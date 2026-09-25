'use strict';
// Shared helpers for the TRACE scripts that read a scope: doctor.js and
// context-graph.js. Everything here is deterministic, uses Node built-ins
// only, and never writes to disk.
//
// The conventions encoded here (marker heading, forwarder line, docs-folder
// precedence, scope discovery) mirror shared/docs-folder-resolution.md. Change
// them there and here together.

const fs = require('node:fs');
const path = require('node:path');

const FORWARDER = 'See @AGENTS.md for more information.';
const MARKER_HEADING = '# Durable project context';
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'vendor', 'dist', 'build', 'out', 'target',
  '.next', '.nuxt', 'coverage', '__pycache__', '.venv', 'venv',
]);

// ---------------------------------------------------------------- file utils

// Line endings come back as LF. A Windows checkout with core.autocrlf=true
// has CRLF files, and a trailing \r breaks every line-anchored pattern.
function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
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

// Scope-relative path with forward slashes, on every platform.
function rel(scope, p) {
  return path.relative(scope, p).split(path.sep).join('/');
}

function listDir(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}

// ------------------------------------------------------------ markdown utils

// First heading line of a document, or null when non-blank text precedes it.
function firstHeading(content) {
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t.startsWith('#')) return t;
    if (t !== '') return null;
  }
  return null;
}

function isMarkerContent(content) {
  return content !== null && firstHeading(content) === MARKER_HEADING;
}

// Blanks out fenced blocks and inline code spans so scans don't fire on
// examples. A fence only counts when it opens a line — a stray inline ``` is
// prose, not a fence. Lines are blanked rather than removed so offsets stay
// usable.
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

// Every .md file under dir, skipping build and dependency folders.
function collectMarkdownFiles(dir, out) {
  for (const entry of listDir(dir)) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collectMarkdownFiles(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// ------------------------------------------------------------ markdown links

// Relative markdown links outside code, in document order. URLs, mailto, and
// anchor-only links are skipped. `raw` is the link as written; `target` drops
// the #fragment.
function findLinks(content) {
  const found = [];
  const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const scannable = stripCode(content);
  let m;
  while ((m = re.exec(scannable)) !== null) {
    const raw = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) continue;
    const target = raw.split('#')[0];
    if (target) found.push({ raw, target });
  }
  return found;
}

// A link resolves against the file that holds it. A leading `/` means the
// base directory (scope or scanned root), the way GitHub renders it.
function resolveLink(base, fromFile, target) {
  return target.startsWith('/') ? path.join(base, target) : path.resolve(path.dirname(fromFile), target);
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
  for (const entry of listDir(scope)) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    if (isMarkerContent(readText(path.join(scope, entry.name, 'AGENTS.md')))) marked.push(entry.name);
  }
  if (marked.length === 1) return path.join(scope, marked[0]);

  return path.join(scope, 'docs');
}

// ---------------------------------------------------------- scope discovery

// A scope root is a directory with its own AGENTS.md — excluding the
// durable-context marker, whose AGENTS.md marks a docs folder, not a scope.
function isScopeRoot(dir) {
  const agents = readText(path.join(dir, 'AGENTS.md'));
  return agents !== null && !isMarkerContent(agents);
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
    for (const entry of listDir(dir)) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name) || entry.name === '.claude') continue;
      const full = path.join(dir, entry.name);
      if (full === skip) continue;
      walk(full, skip);
    }
  })(root, null);
  return scopes.length ? scopes : [root];
}

// A scope has adopted TRACE when init persisted a config or the resolved docs
// folder carries the TRACE marker. A bare AGENTS.md without either is
// context-only — legitimate, but not expected to hold the canonical tree.
function isAdopted(scope) {
  if (readConfiguredDocsFolder(scope)) return true;
  return isMarkerContent(readText(path.join(resolveDocsFolder(scope, null), 'AGENTS.md')));
}

module.exports = {
  FORWARDER,
  MARKER_HEADING,
  SKIP_DIRS,
  readText,
  isFile,
  isDir,
  rel,
  listDir,
  firstHeading,
  isMarkerContent,
  stripCode,
  collectMarkdownFiles,
  findLinks,
  resolveLink,
  resolveDocsFolder,
  discoverScopes,
  isAdopted,
};
