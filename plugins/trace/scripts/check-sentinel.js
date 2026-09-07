#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { readInput, record, claimContext, debug } = require('./hook-input');
const input = readInput();
if (input && process.argv[2]) {
  record(input, 'UserPromptSubmit');
  if (fs.existsSync(path.join(input.cwd, '.claude', '.trace', 'distillation-pending'))) {
    try {
      const additionalContext = fs.readFileSync(process.argv[2], 'utf8');
      if (claimContext(input, 'UserPromptSubmit')) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext } }));
    } catch (error) { debug(error); }
  }
}
