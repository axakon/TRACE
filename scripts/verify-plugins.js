#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ROOT, files, generate } = require('./generate-plugins');

function packageHash() {
  const hash = crypto.createHash('sha256');
  for (const [file, bytes] of [...generate().result].sort(([a], [b]) => a.localeCompare(b, 'en'))) hash.update(file).update('\0').update(bytes).update('\0');
  return hash.digest('hex');
}
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
const LIVE_CHECKS = ['install', 'init', 'agents-md-setup', 'scaffold-docs', 'adr', 'distil', 'doctor', 'spec', 'epic', 'commit-message', 'pr-description', 'spec-revise-reject-approve', 'epic-preview-board-seed', 'hooks'];
function releaseEvidence(hash, root = ROOT) {
  const evidence = JSON.parse(fs.readFileSync(path.join(root, 'verification/live-smoke.json'), 'utf8'));
  for (const client of ['claude-code', 'codex-cli', 'codex-desktop']) {
    const record = evidence.clients?.[client];
    if (!record?.version || record.packageHash !== hash) throw new Error(`Live evidence missing or stale: ${client}`);
    for (const check of LIVE_CHECKS) if (record.checks?.[check]?.status !== 'met' || !record.checks[check].evidence) throw new Error(`Live check unverified: ${client}/${check}`);
  }
}
function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--release', '--hash'].includes(arg))) throw new Error('Usage: node scripts/verify-plugins.js [--release|--hash]');
  if (args.includes('--hash')) { console.log(packageHash()); return; }
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
    releaseEvidence(packageHash());
  }
  console.log(`TRACE ${version}: automated checks passed${args.includes('--release') ? ', live evidence current' : ''}.`);
}
module.exports = { packageHash, releaseEvidence, LIVE_CHECKS };
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
