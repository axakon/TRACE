---
name: distil
description: Evaluate recent changes and propose updates to the project's permanent context (AGENTS.md or the scope's docs folder) when something durable was learned
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

Apply [distillation-criteria.md](../../shared/distillation-criteria.md) to what you read. Judge criteria 1–4 (new convention, security boundary, durable design choice, non-obvious gotcha) from the diff alone. Hold each qualifying observation as a separate candidate — they may route to different files. Criterion 5 (a correction to existing context) is confirmed in Phase 3, when you read the affected scope's `AGENTS.md`.

If the diff yields no candidates and nothing in it plausibly invalidates existing context, say so, clear the sentinel (Phase 6), and stop — skip the rest. Most runs distil nothing; don't invent reasons to write.

## Phase 3: Map scope and read only the relevant existing context

A project may be a single repo or a super-repo of sub-repos that each carry their own `AGENTS.md` and durable-context folder. Route each candidate to the *most-local* scope whose contents it describes — otherwise sub-repo knowledge lands at the super-repo level, where someone working inside the sub-repo never sees it.

For each candidate, find its **nearest-ancestor scope** — the closest ancestor directory (from the changed file upward) containing an `AGENTS.md`; the repo root counts, intermediate directories with their own `AGENTS.md` count first. (An existing `CLAUDE.md` without a sibling `AGENTS.md` does *not* count — per this plugin's convention only AGENTS.md is canonical.) Resolve that scope's durable-context folder per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md); if it isn't playbook-marked yet, you'll mark it on first write (Phase 5). Also note any **further-ancestor scopes** between that one and the project root — distil reads these too, so a sub-scope candidate doesn't duplicate something a domain-wide AGENTS.md or docs folder already records.

Read existing context **proportionally** — enough to avoid duplicates and contradictions, not the whole library:

- The affected scope's root `AGENTS.md`, and each ancestor scope's root `AGENTS.md` up to the project root (all small; together they are your dedup *and* your correction check for criterion 5 — a change can invalidate something the parent scope claims, not just the local one).
- In each of those scopes' durable-context folders, the per-folder `AGENTS.md` marker and the *filenames* in `<docs-folder>/system/`, `<docs-folder>/architecture/` (if present), and at the `<docs-folder>/` root (legacy location for descriptive files). Open in full only the file(s) whose area overlaps a candidate — skip unrelated ones.
- Any existing ADR under `<docs-folder>/adr/` at the affected scope or any ancestor, touching a candidate's area, so you don't restate its rationale.

`<docs-folder>/adr/` is never a distillation target. Historical folders (`reference/`, `working-notes/`) are also never targets — distil writes living knowledge, not rationale or research. `<docs-folder>/architecture/` *is* a valid target for prescriptive candidates (operational rules), but only when the project has the folder set up; descriptive candidates always route to `system/`.

## Phase 4: Decide on a target for each candidate

For each candidate observation, pick a destination using two questions in this order:

**1. Which scope owns this knowledge?** Default to the nearest-ancestor scope of the changed paths. Then check three promotion signals against the ancestor scopes you read in Phase 3:

- **Parent already covers the area** — an ancestor's `AGENTS.md` or a file in its docs folder already discusses what this candidate adds to. Propose updating *that file* instead of writing a local duplicate.
- **Diff touches shared code** — the change includes files outside the affected scope (a root-level `shared/`, `contracts/`, `proto/`, or similar). Propose the nearest scope that owns the shared path.
- **Candidate references siblings** — the candidate text names another sub-scope, or describes a contract between sub-scopes. Propose their common-ancestor scope.

When any signal fires, lead with the upward target in Phase 5; the developer can still flip via **Change location**. When none fire but the candidate still feels domain-wide (a general rule rather than scope-specific behaviour), use `AskUserQuestion` before drafting: **Keep at `<local>`** / **Hoist to `<parent>`** / **Skip**. Don't guess silently. When none fire and the candidate is plainly local, propose local and move on.

**2. Inside that scope, which file?**

First decide **what kind of knowledge** the candidate is:

- **Descriptive** — facts about what the codebase *is* now ("we use Postgres 16," "auth handler at `src/auth.ts`"). Routes to `system/`.
- **Prescriptive** — a rule the system *must* follow ("MUST refresh the token every 5 minutes," "endpoint X MUST be retried"). Routes to `architecture/<area>.md`. Use only if the candidate is unambiguously a MUST/operational rule and `<docs-folder>/architecture/` exists in the project. If unclear, default to descriptive and let the developer redirect.

Then pick the file:

- **Update the scope's `AGENTS.md`** if the candidate corrects an outdated entry there (Stack/Commands), or is a *scope-wide* gotcha — one that would catch out work anywhere in the scope. A gotcha confined to one area routes to that area's `system/<topic>.md` instead.
- **Update an existing context file** if the scope's durable-context folder already has a file covering the affected area — at its existing path, whether that's `<docs-folder>/system/<topic>.md`, `<docs-folder>/architecture/<topic>.md`, or `<docs-folder>/<topic>.md` (legacy). Do not migrate the file's location as part of the update.
- **Create a new descriptive file** at `<docs-folder>/system/<topic>.md` if no existing file fits and the candidate is substantial enough to warrant its own file.
- **Create a new prescriptive file** at `<docs-folder>/architecture/<topic>.md` only if the candidate is clearly a MUST/operational rule, `<docs-folder>/architecture/` already exists, and no existing architecture file covers the area. Use RFC 2119 voice (MUST / MUST NOT / SHOULD) and cite the source (an ADR, a contract, an incident) for each rule.
- **Add a section to an adjacent context file** if the candidate is small but related to an existing file's scope.

Naming guidance for new context files: scope each to a meaningful concept — `security.md`, `data-model.md`, `kafka-events.md`, `api-conventions.md`. Not so narrow they fragment (`that-blue-button.md` is wrong). Not so broad they become a dump (`misc.md` is wrong). Use the project's own vocabulary, not the example list. Pair filenames across `system/` and `architecture/` for the same area (e.g. `system/api.md` describing the client + `architecture/api.md` constraining it).

**Don't duplicate an ADR's rationale.** Distilled context records the *resulting convention* ("rate limits go through `RateLimiter`"); an ADR records the *decision and why* ("we chose token-bucket over fixed-window because…"). If a candidate is really a design decision and an ADR covers it, distil only the convention and point at the ADR rather than restating the reasoning. If the decision is significant but no ADR exists, suggest `/playbook:adr` instead of capturing the rationale here.

## Phase 5: Propose and write each candidate

Work through the candidates one at a time — present, get one approval, write, then move on. Ask for every candidate, even when the routing is obvious. For each:

1. **Show the developer, together:**
   - **What** — a one-sentence summary of the observation.
   - **Why it qualifies** — which distillation criterion it meets.
   - **Proposed target** — the file (existing or new) and a brief reason; with multiple scopes, give the full path from the cwd (e.g. `services/api/docs/api-conventions.md`).
   - **The drafted change** — the exact diff you propose. Follow [authoring-rules.md](../../shared/authoring-rules.md) (read it now): concise, only what's confirmed from the change, plain prose.

2. **Ask once** with `AskUserQuestion`: **Confirm & write** / **Change location** / **Edit content** / **Skip**. Nothing is written until the developer confirms.

3. **On confirm:** if the target durable-context folder isn't playbook-marked yet (missing, or no `AGENTS.md` with the playbook heading), write the marker first: `<scope>/<docs-folder>/AGENTS.md` from [context-folder-template.md](./context-folder-template.md) (start at `# Durable project context`; Write creates parent dirs), plus a sibling `<scope>/<docs-folder>/CLAUDE.md` containing the one-line forwarder `See @AGENTS.md for more information.`. If the folder already holds hand-written docs, tell the developer the marker pair lands alongside them. Then write the candidate's addition.

## Phase 6: Clear the distillation-pending sentinel

Once this run reaches a clean conclusion — candidates written, or a no-op from Phase 2 — clear the sentinel:

`node "${CLAUDE_PLUGIN_ROOT}/scripts/clear-sentinel.js"`

Skip only if the developer aborted mid-flow; then the pending state still applies.

## Notes

- If the developer invokes this skill mid-session and there's no diff yet (work hasn't been done), say so and stop.
- If the developer invokes this skill on a project with no `AGENTS.md` at the root, say so and recommend running `/playbook:agents-md-setup` first. (An existing `CLAUDE.md` without an `AGENTS.md` does not count — only AGENTS.md is canonical.) In a super-repo with sub-repos that have their own `AGENTS.md` files, a missing super-repo `AGENTS.md` is fine — the recommendation only applies when there's no `AGENTS.md` anywhere in the changed scopes.
