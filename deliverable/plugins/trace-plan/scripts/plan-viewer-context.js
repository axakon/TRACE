#!/usr/bin/env node
// PostToolUse hook (matcher: ExitPlanMode). Fires after the plan is approved:
// tells Claude the plan's viewer URL so it can reference the link in its
// response. Discovers which port serves this plan's directory (the open hook
// may have landed past 7526 when other servers occupy the range). Exits 0
// silently when the input is missing or malformed.
//
// Disable with TRACE_PLAN_VIEWER=0 (PLAYBOOK_PLAN_VIEWER still honoured).

'use strict';

const path = require('path');
const { BASE_PORT, readStdin, findServer } = require('./plan-viewer-common');

async function main() {
  if ((process.env.TRACE_PLAN_VIEWER ?? process.env.PLAYBOOK_PLAN_VIEWER) === '0') return;

  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    return;
  }
  if (input.tool_name !== 'ExitPlanMode') return;

  const planFilePath = input.tool_input && input.tool_input.planFilePath;
  if (!planFilePath || !planFilePath.endsWith('.md')) return;
  const slug = path.basename(planFilePath, '.md');

  const found = await findServer(path.dirname(planFilePath));
  const port = found ? found.port : BASE_PORT;
  const url = `http://127.0.0.1:${port}/plan/${encodeURIComponent(slug)}`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          `The approved plan is rendered in the TRACE plan viewer at ${url} ` +
          `(server runs on the developer's machine). Include this link when you ` +
          `summarize the plan or reference it later in the session.`,
      },
    })
  );
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
