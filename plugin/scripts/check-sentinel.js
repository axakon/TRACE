#!/usr/bin/env node
// UserPromptSubmit hook: if a distillation-pending sentinel exists for this
// project, inject a reminder for the agent to surface /playbook:distil when
// the developer's current turn appears to be wrapping up.
//
// Exits 0 silently with no output if the sentinel is absent or the reminder
// file is missing.
//
// Usage: node check-sentinel.js <reminder-text-file>

const fs = require('fs');
const path = require('path');

const reminderFile = process.argv[2];
if (!reminderFile || !fs.existsSync(reminderFile)) {
  process.exit(0);
}

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

const sentinel = path.join(cwd, '.claude', '.playbook', 'distillation-pending');
if (!fs.existsSync(sentinel)) {
  process.exit(0);
}

let contents;
try {
  contents = fs.readFileSync(reminderFile, 'utf8');
} catch {
  process.exit(0);
}

contents = contents.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, name) =>
  process.env[name] !== undefined ? process.env[name] : match
);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: contents,
    },
  })
);
