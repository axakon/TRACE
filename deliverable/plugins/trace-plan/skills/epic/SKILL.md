---
name: epic
description: Turn a multi-phase feature into a local epic — an architecture-focused interview producing core user stories, diagrams, and spec-sized tickets under ~/.claude/epics — then manage the board as work lands
when_to_use: When planned work spans multiple phases or deliverables — the developer says "this spans several phases", "break this into tickets", "this is really an epic", or describes a feature too large for one plan. Also for returning to an existing epic — board review, status updates, adding or splitting tickets. Not for a single feature with one deliverable, however large — that goes through /trace-plan:spec. Not triggered by wrap-up signals ("done", "ship it") — those belong to /trace:distil.
allowed-tools: Glob Read Write Edit AskUserQuestion Bash(node *)
---

You are running the epic path of TRACE: work too large for one spec plan. An **epic** captures the shared intent once — core user stories and architecture-level diagrams — and decomposes it into **tickets**, each sized for one future `/trace-plan:spec` run. The epic carries the context so the later spec plans stay short.

Epics are the developer's personal work-staging, not repo artifacts. They live in `~/.claude/epics/<epic-slug>/` (resolve `~` to the developer's home directory) and are never committed. Templates: [epic-template.md](./epic-template.md) and [ticket-template.md](./ticket-template.md).

## Phase 1: Resolve mode

Glob `~/.claude/epics/*/epic.md`.

- **Invoked with a feature description** → create (Phase 2).
- **Invoked bare, existing epics found** → AskUserQuestion: **Create new epic** / one option per existing epic (label = its title). Choosing an epic → manage (Phase 4).
- **Invoked bare, no epics** → ask one open question: "What do you want to build?" Then create.

## Phase 2 (create): Interview at epic altitude

Interview about architecture and phasing, not implementation. One question at a time, each with your recommended answer; answer from the codebase first and only ask what the repo can't settle. Don't draft until you understand:

- The outcome and the affected users/roles — feeds the core user stories
- The systems and components touched, and where the architecture bends
- Phase boundaries: what must land before what — feeds `depends_on`
- Risks and unknowns — one worth investigating becomes its own spike ticket
- What is out of scope for the whole epic

**Ticket sizing:** one ticket = one future `/trace-plan:spec` run — a short deliverable statable in a sentence or two. A phase that can't be stated that tightly gets split.

## Phase 3 (create): Draft, preview, revise, write

Draft the complete epic — epic.md per [epic-template.md](./epic-template.md) (context, core user stories, architecture diagrams, board table) and every ticket per [ticket-template.md](./ticket-template.md). A ticket's Scope section is the **spec seed**: self-contained text a `/trace-plan:spec` run can start from without reading the epic — the deliverable, not acceptance criteria; those belong to the spec run.

Read [authoring-rules.md](../../shared/authoring-rules.md) and [example-epic.md](./example-epic.md) before you draft, and re-check the draft against both before you stage it.

Stage the draft for browser review instead of dumping it in chat:

1. Write the draft to the preview area — `~/.claude/epics/.preview/<epic-slug>/` with the same `epic.md` + `tickets/` layout as a real epic.
2. Open it in the viewer: `node "${CLAUDE_SKILL_DIR}/../../scripts/epic-viewer-open.js" <epic-slug> --preview`. In chat, give only a two-line summary (title, ticket count) — the browser shows the full draft.
3. AskUserQuestion: **Write epic** / **Revise** / **Abort**.
4. On **Revise**: the developer's feedback may be typed or pasted from the viewer's revision marks ("Revise the epic …"). Apply it to the preview files — the browser live-reloads — and re-ask step 3.
5. On **Write epic**: write the final files to `~/.claude/epics/<epic-slug>/epic.md` and `tickets/<NNN>-<slug>.md` (three-digit numbers from `001`, kebab-case slugs), delete the preview staging with `node -e "require('fs').rmSync('<absolute-home>/.claude/epics/.preview/<epic-slug>', { recursive: true, force: true })"`, then open the real board: `node "${CLAUDE_SKILL_DIR}/../../scripts/epic-viewer-open.js" <epic-slug>`.

The open script finds or starts the TRACE viewer; it exits silently if the viewer can't start — don't treat that as an error, fall back to showing the draft in chat before asking.

## Phase 4 (manage): Board review

Read every ticket's frontmatter and render the board: number, title, status, dependencies. Then offer, via AskUserQuestion:

- **Update status** — set a ticket to `todo` / `in-progress` / `done`
- **Add ticket** — mini-interview (why, scope, dependencies), next free number
- **Split ticket** — the original becomes the first of the splits; new tickets take fresh numbers
- **Show ticket seed** — print the ticket for pasting into `/trace-plan:spec`: a line naming the epic title, a `Ticket file:` line with the ticket's absolute path, then the ticket body. The viewer's **copy seed** button emits the same text.

After any change, rewrite the affected ticket frontmatter and regenerate epic.md's board table. Ticket frontmatter is authoritative; the board table is a view of it.

When the board session ends, open the updated board in the browser with the same command as Phase 3: `node "${CLAUDE_SKILL_DIR}/../../scripts/epic-viewer-open.js" <epic-slug>`.

## Notes

- Status vocabulary is exactly `todo` | `in-progress` | `done`.
- Epic files belong to the developer — hand edits are fine; manage mode reconciles the board from frontmatter, never the reverse.
- Don't deepen tickets toward spec plans. If a ticket needs acceptance criteria, it's time to run `/trace-plan:spec` on it, not to grow the ticket.
