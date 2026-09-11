#!/usr/bin/env node
'use strict';
// Measure how much instruction context an agent carries at each directory of
// a project, and where that weight comes from.
//
//   context-graph.js [root] [--format json|tree|markdown|treegraph] [--out <file> | --save] [--all]
//
// The tree hides docs-folder marker rows (the template every scope carries)
// unless --all is given; the footer reports how many and how much.
//
// Every format prints to stdout. --out <file> writes it to that file instead.
// --save writes it to <root>/.claude/.trace/context-graph-<timestamp>.<ext>,
// so a new run never overwrites an old report. Both print the path written.
//
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
// Output is a single document on stdout, or in --out when given. Exit 1 is
// reserved for caller errors (bad arguments, unreadable root). Node built-ins
// only; never writes anywhere but --out.

const fs = require('node:fs');
const path = require('node:path');
const {
  SKIP_DIRS, readText, isDir, rel, listDir, isMarkerContent, stripCode,
  collectMarkdownFiles, resolveDocsFolder,
  REF, trimPath, looksLikePath, findImports, resolveRef,
} = require('./trace-lib');

const SCHEMA_VERSION = 1;
const MAX_IMPORT_HOPS = 4;
const CONTEXT_FILES = ['AGENTS.md', 'CLAUDE.md', 'CLAUDE.local.md'];
const GOTCHA_HEADING = /gotcha/i;

// Terminal decoration for the tree format only. A cell turns yellow at
// COLOR_WARN_TOKENS and red at COLOR_ALERT_TOKENS. Never part of JSON,
// markdown, or the fixture contract.
const COLOR_WARN_TOKENS = 4000;
const COLOR_ALERT_TOKENS = 8000;
const ANSI = { yellow: '\x1b[33m', red: '\x1b[31m', reset: '\x1b[0m' };

// Color only when writing to a terminal, unless the environment says otherwise:
// NO_COLOR wins, then FORCE_COLOR, then TERM=dumb, then the TTY check.
function useColor(outFile, env = process.env, isTTY = process.stdout.isTTY) {
  if (outFile) return false;
  if ('NO_COLOR' in env) return false;
  if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== '0' && env.FORCE_COLOR !== '') return true;
  if (env.TERM === 'dumb') return false;
  return isTTY === true;
}

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

// Backticked @paths and relative markdown links to files.
function findPointers(content) {
  const found = [];
  const add = (p) => { if (p && !found.includes(p)) found.push(p); };
  let m;
  const span = new RegExp(`\`@(${REF.source})\``, 'g');
  while ((m = span.exec(content)) !== null) add(trimPath(m[1]));
  const link = /\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const scannable = stripCode(content);
  while ((m = link.exec(scannable)) !== null) {
    const target = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
    const bare = target.split('#')[0];
    if (bare) add(bare);
  }
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
          if (!external.some((e) => e.ref === ref && e.from === from)) external.push({ from, ref });
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
  for (const ref of pointers) {
    const { target, inside } = resolveRef(root, path.join(root, file.path), ref);
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
    const present = CONTEXT_FILES.filter((name) => {
      try { return fs.statSync(path.join(dir, name)).isFile(); } catch { return false; }
    });
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
    unresolvedImports.push(...imports.unresolved);
    externalImports.push(...imports.external);
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

  const heaviest = nodes.reduce((best, n) => (best === null || n.chain_tokens > best.chain_tokens ? n : best), null);
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

function renderTree(graph, options = {}) {
  // Numbers are right-aligned under a header row. Pad first, then wrap, so
  // escape codes never shift the columns.
  const CELL = 8;
  const right = (text) => ' '.repeat(Math.max(0, CELL - String(text).length)) + text;
  const cell = (tokens) => {
    const text = right(k(tokens));
    if (!options.color) return text;
    const color = tokens >= COLOR_ALERT_TOKENS ? ANSI.red : tokens >= COLOR_WARN_TOKENS ? ANSI.yellow : null;
    return color ? color + text + ANSI.reset : text;
  };
  // Marker rows (the docs-folder template) are hidden unless options.markers.
  // A hidden marker's children hang from the nearest shown ancestor.
  const shown = graph.nodes.filter((n) => options.markers || n.kind !== 'marker');
  const shownPaths = new Set(shown.map((n) => n.path));
  const byPath = new Map(graph.nodes.map((n) => [n.path, n]));
  const displayParent = (n) => {
    let p = n.parent;
    while (p !== null && !shownPaths.has(p)) p = byPath.get(p).parent;
    return p;
  };
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

  const header = pad('', width) + ['own', 'chain', 'gotchas', 'docs'].map(right).join('');
  const lines = [header, ...rows.map(({ text, node: n }) => pad(text, width)
    + cell(n.own_tokens)
    + cell(n.chain_tokens)
    + right(k(n.gotcha_tokens))
    + right(n.docs ? k(n.docs.tokens) : '-'))];
  if (rows.length > 30) lines.push(header);

  const t = graph.totals;
  const hidden = graph.nodes.filter((n) => n.kind === 'marker' && !options.markers);
  const heaviest = shown.reduce((best, n) => (best === null || n.chain_tokens > best.chain_tokens ? n : best), null);
  lines.push('');
  lines.push('own      this folder\'s AGENTS.md and CLAUDE.md, plus files they import with a bare @path');
  lines.push('chain    own here plus own in every folder above. What loads when an agent starts here');
  lines.push('gotchas  the Gotchas section of AGENTS.md');
  lines.push('docs     the docs folder. Read on demand, not at start');
  lines.push('All numbers are tokens, estimated as characters / 4.');
  lines.push('');
  lines.push(`${t.nodes} nodes (${t.scopes} scopes, ${t.markers} markers). Instruction files: ${k(t.instruction_tokens)} tokens, of which gotchas ${k(t.gotcha_tokens)}. Docs on demand: ${k(t.docs_tokens)} tokens.`);
  if (heaviest) lines.push(`Heaviest launch load: ${heaviest.path} at ${k(heaviest.chain_tokens)} tokens.`);
  if (hidden.length) lines.push(`${hidden.length} docs-folder marker rows hidden (${k(hidden.reduce((s, n) => s + n.own_tokens, 0))} tokens in total, loaded when a docs file is read). Add --all to show them.`);
  if (graph.broken_pointers.length) lines.push(`Broken pointers: ${graph.broken_pointers.length}.`);
  if (graph.unresolved_imports.length) lines.push(`Unresolved bare @imports: ${graph.unresolved_imports.length}.`);
  if (graph.external_imports.length) lines.push(`External imports (not counted): ${graph.external_imports.length}.`);
  return lines.join('\n') + '\n';
}

function mermaidId(i) {
  return `n${i}`;
}

function renderMarkdown(graph) {
  const t = graph.totals;
  const out = [];
  out.push('# Context graph');
  out.push('');
  out.push(`Root: \`${graph.root}\``);
  out.push('');
  out.push(`${t.nodes} directories hold instruction files: ${t.scopes} scopes, ${t.markers} docs-folder markers. Instruction files weigh ${k(t.instruction_tokens)} tokens in total, and gotcha sections account for ${k(t.gotcha_tokens)} of them. Docs folders hold ${k(t.docs_tokens)} tokens that load only when read.`);
  if (t.heaviest_chain) {
    out.push('');
    out.push(`The heaviest launch load is \`${t.heaviest_chain.path}\` at ${k(t.heaviest_chain.tokens)} tokens. That is what an agent started in that directory carries before reading one line of code.`);
  }
  out.push('');
  out.push(`Tokens are estimated as characters divided by four. Own is the node's instruction files plus their bare \`@\` imports. Chain is own summed from the root to the node.`);
  out.push('');

  // Mermaid: scopes and CLAUDE.md-only nodes; markers are template copies.
  const shown = graph.nodes.filter((n) => n.kind !== 'marker');
  const index = new Map(shown.map((n, i) => [n.path, i]));
  out.push('```mermaid');
  out.push('graph TD');
  for (const n of shown) {
    const name = n.path === '.' ? 'root' : n.path;
    out.push(`  ${mermaidId(index.get(n.path))}["${name}<br/>own ${k(n.own_tokens)} · chain ${k(n.chain_tokens)}"]`);
  }
  for (const n of shown) {
    let parent = n.parent;
    while (parent !== null && !index.has(parent)) parent = graph.nodes.find((x) => x.path === parent).parent;
    if (parent !== null) out.push(`  ${mermaidId(index.get(parent))} --> ${mermaidId(index.get(n.path))}`);
  }
  out.push('```');
  out.push('');

  out.push('| Path | Kind | Own | Chain | Gotchas | Docs (on demand) | Imports |');
  out.push('|---|---|---:|---:|---:|---:|---|');
  for (const n of graph.nodes) {
    const docs = n.docs ? `${k(n.docs.tokens)} (${n.docs.files} files)` : '-';
    const imports = n.imports.length ? n.imports.map((i) => `\`${i.path}\``).join(', ') : '-';
    out.push(`| \`${n.path}\` | ${n.kind} | ${k(n.own_tokens)} | ${k(n.chain_tokens)} | ${k(n.gotcha_tokens)} | ${docs} | ${imports} |`);
  }
  out.push('');

  const sectionRows = [];
  for (const n of graph.nodes) {
    for (const f of n.files) {
      if (f.marker) continue;
      for (const s of f.sections) sectionRows.push({ file: f.path, heading: s.heading, tokens: s.tokens });
    }
  }
  sectionRows.sort((a, b) => b.tokens - a.tokens);
  if (sectionRows.length) {
    out.push('## Heaviest sections');
    out.push('');
    out.push('| File | Section | Tokens |');
    out.push('|---|---|---:|');
    for (const r of sectionRows.slice(0, 15)) out.push(`| \`${r.file}\` | ${r.heading} | ${k(r.tokens)} |`);
    out.push('');
  }

  if (graph.broken_pointers.length) {
    out.push('## Broken pointers');
    out.push('');
    for (const p of graph.broken_pointers) out.push(`- \`${p.from}\` points to \`${p.ref}\`, which does not exist.`);
    out.push('');
  }
  if (graph.unresolved_imports.length) {
    out.push('## Unresolved bare imports');
    out.push('');
    out.push('A bare `@path` outside backticks is an import. These targets do not exist, so either the path is wrong or the `@` was meant as text and needs backticks.');
    out.push('');
    for (const p of graph.unresolved_imports) out.push(`- \`${p.from}\` imports \`${p.ref}\`.`);
    out.push('');
  }
  if (graph.external_imports.length) {
    out.push('## External imports');
    out.push('');
    out.push('These resolve outside the scanned root. They load into context but are not counted here.');
    out.push('');
    for (const p of graph.external_imports) out.push(`- \`${p.from}\` imports \`${p.ref}\`.`);
    out.push('');
  }
  return out.join('\n');
}

// ------------------------------------------------------------------ treemap

// The treegraph: a static SVG treemap of launch weight. Each directory is a box sized by the
// tokens loaded there, nested in its parent. Inside a box, the instruction
// files split into their sections and imports, so a heavy Gotchas section is
// visible as area. Docs folders are left out: they load on demand and would
// dwarf everything else. Every box carries a <title>, which browsers show on
// hover.

const SVG = {
  width: 1200, height: 760, title: 34, legend: 28, header: 16, pad: 3, font: 11,
  fill: {
    scope: '#e8eef5', marker: '#f1f1f1', 'claude-only': '#e9f3e9', virtual: '#ffffff',
    section: '#c9d5e3', gotchas: '#f2b58f', import: '#d8cbea', file: '#dddddd',
  },
};

function escapeXml(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Squarified treemap (Bruls, Huizing, van Wijk). Items are laid out in rows
// along the shorter side; a row closes when adding the next item would make
// its worst aspect ratio worse.
function squarify(items, x, y, w, h) {
  const total = items.reduce((sum, it) => sum + it.area, 0);
  if (total <= 0 || w <= 0 || h <= 0) return [];
  const scaled = items
    .map((it) => ({ item: it, a: (it.area / total) * w * h }))
    .filter((it) => it.a > 0)
    .sort((p, q) => q.a - p.a);
  const worst = (row, sum, side) => {
    const s2 = sum * sum;
    const side2 = side * side;
    let max = 0;
    let min = Infinity;
    for (const r of row) { if (r.a > max) max = r.a; if (r.a < min) min = r.a; }
    return Math.max((side2 * max) / s2, s2 / (side2 * min));
  };
  const out = [];
  let i = 0;
  while (i < scaled.length && w > 0 && h > 0) {
    const vertical = w >= h; // the row runs down the left edge
    const side = vertical ? h : w;
    let row = [scaled[i]];
    let sum = scaled[i].a;
    i++;
    let ratio = worst(row, sum, side);
    while (i < scaled.length) {
      const next = row.concat(scaled[i]);
      const nextSum = sum + scaled[i].a;
      const nextRatio = worst(next, nextSum, side);
      if (nextRatio > ratio) break;
      row = next; sum = nextSum; ratio = nextRatio; i++;
    }
    const thickness = sum / side;
    let offset = 0;
    for (const r of row) {
      const length = r.a / thickness;
      out.push(vertical
        ? { item: r.item, x, y: y + offset, w: thickness, h: length }
        : { item: r.item, x: x + offset, y, w: length, h: thickness });
      offset += length;
    }
    if (vertical) { x += thickness; w -= thickness; } else { y += thickness; h -= thickness; }
  }
  return out;
}

// Builds the box tree from the graph: directories contain their instruction
// files (split into sections), their imports, and their child directories.
function treemapTree(graph) {
  const byPath = new Map();
  for (const n of graph.nodes) {
    const children = [];
    for (const file of n.files) {
      const name = file.path.split('/').pop();
      if (file.sections.length > 1) {
        for (const sec of file.sections) {
          const gotcha = GOTCHA_HEADING.test(sec.heading);
          children.push({ label: sec.heading === 'preamble' ? name : `## ${sec.heading}`, area: sec.tokens, kind: gotcha ? 'gotchas' : 'section', title: `${file.path} — ${sec.heading}: ${sec.tokens} tokens` });
        }
      } else {
        children.push({ label: name, area: file.tokens, kind: 'file', title: `${file.path}: ${file.tokens} tokens` });
      }
    }
    for (const imp of n.imports) {
      children.push({ label: `@${imp.path.split('/').pop()}`, area: imp.tokens, kind: 'import', title: `import ${imp.path} (hop ${imp.hop} from ${imp.from}): ${imp.tokens} tokens` });
    }
    byPath.set(n.path, { label: n.path === '.' ? 'root' : n.path.split('/').pop(), kind: n.kind, node: n, children, area: 0 });
  }
  const tops = [];
  for (const n of graph.nodes) {
    const box = byPath.get(n.path);
    if (n.parent === null) tops.push(box);
    else byPath.get(n.parent).children.push(box);
  }
  const total = (box) => {
    if (box.node) {
      box.area = box.children.reduce((sum, c) => sum + total(c), 0);
      box.title = `${box.node.path} — own ${k(box.node.own_tokens)}, chain ${k(box.node.chain_tokens)}, gotchas ${k(box.node.gotcha_tokens)}`;
    }
    return box.area;
  };
  tops.forEach(total);
  if (tops.length === 1) return tops[0];
  const virtual = { label: 'root', kind: 'virtual', children: tops, area: tops.reduce((sum, t) => sum + t.area, 0), title: 'scanned root' };
  return virtual;
}

function renderTreegraph(graph) {
  const tree = treemapTree(graph);
  const parts = [];
  const { font, pad, header } = SVG;
  const label = (text, x, y, w, h, bold) => {
    if (h < font + 2 || w < font) return;
    const maxChars = Math.floor((w - 4) / (font * 0.58));
    if (maxChars < 2) return;
    const shown = text.length > maxChars ? text.slice(0, Math.max(1, maxChars - 1)) + '…' : text;
    parts.push(`<text x="${(x + 3).toFixed(1)}" y="${(y + font).toFixed(1)}" font-size="${font}"${bold ? ' font-weight="600"' : ''}>${escapeXml(shown)}</text>`);
  };
  const draw = (box, x, y, w, h, depth) => {
    if (w <= 0 || h <= 0) return;
    const fill = SVG.fill[box.kind] || SVG.fill.file;
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="#555" stroke-width="${box.node || box.kind === 'virtual' ? 1 : 0.5}"><title>${escapeXml(box.title || box.label)}</title></rect>`);
    if (!box.children || !box.children.length) {
      label(`${box.label} ${k(box.area)}`, x, y, w, h, false);
      return;
    }
    const hasHeader = h >= header + 2 * pad + font;
    if (hasHeader) label(`${box.label} ${k(box.area)}`, x, y, w, header, true);
    const innerY = y + (hasHeader ? header : pad);
    const innerH = h - (hasHeader ? header : pad) - pad;
    const placed = squarify(box.children, x + pad, innerY, w - 2 * pad, innerH);
    for (const p of placed) draw(p.item, p.x, p.y, p.w, p.h, depth + 1);
  };

  const t = graph.totals;
  const width = SVG.width;
  const height = SVG.height;
  parts.push(`<text x="8" y="22" font-size="15" font-weight="600">Context weight: ${escapeXml(graph.root)}</text>`);
  parts.push(`<text x="8" y="${SVG.title + height + 18}" font-size="${font}">Box area is tokens loaded at launch (characters / 4). ${t.nodes} directories, ${k(t.instruction_tokens)} tokens, gotchas ${k(t.gotcha_tokens)}. Docs folders (${k(t.docs_tokens)} tokens, on demand) are not drawn.</text>`);
  let lx = 8;
  for (const [name, key] of [['scope', 'scope'], ['docs marker', 'marker'], ['CLAUDE.md only', 'claude-only'], ['section', 'section'], ['Gotchas', 'gotchas'], ['import', 'import']]) {
    const ly = SVG.title + height + 26;
    parts.push(`<rect x="${lx}" y="${ly}" width="12" height="12" fill="${SVG.fill[key]}" stroke="#555" stroke-width="0.5"/>`);
    parts.push(`<text x="${lx + 16}" y="${ly + 10}" font-size="${font}">${escapeXml(name)}</text>`);
    lx += 16 + name.length * font * 0.6 + 14;
  }
  draw(tree, 0.5, SVG.title + 0.5, width - 1, height - 1, 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${SVG.title + height + SVG.legend + 14}" viewBox="0 0 ${width} ${SVG.title + height + SVG.legend + 14}" font-family="system-ui, sans-serif" fill="#111">\n<rect width="100%" height="100%" fill="#fff"/>\n${parts.join('\n')}\n</svg>\n`;
}

// ---------------------------------------------------------------------- main

// File extension per format, for --save.
const EXTENSIONS = { json: 'json', tree: 'txt', markdown: 'md', treegraph: 'svg' };

function timestamp(date = new Date()) {
  const two = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${two(date.getMonth() + 1)}${two(date.getDate())}-${two(date.getHours())}${two(date.getMinutes())}${two(date.getSeconds())}`;
}

// <root>/.claude/.trace/context-graph-<timestamp>.<ext>. The state folder is
// self-gitignored, the same way the hooks leave it.
function saveFile(root, ext, date) {
  const dir = path.join(root, '.claude', '.trace');
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(dir, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '*\n');
  return path.join(dir, `context-graph-${timestamp(date)}.${ext}`);
}

function main() {
  const argv = process.argv.slice(2);
  let format = 'json';
  let outFile = null;
  let save = false;
  let all = false;
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--format') {
      format = argv[++i];
      if (!['json', 'tree', 'markdown', 'treegraph'].includes(format)) fail(`--format must be json, tree, markdown, or treegraph, got "${format}"`);
    } else if (a === '--out') {
      outFile = argv[++i];
      if (!outFile) fail('--out requires a file path');
    } else if (a === '--save') {
      save = true;
    } else if (a === '--all') {
      all = true;
    } else if (a.startsWith('--')) {
      fail(`unknown option ${a}`);
    } else {
      positional.push(a);
    }
  }
  if (positional.length > 1) fail('usage: context-graph.js [root] [--format json|tree|markdown|treegraph] [--out <file> | --save] [--all]');
  if (outFile && save) fail('--out and --save exclude each other');
  const root = path.resolve(positional[0] || '.');
  if (!isDir(root)) fail(`root is not a directory: ${root}`);

  const graph = scan(root);
  const text = format === 'json' ? JSON.stringify(graph, null, 2) + '\n'
    : format === 'tree' ? renderTree(graph, { color: useColor(outFile), markers: all })
      : format === 'treegraph' ? renderTreegraph(graph)
        : renderMarkdown(graph);

  if (!outFile && !save) {
    process.stdout.write(text);
    return;
  }
  let dest;
  if (outFile) {
    dest = path.resolve(outFile);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
  } else {
    dest = saveFile(root, EXTENSIONS[format]);
  }
  fs.writeFileSync(dest, text);
  process.stdout.write(`${dest}\n`);
}

module.exports = { scan, renderTree, renderMarkdown, renderTreegraph, squarify, saveFile, timestamp, findPointers, stripHtmlComments, useColor, SCHEMA_VERSION };
if (require.main === module) {
  // A reader that stops early (`| head`) closes the pipe; that is not an error.
  process.stdout.on('error', (error) => {
    if (error.code === 'EPIPE') process.exit(0);
    throw error;
  });
  main();
}
