# trace-plan

Plans larger changes, shows plans and epics in a browser, and checks the finished work against written acceptance criteria.

{{installation}}

## Skills

- `{{skill:trace-plan:spec}}`
- `{{skill:trace-plan:epic}}`

## How a review works

**Specs.** The spec skill asks questions to settle the scope, user stories, acceptance criteria, and how to verify the work. It opens the plan in the browser and asks for your approval with the host's controls. After you approve, it implements the plan and reports evidence for each criterion.

**Epics.** The epic skill writes a board and tickets under `~/.claude/epics/`. Drafts stay in `.preview/` until you approve them. In the browser you can mark text for revision, and the viewer gives you feedback to paste back into the conversation. Each ticket's frontmatter sets its status on the board. Each ticket also has a starting prompt for a spec.

The skills open the viewer themselves. No plan-mode hook is involved. If the host has its own planning controls, the skills use them. Otherwise they ask for approval in chat. The host's current mode and permissions still decide whether implementation can start.

## Viewer commands

```sh
node <installed-plugin>/scripts/viewer-open.js plan <absolute-plan.md>
node <installed-plugin>/scripts/viewer-open.js epic <absolute-epic-directory>/epic.md
```

Each command prints JSON with the URL, the file path, and whether a browser tab opened. If the preview fails, the skill shows the draft in chat instead. `--no-browser` starts the viewer and checks it without opening a tab.

Set `TRACE_PLAN_VIEWER=0` to turn previews off. `TRACE_PLAN_VIEWER_PORT` sets the first of ten ports the viewer tries (default 7526). The older `PLAYBOOK_` names still work. A browser tab can be reused for the same host and the same folder.

Plans and epics stay in their existing folders in your home directory. A session in one host does not need to move to the other. The plan file is the approved plan itself, not a separate spec document.
