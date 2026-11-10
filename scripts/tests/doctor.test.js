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
  // CLAUDE_CONFIG_DIR changes which CLAUDE.md is the user's own, so tests
  // set it explicitly instead of inheriting the developer's.
  const doctor = (scope, env = {}) => {
    const { CLAUDE_CONFIG_DIR, ...base_env } = process.env;
    const result = spawnSync(process.execPath, [path.join(ROOT, base, 'scripts/doctor.js'), 'check', scope], { encoding: 'utf8', env: { ...base_env, ...env } });
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

  test(`${base}: doctor suggests deleting old CLAUDE.md forwarders`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    write('CLAUDE.md', 'See @AGENTS.md for more information.\n');
    write('docs/CLAUDE.md', 'See @AGENTS.md for more information.\n');
    const found = doctor(scope).warnings.map((w) => [w.check, w.path]);
    assert.deepEqual(found, [['legacy-forwarder', 'CLAUDE.md'], ['legacy-forwarder', 'docs/CLAUDE.md']]);
  });

  test(`${base}: doctor flags a forwarder whose import is in backticks`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    write('CLAUDE.md', 'See `@AGENTS.md` for more information.\n');
    const [finding, ...rest] = doctor(scope).warnings;
    assert.equal(finding.check, 'agents-md-hidden');
    assert.equal(finding.path, 'CLAUDE.md');
    assert.match(finding.message, /backticks/);
    // The root CLAUDE.md also hides docs/AGENTS.md.
    assert.deepEqual(rest.map((w) => [w.check, w.path]), [['agents-md-hidden', 'docs/AGENTS.md']]);
  });

  test(`${base}: doctor keeps a forwarder that sits beside another CLAUDE file`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    write('CLAUDE.md', 'See @AGENTS.md for more information.\n');
    write('CLAUDE.local.md', 'My notes.\n');
    write('docs/CLAUDE.md', 'See @AGENTS.md for more information.\n');
    write('docs/.claude/CLAUDE.md', 'Docs notes.\n');
    assert.deepEqual(doctor(scope).warnings, []);
  });

  test(`${base}: doctor warns when a CLAUDE file hides AGENTS.md`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    write('.claude/CLAUDE.md', '# Rules\n\nUse tabs.\n');
    write('docs/CLAUDE.local.md', 'My notes.\n');
    const found = doctor(scope).warnings.map((w) => [w.check, w.path]);
    assert.deepEqual(found, [['agents-md-hidden', '.claude/CLAUDE.md'], ['agents-md-hidden', 'docs/CLAUDE.local.md']]);
  });

  test(`${base}: doctor accepts a CLAUDE file that imports AGENTS.md`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    write('.claude/CLAUDE.md', '# Rules\n\n@../AGENTS.md\n\nUse tabs.\n');
    write('docs/CLAUDE.local.md', 'My notes.\n@./AGENTS.md\n');
    assert.deepEqual(doctor(scope).warnings, []);
  });

  test(`${base}: doctor warns when a parent folder's CLAUDE file hides AGENTS.md`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    write('service/.claude/CLAUDE.md', '# Not used\n');
    write('.claude/CLAUDE.md', '# Super-repo rules\n');
    write('service/team/AGENTS.md', AGENTS_MD);
    const sub = path.join(scope, 'service/team');
    const report = doctor(sub);
    const finding = report.warnings.find((w) => w.path === 'AGENTS.md');
    assert.equal(finding.check, 'agents-md-hidden');
    assert.deepEqual(finding.hidden_by, [path.join(scope, 'service/.claude/CLAUDE.md'), path.join(scope, '.claude/CLAUDE.md')]);
  });

  test(`${base}: doctor ignores the user's CLAUDE.md and names a stray one`, (t) => {
    const { scope: home, write } = makeScope(t, AGENTS_MD);
    write('.claude/CLAUDE.md', '# My rules\n');
    write('code/app/AGENTS.md', AGENTS_MD);
    const app = path.join(home, 'code/app');
    const hidden = (env) => doctor(app, { HOME: home, ...env }).warnings.filter((w) => w.path === 'AGENTS.md');
    // Default config folder: ~/.claude/CLAUDE.md is the user's own file.
    assert.deepEqual(hidden({}), []);
    // A custom config folder makes ~/.claude/CLAUDE.md a parent-folder file.
    const [finding] = hidden({ CLAUDE_CONFIG_DIR: path.join(home, '.claude-h') });
    assert.deepEqual(finding.hidden_by, [path.join(home, '.claude/CLAUDE.md')]);
    assert.match(finding.message, /CLAUDE_CONFIG_DIR/);
  });

  test(`${base}: doctor keeps a forwarder below a parent CLAUDE.md`, (t) => {
    const { scope, write } = makeScope(t, AGENTS_MD);
    write('CLAUDE.md', '# Super-repo rules\n');
    write('service/CLAUDE.md', 'See @AGENTS.md for more information.\n');
    write('service/AGENTS.md', AGENTS_MD);
    write('service/docs/AGENTS.md', '# Durable project context\n');
    for (const readme of ['README.md', 'system', 'architecture', 'adr', 'reference', 'working-notes']) {
      write(readme === 'README.md' ? 'service/docs/README.md' : `service/docs/${readme}/README.md`, `# ${readme}\n`);
    }
    const result = spawnSync(process.execPath, [path.join(ROOT, base, 'scripts/doctor.js'), 'check', path.join(scope, 'service')], { encoding: 'utf8' });
    const forwarder = JSON.parse(result.stdout).warnings.find((w) => w.check === 'legacy-forwarder');
    assert.deepEqual(forwarder.kept_by, [path.join(scope, 'CLAUDE.md')]);
  });
}
