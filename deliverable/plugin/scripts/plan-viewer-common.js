// Shared helpers for the plan-viewer hook scripts. The viewer may run several
// servers side by side (different plans dirs, parallel sessions), so discovery
// walks a small port range and identifies servers via GET /api/info.

'use strict';

const http = require('http');
const path = require('path');

const BASE_PORT = Number(process.env.PLAYBOOK_PLAN_VIEWER_PORT) || 7526;
const MAX_PORTS = 10;
const SERVICE = 'playbook-plan-viewer';

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
//   { status: 'ours', plansDir, epicsDir }  — a playbook-viewer server answered
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

module.exports = { BASE_PORT, MAX_PORTS, SERVICE, readStdin, normDir, probe, findServer };
