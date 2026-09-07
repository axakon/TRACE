#!/usr/bin/env node
'use strict';
const os = require('node:os');
const path = require('node:path');
const { openArtifact } = require('./viewer-open');
const args = process.argv.slice(2);
const slug = args.shift();
let root = path.join(os.homedir(), '.claude', 'epics');
let preview = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--preview') preview = true;
  else if (args[i] === '--epics-dir' && args[i + 1]) root = path.resolve(args[++i]);
  else { console.error('Usage: epic-viewer-open.js <slug> [--epics-dir DIR] [--preview]'); process.exit(1); }
}
if (!slug || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) || slug.includes('..')) {
  console.error('Provide an epic slug.'); process.exit(1);
}
openArtifact('epic', path.join(root, ...(preview ? ['.preview'] : []), slug, 'epic.md'))
  .then((result) => console.log(JSON.stringify(result)))
  .catch((error) => { console.error(error.message); process.exitCode = 1; });
