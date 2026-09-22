#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT, files } = require('./generate-plugins');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`);
}
function compareTemplates() {
  const source = path.join(ROOT, 'plugin-src/trace/shared/doc-structure');
  const reference = path.join(ROOT, 'deliverable/playbook/reference-doc-structure/docs');
  const relative = (root) => files(root).filter((file) => !['AGENTS.md', 'CLAUDE.md'].includes(path.basename(file))).map((file) => path.relative(root, file));
  if (JSON.stringify(relative(source)) !== JSON.stringify(relative(reference))) throw new Error('Doc-structure inventories differ');
  for (const file of relative(source)) if (!fs.readFileSync(path.join(source, file)).equals(fs.readFileSync(path.join(reference, file)))) throw new Error(`Doc-structure drift: ${file}`);
}
function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--release')) throw new Error('Usage: node scripts/verify-plugins.js [--release]');
  run(process.execPath, ['scripts/generate-plugins.js', '--check']);
  run(process.execPath, ['scripts/validate-packages.js']);
  for (const file of [...files(path.join(ROOT, 'scripts')), ...files(path.join(ROOT, 'plugin-src'), ['node_modules'])]) {
    if (file.endsWith('.js') && !file.includes(`${path.sep}viewer${path.sep}`)) run(process.execPath, ['--check', file]);
  }
  const tests = files(path.join(ROOT, 'scripts/tests')).filter((file) => file.endsWith('.test.js'));
  run(process.execPath, ['--test', ...tests]);
  compareTemplates();
  run(process.execPath, ['deliverable/plugins/trace/scripts/doctor.js', 'check', '.']);
  const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugin-src/catalog.json'), 'utf8'));
  const heading = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8').match(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/m);
  if (!heading || heading[1] !== version) throw new Error('Changelog and catalog versions differ');
  if (args.includes('--release')) {
    if (heading[2] !== new Date().toISOString().slice(0, 10)) throw new Error('Set the changelog date to the release date');
    const tags = spawnSync('git', ['tag', '--list', 'v*', '--sort=-v:refname'], { cwd: ROOT, encoding: 'utf8' });
    if (tags.status !== 0) throw new Error('Cannot read release tags');
    const latest = tags.stdout.split('\n').find((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
    if (latest) {
      const a = version.split('.').map(Number), b = latest.slice(1).split('.').map(Number);
      const difference = a.map((n, i) => n - b[i]).find((n) => n !== 0);
      if (!difference || difference < 0) throw new Error('Release version must exceed the latest tag');
    }
  }
  console.log(`TRACE ${version}: automated checks passed${args.includes('--release') ? ', release version and date current' : ''}.`);
}
try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
