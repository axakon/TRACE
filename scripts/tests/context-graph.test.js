'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('../generate-plugins');

const FIXTURE = path.join(ROOT, 'scripts/tests/fixtures/context-graph');
const EXPECTED = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/context-graph.expected.json'), 'utf8'));

function run(plugin, script, args, cwd = ROOT) {
  const result = spawnSync(process.execPath, [path.join(ROOT, plugin, 'scripts', script), ...args], { cwd, encoding: 'utf8' });
  return result;
}

for (const base of ['deliverable/plugins/trace', 'plugins/trace']) {
  test(`${base}: context-graph matches the fixture contract`, () => {
    const result = run(base, 'context-graph.js', [FIXTURE]);
    assert.equal(result.status, 0, result.stderr);
    const graph = JSON.parse(result.stdout);
    assert.equal(graph.root, FIXTURE);
    delete graph.root;
    assert.deepEqual(graph, EXPECTED);
  });

  test(`${base}: context-graph renders a tree`, () => {
    const tree = run(base, 'context-graph.js', [FIXTURE, '--format', 'tree']);
    assert.equal(tree.status, 0, tree.stderr);
    assert.match(tree.stdout, /^ +own {5}chain {3}gotchas {4}docs$/m, 'header row with right-aligned titles');
    assert.match(tree.stdout, /^\. {2,}264 {7}264 {8}29 {5}180$/m);
    assert.doesNotMatch(tree.stdout, /\(marker\)/, 'marker rows are hidden by default');
    assert.match(tree.stdout, /Heaviest launch load: services\/billing at 424 tokens\./);
    assert.match(tree.stdout, /2 docs-folder marker rows hidden \(86 tokens in total, loaded when a docs file is read\)\. Add --all to show them\./);
    const all = run(base, 'context-graph.js', [FIXTURE, '--format', 'tree', '--all']);
    assert.match(all.stdout, /└── context \(marker\) +43 +467 +0 +-$/m);
    assert.match(all.stdout, /Heaviest launch load: services\/billing at 424 tokens\./, 'a marker is never the heaviest load');
    assert.doesNotMatch(all.stdout, /marker rows hidden/);
  });

  test(`${base}: context-graph rejects caller errors and shares scope discovery with doctor`, () => {
    assert.equal(run(base, 'context-graph.js', [FIXTURE, '--format', 'markdown']).status, 1);
    assert.equal(run(base, 'context-graph.js', [FIXTURE, '--save']).status, 1);
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
  const { findImports, findPointers, stripHtmlComments } = require(path.join(ROOT, 'plugin-src/trace/scripts/context-graph.js'));
  const text = [
    'Load @docs/a.md and @./b.md, then @~/.claude/c.md.',
    'Not these: `@docs/d.md` me@example.com @scope/pkg',
    '```',
    '@docs/e.md',
    '```',
    'See [x](docs/f.md#top) and [y](https://example.com) and [z](#anchor).',
  ].join('\n');
  assert.deepEqual(findImports(text), ['docs/a.md', './b.md', '~/.claude/c.md', 'scope/pkg']);
  assert.deepEqual(findPointers(text), [{ ref: 'docs/d.md', link: false }, { ref: 'docs/f.md', link: true }]);
  assert.equal(stripHtmlComments('a <!-- x --> b\n<!-- two\nlines -->c\n```\n<!-- kept -->\n```'), 'a  b\nc\n```\n<!-- kept -->\n```');
});

test('tree marks heavy cells with ! and !! and keeps columns aligned', () => {
  const { renderTree, scan } = require(path.join(ROOT, 'plugin-src/trace/scripts/context-graph.js'));
  const graph = scan(FIXTURE);
  const plain = renderTree(graph);
  assert.doesNotMatch(plain.split('\n\n')[0], /!/, 'fixture values sit under the warning limit');
  graph.nodes[0].own_tokens = 4500;
  graph.nodes[0].chain_tokens = 9000;
  const marked = renderTree(graph).split('\n');
  assert.match(marked[1], /^\. +4\.5k! {5}9\.0k!! {6}29 {5}180$/);
  assert.equal(marked[1].length, plain.split('\n')[1].length);
});
