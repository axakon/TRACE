#!/usr/bin/env node
// Sync shared instruction files from the trace core plugin into the add-on
// plugins that also need them.
//
// Claude Code copies each plugin into its own cache directory and a plugin
// cannot read files outside its own root, so an add-on skill cannot reference
// core's shared/ folder. The file has to physically exist in both plugins.
// Core is the single source; this script propagates it.
//
//   node scripts/sync-shared.js          write the copies
//   node scripts/sync-shared.js --check  exit 1 if any copy is stale
//
// Add a row to TARGETS when a new shared file starts crossing a boundary.

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const PLUGINS = path.join(REPO, 'deliverable', 'plugins');

const TARGETS = [
  { file: 'authoring-rules.md', from: 'trace', to: ['trace-plan'] },
];

const check = process.argv.includes('--check');
let stale = 0;
let synced = 0;

for (const { file, from, to } of TARGETS) {
  const src = path.join(PLUGINS, from, 'shared', file);
  if (!fs.existsSync(src)) {
    console.error(`missing source: ${path.relative(REPO, src)}`);
    process.exit(1);
  }
  const content = fs.readFileSync(src, 'utf8');

  for (const plugin of to) {
    const dest = path.join(PLUGINS, plugin, 'shared', file);
    const rel = path.relative(REPO, dest);
    const current = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;

    if (current === content) continue;

    if (check) {
      console.error(`stale: ${rel} differs from ${from}/shared/${file}`);
      stale++;
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, content);
      console.log(`synced ${rel}`);
      synced++;
    }
  }
}

if (check) {
  if (stale) {
    console.error(`\n${stale} stale copy/copies. Run: node scripts/sync-shared.js`);
    process.exit(1);
  }
  console.log('shared files in sync');
} else {
  console.log(synced ? `\n${synced} file(s) synced` : 'shared files already in sync');
}
