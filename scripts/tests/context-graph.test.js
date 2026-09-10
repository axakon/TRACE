'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('../generate-plugins');

const FIXTURE = path.join(ROOT, 'scripts/tests/fixtures/context-graph');
const EXPECTED = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/context-graph.expected.json'), 'utf8'));

function run(plugin, script, args, cwd = ROOT) {
  const result = spawnSync(process.execPath, [path.join(ROOT, plugin, 'scripts', script), ...args], { cwd, encoding: 'utf8' });
  return result;
}

for (const base of ['deliverable/plugins/trace', 'plugins/trace', 'plugins/trace-full']) {
  test(`${base}: context-graph matches the fixture contract`, () => {
    const result = run(base, 'context-graph.js', [FIXTURE]);
    assert.equal(result.status, 0, result.stderr);
    const graph = JSON.parse(result.stdout);
    assert.equal(graph.root, FIXTURE);
    delete graph.root;
    assert.deepEqual(graph, EXPECTED);
  });

  test(`${base}: context-graph renders a tree and a markdown report`, (t) => {
    const tree = run(base, 'context-graph.js', [FIXTURE, '--format', 'tree']);
    assert.equal(tree.status, 0, tree.stderr);
    assert.match(tree.stdout, /^ +own {3}chain {1}gotchas {4}docs$/m, 'header row with right-aligned titles');
    assert.match(tree.stdout, /^\. {2,}264 {5}264 {6}29 {5}180$/m);
    assert.doesNotMatch(tree.stdout, /\(marker\)/, 'marker rows are hidden by default');
    assert.match(tree.stdout, /Heaviest launch load: services\/billing at 424 tokens\./);
    assert.match(tree.stdout, /2 docs-folder marker rows hidden \(86 tokens in total, loaded when a docs file is read\)\. Add --all to show them\./);
    const all = run(base, 'context-graph.js', [FIXTURE, '--format', 'tree', '--all']);
    assert.match(all.stdout, /└── context \(marker\) +43 +467 +0 +-$/m);
    assert.match(all.stdout, /Heaviest launch load: services\/billing\/context at 467 tokens\./);
    assert.doesNotMatch(all.stdout, /marker rows hidden/);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-context-graph-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const out = path.join(dir, 'nested', 'context-graph.md');
    const md = run(base, 'context-graph.js', [FIXTURE, '--format', 'markdown', '--out', out]);
    assert.equal(md.status, 0, md.stderr);
    assert.equal(md.stdout.trim(), out);
    const report = fs.readFileSync(out, 'utf8');
    assert.match(report, /^```mermaid\ngraph TD\n/m);
    assert.match(report, /n2\["services<br\/>own 119 · chain 383"\]/);
    assert.doesNotMatch(report, /n\d+\["docs<br/, 'marker nodes stay out of the diagram');
    assert.match(report, /- `services\/AGENTS\.md` imports `\.\.\/ghost\.md`\./);
    assert.match(report, /- `AGENTS\.md` points to `docs\/missing\.md`, which does not exist\./);
  });

  test(`${base}: context-graph rejects caller errors and shares scope discovery with doctor`, () => {
    assert.equal(run(base, 'context-graph.js', [FIXTURE, '--format', 'html']).status, 1);
    assert.equal(run(base, 'context-graph.js', [path.join(FIXTURE, 'AGENTS.md')]).status, 1);
    const doctor = run(base, 'doctor.js', ['check', '--all', FIXTURE]);
    assert.equal(doctor.status, 0, doctor.stderr);
    const report = JSON.parse(doctor.stdout);
    const adopted = report.scopes.map((s) => s.scope_rel).sort();
    const contextOnly = report.context_only.map((s) => s.scope_rel).sort();
    assert.deepEqual(adopted, ['.', 'services/billing']);
    assert.deepEqual(contextOnly, ['services', 'tools/dev']);

  });
}

test('import and pointer detection follows the Claude Code rules', () => {
  const { findPointers, stripHtmlComments } = require(path.join(ROOT, 'plugin-src/trace/scripts/context-graph.js'));
  const { findImports } = require(path.join(ROOT, 'plugin-src/trace/scripts/trace-lib.js'));
  const text = [
    'Load @docs/a.md and @./b.md, then @~/.claude/c.md.',
    'Not these: `@docs/d.md` me@example.com @scope/pkg',
    '```',
    '@docs/e.md',
    '```',
    'See [x](docs/f.md#top) and [y](https://example.com) and [z](#anchor).',
  ].join('\n');
  assert.deepEqual(findImports(text), ['docs/a.md', './b.md', '~/.claude/c.md', 'scope/pkg']);
  assert.deepEqual(findPointers(text), ['docs/d.md', 'docs/f.md']);
  assert.equal(stripHtmlComments('a <!-- x --> b\n<!-- two\nlines -->c\n```\n<!-- kept -->\n```'), 'a  b\nc\n```\n<!-- kept -->\n```');
});

test('tree color is terminal decoration only and keeps columns aligned', () => {
  const { useColor, renderTree, scan } = require(path.join(ROOT, 'plugin-src/trace/scripts/context-graph.js'));
  assert.equal(useColor(null, {}, true), true);
  assert.equal(useColor(null, {}, false), false);
  assert.equal(useColor('out.md', {}, true), false);
  assert.equal(useColor(null, { NO_COLOR: '' }, true), false);
  assert.equal(useColor(null, { NO_COLOR: '1', FORCE_COLOR: '1' }, false), false);
  assert.equal(useColor(null, { FORCE_COLOR: '1' }, false), true);
  assert.equal(useColor(null, { FORCE_COLOR: '0' }, true), true);
  assert.equal(useColor(null, { TERM: 'dumb' }, true), false);

  const graph = scan(FIXTURE);
  const plain = renderTree(graph, { color: false });
  assert.doesNotMatch(plain, /\x1b\[/);
  assert.equal(renderTree(graph, { color: true }), plain, 'fixture values sit under the warn threshold');
  assert.match(renderTree(graph, { markers: true }), /context \(marker\)/);

  graph.nodes[0].own_tokens = 4500;
  graph.nodes[0].chain_tokens = 9000;
  const colored = renderTree(graph, { color: true });
  assert.match(colored, /\x1b\[33m    4\.5k\x1b\[0m\x1b\[31m    9\.0k\x1b\[0m {6}29/);
  const strip = (text) => text.replace(/\x1b\[\d+m/g, '');
  assert.equal(strip(colored), renderTree(graph, { color: false }));

  const piped = spawnSync(process.execPath, [path.join(ROOT, 'plugin-src/trace/scripts/context-graph.js'), FIXTURE, '--format', 'tree'], { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '1' } });
  assert.equal(piped.status, 0, piped.stderr);
  assert.equal(piped.stdout, plain, 'FORCE_COLOR on a pipe changes nothing while every cell is under the threshold');
});

test('treegraph is a static, well-formed SVG treemap of launch weight', () => {
  const { scan, renderTreegraph, squarify } = require(path.join(ROOT, 'plugin-src/trace/scripts/context-graph.js'));
  const placed = squarify([{ area: 6 }, { area: 6 }, { area: 4 }, { area: 3 }, { area: 2 }, { area: 2 }, { area: 1 }], 0, 0, 600, 400);
  assert.equal(placed.length, 7);
  const covered = placed.reduce((sum, p) => sum + p.w * p.h, 0);
  assert.ok(Math.abs(covered - 600 * 400) < 1e-6, 'boxes tile the rectangle exactly');
  for (const p of placed) assert.ok(p.x >= 0 && p.y >= 0 && p.x + p.w <= 600 + 1e-6 && p.y + p.h <= 400 + 1e-6);
  assert.deepEqual(squarify([{ area: 0 }], 0, 0, 10, 10), []);

  const svg = renderTreegraph(scan(FIXTURE));
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(svg, /NaN|Infinity|<script/);
  assert.match(svg, /<title>services\/AGENTS\.md — Gotchas: 76 tokens<\/title>/);
  assert.match(svg, /<title>import docs\/system\/conventions\.md \(hop 1 from AGENTS\.md\): \d+ tokens<\/title>/);
  assert.match(svg, /<title>services\/billing — own 41, chain 424, gotchas 0<\/title>/);
  assert.match(svg, /Docs folders \(245 tokens, on demand\) are not drawn/);
  const cli = spawnSync(process.execPath, [path.join(ROOT, 'plugins/trace/scripts/context-graph.js'), FIXTURE, '--format', 'treegraph'], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.stdout, svg);
});

test('--save writes a timestamped file under .claude/.trace; stdout is the default', (t) => {
  const { timestamp } = require(path.join(ROOT, 'plugin-src/trace/scripts/context-graph.js'));
  assert.equal(timestamp(new Date(2026, 8, 10, 23, 5, 7)), '20260910-230507');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-graph-out-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(FIXTURE, root, { recursive: true });
  for (const [format, ext] of [['markdown', 'md'], ['treegraph', 'svg'], ['tree', 'txt'], ['json', 'json']]) {
    const result = spawnSync(process.execPath, [path.join(ROOT, 'plugins/trace/scripts/context-graph.js'), root, '--format', format, '--save'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const written = result.stdout.trim();
    assert.match(written, new RegExp(`/\\.claude/\\.trace/context-graph-\\d{8}-\\d{6}\\.${ext}$`));
    assert.ok(fs.existsSync(written));
  }
  assert.equal(fs.readFileSync(path.join(root, '.claude/.trace/.gitignore'), 'utf8'), '*\n');
  const before = fs.readdirSync(path.join(root, '.claude/.trace')).length;
  const stdout = spawnSync(process.execPath, [path.join(ROOT, 'plugins/trace/scripts/context-graph.js'), root, '--format', 'markdown'], { encoding: 'utf8' });
  assert.match(stdout.stdout, /^# Context graph/, 'markdown prints to stdout by default');
  assert.equal(fs.readdirSync(path.join(root, '.claude/.trace')).length, before, 'no file is written without --save or --out');
  const both = spawnSync(process.execPath, [path.join(ROOT, 'plugins/trace/scripts/context-graph.js'), root, '--save', '--out', 'x.md'], { encoding: 'utf8' });
  assert.equal(both.status, 1);
});
