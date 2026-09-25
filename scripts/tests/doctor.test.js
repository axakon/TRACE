'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('../generate-plugins');

const AGENTS_MD = [
  '# Example', '', '## What is this', '', 'A test scope.', '', '## Stack', '', 'Node.',
  '', '## Directory index', '', '`docs/`', '', '## Commands', '', '`npm test`', '',
].join('\n');

const ADR = [
  '# 0001. Use Postgres', '', '*2026-06-04*', '', '## Decision', '',
  'We use Postgres.', '', '* It has JSONB.', '',
].join('\n');

// A TRACE-adopted scope that passes every structure check.
function makeScope(t, agentsMd) {
  const scope = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-doctor-'));
  t.after(() => fs.rmSync(scope, { recursive: true, force: true }));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(scope, rel)), { recursive: true });
    fs.writeFileSync(path.join(scope, rel), text);
  };
  write('AGENTS.md', agentsMd);
  write('CLAUDE.md', 'See @AGENTS.md for more information.\n');
  write('docs/CLAUDE.md', 'See @AGENTS.md for more information.\n');
  write('docs/AGENTS.md', '# Durable project context\n');
  for (const readme of ['README.md', 'system', 'architecture', 'adr', 'reference', 'working-notes']) {
    write(readme === 'README.md' ? 'docs/README.md' : `docs/${readme}/README.md`, `# ${readme}\n`);
  }
  return { scope, write };
}

function git(scope, ...args) {
  const result = spawnSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd: scope, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function commitAll(scope, message) {
  git(scope, 'add', '-A');
  git(scope, 'commit', '-q', '-m', message);
}

for (const base of ['deliverable/plugins/trace', 'plugins/trace']) {
  const doctor = (scope) => {
    const result = spawnSync(process.execPath, [path.join(ROOT, base, 'scripts/doctor.js'), 'check', scope], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };

  test(`${base}: doctor reads an AGENTS.md with CRLF line endings`, (t) => {
    const { scope } = makeScope(t, AGENTS_MD.replace(/\n/g, '\r\n'));
    const report = doctor(scope);
    assert.deepEqual(report.warnings.filter((w) => w.check === 'agents-md'), []);
  });

  test(`${base}: an ADR ships when it reaches the base branch`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    git(scope, 'init', '-q', '-b', 'main');
    commitAll(scope, 'Adopt TRACE');

    // Drafting on the ADR's own branch: a first version under another
    // number, then a renumber and review fixes.
    git(scope, 'checkout', '-q', '-b', 'adr');
    write('docs/adr/0002-use-postgres.md', ADR.replace('0001', '0002').replace('We use Postgres.', 'We use MySQL.'));
    commitAll(scope, 'Draft ADR');
    fs.unlinkSync(path.join(scope, 'docs/adr/0002-use-postgres.md'));
    write('docs/adr/0001-use-postgres.md', ADR);
    commitAll(scope, 'Renumber and fix the ADR');
    git(scope, 'checkout', '-q', 'main');
    git(scope, 'merge', '-q', '--no-ff', '-m', 'Merge adr', 'adr');
    const merge = git(scope, 'rev-parse', 'HEAD');
    assert.deepEqual(doctor(scope).warnings, []);

    // A formatter run after shipping changes markup, not words.
    write('docs/adr/0001-use-postgres.md', ADR.replace('*2026-06-04*', '_2026-06-04_').replace('* It', '- It').replace('\n\n## Decision', '\n\n\n## Decision   '));
    commitAll(scope, 'Run Prettier');
    assert.deepEqual(doctor(scope).warnings, []);

    // Changing the decision after shipping is flagged against the merge.
    write('docs/adr/0001-use-postgres.md', ADR.replace('We use Postgres.', 'We use SQLite.'));
    const report = doctor(scope);
    assert.equal(report.summary.adr_base, 'main');
    assert.equal(report.warnings.length, 1);
    assert.equal(report.warnings[0].check, 'adr-immutability');
    assert.equal(report.warnings[0].shipped_in, merge);
  });
}
