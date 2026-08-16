# trace-plan

The planning add-on for [TRACE](../../../README.md). For work that earns a written plan before any code gets written.

Depends on [`trace`](../trace/) — installing this brings the core with it.

---

## Install

```
/plugin marketplace add axakon/TRACE
/plugin install trace-plan@trace
/reload-plugins
```

Commands are namespaced `/trace-plan:`.

---

## Skills

| Command | What it does |
|---|---|
| `/trace-plan:spec` | Interviews you to a plan with explicit acceptance criteria, implements against it, then verifies each criterion with evidence. |
| `/trace-plan:epic` | Turns work spanning several phases into an epic of spec-sized tickets on a kanban board. |

---

## The spec path

Describe the work in plain language — *"let's add rate limiting to the API"* — and the agent offers the workflow. Or invoke it directly.

It enters plan mode and interviews you properly: what outcome you want, what's out of scope, what "done" looks like, how it'll be verified. Those acceptance criteria go **into the plan**, not just the conversation. You approve; it implements; then it walks the criteria one by one and marks each met, unverified, or not met — and "met" requires evidence, not an assertion.

Phase 1 confirms scope first, so if it triggers on borderline work you can redirect in a sentence. Small edits don't need it.

At handoff, if the work settled a real architectural decision, it offers to record an ADR by invoking `/trace:adr` — which applies its own gate and may still decline.

---

## Epics

For work too large for one plan. The interview runs at architecture altitude and produces core user stories plus mermaid diagrams carrying the shared intent, decomposed into tickets each sized to seed one later `/trace-plan:spec` run.

The draft opens in the viewer for review before anything is written — mark passages, attach comments, add missing stories, then copy one combined revision prompt back into the session. Only when you confirm does it land in `~/.claude/epics/<slug>/`.

**Epics live in your home directory, never the repo.** They're personal work-staging, so planning residue doesn't end up in code review.

Reopen the skill or use the board directly to move tickets between todo / in-progress / done, split them as understanding evolves, and copy a ticket's seed into `/trace-plan:spec` when you pick it up. Ticket frontmatter is the source of truth; the board table is a generated view.

---

## The viewer

Plans and epics render far better in a browser than a terminal: mermaid diagrams, styled user-story cards, tables, light/dark with a settings panel. It's a Node built-ins server plus a committed bundle — you never run a build.

- **Plans** open automatically when one is presented for approval. Select text to attach an inline revision comment, add stories with the **+** button, then **Copy revision prompt** and paste it back.
- **Epics** get a kanban board above the rendered epic. Moving a ticket rewrites its frontmatter and the board table; **copy seed** formats it for `/trace-plan:spec`.

**One tab, not twenty.** Opening a plan or epic reuses the viewer tab you already have rather than adding another. The hooks park the target with the server, and whichever page polls first claims it and navigates — so exactly one tab moves however many are open. A new tab appears only when nothing is listening. Note that a reused tab doesn't pull the browser to the front; it updates in place and is showing the right page when you switch to it.

Servers bind 127.0.0.1 only and walk ports 7526–7535, so several can coexist — real plans, fixtures, parallel sessions.

| Environment variable | Effect |
|---|---|
| `TRACE_PLAN_VIEWER=0` | Turns the viewer off entirely |
| `TRACE_PLAN_VIEWER_PORT` | Overrides the base port (default 7526) |

The pre-1.0 `PLAYBOOK_PLAN_VIEWER` names are still honoured.

---

## Hooks

| Event | What happens |
|---|---|
| `PermissionRequest` on `ExitPlanMode` | Opens the plan in the viewer while the approval dialog is up. Silent if it can't. |
| `PostToolUse` on `ExitPlanMode` | After approval, tells the agent the plan's URL so it can refer back to it. |

---

## Maintainer notes

`shared/authoring-rules.md` is a synced copy of the file in [`trace/shared/`](../trace/shared/authoring-rules.md) — a plugin can't read outside its own directory once installed, so it has to exist in both. Edit the copy in `trace/`, then run `node scripts/sync-shared.js` from the repo root. The release preflight fails if they drift.

When `viewer/src/` changes, run `npm run build` in `viewer/` and commit the regenerated `dist/viewer.bundle.js` in the same change — a stale bundle ships silently.
