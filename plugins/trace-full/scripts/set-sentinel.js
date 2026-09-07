#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { readInput, changedPaths, isDocumentation, record, debug } = require('./hook-input');
const input = readInput();
if (input) {
  record(input, 'PostToolUse');
  if (changedPaths(input).some((file) => !isDocumentation(file))) {
    try { fs.writeFileSync(path.join(input.cwd, '.claude', '.trace', 'distillation-pending'), ''); }
    catch (error) { debug(error); }
  }
}
