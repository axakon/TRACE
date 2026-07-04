#!/usr/bin/env node
// PostToolUse hook (matched on Write|Edit|MultiEdit): mark the project as
// having pending distillation candidates. The UserPromptSubmit hook reads
// this sentinel and injects a soft reminder for the agent to surface
// /playbook:distil when the work appears to be wrapping up.
//
// Documentation edits don't set the sentinel: there is nothing to distil
// *from* writing docs, so markdown-family files and anything under .claude/
// are filtered out here, judged from the tool input alone (no docs-folder
// resolution). The reminder text still carries its own code-or-config check
// for mixed code+doc sessions.
//
// Exits 0 silently on any failure — never disrupt the agent's flow.

const fs = require('fs');
const path = require('path');

const DOC_EXTENSIONS = new Set(['.md', '.mdx', '.markdown', '.rst', '.adoc', '.txt']);

function isDocumentationEdit(filePath) {
  if (DOC_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return true;
  return filePath.split(/[\\/]/).includes('.claude');
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
    // When the edited path is identifiable and is documentation, skip the
    // sentinel. An unidentifiable path falls through to setting it.
    const filePath = parsed && parsed.tool_input && parsed.tool_input.file_path;
    if (typeof filePath === 'string' && filePath && isDocumentationEdit(filePath)) {
      process.exit(0);
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
