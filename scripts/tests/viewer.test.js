'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { ROOT } = require('../generate-plugins');

function command(script, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { env: { ...process.env, ...env } });
    let stdout = '', stderr = '';
    child.stdout.on('data', (data) => { stdout += data; }); child.stderr.on('data', (data) => { stderr += data; });
    child.on('error', reject); child.on('exit', (code) => resolve({ code, stdout, stderr }));
  });
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.on('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

for (const base of ['deliverable/plugins/trace-plan', 'plugins/trace-plan', 'plugins/trace-full']) {
  test(`${base}: actual viewer serves and updates plans and epic previews`, async (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace viewer '));
    const pids = new Set();
    t.after(() => { for (const pid of pids) { try { process.kill(pid); } catch {} } fs.rmSync(root, { recursive: true, force: true }); });
    const fixtures = path.join(ROOT, 'plugin-src/trace-plan/viewer/fixtures');
    fs.cpSync(fixtures, root, { recursive: true });
    fs.mkdirSync(path.join(root, 'epics/.preview'), { recursive: true });
    fs.cpSync(path.join(root, 'epics/demo-epic'), path.join(root, 'epics/.preview/demo-epic'), { recursive: true });
    const port = await freePort();
    const script = path.join(ROOT, base, 'scripts/viewer-open.js');
    async function open(kind, file) {
      const res = await command(script, [kind, file, '--no-browser'], { TRACE_PLAN_VIEWER_PORT: String(port) });
      assert.equal(res.code, 0, res.stderr);
      const data = JSON.parse(res.stdout);
      const origin = new URL(data.url).origin;
      const info = await (await fetch(`${origin}/api/info`)).json(); pids.add(info.pid);
      assert.equal(data.opened, false); return { ...data, origin, info };
    }
    const plan = path.join(root, 'demo-plan.md');
    const first = await open('plan', plan);
    const again = await open('plan', plan); assert.equal(first.info.pid, again.info.pid);
    const body = await (await fetch(`${first.origin}/api/plan/demo-plan`)).json();
    assert.equal(body.markdown, fs.readFileSync(plan, 'utf8'));
    fs.appendFileSync(plan, '\nReview revision.\n');
    assert((await (await fetch(`${first.origin}/api/plan/demo-plan`)).json()).markdown.endsWith('Review revision.\n'));
    const preview = await open('epic', path.join(root, 'epics/.preview/demo-epic/epic.md'));
    assert(preview.url.includes('/epic-preview/demo-epic'));
    const epicApi = `${preview.origin}/api/epic-preview/demo-epic`;
    const epic = await (await fetch(epicApi)).json(); assert.equal(epic.tickets.length, 3);
    const changed = await fetch(`${epicApi}/ticket/001/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'in-progress' }) });
    assert.equal(changed.status, 200);
    assert(fs.readFileSync(path.join(root, 'epics/.preview/demo-epic/tickets/001-event-collector.md'), 'utf8').includes('status: in-progress'));
    assert(!fs.readFileSync(path.join(root, 'epics/demo-epic/tickets/001-event-collector.md'), 'utf8').includes('status: in-progress'));
    const bad = await fetch(`${epicApi}/ticket/001/status`, { method: 'POST', body: JSON.stringify({ status: 'invalid' }) }); assert.equal(bad.status, 400);
    const html = await (await fetch(preview.url)).text();
    assert(html.includes(`Use ${preview.info.specCommand} on this ticket`));
    await fetch(`${preview.origin}/api/focus`);
    const focus = await (await fetch(`${preview.origin}/api/focus`, { method: 'POST', body: JSON.stringify({ url: '/epics' }) })).json(); assert.equal(focus.live, true);
    assert.equal((await (await fetch(`${preview.origin}/api/focus`)).json()).url, '/epics');
    assert.equal((await (await fetch(`${preview.origin}/api/focus`)).json()).url, null);
    const missing = await command(script, ['plan', path.join(root, 'missing.md'), '--no-browser'], { TRACE_PLAN_VIEWER_PORT: String(port) }); assert.notEqual(missing.code, 0); assert(missing.stderr.includes('TRACE viewer:'));
    const disabled = await command(script, ['plan', plan], { TRACE_PLAN_VIEWER: '0' }); assert.deepEqual(JSON.parse(disabled.stdout), { disabled: true });
  });
}

test('discovery reuses a later running server after an earlier port becomes free', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-discovery-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const base = await freePort();
  const http = require('node:http');
  const server = http.createServer((req, res) => { res.end(JSON.stringify({ service: 'trace-plan-viewer', plansDir: root, specCommand: '$trace-plan:spec' })); });
  await new Promise((resolve, reject) => { server.on('error', reject); server.listen(base + 1, '127.0.0.1', resolve); });
  t.after(() => { server.closeAllConnections(); server.close(); });
  const script = path.join(root, 'discover.cjs');
  fs.writeFileSync(script, `require(${JSON.stringify(path.join(ROOT, 'plugins/trace-plan/scripts/plan-viewer-common.js'))}).findServer(${JSON.stringify(root)}, 'plansDir', '$trace-plan:spec').then(x => console.log(JSON.stringify(x)))`);
  const result = await command(script, [], { TRACE_PLAN_VIEWER_PORT: String(base) });
  assert.deepEqual(JSON.parse(result.stdout), { running: true, port: base + 1 });
});
