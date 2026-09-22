# trace

The core TRACE plugin. It sets up the docs folder, writes `AGENTS.md`, adds starter docs, records ADRs, distils what you learn into the docs, checks the conventions, and reports how much instruction text an agent loads.

{{installation}}

## Skills

- `{{skill:trace:init}}`
- `{{skill:trace:agents-md-setup}}`
- `{{skill:trace:scaffold-docs}}`
- `{{skill:trace:adr}}`
- `{{skill:trace:distil}}`
- `{{skill:trace:doctor}}`
- `{{skill:trace:context-graph}}`

## Settings and hooks

Settings live in `<scope>/.claude/.trace/config.json`. The plugin still reads the older `.claude/.playbook/config.json`. Claude Code and Codex use the same docs conventions and the same `AGENTS.md` pointer files.

The plugin has three hooks:

- **SessionStart** adds guidance on Context7 when that tool is available.
- **PostToolUse** marks the session for distillation after an edit to code or config. Edits to docs alone don't count.
- **UserPromptSubmit** adds a short reminder when the work seems to be finishing.

A completed distillation clears the mark. The plugin never runs distillation for you. Run `{{skill:trace:distil}}` when you want to record what you learned.

## Scripts

To see context size outside a session, run `node <installed-plugin>/scripts/context-graph.js <scope> --format tree` in a terminal. Add `--all` to include the docs-folder template rows that the tree hides. Leave out `--format tree` to get JSON.

To check the hooks, run `node <installed-plugin>/scripts/hook-status.js` in the affected scope. The report shows which hook scripts ran recently. It can't tell you whether the host trusts the hooks, so check that in the host's hook settings. Set `TRACE_DEBUG_HOOKS=1` to print hook script errors.
