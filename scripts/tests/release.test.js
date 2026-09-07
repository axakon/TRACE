'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { releaseEvidence, LIVE_CHECKS } = require('../verify-plugins');

test('release requires current, complete observed evidence from every client', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'verification'));
  const file = path.join(root, 'verification/live-smoke.json');
  assert.throws(() => releaseEvidence('current', root));
  const clients = Object.fromEntries(['claude-code', 'codex-cli', 'codex-desktop'].map((client) => [client, {
    version: 'test-fixture', packageHash: 'current',
    checks: Object.fromEntries(LIVE_CHECKS.map((check) => [check, { status: 'met', evidence: 'Fixture observation' }])),
  }]));
  const save = () => fs.writeFileSync(file, JSON.stringify({ clients }));
  save();
  assert.doesNotThrow(() => releaseEvidence('current', root));
  assert.throws(() => releaseEvidence('changed', root), /stale/);
  clients['codex-desktop'].checks.hooks.status = 'unverified'; save();
  assert.throws(() => releaseEvidence('current', root), /codex-desktop\/hooks/);
  clients['codex-desktop'].checks.hooks = { status: 'met', evidence: '' }; save();
  assert.throws(() => releaseEvidence('current', root), /codex-desktop\/hooks/);
  delete clients['codex-desktop']; save();
  assert.throws(() => releaseEvidence('current', root), /codex-desktop/);
});
