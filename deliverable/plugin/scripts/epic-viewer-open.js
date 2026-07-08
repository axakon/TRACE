#!/usr/bin/env node
// Opens the epic board in the browser: finds or starts a playbook viewer
// whose epics dir matches (walking ports 7526-7535), then opens
// /epic/<slug>, or the /epics index when no slug is given. Run by the
// epic-workflow skill after create/manage; safe to run by hand. Exits 0
// silently on any failure.
//
// Usage: node epic-viewer-open.js [epic-slug] [--epics-dir DIR] [--preview]
// --preview opens /epic-preview/<slug> (the .preview staging area epic-workflow
// writes drafts into) instead of the real board.
// Disable with PLAYBOOK_PLAN_VIEWER=0.

'use strict';

const os = require('os');
const path = require('path');
const { spawn, execFile } = require('child_process');
const { probe, findServer, normDir } = require('./plan-viewer-common');

const DEFAULT_EPICS_DIR = path.join(os.homedir(), '.claude', 'epics');

function parseArgs(argv) {
  const opts = { slug: null, epicsDir: DEFAULT_EPICS_DIR, preview: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--epics-dir' && argv[i + 1]) opts.epicsDir = path.resolve(argv[++i]);
    else if (argv[i] === '--preview') opts.preview = true;
    else if (!opts.slug) opts.slug = argv[i];
  }
  return opts;
}

function startServer(port, epicsDir) {
  const child = spawn(
    process.execPath,
    [path.join(__dirname, 'plan-server.js'), '--port', String(port), '--epics-dir', epicsDir],
    { detached: true, stdio: 'ignore' }
  );
  child.unref();
}

async function waitForServer(port, epicsDir, attempts) {
  for (let i = 0; i < attempts; i++) {
    const result = await probe(port);
    if (result.status === 'ours' && normDir(result.epicsDir || '') === normDir(epicsDir)) {
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

  const { slug, epicsDir, preview } = parseArgs(process.argv);
  if (slug && !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug)) return;

  const found = await findServer(epicsDir, 'epicsDir');
  if (!found) return; // every port in the range is taken

  if (!found.running) {
    startServer(found.port, epicsDir);
    if (!(await waitForServer(found.port, epicsDir, 10))) return;
  }
  const base = preview ? '/epic-preview/' : '/epic/';
  const target = slug ? `${base}${encodeURIComponent(slug)}` : '/epics';
  await openBrowser(`http://127.0.0.1:${found.port}${target}`);
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
