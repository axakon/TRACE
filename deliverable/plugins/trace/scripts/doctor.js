#!/usr/bin/env node
// Validate a TRACE-adopted scope against TRACE's own conventions,
// and provide the mechanical half of ADR number-collision resolution.
//
// Subcommands:
//   check   [scope-root]                 full validation report
//   check --all [root]                   discover every scope (dir with a
//                                        non-marker AGENTS.md) under root and
//                                        report per scope — for monorepos
//   refs    <NNNN> [scope-root]          every reference to ADR <NNNN> across the
//                                        scope, each attributed to its nearest scope
//   migrate <adr-file> <NNNN> [scope]    renumber one ADR file to a free number,
//                                        then report all references to the OLD number
//
// ADR filenames take two forms: YYYY-MM-DD-kebab-title.md for new records, and
// NNNN-kebab-title.md for the older sequential scheme. Both stay valid forever.
// refs and migrate serve the numbered scheme only — it is the one that collides.
//
// Options: --docs <folder>  override docs-folder resolution (relative to scope;
//                           single-scope check only)
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
// ADR filenames come in two forms. Dated is what new ADRs use: two branches
// never mint the same name without also colliding on the slug, which git
// reports. Numbered is the older sequential form, kept working forever so
// adopters never have to renumber what they already shipped. Test dated
// first — a dated name also satisfies the numbered pattern, capturing the year.
const ADR_FILENAME_DATED = /^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const ADR_FILENAME_NUMBERED = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
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

// Reads the persisted docs_folder for a scope, or null. Prefers the current
// .claude/.trace/ location and falls back to the pre-1.0 .claude/.playbook/
// one so adopters who haven't re-run init still resolve correctly.
function readConfiguredDocsFolder(scope) {
  for (const dir of ['.trace', '.playbook']) {
    const config = readText(path.join(scope, '.claude', dir, 'config.json'));
    if (!config) continue;
    try {
      const parsed = JSON.parse(config);
      if (parsed && typeof parsed.docs_folder === 'string' && parsed.docs_folder) {
        return parsed.docs_folder;
      }
    } catch { /* try the next location */ }
  }
  return null;
}

// Mirrors shared/docs-folder-resolution.md: config → single TRACE-marked
// folder → existing docs/ → default docs/.
function resolveDocsFolder(scope, override) {
  if (override) return path.resolve(scope, override);

  const configured = readConfiguredDocsFolder(scope);
  if (configured) return path.resolve(scope, configured);

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
      message: 'Docs folder does not exist — run /trace:init.',
    });
    return false;
  }

  for (const readme of CANONICAL_READMES) {
    const p = path.join(docs, readme);
    if (!isFile(p)) {
      report.errors.push({
        check: 'structure', path: rel(scope, p),
        message: 'Canonical README missing — /trace:init lays these down (re-running is safe, existing files are skipped).',
      });
    }
  }

  const marker = readText(path.join(docs, 'AGENTS.md'));
  if (marker === null) {
    report.errors.push({
      check: 'structure', path: rel(scope, path.join(docs, 'AGENTS.md')),
      message: 'Docs-folder marker AGENTS.md missing — TRACE will not recognise this folder.',
    });
  } else if (firstHeading(marker) !== MARKER_HEADING) {
    report.errors.push({
      check: 'structure', path: rel(scope, path.join(docs, 'AGENTS.md')),
      message: `Docs-folder AGENTS.md exists but is not TRACE-marked (first heading must be "${MARKER_HEADING}").`,
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
        message: 'CLAUDE.md is not the one-line forwarder — per TRACE convention AGENTS.md holds the content.',
      });
    }
  }

  if (!isFile(path.join(scope, 'AGENTS.md'))) {
    report.errors.push({
      check: 'structure', path: 'AGENTS.md',
      message: 'Root AGENTS.md missing — run /trace:agents-md-setup.',
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
  // Any blockquote line that starts "Superseded by" is a supersession banner
  // — humans write variants of the canonical "> Superseded by NNNN." form,
  // and flagging those as post-ship edits is a false positive.
  return content
    .split('\n')
    .filter((line) => !/^>\s*superseded by\b/i.test(line.trim()))
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

function git(scope, args) {
  const res = spawnSync('git', args, { cwd: scope, encoding: 'utf8' });
  if (res.error || res.status !== 0) return null;
  return res.stdout;
}

function isRealDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// A dated ADR carries its date in the filename, so the heading is the title
// alone. The date line under the heading is the one place the date is repeated,
// which makes it the cross-check that a mistyped filename date is caught.
function checkDatedAdrBody(relPath, content, heading, date, report) {
  if (!heading) {
    report.warnings.push({
      check: 'adr-heading', path: relPath,
      message: 'First heading should be "# Title" — the title alone, with no number or date prefix.',
    });
  } else if (/^#\s+(?:\d{4}-\d{2}-\d{2}|\d{4})\.\s/.test(heading)) {
    report.warnings.push({
      check: 'adr-heading', path: relPath,
      message: 'A dated ADR states the title alone in its heading. Drop the number or date prefix — the filename carries the date.',
    });
  }

  const dateLine = /^\*(\d{4}-\d{2}-\d{2})\*$/m.exec(content);
  if (!dateLine) {
    report.warnings.push({
      check: 'adr-date', path: relPath,
      message: `No "*${date}*" date line under the title.`,
    });
  } else if (dateLine[1] !== date) {
    report.errors.push({
      check: 'adr-date', path: relPath,
      message: `Date line ${dateLine[1]} does not match filename date ${date}.`,
    });
  }
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
  let datedCount = 0;

  for (const file of files) {
    const relPath = rel(scope, path.join(adrDir, file));
    const dated = ADR_FILENAME_DATED.exec(file);
    const numbered = dated ? null : ADR_FILENAME_NUMBERED.exec(file);
    if (!dated && !numbered) {
      report.errors.push({
        check: 'adr-filename', path: relPath,
        message: 'Filename must match YYYY-MM-DD-kebab-title.md, or NNNN-kebab-title.md for an ADR numbered under the older sequential scheme.',
      });
      continue;
    }

    const content = readText(path.join(adrDir, file));
    const heading = content === null ? null : firstHeading(content);

    if (dated) {
      datedCount++;
      const date = dated[1];
      if (!isRealDate(date)) {
        report.errors.push({
          check: 'adr-filename', path: relPath,
          message: `Filename date ${date} is not a real calendar date.`,
        });
      }
      if (content !== null) checkDatedAdrBody(relPath, content, heading, date, report);
      continue;
    }

    const number = numbered[1];
    numbers.push(parseInt(number, 10));
    if (!byNumber.has(number)) byNumber.set(number, []);
    byNumber.get(number).push(file);

    if (content !== null) {
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
  report.summary.dated_adr_count = datedCount;
  report.summary.numbered_adr_count = numbers.length;
  // Only the numbered scheme has a "next" number. It is what `migrate` moves a
  // collided ADR to, so it stays in the report while any numbered ADR remains.
  report.summary.next_free_adr = nextFree;

  // Collisions and gaps belong to the numbered scheme alone. Two branches
  // cannot produce the same dated filename without also picking the same slug,
  // and git reports that as an add/add conflict at merge time.
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
        message: `Numbering gap between ${String(unique[i - 1]).padStart(4, '0')} and ${String(unique[i]).padStart(4, '0')} — numbered ADRs should be strictly sequential.`,
      });
    }
  }

  // Immutability: a shipped (committed) ADR may only gain supersession banners.
  if (git(scope, ['rev-parse', '--is-inside-work-tree']) === null) {
    report.skipped.push({ check: 'adr-immutability', reason: 'git unavailable or not a repository' });
    return;
  }
  for (const file of files) {
    if (!ADR_FILENAME_DATED.test(file) && !ADR_FILENAME_NUMBERED.test(file)) continue;
    const relPath = rel(scope, path.join(adrDir, file));
    const log = git(scope, ['log', '--diff-filter=A', '--format=%H', '--', relPath]);
    if (!log || !log.trim()) continue; // never committed — still a draft, free to edit
    const addCommit = log.trim().split('\n').pop();
    // The ./ prefix makes the pathspec cwd-relative; without it git resolves
    // the path against the repo root, which silently breaks for a scope that
    // is a subdirectory of its repository (monorepo sub-project).
    const original = git(scope, ['show', `${addCommit}:./${relPath}`]);
    if (original === null) {
      report.skipped.push({
        check: 'adr-immutability',
        reason: `could not read the first committed version of ${relPath}`,
      });
      continue;
    }
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

// Blanks out fenced blocks and inline code spans so checks don't fire on
// examples. A fence only counts when it opens a line — a stray inline ``` is
// prose, not a fence. (Matching it as one used to swallow the rest of the file
// through the end-of-input fallback, silently skipping every later link.)
// Lines are blanked rather than removed so offsets stay usable.
function stripCode(content) {
  let inFence = false;
  return content
    .split('\n')
    .map((line) => {
      if (/^[ \t]*```/.test(line)) {
        inFence = !inFence;
        return '';
      }
      return inFence ? '' : line;
    })
    .join('\n')
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

// A scope root is a directory with its own AGENTS.md — excluding the
// durable-context marker, whose AGENTS.md marks a docs folder, not a scope.
function isScopeRoot(dir) {
  const agents = readText(path.join(dir, 'AGENTS.md'));
  return agents !== null && firstHeading(agents) !== MARKER_HEADING;
}

// Deepest discovered scope containing the file; the scan root when none does.
// Uses the same discovery semantics as check --all, so an AGENTS.md that is
// docs-tree content (a folder guide inside another scope's docs folder) never
// claims references.
function nearestScopeFromSet(scanRoot, file, scopeSet) {
  let dir = path.dirname(file);
  for (;;) {
    if (scopeSet.has(dir)) return dir;
    if (dir === scanRoot) return scanRoot;
    const parent = path.dirname(dir);
    if (parent === dir) return scanRoot;
    dir = parent;
  }
}

// Every place the scope mentions ADR <number>: "ADR 0007" / "adr-0007" /
// "ADR #7" prose forms, plus filename forms like "0007-some-slug.md".
function findAdrReferences(scope, number, docs) {
  const n = parseInt(number, 10);
  const prose = /\badr[\s\-_#:]{0,3}(\d{1,4})\b/gi;
  const filename = /\b(\d{4})-(?!\d{2}-\d{2}-)[a-z0-9][a-z0-9-]*\.md\b/g;
  const superseded = /\bSuperseded by (\d{4})\b/gi;

  const files = [];
  collectAllFiles(scope, files);
  const scopeSet = new Set(discoverScopes(scope));

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
            nearest_scope: rel(scope, nearestScopeFromSet(scope, file, scopeSet)) || '.',
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
  if (ADR_FILENAME_DATED.test(base)) {
    fail(`"${base}" is a dated ADR. migrate renumbers ADRs under the older sequential scheme, and dated filenames never collide.`);
  }
  const m = ADR_FILENAME_NUMBERED.exec(base);
  if (!m) fail(`"${base}" does not match the NNNN-kebab-title.md pattern`);
  const fromNumber = m[1];
  if (fromNumber === toNumber) fail('source and target numbers are identical');

  const taken = fs.readdirSync(adrDir).some((f) => {
    const nm = ADR_FILENAME_DATED.test(f) ? null : ADR_FILENAME_NUMBERED.exec(f);
    return nm !== null && nm[1] === toNumber;
  });
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
    note: 'References were NOT rewritten. Each one must be reviewed: does it mean the ADR that kept the old number, or the renumbered one? A reference whose nearest_scope differs from the migrated ADR\'s scope refers to that scope\'s own sequence — leave it alone.',
  };
}

// --------------------------------------------------------------------- check

function runCheck(scope, docsOverride) {
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
  return report;
}

// Every scope root under (and including) the given root — for monorepos where
// TRACE is adopted at the root and at project level. A scope's own docs folder
// is never descended into: an AGENTS.md in there is docs-tree content (a
// folder guide, a customer brief), not a project scope.
function discoverScopes(root) {
  const scopes = [];
  (function walk(dir, docsToSkip) {
    let skip = docsToSkip;
    if (isScopeRoot(dir)) {
      scopes.push(dir);
      skip = resolveDocsFolder(dir, null);
    }
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name) || entry.name === '.claude') continue;
      const full = path.join(dir, entry.name);
      if (full === skip) continue;
      walk(full, skip);
    }
  })(root, null);
  return scopes.length ? scopes : [root];
}

// A scope has adopted TRACE when init persisted a config or the
// resolved docs folder carries TRACE marker. A bare AGENTS.md without
// either is context-only — legitimate, but not expected to hold the canonical
// tree or meet the project-root AGENTS.md spec.
function isAdopted(scope) {
  if (readConfiguredDocsFolder(scope)) return true;
  const marker = readText(path.join(resolveDocsFolder(scope, null), 'AGENTS.md'));
  return marker !== null && firstHeading(marker) === MARKER_HEADING;
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
const allFlag = argv.indexOf('--all');
let checkAll = false;
if (allFlag !== -1) {
  checkAll = true;
  argv.splice(allFlag, 1);
}

const command = argv[0] || 'check';

if (command === 'check') {
  const root = path.resolve(argv[1] || '.');
  if (!isDir(root)) fail(`scope root is not a directory: ${root}`);

  if (checkAll) {
    // Per-scope resolution only — a --docs override can't apply to every scope.
    // Only TRACE-adopted scopes get the full check; a bare AGENTS.md scope
    // is listed as context-only, since adopting it is a decision, not a repair.
    const reports = [];
    const contextOnly = [];
    for (const s of discoverScopes(root)) {
      if (isAdopted(s)) {
        const r = runCheck(s, null);
        r.scope_rel = rel(root, s) || '.';
        reports.push(r);
      } else {
        contextOnly.push({
          scope_rel: rel(root, s) || '.',
          note: 'AGENTS.md context only — not TRACE-adopted (no config, no marked docs folder). Run /trace:init <scope> if it should carry the canonical tree.',
        });
      }
    }
    if (!reports.length) {
      // Nothing adopted anywhere — fall back to a full check of the root so a
      // fresh repo still gets actionable output.
      const r = runCheck(root, null);
      r.scope_rel = '.';
      reports.push(r);
    }
    process.stdout.write(JSON.stringify({
      root,
      ok: reports.every((r) => r.ok),
      scope_count: reports.length,
      scopes: reports,
      context_only: contextOnly,
    }, null, 2));
    process.exit(0);
  }

  process.stdout.write(JSON.stringify(runCheck(root, docsOverride), null, 2));
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
