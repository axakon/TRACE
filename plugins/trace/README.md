# trace

Durable project context: configure docs, author AGENTS.md, scaffold useful documents, record ADRs, distil knowledge, and validate conventions.

Add the TRACE marketplace, then install this package:

```sh
codex plugin marketplace add axakon/TRACE
codex plugin add trace@trace
```

Start a new session after installation. In Codex desktop, install from the TRACE marketplace in the Plugins view. Review and trust plugin hooks in the host hook controls. Choose either trace-full or individual packages; enabling both duplicates skill listings.

## Skills

- `$trace:init`
- `$trace:agents-md-setup`
- `$trace:scaffold-docs`
- `$trace:adr`
- `$trace:distil`
- `$trace:doctor`

## State and hooks

Configuration remains in `<scope>/.claude/.trace/config.json`, with the existing `.claude/.playbook/config.json` compatibility read. Both harnesses use the same documentation conventions and AGENTS.md forwarders.

SessionStart supplies Context7 guidance when that tool is available. PostToolUse marks code/config edits for distillation. UserPromptSubmit supplies a soft reminder when work wraps up. Documentation-only edits do not set the sentinel. Distillation clears it after a completed run.

To diagnose hooks, run `node <installed-plugin>/scripts/hook-status.js` from the affected scope. The report shows recent script execution, not host trust. Inspect the host’s hook controls for discovery, enablement, and trust. Set `TRACE_DEBUG_HOOKS=1` to print script failures.

The core never forces distillation. Invoke `$trace:distil` when you want to capture durable knowledge.
