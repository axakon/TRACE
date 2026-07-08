#!/usr/bin/env node
// PermissionRequest hook (matcher: ExitPlanMode). Fires while the user is
// reviewing the plan: finds or starts a plan server for the plan's directory
// (walking ports 7526-7535 past servers that belong to other plans dirs),
// then opens the plan in the default browser. Emits no permission decision —
// the normal approval dialog is untouched. Exits 0 silently on any failure.
//
// Disable with PLAYBOOK_PLAN_VIEWER=0.

'use strict';

const path = require('path');
const { spawn, execFile } = require('child_process');
const { readStdin, probe, findServer, normDir } = require('./plan-viewer-common');

function startServer(port, plansDir) {
  const child = spawn(
    process.execPath,
    [path.join(__dirname, 'plan-server.js'), '--port', String(port), '--plans-dir', plansDir],
    { detached: true, stdio: 'ignore' }
  );
  child.unref();
}

async function waitForServer(port, plansDir, attempts) {
  for (let i = 0; i < attempts; i++) {
    const result = await probe(port);
    if (result.status === 'ours' && normDir(result.plansDir || '') === normDir(plansDir)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

function openBrowser(url) {
  return new Promise((resolve) => {
    const cmd =
      process.platform === 'darwin'
        ? ['open', [url]]
        : process.platform === 'win32'
          ? ['cmd', ['/c', 'start', '', url]]
          : ['xdg-open', [url]];
    execFile(cmd[0], cmd[1], () => resolve());
  });
}

async function main() {
  if (process.env.PLAYBOOK_PLAN_VIEWER === '0') return;

  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    return;
  }
  if (input.tool_name !== 'ExitPlanMode') return;

  const planFilePath = input.tool_input && input.tool_input.planFilePath;
  if (!planFilePath || !planFilePath.endsWith('.md')) return;
  const slug = path.basename(planFilePath, '.md');
  const plansDir = path.dirname(planFilePath);

  const found = await findServer(plansDir);
  if (!found) return; // every port in the range is taken

  if (!found.running) {
    startServer(found.port, plansDir);
    if (!(await waitForServer(found.port, plansDir, 10))) return;
  }
  await openBrowser(`http://127.0.0.1:${found.port}/plan/${encodeURIComponent(slug)}`);
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
