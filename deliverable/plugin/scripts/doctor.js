#!/usr/bin/env node
// Validate a playbook-adopted scope against the playbook's own conventions,
// and provide the mechanical half of ADR number-collision resolution.
//
// Subcommands:
//   check   [scope-root]                 full validation report
//   refs    <NNNN> [scope-root]          every reference to ADR <NNNN> across the scope
//   migrate <adr-file> <NNNN> [scope]    renumber one ADR file to a free number,
//                                        then report all references to the OLD number
//
// Options: --docs <folder>  override docs-folder resolution (relative to scope)
//
// All output is a single JSON object on stdout. The script only detects and
// performs mechanical renames — it never rewrites references to an ADR number;
// deciding which decision an ambiguous reference means is the agent's and
// developer's job (see the doctor skill).
//
// Findings are data: `check` exits 0 even when the report contains errors.
// Exit 1 is reserved for caller errors (bad arguments, unreadable scope).
//
// Cross-platform: Node built-ins only. Git is used (via spawnSync, no shell)
// solely for the ADR-immutability check and is skipped gracefully when absent.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ---------------------------------------------------------------- utilities

const FORWARDER = 'See @AGENTS.md for more information.';
const MARKER_HEADING = '# Durable project context';
const ADR_FILENAME = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const BANNER_PREFIX = '> **Working note — not authoritative.**';
const CANONICAL_READMES = [
  'README.md',
  'system/README.md',
  'architecture/README.md',
  'adr/README.md',
  'reference/README.md',
  'working-notes/README.md',
];
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'vendor', 'dist', 'build', 'out', 'target',
  '.next', '.nuxt', 'coverage', '__pycache__', '.venv', 'venv',
]);

function fail(msg) {
  process.stderr.write(`doctor: ${msg}\n`);
  process.exit(1);
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function rel(scope, p) {
  return path.relative(scope, p).split(path.sep).join('/');
}

function firstHeading(content) {
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t.startsWith('#')) return t;
    if (t !== '') return null; // non-blank, non-heading before any heading
  }
  return null;
}

// ------------------------------------------------------- docs-folder lookup

// Mirrors shared/docs-folder-resolution.md: config → single playbook-marked
// folder → existing docs/ → default docs/.
function resolveDocsFolder(scope, override) {
  if (override) return path.resolve(scope, override);

  const config = readText(path.join(scope, '.claude', '.playbook', 'config.json'));
  if (config) {
    try {
      const parsed = JSON.parse(config);
      if (parsed && typeof parsed.docs_folder === 'string' && parsed.docs_folder) {
        return path.resolve(scope, parsed.docs_folder);
      }
    } catch { /* fall through */ }
  }

  const marked = [];
  let entries = [];
  try { entries = fs.readdirSync(scope, { withFileTypes: true }); } catch { /* ignore */ }
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const agents = readText(path.join(scope, entry.name, 'AGENTS.md'));
    if (agents && firstHeading(agents) === MARKER_HEADING) marked.push(entry.name);
  }
  if (marked.length === 1) return path.join(scope, marked[0]);

  return path.join(scope, 'docs');
}

// ------------------------------------------------------------------- checks

function checkStructure(scope, docs, report) {
  if (!isDir(docs)) {
    report.errors.push({
      check: 'structure', path: rel(scope, docs),
      message: 'Docs folder does not exist — run /playbook:init.',
    });
    return false;
  }

  for (const readme of CANONICAL_READMES) {
    const p = path.join(docs, readme);
    if (!isFile(p)) {
      report.errors.push({
        check: 'structure', path: rel(scope, p),
        message: 'Canonical README missing — /playbook:init lays these down (re-running is safe, existing files are skipped).',
      });
    }
  }

  const marker = readText(path.join(docs, 'AGENTS.md'));
  if (marker === null) {
    report.errors.push({
      check: 'structure', path: rel(scope, path.join(docs, 'AGENTS.md')),
      message: 'Docs-folder marker AGENTS.md missing — the playbook will not recognise this folder.',
    });
  } else if (firstHeading(marker) !== MARKER_HEADING) {
    report.errors.push({
      check: 'structure', path: rel(scope, path.join(docs, 'AGENTS.md')),
      message: `Docs-folder AGENTS.md exists but is not playbook-marked (first heading must be "${MARKER_HEADING}").`,
    });
  }

  for (const dir of [docs, scope]) {
    const claudeMd = readText(path.join(dir, 'CLAUDE.md'));
    const label = rel(scope, path.join(dir, 'CLAUDE.md')) || 'CLAUDE.md';
    if (claudeMd === null) {
      report.warnings.push({
        check: 'structure', path: label,
        message: `CLAUDE.md forwarder missing (should contain exactly: ${FORWARDER}).`,
      });
    } else if (claudeMd.trim().replace(/`/g, '') !== FORWARDER) {
      report.warnings.push({
        check: 'structure', path: label,
        message: 'CLAUDE.md is not the one-line forwarder — per the playbook convention AGENTS.md holds the content.',
      });
    }
  }

  if (!isFile(path.join(scope, 'AGENTS.md'))) {
    report.errors.push({
      check: 'structure', path: 'AGENTS.md',
      message: 'Root AGENTS.md missing — run /playbook:agents-md-setup.',
    });
  }
  return true;
}

const AGENTS_SECTIONS = [
  { name: 'What is this', pattern: /what\s+is\s+this/i },
  { name: 'Stack', pattern: /\bstack\b/i },
  { name: 'Directory index', pattern: /director/i },
  { name: 'Commands', pattern: /\bcommands?\b/i },
  { name: 'Gotchas', pattern: /gotcha/i, optional: true }, // omitted when empty, per the rules
];

function checkAgentsMd(scope, report) {
  const p = path.join(scope, 'AGENTS.md');
  const content = readText(p);
  if (content === null) return; // structure check already reported it

  const lines = content.split('\n');
  if (lines.length > 150) {
    report.warnings.push({
      check: 'agents-md', path: 'AGENTS.md',
      message: `${lines.length} lines — the spec targets 50–150; overflow usually belongs in a context file.`,
    });
  }

  const headings = [];
  lines.forEach((line, i) => {
    const m = /^##\s+(.*)$/.exec(line);
    if (m) headings.push({ title: m[1].trim(), line: i });
  });

  let cursor = -1;
  for (const section of AGENTS_SECTIONS) {
    const idx = headings.findIndex((h) => section.pattern.test(h.title));
    if (idx === -1) {
      if (!section.optional) {
        report.warnings.push({
          check: 'agents-md', path: 'AGENTS.md',
          message: `Section "${section.name}" not found — the spec expects the five canonical sections.`,
        });
      }
      continue;
    }
    if (idx < cursor) {
      report.warnings.push({
        check: 'agents-md', path: 'AGENTS.md',
        message: `Section "${headings[idx].title}" is out of the canonical order.`,
      });
    }
    cursor = Math.max(cursor, idx);
  }

  headings.forEach((h, i) => {
    const end = i + 1 < headings.length ? headings[i + 1].line : lines.length;
    const size = end - h.line;
    if (size > 40) {
      report.warnings.push({
        check: 'agents-md', path: 'AGENTS.md',
        message: `Section "${h.title}" spans ${size} lines — the spec caps sections at 40.`,
      });
    }
  });
}

function stripSupersessionBanners(content) {
  return content
    .split('\n')
    .filter((line) => !/^>\s*Superseded by \d{4}\.\s*$/.test(line.trim()))
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

function git(scope, args) {
  const res = spawnSync('git', args, { cwd: scope, encoding: 'utf8' });
  if (res.error || res.status !== 0) return null;
  return res.stdout;
}

function checkAdrs(scope, docs, report) {
  const adrDir = path.join(docs, 'adr');
  if (!isDir(adrDir)) return; // structure check covers the missing folder

  let files = [];
  try {
    files = fs.readdirSync(adrDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
  } catch { return; }

  const byNumber = new Map();
  const numbers = [];

  for (const file of files) {
    const relPath = rel(scope, path.join(adrDir, file));
    const m = ADR_FILENAME.exec(file);
    if (!m) {
      report.errors.push({
        check: 'adr-filename', path: relPath,
        message: 'Filename must match NNNN-kebab-title.md (four-digit zero-padded number, kebab-case slug).',
      });
      continue;
    }
    const number = m[1];
    numbers.push(parseInt(number, 10));
    if (!byNumber.has(number)) byNumber.set(number, []);
    byNumber.get(number).push(file);

    const content = readText(path.join(adrDir, file));
    if (content !== null) {
      const heading = firstHeading(content);
      const hm = heading && /^#\s+(\d{4})\./.exec(heading);
      if (!hm) {
        report.warnings.push({
          check: 'adr-heading', path: relPath,
          message: 'First heading should be "# NNNN. Title" matching the filename number.',
        });
      } else if (hm[1] !== number) {
        report.errors.push({
          check: 'adr-heading', path: relPath,
          message: `Heading number ${hm[1]} does not match filename number ${number}.`,
        });
      }
    }
  }

  const maxNumber = numbers.length ? Math.max(...numbers) : 0;
  const nextFree = String(maxNumber + 1).padStart(4, '0');
  report.summary.adr_count = files.length;
  report.summary.next_free_adr = nextFree;

  for (const [number, dupes] of byNumber) {
    if (dupes.length > 1) {
      report.errors.push({
        check: 'adr-collision', path: rel(scope, adrDir), number,
        files: dupes.sort(),
        suggested_free: nextFree,
        message: `ADR number ${number} is used by ${dupes.length} files (usually a branch merge). Renumber all but one with: node doctor.js migrate <file> ${nextFree}`,
      });
    }
  }

  const unique = [...new Set(numbers)].sort((a, b) => a - b);
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] !== unique[i - 1] + 1) {
      report.warnings.push({
        check: 'adr-gap', path: rel(scope, adrDir),
        message: `Numbering gap between ${String(unique[i - 1]).padStart(4, '0')} and ${String(unique[i]).padStart(4, '0')} — numbers should be strictly sequential.`,
      });
    }
  }

  // Immutability: a shipped (committed) ADR may only gain supersession banners.
  if (git(scope, ['rev-parse', '--is-inside-work-tree']) === null) {
    report.skipped.push({ check: 'adr-immutability', reason: 'git unavailable or not a repository' });
    return;
  }
  for (const file of files) {
    if (!ADR_FILENAME.test(file)) continue;
    const relPath = rel(scope, path.join(adrDir, file));
    const log = git(scope, ['log', '--diff-filter=A', '--format=%H', '--', relPath]);
    if (!log || !log.trim()) continue; // never committed — still a draft, free to edit
    const addCommit = log.trim().split('\n').pop();
    const original = git(scope, ['show', `${addCommit}:${relPath}`]);
    if (original === null) continue;
    const current = readText(path.join(adrDir, file));
    if (current === null) continue;
    if (stripSupersessionBanners(original) !== stripSupersessionBanners(current)) {
      report.warnings.push({
        check: 'adr-immutability', path: relPath,
        message: 'Shipped ADR differs from the version first committed beyond supersession banners — shipped ADRs are immutable; course corrections are a new superseding ADR.',
      });
    }
  }
}

function checkWorkingNotes(scope, docs, report) {
  const notesDir = path.join(docs, 'working-notes');
  if (!isDir(notesDir)) return;

  let files = [];
  try {
    files = fs.readdirSync(notesDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
  } catch { return; }

  for (const file of files) {
    const relPath = rel(scope, path.join(notesDir, file));
    const content = readText(path.join(notesDir, file));
    if (content === null) continue;
    const lines = content.split('\n');

    const head = lines.slice(0, 6).map((l) => l.trim());
    if (!head.some((l) => l.startsWith(BANNER_PREFIX))) {
      report.errors.push({
        check: 'note-banner', path: relPath,
        message: `Missing the non-authority banner right under the title: ${BANNER_PREFIX} …`,
      });
    }

    const statusZone = lines.slice(0, 40).join('\n');
    if (!/Status:.*(Research note|Stabilizing|Promoted)/i.test(statusZone)) {
      report.warnings.push({
        check: 'note-status', path: relPath,
        message: 'No "Status:" header (Research note / Stabilizing / Promoted) found near the top of the note.',
      });
    }
  }
}

function stripCode(content) {
  return content
    .replace(/```[\s\S]*?(```|$)/g, '')
    .replace(/`[^`\n]*`/g, '');
}

function collectMarkdownFiles(dir, out) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collectMarkdownFiles(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(path.join(dir, entry.name));
    }
  }
}

function checkLinks(scope, docs, report) {
  const files = [];
  if (isDir(docs)) collectMarkdownFiles(docs, files);
  const rootAgents = path.join(scope, 'AGENTS.md');
  if (isFile(rootAgents)) files.push(rootAgents);

  const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const file of files) {
    const content = readText(file);
    if (content === null) continue;
    const scannable = stripCode(content);
    let m;
    while ((m = LINK.exec(scannable)) !== null) {
      let target = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue; // URLs, mailto, anchors
      target = target.split('#')[0];
      if (!target) continue;
      const resolved = target.startsWith('/')
        ? path.join(scope, target)
        : path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) {
        report.errors.push({
          check: 'link', path: rel(scope, file),
          message: `Relative link target does not exist: ${m[1]}`,
        });
      }
    }
  }
}

// --------------------------------------------------------------- refs / migrate

function isProbablyBinary(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(8192);
    const bytes = fs.readSync(fd, buf, 0, 8192, 0);
    fs.closeSync(fd);
    return buf.subarray(0, bytes).includes(0);
  } catch {
    return true;
  }
}

function collectAllFiles(dir, out) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && entry.name !== '.claude') collectAllFiles(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}

// Every place the scope mentions ADR <number>: "ADR 0007" / "adr-0007" /
// "ADR #7" prose forms, plus filename forms like "0007-some-slug.md".
function findAdrReferences(scope, number, docs) {
  const n = parseInt(number, 10);
  const prose = /\badr[\s\-_#:]{0,3}(\d{1,4})\b/gi;
  const filename = /\b(\d{4})-[a-z0-9][a-z0-9-]*\.md\b/g;
  const superseded = /\bSuperseded by (\d{4})\b/gi;

  const files = [];
  collectAllFiles(scope, files);

  const refs = [];
  for (const file of files) {
    let stat;
    try { stat = fs.statSync(file); } catch { continue; }
    if (stat.size > 2 * 1024 * 1024 || isProbablyBinary(file)) continue;
    const content = readText(file);
    if (content === null) continue;

    const lines = content.split('\n');
    lines.forEach((line, i) => {
      for (const pattern of [prose, filename, superseded]) {
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(line)) !== null) {
          if (parseInt(m[1], 10) !== n) continue;
          refs.push({
            file: rel(scope, file),
            line: i + 1,
            text: line.trim().slice(0, 200),
            inside_adr_folder: docs ? file.startsWith(path.join(docs, 'adr') + path.sep) : false,
          });
          break; // one entry per line per pattern is enough
        }
      }
    });
  }

  // De-duplicate lines matched by more than one pattern.
  const seen = new Set();
  return refs.filter((r) => {
    const key = `${r.file}:${r.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function migrate(scope, docs, fileArg, toNumber) {
  if (!/^\d{4}$/.test(toNumber)) fail(`target number must be four digits, got "${toNumber}"`);
  const adrDir = path.join(docs, 'adr');

  let src = path.isAbsolute(fileArg) ? fileArg : path.resolve(scope, fileArg);
  if (!isFile(src)) src = path.join(adrDir, fileArg); // bare filename convenience
  if (!isFile(src)) fail(`ADR file not found: ${fileArg}`);

  const base = path.basename(src);
  const m = ADR_FILENAME.exec(base);
  if (!m) fail(`"${base}" does not match the NNNN-kebab-title.md pattern`);
  const fromNumber = m[1];
  if (fromNumber === toNumber) fail('source and target numbers are identical');

  const taken = fs.readdirSync(adrDir).some((f) => f.startsWith(`${toNumber}-`));
  if (taken) fail(`target number ${toNumber} is already in use`);

  const dest = path.join(adrDir, `${toNumber}-${base.slice(5)}`);
  const content = readText(src);
  if (content === null) fail(`cannot read ${src}`);

  // Rewrite the file's own heading number; nothing else inside it changes.
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t.startsWith('#')) {
      lines[i] = lines[i].replace(new RegExp(`^(\\s*#\\s+)${fromNumber}\\.`), `$1${toNumber}.`);
    }
    break;
  }

  fs.writeFileSync(dest, lines.join('\n'));
  fs.unlinkSync(src);

  // Inventory every reference to the OLD number: after a collision, each one
  // is ambiguous between the two decisions — resolving them is judgment work.
  const references = findAdrReferences(scope, fromNumber, docs);

  return {
    renamed_from: rel(scope, src),
    renamed_to: rel(scope, dest),
    old_number: fromNumber,
    new_number: toNumber,
    references_to_old_number: references,
    note: 'References were NOT rewritten. Each one must be reviewed: does it mean the ADR that kept the old number, or the renumbered one?',
  };
}

// --------------------------------------------------------------------- main

const argv = process.argv.slice(2);
const docsFlag = argv.indexOf('--docs');
let docsOverride = null;
if (docsFlag !== -1) {
  docsOverride = argv[docsFlag + 1];
  if (!docsOverride) fail('--docs requires a folder argument');
  argv.splice(docsFlag, 2);
}

const command = argv[0] || 'check';

if (command === 'check') {
  const scope = path.resolve(argv[1] || '.');
  if (!isDir(scope)) fail(`scope root is not a directory: ${scope}`);
  const docs = resolveDocsFolder(scope, docsOverride);

  const report = {
    scope,
    docs_folder: rel(scope, docs) + '/',
    ok: true,
    errors: [],
    warnings: [],
    skipped: [],
    summary: {},
  };

  if (checkStructure(scope, docs, report)) {
    checkAgentsMd(scope, report);
    checkAdrs(scope, docs, report);
    checkWorkingNotes(scope, docs, report);
    checkLinks(scope, docs, report);
  } else {
    checkAgentsMd(scope, report);
  }

  report.ok = report.errors.length === 0;
  report.summary.errors = report.errors.length;
  report.summary.warnings = report.warnings.length;
  process.stdout.write(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (command === 'refs') {
  const number = argv[1];
  if (!number || !/^\d{1,4}$/.test(number)) fail('usage: doctor.js refs <NNNN> [scope-root]');
  const scope = path.resolve(argv[2] || '.');
  if (!isDir(scope)) fail(`scope root is not a directory: ${scope}`);
  const docs = resolveDocsFolder(scope, docsOverride);
  const references = findAdrReferences(scope, number, docs);
  process.stdout.write(JSON.stringify({
    number: number.padStart(4, '0'),
    count: references.length,
    references,
  }, null, 2));
  process.exit(0);
}

if (command === 'migrate') {
  const fileArg = argv[1];
  const toNumber = argv[2];
  if (!fileArg || !toNumber) fail('usage: doctor.js migrate <adr-file> <NNNN> [scope-root]');
  const scope = path.resolve(argv[3] || '.');
  if (!isDir(scope)) fail(`scope root is not a directory: ${scope}`);
  const docs = resolveDocsFolder(scope, docsOverride);
  const result = migrate(scope, docs, fileArg, toNumber);
  process.stdout.write(JSON.stringify(result, null, 2));
  process.exit(0);
}

fail(`unknown command "${command}" — expected check, refs, or migrate`);
