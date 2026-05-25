#!/usr/bin/env node
// PostToolUse hook (matched on Write|Edit|MultiEdit): mark the project as
// having pending distillation candidates. The UserPromptSubmit hook reads
// this sentinel and injects a soft reminder for the agent to surface
// /playbook:distil when the work appears to be wrapping up.
//
// Exits 0 silently on any failure — never disrupt the agent's flow.

const fs = require('fs');
const path = require('path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

let cwd = process.cwd();
const input = readStdin();
if (input) {
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed.cwd === 'string' && parsed.cwd) {
      cwd = parsed.cwd;
    }
  } catch {
    // ignore malformed input
  }
}

const stateDir = path.join(cwd, '.claude', '.playbook');
try {
  fs.mkdirSync(stateDir, { recursive: true });
} catch {
  process.exit(0);
}

const gitignore = path.join(stateDir, '.gitignore');
if (!fs.existsSync(gitignore)) {
  try {
    fs.writeFileSync(gitignore, '*\n');
  } catch {
    // ignore
  }
}

try {
  fs.writeFileSync(path.join(stateDir, 'distillation-pending'), '');
} catch {
  // ignore
}

process.exit(0);
