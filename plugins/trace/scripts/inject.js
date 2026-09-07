#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { readInput, record, claimContext, debug } = require('./hook-input');
const [textFile, hookEventName] = process.argv.slice(2);
const input = readInput();
if (input && textFile && hookEventName) {
  try {
    const additionalContext = fs.readFileSync(textFile, 'utf8');
    record(input, hookEventName);
    if (claimContext(input, hookEventName)) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext } }));
  } catch (error) { debug(error); }
}
