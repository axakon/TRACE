'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ROOT, generate, differences } = require('../generate-plugins');
const { validate } = require('../validate-packages');

test('generation is deterministic', () => {
  const first = generate();
  const second = generate();
  assert.deepEqual(first.result, second.result);
});

test('fresh output detects stale, missing, extra and version-mismatched packages', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-packages-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'plugin-src'));
  fs.copyFileSync(path.join(ROOT, 'plugin-src/catalog.json'), path.join(root, 'plugin-src/catalog.json'));
  const { result, catalog } = generate();
  for (const [file, bytes] of result) { const dest = path.join(root, file); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes); }
  assert.deepEqual(differences(root, result, catalog), []);
  assert.deepEqual(validate(root), []);
  fs.appendFileSync(path.join(root, 'plugins/trace/skills/init/SKILL.md'), 'stale edit');
  fs.unlinkSync(path.join(root, 'deliverable/plugins/trace/scripts/doctor.js'));
  fs.writeFileSync(path.join(root, 'plugins/trace/untracked-file.txt'), 'extra');
  const manifestPath = path.join(root, 'plugins/trace/.codex-plugin/plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath)); manifest.version = '0.0.1'; fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const changed = differences(root, result, catalog);
  assert(changed.some((c) => c.kind === 'changed' && c.file.endsWith('SKILL.md')));
  assert(changed.some((c) => c.kind === 'missing' && c.file.endsWith('doctor.js')));
  assert(changed.some((c) => c.kind === 'obsolete' && c.file.endsWith('untracked-file.txt')));
  assert(changed.some((c) => c.kind === 'changed' && c.file === 'plugins/trace/.codex-plugin/plugin.json'));
});

test('one source edit propagates to both harnesses', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-source-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(path.join(ROOT, 'plugin-src'), path.join(root, 'plugin-src'), { recursive: true, filter: (p) => !p.split(path.sep).includes('node_modules') });
  const source = path.join(root, 'plugin-src/trace/skills/init/SKILL.md');
  fs.appendFileSync(source, '\nShared behaviour evidence.\n');
  const { result } = generate(root);
  for (const base of ['deliverable/plugins/trace', 'plugins/trace']) assert(result.get(`${base}/skills/init/SKILL.md`).includes('Shared behaviour evidence.'));
});
