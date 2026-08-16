// Shared helpers for the plan-viewer hook scripts. The viewer may run several
// servers side by side (different plans dirs, parallel sessions), so discovery
// walks a small port range and identifies servers via GET /api/info.

'use strict';

const http = require('http');
const path = require('path');
const { execFile } = require('child_process');

const BASE_PORT = Number(process.env.TRACE_PLAN_VIEWER_PORT || process.env.PLAYBOOK_PLAN_VIEWER_PORT) || 7526;
const MAX_PORTS = 10;
const SERVICE = 'trace-plan-viewer';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 3000);
  });
}

function normDir(p) {
  const resolved = path.resolve(p);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

// Probe one port. Resolves to:
//   { status: 'ours', plansDir, epicsDir }  — a TRACE viewer server answered
//   { status: 'free' }                      — nothing is listening
//   { status: 'other' }                     — something else owns the port
function probe(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/info', timeout: 500 }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const info = JSON.parse(body);
          if (info.service === SERVICE) {
            return resolve({ status: 'ours', plansDir: info.plansDir, epicsDir: info.epicsDir });
          }
        } catch {}
        resolve({ status: 'other' });
      });
    });
    req.on('error', (err) => {
      resolve({ status: err.code === 'ECONNREFUSED' ? 'free' : 'other' });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'other' });
    });
  });
}

// Walk BASE_PORT..BASE_PORT+MAX_PORTS-1. Returns the first port that either
// already runs a server whose `field` (plansDir or epicsDir) matches `dir`
// ({ running: true }) or is free to start one on ({ running: false });
// null when the whole range is taken.
async function findServer(dir, field = 'plansDir') {
  const target = normDir(dir);
  for (let i = 0; i < MAX_PORTS; i++) {
    const port = BASE_PORT + i;
    const result = await probe(port);
    if (result.status === 'ours' && normDir(result[field] || '') === target) {
      return { port, running: true };
    }
    if (result.status === 'free') {
      return { port, running: false };
    }
  }
  return null;
}

// Ask a running viewer to steer an already-open tab to `target` (a path, e.g.
// "/epic/foo"). Resolves true when a tab was listening and took it, meaning the
// caller should not open a browser. False on any failure, so the caller falls
// back to opening a new tab.
function requestFocus(port, target) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ url: target });
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: '/api/focus',
        method: 'POST',
        timeout: 800,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data).live === true);
          } catch {
            resolve(false);
          }
        });
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end(body);
  });
}

// Steer an open tab when one exists, otherwise open the URL in the default
// browser. Every caller wants this pair, so it lives here.
function focusOrOpen(port, target) {
  return requestFocus(port, target).then((taken) => {
    if (taken) return;
    return new Promise((resolve) => {
      const url = `http://127.0.0.1:${port}${target}`;
      const cmd =
        process.platform === 'darwin'
          ? ['open', [url]]
          : process.platform === 'win32'
            ? ['cmd', ['/c', 'start', '', url]]
            : ['xdg-open', [url]];
      execFile(cmd[0], cmd[1], () => resolve());
    });
  });
}

module.exports = {
  BASE_PORT,
  MAX_PORTS,
  SERVICE,
  readStdin,
  normDir,
  probe,
  findServer,
  requestFocus,
  focusOrOpen,
};
