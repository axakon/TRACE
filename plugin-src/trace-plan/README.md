# trace-plan

Plan substantial changes, review plans and epics in the browser, and verify implementation against explicit acceptance criteria.

{{installation}}

## Skills

- `{{skill:trace-plan:spec}}`
- `{{skill:trace-plan:epic}}`

## Review workflow

Spec interviews establish scope, user stories, acceptance criteria, and verification. The skill opens the plan preview, asks for approval using the harness’s controls, implements the approved work, and reports evidence for each criterion.

Epic interviews produce a board and tickets under `~/.claude/epics/`. Drafts stay in `.preview/` until approved. Revision marks produce feedback to paste into the conversation. Ticket frontmatter controls board status; ticket seeds start a spec workflow.

The viewer opens explicitly from the skill. It does not wait for an ExitPlanMode hook. Native planning controls are used when available; conversational approval applies otherwise. The active harness mode and permissions still govern implementation.

## Viewer commands

```sh
node <installed-plugin>/scripts/viewer-open.js plan <absolute-plan.md>
node <installed-plugin>/scripts/viewer-open.js epic <absolute-epic-directory>/epic.md
```

Commands return JSON containing the URL, artifact path, and browser-open result. Preview failure falls back to showing the draft in chat. `--no-browser` starts and verifies the viewer without opening a tab.

`TRACE_PLAN_VIEWER=0` disables previews. `TRACE_PLAN_VIEWER_PORT` selects the first port in the ten-port discovery range (default 7526). The older `PLAYBOOK_` variable names remain supported. Tabs can be reused within the same harness and served directory.

Plans and epics keep their existing user-space paths. No cross-harness session transfer is required. The plan file renders the approval contract; it is not a separate change-spec document.
