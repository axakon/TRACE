---
name: distil
description: Evaluate recent changes and propose updates to the project's permanent context (CLAUDE.md or the scope's docs folder) when something durable was learned
disable-model-invocation: true
allowed-tools: Bash(git diff*) Bash(git status*) Bash(git log*) Bash(node *) Glob Read Edit Write
---

You are running the distillation step of the playbook: evaluate recent changes and propose capturing anything durable into the project's permanent context.

Before doing anything, read [distillation-criteria.md](../../shared/distillation-criteria.md) (the bar for Phase 2) and [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) (folder lookup for Phase 3). Read [authoring-rules.md](../../shared/authoring-rules.md) later, in Phase 5, and only if you end up writing something.

## Phase 1: Determine what changed (cheaply first)

Get the changed-file list before reading diff content — don't pull the whole diff blind.

1. **Uncommitted changes** — `git status --short` and `git diff HEAD --stat`. If present, those files are the scope.
2. **Recent commits** — if the tree is clean, `git log -5 --oneline` and `git diff HEAD~1 HEAD --stat` (further back if the developer gave a range).
3. **No git** — ask the developer to describe what changed.

Then read the diff only for files worth evaluating, one or a few at a time: `git diff HEAD -- <path>`. Prioritise config, security-sensitive paths, new files, and structural changes (added/removed exports, schema changes). Skip lockfiles, generated output, and formatting-only churn.

## Phase 2: Evaluate against criteria

Apply [distillation-criteria.md](../../shared/distillation-criteria.md) to what you read. Judge criteria 1–4 (new convention, security boundary, durable design choice, non-obvious gotcha) from the diff alone. Hold each qualifying observation as a separate candidate — they may route to different files. Criterion 5 (a correction to existing context) is confirmed in Phase 3, when you read the affected scope's `CLAUDE.md`.

If the diff yields no candidates and nothing in it plausibly invalidates existing context, say so, clear the sentinel (Phase 6), and stop — skip the rest. Most runs distil nothing; don't invent reasons to write.

## Phase 3: Map scope and read only the relevant existing context

A project may be a single repo or a super-repo of sub-repos that each carry their own `CLAUDE.md` and durable-context folder. Route each candidate to the *most-local* scope whose contents it describes — otherwise sub-repo knowledge lands at the super-repo level, where someone working inside the sub-repo never sees it.

For each candidate, find its **nearest-ancestor scope** — the closest ancestor directory (from the changed file upward) containing a `CLAUDE.md`; the repo root counts, intermediate directories with their own `CLAUDE.md` count first. Resolve that scope's durable-context folder per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md); if it isn't playbook-marked yet, you'll mark it on first write (Phase 5).

Read existing context **proportionally** — enough to avoid duplicates and contradictions, not the whole library:

- The affected scope's root `CLAUDE.md` (small; also your correction check for criterion 5).
- In the durable-context folder, the per-folder `CLAUDE.md` and the *filenames*. Open in full only the file(s) whose area overlaps a candidate — skip unrelated ones.
- Any existing ADR under `adr/` touching a candidate's area, so you don't restate its rationale.

`<docs-folder>/adr/` is never a distillation target.

## Phase 4: Decide on a target for each candidate

For each candidate observation, pick a destination using two questions in this order:

**1. Which scope owns this knowledge?** Default to the nearest-ancestor scope of the changed paths the candidate describes. Promote to a higher scope (a parent repo's `CLAUDE.md` or durable-context folder) only when the candidate is genuinely cross-cutting — it describes a convention multiple sub-repos must follow, names a relationship between sub-repos, or constrains how they integrate. When unsure, propose the local target; the developer can override. Over-correction toward the super-repo is harder to undo.

**2. Inside that scope, which file?**

- **Update the scope's `CLAUDE.md`** if the candidate corrects or extends something already there (most often: the Gotchas section or an outdated Stack/Commands entry).
- **Update an existing context file** if the scope's durable-context folder already has a file covering the affected area.
- **Create a new context file** if no existing file fits and the candidate is substantial enough to warrant its own file.
- **Add a section to an adjacent context file** if the candidate is small but related to an existing file's scope.

Naming guidance for new context files: scope each to a meaningful concept — `security.md`, `data-model.md`, `kafka-events.md`, `api-conventions.md`. Not so narrow they fragment (`that-blue-button.md` is wrong). Not so broad they become a dump (`misc.md` is wrong). Use the project's own vocabulary, not the example list.

**Don't duplicate an ADR's rationale.** Distilled context records the *resulting convention* ("rate limits go through `RateLimiter`"); an ADR records the *decision and why* ("we chose token-bucket over fixed-window because…"). If a candidate is really a design decision and an ADR covers it, distil only the convention and point at the ADR rather than restating the reasoning. If the decision is significant but no ADR exists, suggest `/playbook:adr` instead of capturing the rationale here.

## Phase 5: Propose and write each candidate

Work through the candidates one at a time — present, get one approval, write, then move on. Ask for every candidate, even when the routing is obvious. For each:

1. **Show the developer, together:**
   - **What** — a one-sentence summary of the observation.
   - **Why it qualifies** — which distillation criterion it meets.
   - **Proposed target** — the file (existing or new) and a brief reason; with multiple scopes, give the full path from the cwd (e.g. `services/api/docs/api-conventions.md`).
   - **The drafted change** — the exact diff you propose. Follow [authoring-rules.md](../../shared/authoring-rules.md) (read it now): concise, only what's confirmed from the change, plain prose.

2. **Ask once** with `AskUserQuestion`: **Confirm & write** / **Change location** / **Edit content** / **Skip**. Nothing is written until the developer confirms.

3. **On confirm:** if the target durable-context folder isn't playbook-marked yet (missing, or no `CLAUDE.md`), write the marker `<scope>/<docs-folder>/CLAUDE.md` first, from [context-folder-template.md](./context-folder-template.md) (start at `# Durable project context`; Write creates parent dirs) — and if that folder already holds hand-written docs, tell the developer it lands alongside them. Then write the candidate's addition.

## Phase 6: Clear the distillation-pending sentinel

Once this run reaches a clean conclusion — candidates written, or a no-op from Phase 2 — clear the sentinel:

`node "${CLAUDE_PLUGIN_ROOT}/scripts/clear-sentinel.js"`

Skip only if the developer aborted mid-flow; then the pending state still applies.

## Notes

- If the developer invokes this skill mid-session and there's no diff yet (work hasn't been done), say so and stop.
- If the developer invokes this skill on a project with no `CLAUDE.md` at the root, say so and recommend running `/playbook:claude-md-setup` first. In a super-repo with sub-repos that have their own `CLAUDE.md` files, a missing super-repo `CLAUDE.md` is fine — the recommendation only applies when there's no `CLAUDE.md` anywhere in the changed scopes.
