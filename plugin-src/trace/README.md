# trace

All of TRACE in one plugin. It sets up the docs folder, writes `AGENTS.md`, adds starter docs, records ADRs, distils what you learn into the docs, checks the conventions, and reports how much instruction text an agent loads. It also plans larger changes, shows plans and epics in a browser, and drafts commit messages and PR descriptions.

{{installation}}

## Skills

- `{{skill:trace:init}}`
- `{{skill:trace:agents-md-setup}}`
- `{{skill:trace:scaffold-docs}}`
- `{{skill:trace:adr}}`
- `{{skill:trace:distil}}`
- `{{skill:trace:doctor}}`
- `{{skill:trace:context-graph}}`
- `{{skill:trace:spec}}`
- `{{skill:trace:epic}}`
- `{{skill:trace:commit-message}}`
- `{{skill:trace:pr-description}}`

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

## Plans and epics

**Specs.** The spec skill asks questions to settle the scope, user stories, acceptance criteria, and how to verify the work. It opens the plan in the browser and asks for your approval with the host's controls. After you approve, it implements the plan and reports evidence for each criterion.

**Epics.** The epic skill writes a board and tickets under `~/.claude/epics/`. Drafts stay in `.preview/` until you approve them. In the browser you can mark text for revision, and the viewer gives you feedback to paste back into the conversation. Each ticket's frontmatter sets its status on the board. Each ticket also has a starting prompt for a spec.

The skills open the viewer themselves. No plan-mode hook is involved. If the host has its own planning controls, the skills use them. Otherwise they ask for approval in chat. The host's current mode and permissions still decide whether implementation can start.

### Viewer commands

```sh
node <installed-plugin>/scripts/viewer-open.js plan <absolute-plan.md>
node <installed-plugin>/scripts/viewer-open.js epic <absolute-epic-directory>/epic.md
```

Each command prints JSON with the URL, the file path, and whether a browser tab opened. If the preview fails, the skill shows the draft in chat instead. `--no-browser` starts the viewer and checks it without opening a tab.

Set `TRACE_PLAN_VIEWER=0` to turn previews off. `TRACE_PLAN_VIEWER_PORT` sets the first of ten ports the viewer tries (default 7526). The older `PLAYBOOK_` names still work. A browser tab can be reused for the same host and the same folder.

Plans and epics stay in their existing folders in your home directory. A session in one host does not need to move to the other. The plan file is the approved plan itself, not a separate spec document.

## Commits and PRs

The commit-message and PR-description skills follow TRACE's shared writing rules. They run only when you ask for a message, or ask the agent to commit or open a PR.
