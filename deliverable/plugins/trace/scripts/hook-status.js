#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(process.cwd(), '.claude', '.trace');
const events = {};
for (const event of ['SessionStart', 'PostToolUse', 'UserPromptSubmit']) {
  try { events[event] = JSON.parse(fs.readFileSync(path.join(dir, `hook-${event}.json`), 'utf8')); }
  catch { events[event] = null; }
}
console.log(JSON.stringify({
  node: process.version, cwd: process.cwd(), pending: fs.existsSync(path.join(dir, 'distillation-pending')),
  events, note: 'Recorded events prove script execution only. Inspect the host hook controls for discovery, enablement, and trust. Set TRACE_DEBUG_HOOKS=1 to diagnose script failures.',
}, null, 2));
