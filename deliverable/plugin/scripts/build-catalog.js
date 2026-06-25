#!/usr/bin/env node
// Generates the cross-scope knowledge map: a compact catalog of what every
// TRACE scope in the repo documents. Walks the tree from the git root, finds
// each scope (a directory with its own AGENTS.md that is not a durable-context
// marker), and lists that scope's docs folder — system/ and architecture/
// topic filenames plus adr/ titles. The map is ephemeral: nothing is written
// to disk; it is emitted into the agent's context so cross-service docs and
// binding ADRs are visible before the agent acts.
//
// Usage:
//   node build-catalog.js [scanRoot] [--mode=session|text]
//
//   --mode=session (default) emits the JSON additionalContext envelope for the
//                  SessionStart hook. cwd is read from the hook's stdin JSON.
//   --mode=text    emits the plain catalog block for the knowledge-map skill.
//
// Scoping: never globs arbitrary *.md. Reads only each scope's resolved docs
// folder (config docs_folder, else docs/) and only its system/, architecture/,
// and adr/ subfolders. The tree walk skips package/build/VCS directories.
//
// Exits 0 silently on any failure or when no scopes with content are found —
// a SessionStart hook must never pollute the session.

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', 'target', 'vendor',
  'coverage', '.venv', '__pycache__',
]);
const MAX_HEAD_BYTES = 4096;

function main() {
  const args = process.argv.slice(2);
  let mode = 'session';
  let scanRootArg = null;
  for (const a of args) {
    if (a.startsWith('--mode=')) mode = a.slice('--mode='.length);
    else if (!a.startsWith('--')) scanRootArg = a;
  }

  // Normalize: the hook-provided cwd may carry mixed separators; discovered
  // scope paths are always OS-native, and nearestScope compares them directly.
  const cwd = path.resolve(mode === 'session' ? cwdFromStdin() : process.cwd());
  const scanRoot = scanRootArg
    ? path.resolve(cwd, scanRootArg)
    : (findGitRoot(cwd) || cwd);

  const scopeDirs = discoverScopes(scanRoot);
  if (scopeDirs.length === 0) process.exit(0);

  const currentScope = nearestScope(cwd, scopeDirs);
  const catalog = scopeDirs
    .map(buildScopeEntry)
    .filter((e) => e && e.hasContent);
  if (catalog.length === 0) process.exit(0);

  const block = render(catalog, scanRoot, currentScope);

  if (mode === 'text') {
    process.stdout.write(block + '\n');
  } else {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: block,
      },
    }));
  }
}

// --- discovery -------------------------------------------------------------

function discoverScopes(root) {
  const scopes = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const hasAgents = entries.some((e) => e.isFile() && e.name === 'AGENTS.md');
    if (hasAgents && !isMarkerDir(dir)) scopes.push(dir);
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (ent.name.startsWith('.') || IGNORE_DIRS.has(ent.name)) continue;
      stack.push(path.join(dir, ent.name));
    }
  }
  return scopes;
}

// A scope's own AGENTS.md is project context; a durable-context folder's
// AGENTS.md is a marker (heading "# Durable project context") and is not a
// scope root.
function isMarkerDir(dir) {
  return /^#\s+Durable project context/m.test(readHead(path.join(dir, 'AGENTS.md')));
}

function nearestScope(cwd, scopeDirs) {
  let best = null;
  for (const s of scopeDirs) {
    if (cwd === s || cwd.startsWith(s + path.sep)) {
      if (!best || s.length > best.length) best = s;
    }
  }
  return best;
}

// --- per-scope catalog -----------------------------------------------------

function buildScopeEntry(scopeDir) {
  const docsPath = resolveDocsFolder(scopeDir);
  if (!isDir(docsPath)) return null;
  const system = listTopics(path.join(docsPath, 'system'));
  const architecture = listTopics(path.join(docsPath, 'architecture'));
  const adrs = listAdrs(path.join(docsPath, 'adr'));
  return {
    dir: scopeDir,
    system,
    architecture,
    adrs,
    hasContent: system.length > 0 || architecture.length > 0 || adrs.length > 0,
  };
}

// Honors the persisted config docs_folder, else defaults to docs/. (A
// playbook-marked folder under a non-default name — precedence case 2 — is not
// scanned for here; docs/ is the default the plugin writes.)
function resolveDocsFolder(scopeDir) {
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(scopeDir, '.claude', '.playbook', 'config.json'), 'utf8')
    );
    if (cfg && typeof cfg.docs_folder === 'string' && cfg.docs_folder) {
      return path.resolve(scopeDir, cfg.docs_folder);
    }
  } catch {
    // no config — fall through to default
  }
  return path.join(scopeDir, 'docs');
}

function listTopics(dir) {
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => isDocMd(n))
    .map((n) => n.slice(0, -3))
    .sort();
}

function listAdrs(dir) {
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const adrs = [];
  for (const n of names) {
    if (!isDocMd(n)) continue;
    const head = readHead(path.join(dir, n));
    const title = head.match(/^#\s+(\d+)\.\s*(.+?)\s*$/m);
    if (!title) continue;
    const sup = head.match(/^>\s*Superseded by\s*(\d+)/im);
    adrs.push({ num: title[1], title: title[2], supersededBy: sup ? sup[1] : null });
  }
  adrs.sort((a, b) => a.num.localeCompare(b.num, undefined, { numeric: true }));
  return adrs;
}

// --- render ----------------------------------------------------------------

function render(catalog, scanRoot, currentScope) {
  const byDir = new Map(catalog.map((e) => [e.dir, e]));
  const ordered = [];
  const seen = new Set();
  const pushOnce = (dir) => {
    const e = byDir.get(dir);
    if (e && !seen.has(dir)) {
      ordered.push(e);
      seen.add(dir);
    }
  };
  pushOnce(scanRoot);
  if (currentScope) pushOnce(currentScope);
  catalog
    .slice()
    .sort((a, b) => relName(a.dir, scanRoot).localeCompare(relName(b.dir, scanRoot)))
    .forEach((e) => pushOnce(e.dir));

  const youAreIn = currentScope ? relName(currentScope, scanRoot) : '(outside any scope)';
  const body = ordered
    .map((e) => renderEntry(e, scanRoot, e.dir === currentScope))
    .join('\n\n');

  return [
    '## Knowledge map (generated — read the relevant file before acting in its area)',
    `You are in: ${youAreIn}`,
    '',
    body,
    '',
    'ADRs are binding within their scope. Read a file before working in its area.',
  ].join('\n');
}

function renderEntry(e, scanRoot, isCurrent) {
  const label = (text) => ('  ' + text).padEnd(17);
  const indent = ' '.repeat(17);
  const lines = [relName(e.dir, scanRoot) + (isCurrent ? '   ← your scope' : '')];
  if (e.system.length) lines.push(label('system/') + e.system.join(', '));
  if (e.architecture.length) lines.push(label('architecture/') + e.architecture.join(', '));
  e.adrs.forEach((a, i) => {
    const text = `${a.num}. ${a.title}` + (a.supersededBy ? `  (superseded by ${a.supersededBy})` : '');
    lines.push((i === 0 ? label('adr/') : indent) + text);
  });
  return lines.join('\n');
}

function relName(dir, scanRoot) {
  if (dir === scanRoot) return '<root> (org-level)';
  const rel = path.relative(scanRoot, dir).split(path.sep).join('/');
  return rel || '<root> (org-level)';
}

// --- helpers ---------------------------------------------------------------

function cwdFromStdin() {
  let cwd = process.cwd();
  try {
    const input = fs.readFileSync(0, 'utf8');
    if (input) {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed.cwd === 'string' && parsed.cwd) cwd = parsed.cwd;
    }
  } catch {
    // no stdin / malformed — use process.cwd()
  }
  return cwd;
}

function findGitRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function isDocMd(name) {
  const lower = name.toLowerCase();
  return lower.endsWith('.md') && lower !== 'readme.md';
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readHead(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(MAX_HEAD_BYTES);
    const n = fs.readSync(fd, buf, 0, MAX_HEAD_BYTES, 0);
    fs.closeSync(fd);
    return buf.toString('utf8', 0, n);
  } catch {
    return '';
  }
}

try {
  main();
} catch {
  process.exit(0);
}
