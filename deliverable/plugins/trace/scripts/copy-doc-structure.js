#!/usr/bin/env node
// Copy the canonical doc-structure READMEs from the plugin's
// shared/doc-structure/ into a target durable-context folder, preserving
// sub-paths. Used by the init skill (Phase 3) so the six READMEs are placed in
// one cross-platform call instead of routing each file's contents through the
// agent's context.
//
// Copy-only-missing: never overwrites. Each source file is classified as
//   - written          target did not exist; it was created
//   - skipped_identical target already byte-identical to source
//   - conflicts         target exists and differs; left untouched for the
//                       skill to resolve (Read + AskUserQuestion)
//   - errors           target could not be written (e.g. a file exists where
//                      a directory is needed); { path, message } entries
//
// Usage: node copy-doc-structure.js <target-folder>
//
// Prints a JSON report to stdout:
//   { "written": [...], "skipped_identical": [...], "conflicts": [...], "errors": [...] }
// Paths in the report are relative to <target-folder>.
//
// Exits 1 with a stderr message if the target argument is missing or the
// source structure cannot be found — these are caller errors, not the silent
// no-ops the hook scripts use.

const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  process.stderr.write('copy-doc-structure: missing <target-folder> argument\n');
  process.exit(1);
}

const srcRoot = path.join(__dirname, '..', 'shared', 'doc-structure');
if (!fs.existsSync(srcRoot)) {
  process.stderr.write(`copy-doc-structure: source not found at ${srcRoot}\n`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const report = { written: [], skipped_identical: [], conflicts: [], errors: [] };

for (const srcFile of walk(srcRoot)) {
  const rel = path.relative(srcRoot, srcFile);
  const destFile = path.join(target, rel);

  try {
    if (!fs.existsSync(destFile)) {
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      report.written.push(rel);
      continue;
    }

    const srcBuf = fs.readFileSync(srcFile);
    const destBuf = fs.readFileSync(destFile);
    if (srcBuf.equals(destBuf)) report.skipped_identical.push(rel);
    else report.conflicts.push(rel);
  } catch (err) {
    report.errors.push({ path: rel, message: err.message });
  }
}

process.stdout.write(JSON.stringify(report));
process.exit(0);
