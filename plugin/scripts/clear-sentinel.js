#!/usr/bin/env node
// Remove the distillation-pending sentinel from the current working
// directory's .claude/.playbook/ state folder. Used by the distil skill at
// the end of a successful run.
//
// Exits 0 whether or not the sentinel existed — clearing a missing sentinel
// is a no-op, not a failure.

const fs = require('fs');
const path = require('path');

const sentinel = path.join(process.cwd(), '.claude', '.playbook', 'distillation-pending');

try {
  fs.rmSync(sentinel, { force: true });
} catch {
  // ignore
}

process.exit(0);
