'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('../generate-plugins');

for (const base of ['deliverable/plugins/trace', 'plugins/trace', 'plugins/trace-full']) {
  test(`${base}: hook lifecycle handles both payloads`, (t) => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-hooks-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    const plugin = path.join(ROOT, base);
    const sentinel = path.join(cwd, '.claude/.trace/distillation-pending');
    function run(script, payload, args = []) {
      const result = spawnSync(process.execPath, [path.join(plugin, 'scripts', script), ...args], { cwd, input: typeof payload === 'string' ? payload : JSON.stringify({ cwd, ...payload }), encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr); return result.stdout;
    }
    run('set-sentinel.js', ''); assert(!fs.existsSync(sentinel));
    run('set-sentinel.js', '{bad'); assert(!fs.existsSync(sentinel));
    run('set-sentinel.js', { tool_name: 'Write', tool_input: { file_path: 'docs/API.md' } }); assert(!fs.existsSync(sentinel));
    run('set-sentinel.js', { tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Add File: docs/new.md\n+x\n*** Update File: .codex/config.toml\n+x\n*** End Patch' } }); assert(!fs.existsSync(sentinel));
    run('set-sentinel.js', { tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Update File: docs/API.md\n+x\n*** Update File: src/a.js\n+x\n*** End Patch' } }); assert(fs.existsSync(sentinel));
    const reminder = path.join(plugin, 'shared/distillation-pending-reminder.md');
    const result = JSON.parse(run('check-sentinel.js', {}, [reminder]));
    assert.equal(result.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
    assert(result.hookSpecificOutput.additionalContext.includes(base.endsWith('trace-full') ? '$trace-full:distil' : base.startsWith('plugins') ? '$trace:distil' : '/trace:distil'));
    run('clear-sentinel.js', {}); assert(!fs.existsSync(sentinel));
    assert.equal(run('check-sentinel.js', {}, [reminder]), '');
    run('set-sentinel.js', { tool_name: 'Edit', tool_input: { file_path: 'src/a.js' } }); assert(fs.existsSync(sentinel));
    run('clear-sentinel.js', {});
    run('set-sentinel.js', { tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Delete File: src/a.js\n*** End Patch' } }); assert(fs.existsSync(sentinel));
    run('clear-sentinel.js', {});
    run('set-sentinel.js', { tool_name: 'apply_patch', tool_input: { command: '*** Update File: docs/old.md\n*** Move to: src/code.js\n+x' } }); assert(fs.existsSync(sentinel));
    run('clear-sentinel.js', {});
    run('set-sentinel.js', { tool_name: 'Bash', tool_input: { command: 'echo read-only' } }); assert(!fs.existsSync(sentinel));
    run('set-sentinel.js', { tool_name: 'Edit', tool_input: { file_path: 'src/a.js' }, tool_response: { isError: true } }); assert(!fs.existsSync(sentinel));
    const contextFile = path.join(plugin, 'shared/context7-instructions.md');
    const input = { session_id: cwd, source: 'startup' };
    const injection = run('inject.js', input, [contextFile, 'SessionStart']);
    assert(JSON.parse(injection).hookSpecificOutput.additionalContext.includes('context7'));
    assert.equal(run('inject.js', input, [contextFile, 'SessionStart']), '');
    assert(JSON.parse(run('hook-status.js', {})).events.PostToolUse);
  });
}
