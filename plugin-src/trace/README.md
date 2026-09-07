# trace

Durable project context: configure docs, author AGENTS.md, scaffold useful documents, record ADRs, distil knowledge, and validate conventions.

{{installation}}

## Skills

- `{{skill:trace:init}}`
- `{{skill:trace:agents-md-setup}}`
- `{{skill:trace:scaffold-docs}}`
- `{{skill:trace:adr}}`
- `{{skill:trace:distil}}`
- `{{skill:trace:doctor}}`

## State and hooks

Configuration remains in `<scope>/.claude/.trace/config.json`, with the existing `.claude/.playbook/config.json` compatibility read. Both harnesses use the same documentation conventions and AGENTS.md forwarders.

SessionStart supplies Context7 guidance when that tool is available. PostToolUse marks code/config edits for distillation. UserPromptSubmit supplies a soft reminder when work wraps up. Documentation-only edits do not set the sentinel. Distillation clears it after a completed run.

To diagnose hooks, run `node <installed-plugin>/scripts/hook-status.js` from the affected scope. The report shows recent script execution, not host trust. Inspect the host’s hook controls for discovery, enablement, and trust. Set `TRACE_DEBUG_HOOKS=1` to print script failures.

The core never forces distillation. Invoke `{{skill:trace:distil}}` when you want to capture durable knowledge.
