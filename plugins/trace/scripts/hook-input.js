'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

function readInput() {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    return input && typeof input === 'object' && !Array.isArray(input) && typeof input.cwd === 'string' && input.cwd ? input : null;
  } catch { return null; }
}
function changedPaths(input) {
  if (!input || !['Write', 'Edit', 'MultiEdit', 'apply_patch'].includes(input.tool_name)) return [];
  if (input.tool_response?.error || input.tool_response?.isError) return [];
  if (input.tool_name !== 'apply_patch') {
    const file = input.tool_input?.file_path;
    return typeof file === 'string' && file ? [file] : [null];
  }
  const patch = input.tool_input?.command;
  if (typeof patch !== 'string') return [null];
  const paths = [...patch.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)\r?$/gm)].map((match) => match[1].trim());
  return paths.length ? paths : [null];
}
function isDocumentation(file) {
  if (file === null) return false;
  return /\.(?:md|mdx|markdown|rst|adoc|txt)$/i.test(file) || file.split(/[\\/]/).some((part) => ['.claude', '.codex', '.agents'].includes(part));
}
function record(input, event) {
  try {
    const dir = path.join(input.cwd, '.claude', '.trace');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '.gitignore'), '*\n');
    fs.writeFileSync(path.join(dir, `hook-${event}.json`), JSON.stringify({ event, time: new Date().toISOString(), tool: input.tool_name || null }) + '\n');
  } catch (error) { debug(error); }
}
// Co-installed full and core packages can emit the same hook during upgrades.
// Store only hashes and suppress concurrent duplicate context for three seconds.
function claimContext(input, event) {
  if (!input.session_id) return true;
  const key = crypto.createHash('sha256').update(JSON.stringify([input.cwd, input.session_id, input.turn_id,
    input.tool_use_id, event, input.source, input.prompt])).digest('hex');
  const dir = path.join(os.tmpdir(), 'trace-hook-context');
  const file = path.join(dir, key);
  try {
    fs.mkdirSync(dir, { recursive: true });
    try { if (Date.now() - fs.statSync(file).mtimeMs > 3000) fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const fd = fs.openSync(file, 'wx'); fs.closeSync(fd);
    return true;
  } catch (error) { if (error.code === 'EEXIST') return false; debug(error); return true; }
}
function debug(error) {
  if (process.env.TRACE_DEBUG_HOOKS === '1') console.error(`TRACE hook: ${error.message}`);
}
module.exports = { readInput, changedPaths, isDocumentation, record, claimContext, debug };
