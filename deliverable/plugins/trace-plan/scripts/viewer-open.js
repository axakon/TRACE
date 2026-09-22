#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { probe, findServer, normDir, focusOrOpen } = require('./plan-viewer-common');
const { specCommand } = require('../runtime.json');

function describeArtifact(kind, filename) {
  const file = fs.realpathSync(path.resolve(filename));
  if (!fs.statSync(file).isFile() || path.extname(file) !== '.md') throw new Error('Choose an existing Markdown file.');
  let slug, dir, target, field;
  if (kind === 'plan') {
    slug = path.basename(file, '.md'); dir = path.dirname(file); field = 'plansDir';
    target = `/plan/${encodeURIComponent(slug)}`;
  } else if (kind === 'epic' && path.basename(file) === 'epic.md') {
    slug = path.basename(path.dirname(file)); dir = path.dirname(path.dirname(file)); field = 'epicsDir';
    const preview = path.basename(dir) === '.preview';
    if (preview) dir = path.dirname(dir);
    target = `/${preview ? 'epic-preview' : 'epic'}/${encodeURIComponent(slug)}`;
  } else throw new Error('Use plan <file.md> or epic <directory/epic.md>.');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) || slug.includes('..')) throw new Error('Use a filename with letters, digits, dots, underscores, or hyphens.');
  return { file, dir, target, field };
}

async function openArtifact(kind, filename, { browser = true } = {}) {
  if ((process.env.TRACE_PLAN_VIEWER ?? process.env.PLAYBOOK_PLAN_VIEWER) === '0') return { disabled: true };
  const artifact = describeArtifact(kind, filename);
  const found = await findServer(artifact.dir, artifact.field, specCommand);
  if (!found) throw new Error('All TRACE viewer ports are occupied. Close an unused viewer server or set TRACE_PLAN_VIEWER_PORT.');
  if (!found.running) {
    const child = spawn(process.execPath, [path.join(__dirname, 'plan-server.js'), '--port', String(found.port),
      artifact.field === 'plansDir' ? '--plans-dir' : '--epics-dir', artifact.dir], { detached: true, stdio: 'ignore' });
    let startError;
    child.on('error', (error) => { startError = error; });
    child.unref();
    let ready = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const info = await probe(found.port);
      if (info.status === 'ours' && normDir(info[artifact.field] || '') === normDir(artifact.dir) && info.specCommand === specCommand) { ready = true; break; }
      if (startError) throw startError;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) { child.kill(); throw new Error('TRACE viewer did not start. Present the draft in chat.'); }
  }
  const url = `http://127.0.0.1:${found.port}${artifact.target}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
  if (!response.ok) throw new Error(`The viewer could not serve the artifact (HTTP ${response.status}).`);
  const bundle = await fetch(`http://127.0.0.1:${found.port}/assets/viewer.js`, { signal: AbortSignal.timeout(2000) });
  if (!bundle.ok) throw new Error('The installed viewer bundle is missing. Reinstall TRACE.');
  await bundle.body.cancel();
  const result = { url, file: artifact.file, opened: false };
  if (browser) {
    try { await focusOrOpen(found.port, artifact.target); result.opened = true; }
    catch (error) { result.warning = `Browser opening failed: ${error.message}. Open the URL manually.`; }
  }
  return result;
}

async function main() {
  const [kind, file, ...flags] = process.argv.slice(2);
  if (!file || flags.some((flag) => flag !== '--no-browser')) throw new Error('Usage: node viewer-open.js plan|epic <absolute-file> [--no-browser]');
  console.log(JSON.stringify(await openArtifact(kind, file, { browser: !flags.includes('--no-browser') })));
}

if (require.main === module) main().catch((error) => { console.error(`TRACE viewer: ${error.message}`); process.exitCode = 1; });
