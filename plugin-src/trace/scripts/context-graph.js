#!/usr/bin/env node
'use strict';
// Measure how much instruction context an agent carries at each directory of
// a project, and where that weight comes from.
//
//   context-graph.js [root] [--format json|tree] [--all]
//
// Prints one document to stdout: the JSON graph (the default) or a terminal
// tree. The tree hides docs-folder marker rows (the template every scope
// carries) unless --all is given; the footer reports how many and how much.

// A node is a directory holding an instruction file: AGENTS.md, CLAUDE.md, or
// CLAUDE.local.md. For each node the script reports
//   own_tokens        the node's own instruction files plus every file they
//                     import with a bare @path (recursive, four hops, code
//                     spans and fenced blocks skipped — the Claude Code rule)
//   chain_tokens      own_tokens summed from the root node down to this node:
//                     what loads at launch when the working directory is here
//   gotcha_tokens     the "## Gotchas" section of the node's AGENTS.md
//   docs              the markdown under the scope's resolved docs folder:
//                     what is reachable on demand, not loaded at launch
// Backticked @paths and relative markdown links are pointers, not imports;
// they become edges and are checked for existence.
//
// Token counts are estimates: characters / 4 after stripping HTML comments,
// which Claude Code removes before injection. The contract for this output —
// what is scanned, how imports resolve, the JSON shape — is
// docs/architecture/context-graph.md in the TRACE repository. Other
// implementations (a CLI in another language) are held to the same fixtures.
//
// Exit 1 is reserved for caller errors (bad arguments, unreadable root). Node
// built-ins only.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  SKIP_DIRS, readText, isFile, isDir, rel, listDir, isMarkerContent, stripCode,
  collectMarkdownFiles, findLinks, resolveLink, resolveDocsFolder,
} = require('./trace-lib');

const SCHEMA_VERSION = 1;
const MAX_IMPORT_HOPS = 4;
const CONTEXT_FILES = ['AGENTS.md', 'CLAUDE.md', 'CLAUDE.local.md'];
const GOTCHA_HEADING = /gotcha/i;

// The tree marks an own or chain cell with ! from WARN_TOKENS and !! from
// ALERT_TOKENS. Plain text, so it survives pipes and files.
const WARN_TOKENS = 4000;
const ALERT_TOKENS = 8000;

function fail(msg) {
  process.stderr.write(`context-graph: ${msg}\n`);
  process.exit(1);
}

// ------------------------------------------------------------- measurement

// Claude Code strips block-level HTML comments before injecting a memory file.
// Comments inside fenced code are kept, so only strip outside fences. A
// comment can span lines.
function stripHtmlComments(content) {
  const out = [];
  let inFence = false;
  let inComment = false;
  for (const line of content.split('\n')) {
    if (!inComment && /^[ \t]*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) { out.push(line); continue; }
    let kept = '';
    let rest = line;
    while (rest.length) {
      if (inComment) {
        const close = rest.indexOf('-->');
        if (close === -1) { rest = ''; break; }
        inComment = false;
        rest = rest.slice(close + 3);
      } else {
        const open = rest.indexOf('<!--');
        if (open === -1) { kept += rest; rest = ''; break; }
        kept += rest.slice(0, open);
        inComment = true;
        rest = rest.slice(open + 4);
      }
    }
    if (!(inComment && kept === '') || line === '') out.push(kept);
  }
  return out.join('\n');
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function countWords(text) {
  const m = text.match(/\S+/g);
  return m ? m.length : 0;
}

// Splits on level-two headings. Each section includes its heading line, so
// the sections of a file add up to the file. Text before the first one is
// "preamble".
function sections(text) {
  const out = [];
  let current = { heading: 'preamble', text: '' };
  for (const line of text.split('\n')) {
    const m = /^##\s+(.*)$/.exec(line);
    if (m) {
      out.push(current);
      current = { heading: m[1].trim(), text: line + '\n' };
    } else {
      current.text += line + '\n';
    }
  }
  out.push(current);
  return out
    .filter((s) => s.heading !== 'preamble' || s.text.trim() !== '')
    .map((s) => ({ heading: s.heading, tokens: estimateTokens(s.text) }));
}

// --------------------------------------------------------------- references

// Trailing punctuation is prose, not path.
function trimPath(p) {
  return p.replace(/[.,;:!?)\]]+$/, '');
}

// An @ reference is only a path candidate when it can be one: it starts with
// a directory prefix, or its last segment carries an extension. Without either
// (`@tanstack/router-cli`, `@theme`) it is a package or handle, and it counts
// only when a file by that name exists — Claude Code's own `@README` example.
const REF = /(?:~\/|\.{1,2}\/|\/)?[\w.\-][\w.\-/]*/;

function looksLikePath(ref) {
  if (/^(?:~\/|\.{1,2}\/|\/)/.test(ref)) return true;
  const last = ref.split('/').pop();
  return /\.[A-Za-z0-9]+$/.test(last);
}

// Bare @path tokens outside code spans and fences — Claude Code's import rule.
// A leading word character rules out e-mail addresses and handles.
function findImports(content) {
  const scannable = stripCode(content);
  const found = [];
  const re = new RegExp(`(?<![\\w\`@/])@(${REF.source})`, 'g');
  let m;
  while ((m = re.exec(scannable)) !== null) {
    const p = trimPath(m[1]);
    if (p && !found.includes(p)) found.push(p);
  }
  return found;
}

// Resolves an @path the way Claude Code does: relative to the file that holds
// it, `~/` to the home directory, `/` to the filesystem root. `inside` is false
// for a target outside the scanned root — counted as external, never read.
function resolveRef(root, fromFile, ref) {
  let target;
  if (ref.startsWith('~/')) target = path.join(os.homedir(), ref.slice(2));
  else if (ref.startsWith('/')) target = ref;
  else target = path.resolve(path.dirname(fromFile), ref);
  const inside = target === root || target.startsWith(root + path.sep);
  return { target, inside };
}

// Backticked @paths and relative markdown links to files. `link` marks a
// markdown link, whose leading `/` means the scanned root.
function findPointers(content) {
  const found = [];
  const add = (ref, link) => { if (ref && !found.some((p) => p.ref === ref)) found.push({ ref, link }); };
  let m;
  const span = new RegExp(`\`@(${REF.source})\``, 'g');
  while ((m = span.exec(content)) !== null) add(trimPath(m[1]), false);
  for (const { target } of findLinks(content)) add(target, true);
  return found;
}

// ------------------------------------------------------------------ scanning

function measureFile(root, file) {
  const raw = readText(file);
  if (raw === null) return null;
  const text = stripHtmlComments(raw);
  return {
    path: rel(root, file),
    tokens: estimateTokens(text),
    words: countWords(text),
    lines: text.split('\n').length,
    marker: isMarkerContent(raw),
    sections: sections(text),
    imports: findImports(text),
    pointers: findPointers(text),
  };
}

// Follows bare imports from the node's own files, up to MAX_IMPORT_HOPS deep.
// Own files count as hop 0 and are never re-counted as imports.
function resolveImports(root, ownFiles, cache) {
  const own = new Set(ownFiles.map((f) => path.join(root, f.path)));
  const seen = new Set(own);
  const resolved = [];
  const unresolved = [];
  const external = [];

  let frontier = ownFiles.map((f) => ({ file: path.join(root, f.path), imports: f.imports }));
  for (let hop = 1; hop <= MAX_IMPORT_HOPS && frontier.length; hop++) {
    const next = [];
    for (const { file, imports } of frontier) {
      for (const ref of imports) {
        const { target, inside } = resolveRef(root, file, ref);
        const from = rel(root, file);
        if (!inside) {
          addOnce(external, [{ from, ref }]);
          continue;
        }
        if (seen.has(target)) continue;
        seen.add(target);
        const measured = isDir(target) ? null : (cache.get(target) || measureFile(root, target));
        if (!measured) {
          if (looksLikePath(ref)) unresolved.push({ from, ref });
          continue;
        }
        cache.set(target, measured);
        resolved.push({ path: measured.path, tokens: measured.tokens, hop, from });
        next.push({ file: target, imports: measured.imports });
      }
    }
    frontier = next;
  }
  return { resolved, unresolved, external };
}

function checkPointers(root, file, pointers) {
  const out = [];
  for (const { ref, link } of pointers) {
    const from = path.join(root, file.path);
    const { target, inside } = link
      ? { target: resolveLink(root, from, ref), inside: true }
      : resolveRef(root, from, ref);
    const exists = fs.existsSync(target);
    if (!exists && !looksLikePath(ref)) continue;
    out.push({ from: file.path, ref, target: inside ? rel(root, target) : null, exists });
  }
  return out;
}

// Every directory under root that holds an instruction file, in path order.
function findNodes(root) {
  const nodes = [];
  (function walk(dir) {
    const present = CONTEXT_FILES.filter((name) => isFile(path.join(dir, name)));
    if (present.length) nodes.push({ dir, present });
    for (const entry of listDir(dir)) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      walk(path.join(dir, entry.name));
    }
  })(root);
  nodes.sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
  return nodes;
}

function nearestAncestor(nodePaths, nodePath) {
  let dir = nodePath;
  for (;;) {
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    if (nodePaths.has(parent)) return parent;
    dir = parent;
  }
}

// A file imported by several nodes reports its bad imports once.
function addOnce(list, entries) {
  for (const e of entries) if (!list.some((x) => x.from === e.from && x.ref === e.ref)) list.push(e);
}

function scan(rootArg) {
  const root = path.resolve(rootArg);
  const cache = new Map();
  const found = findNodes(root);
  const nodeSet = new Set(found.map((n) => n.dir));
  const byDir = new Map();
  const pointers = [];
  const unresolvedImports = [];
  const externalImports = [];

  const nodes = found.map(({ dir, present }) => {
    const files = present.map((name) => measureFile(root, path.join(dir, name))).filter(Boolean);
    for (const f of files) cache.set(path.join(root, f.path), f);
    const imports = resolveImports(root, files, cache);
    addOnce(unresolvedImports, imports.unresolved);
    addOnce(externalImports, imports.external);
    for (const f of files) pointers.push(...checkPointers(root, f, f.pointers));

    const agents = files.find((f) => f.path.endsWith('AGENTS.md'));
    const kind = agents ? (agents.marker ? 'marker' : 'scope') : 'claude-only';
    const ownTokens = files.reduce((s, f) => s + f.tokens, 0)
      + imports.resolved.reduce((s, f) => s + f.tokens, 0);
    const gotchaTokens = agents
      ? agents.sections.filter((s) => GOTCHA_HEADING.test(s.heading)).reduce((s, x) => s + x.tokens, 0)
      : 0;

    let docs = null;
    if (kind === 'scope') {
      const docsDir = resolveDocsFolder(dir, null);
      if (isDir(docsDir)) {
        const mdFiles = collectMarkdownFiles(docsDir, []);
        let tokens = 0;
        for (const f of mdFiles) {
          const m = cache.get(f) || measureFile(root, f);
          if (m) { cache.set(f, m); tokens += m.tokens; }
        }
        docs = { path: rel(root, docsDir), files: mdFiles.length, tokens };
      }
    }

    const parentDir = nearestAncestor(nodeSet, dir);
    const node = {
      path: rel(root, dir) || '.',
      depth: dir === root ? 0 : rel(root, dir).split('/').length,
      parent: parentDir === null ? null : (rel(root, parentDir) || '.'),
      kind,
      files: files.map((f) => ({
        path: f.path, tokens: f.tokens, words: f.words, lines: f.lines,
        marker: f.marker, sections: f.sections,
      })),
      imports: imports.resolved,
      own_tokens: ownTokens,
      chain_tokens: 0, // filled below, parents first
      gotcha_tokens: gotchaTokens,
      docs,
    };
    byDir.set(dir, node);
    return node;
  });

  // Path order puts every ancestor before its descendants.
  for (const { dir } of found) {
    const node = byDir.get(dir);
    const parentDir = nearestAncestor(nodeSet, dir);
    node.chain_tokens = node.own_tokens + (parentDir === null ? 0 : byDir.get(parentDir).chain_tokens);
  }

  const heaviest = nodes
    .filter((n) => n.kind !== 'marker')
    .reduce((best, n) => (best === null || n.chain_tokens > best.chain_tokens ? n : best), null);
  const brokenPointers = pointers.filter((p) => !p.exists);

  return {
    schema_version: SCHEMA_VERSION,
    root,
    token_estimate: 'characters / 4 after stripping HTML comments',
    nodes,
    totals: {
      nodes: nodes.length,
      scopes: nodes.filter((n) => n.kind === 'scope').length,
      markers: nodes.filter((n) => n.kind === 'marker').length,
      instruction_tokens: nodes.reduce((s, n) => s + n.own_tokens, 0),
      gotcha_tokens: nodes.reduce((s, n) => s + n.gotcha_tokens, 0),
      docs_tokens: nodes.reduce((s, n) => s + (n.docs ? n.docs.tokens : 0), 0),
      heaviest_chain: heaviest ? { path: heaviest.path, tokens: heaviest.chain_tokens } : null,
    },
    pointers,
    broken_pointers: brokenPointers,
    unresolved_imports: unresolvedImports,
    external_imports: externalImports,
  };
}

// ----------------------------------------------------------------- rendering

function k(n) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1)}k`;
}

function pad(s, width) {
  s = String(s);
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

// The nearest ancestor of a node that is shown. Hidden marker nodes are
// skipped, so their children hang from the next shown ancestor.
function shownParent(graph, shownPaths) {
  const byPath = new Map(graph.nodes.map((n) => [n.path, n]));
  return (n) => {
    let p = n.parent;
    while (p !== null && !shownPaths.has(p)) p = byPath.get(p).parent;
    return p;
  };
}

function renderTree(graph, options = {}) {
  // Numbers are right-aligned under a header row. own and chain carry a
  // two-character warning column after the number.
  const CELL = 8;
  const right = (text) => ' '.repeat(Math.max(0, CELL - String(text).length)) + text;
  const cell = (tokens) => right(k(tokens)) + (tokens >= ALERT_TOKENS ? '!!' : tokens >= WARN_TOKENS ? '! ' : '  ');
  // Marker rows (the docs-folder template) are hidden unless options.markers.
  const shown = graph.nodes.filter((n) => options.markers || n.kind !== 'marker');
  const displayParent = shownParent(graph, new Set(shown.map((n) => n.path)));
  const children = new Map();
  for (const n of shown) {
    const p = displayParent(n);
    if (!children.has(p)) children.set(p, []);
    children.get(p).push(n);
  }
  function label(n) {
    const p = displayParent(n);
    const name = p === null || p === '.' ? n.path : n.path.slice(p.length + 1);
    const tag = n.kind === 'marker' ? ' (marker)' : n.kind === 'claude-only' ? ' (CLAUDE.md)' : '';
    return name + tag;
  }
  // Build the label column first so every row pads to the same width.
  const rows = [];
  function walk(n, prefix, branch, isLast) {
    rows.push({ text: prefix + branch + label(n), node: n });
    const kids = children.get(n.path) || [];
    const childPrefix = branch === '' ? '' : prefix + (isLast ? '    ' : '│   ');
    kids.forEach((kid, i) => walk(kid, childPrefix, i === kids.length - 1 ? '└── ' : '├── ', i === kids.length - 1));
  }
  for (const top of children.get(null) || []) walk(top, '', '', true);
  const width = Math.max(...rows.map((r) => r.text.length));

  const header = pad('', width) + right('own') + '  ' + right('chain') + '  ' + right('gotchas') + right('docs');
  const lines = [header, ...rows.map(({ text, node: n }) => pad(text, width)
    + cell(n.own_tokens)
    + cell(n.chain_tokens)
    + right(k(n.gotcha_tokens))
    + right(n.docs ? k(n.docs.tokens) : '-'))];
  if (rows.length > 30) lines.push(header);

  const t = graph.totals;
  const hidden = graph.nodes.filter((n) => n.kind === 'marker' && !options.markers);
  lines.push('');
  lines.push('own      this folder\'s AGENTS.md and CLAUDE.md, plus files they import with a bare @path');
  lines.push('chain    own here plus own in every folder above. What loads when an agent starts here');
  lines.push('gotchas  the Gotchas section of AGENTS.md');
  lines.push('docs     the docs folder. Read on demand, not at start');
  lines.push(`All numbers are tokens, estimated as characters / 4. ! marks ${WARN_TOKENS.toLocaleString('en')} or more, !! marks ${ALERT_TOKENS.toLocaleString('en')} or more.`);
  lines.push('');
  lines.push(`${t.nodes} nodes (${t.scopes} scopes, ${t.markers} markers). Instruction files: ${k(t.instruction_tokens)} tokens, of which gotchas ${k(t.gotcha_tokens)}. Docs on demand: ${k(t.docs_tokens)} tokens.`);
  if (t.heaviest_chain) lines.push(`Heaviest launch load: ${t.heaviest_chain.path} at ${k(t.heaviest_chain.tokens)} tokens.`);
  if (hidden.length) lines.push(`${hidden.length} docs-folder marker rows hidden (${k(hidden.reduce((s, n) => s + n.own_tokens, 0))} tokens in total, loaded when a docs file is read). Add --all to show them.`);
  if (graph.broken_pointers.length) lines.push(`Broken pointers: ${graph.broken_pointers.length}.`);
  if (graph.unresolved_imports.length) lines.push(`Unresolved bare @imports: ${graph.unresolved_imports.length}.`);
  if (graph.external_imports.length) lines.push(`External imports (not counted): ${graph.external_imports.length}.`);
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------- main

function main() {
  const argv = process.argv.slice(2);
  let format = 'json';
  let all = false;
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--format') {
      format = argv[++i];
      if (!['json', 'tree'].includes(format)) fail(`--format must be json or tree, got "${format}"`);
    } else if (a === '--all') {
      all = true;
    } else if (a.startsWith('--')) {
      fail(`unknown option ${a}`);
    } else {
      positional.push(a);
    }
  }
  if (positional.length > 1) fail('usage: context-graph.js [root] [--format json|tree] [--all]');
  const root = path.resolve(positional[0] || '.');
  if (!isDir(root)) fail(`root is not a directory: ${root}`);

  const graph = scan(root);
  process.stdout.write(format === 'tree' ? renderTree(graph, { markers: all }) : JSON.stringify(graph, null, 2) + '\n');
}

module.exports = { scan, renderTree, findPointers, findImports, stripHtmlComments, SCHEMA_VERSION };
if (require.main === module) {
  // A reader that stops early (`| head`) closes the pipe; that is not an error.
  process.stdout.on('error', (error) => {
    if (error.code === 'EPIPE') process.exit(0);
    throw error;
  });
  main();
}
