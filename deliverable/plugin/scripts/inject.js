#!/usr/bin/env node
// Reads a markdown file and emits the JSON envelope Claude Code expects for
// injecting additionalContext from a hook. Substitutes ${VAR} placeholders
// from the environment so paths like ${CLAUDE_PLUGIN_ROOT} resolve before the
// text reaches the model.
//
// Usage: node inject.js <text-file> <hook-event-name>
//
// Exits 0 silently if the text file is missing — the session continues without
// the injection rather than failing.

const fs = require('fs');

const textFile = process.argv[2];
const hookEventName = process.argv[3];

if (!textFile || !hookEventName || !fs.existsSync(textFile)) {
  process.exit(0);
}

let contents;
try {
  contents = fs.readFileSync(textFile, 'utf8');
} catch {
  process.exit(0);
}

contents = contents.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, name) =>
  process.env[name] !== undefined ? process.env[name] : match
);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName,
      additionalContext: contents,
    },
  })
);
