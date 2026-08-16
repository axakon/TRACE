---
name: agents-md-setup
description: Set up or review the project's AGENTS.md through an interactive interview with the developer
when_to_use: When a developer opens a project without an AGENTS.md, asks about project setup or conventions, or wants to update an existing AGENTS.md
argument-hint: [path] [--yes]
allowed-tools: Glob Read Edit Write AskUserQuestion
---

You are helping a developer set up or update their project's `AGENTS.md` file. This file gives an agent persistent context about the project — what it is, how it's built, where things live, how to run it, and what's non-obvious.

The convention: **`AGENTS.md` is canonical** (full content lives here, readable by every coding agent that follows the AGENTS.md standard). A sibling **`CLAUDE.md` is a one-line forwarder** containing `See @AGENTS.md for more information.`, so Claude Code's native discovery still finds the file. This skill writes both.

Before you write anything, read these supporting files:
- [scope-resolution.md](../../shared/scope-resolution.md) — how the optional `[path]` argument resolves into a scope root
- [agents-md-rules.md](./agents-md-rules.md) — quality rules your draft must satisfy
- [authoring-rules.md](../../shared/authoring-rules.md) — cross-cutting writing standards
- [example-output.md](./example-output.md) — a concrete example of a well-formed AGENTS.md
- [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — how to find the scope's durable-context folder for the directory index

Parse `$ARGUMENTS` first: a `--yes` (or `-y`) token anywhere turns on **non-interactive mode** (below); the remaining token, if any, is the `[path]`. Resolve the scope per [scope-resolution.md](../../shared/scope-resolution.md) from that remaining token if given, otherwise cwd. Everywhere this skill says "the repo root" or "the root", read it as the resolved scope root: Phase 1 reconnaissance, the `AGENTS.md`/`CLAUDE.md` reads, and the Phase 5 writes all operate inside it.

Determine whether `AGENTS.md` already exists at the scope root (Glob pattern `AGENTS.md` or the Read tool). If it exists, follow **Review and update**. If not, follow **Create from scratch** — even if a `CLAUDE.md` exists at the root with content; per TRACE's convention, only `AGENTS.md` counts as canonical. Treat any pre-existing `CLAUDE.md` as not-yet-set-up state; it will be overwritten with the forwarder in Phase 5.

## Interview mechanics (both paths)

These rules govern every question you ask, in either path.

1. **Probe what exists, never what might be added.** Anchor every question in something observable in the repo or in the developer's lived experience. Don't invite the developer to brainstorm tooling, scripts, or processes that aren't already in place — if it isn't there, it doesn't belong in AGENTS.md or in your question.

2. **One clear turn boundary per section.** Propose the section, ask what's wrong or missing, then hand the turn over and wait — never chain into the next section.
   - Close each section with the literal line: *Reply `ok` to keep it, tell me what to change, or say "skip" to omit it.*
   - Reserve `AskUserQuestion` for genuinely closed picks inside a section (e.g. the package manager) and for the single final write decision — not as a gate after every section. The one-section-at-a-time pace stays; the repeated approvals don't.

3. **Propose, then ask.** Lead with what you inferred from the repo; the developer corrects or confirms. Don't make them describe what you could have read.

4. **Wait for real answers.** Don't treat silence, "sure", or a fast Approve click as deep confirmation. If a section matters — especially Gotchas — and the answer is thin, probe once more before moving on.

5. **The developer controls the pace.** Skip or revisit sections on request. **Skip** is a real choice, not an escape hatch to discourage. Be concise: state what you found, ask what's missing, hand the turn over.

Open every section with its header and italic purpose blurb verbatim, then your inferred content (1–3 sentences), then your questions:

```
**Section N — <Title>**

_<one-sentence purpose, italics, copied from this skill>_

<what you inferred from the repo>

<your follow-up questions or AskUserQuestion calls>
```

## Self-review (both paths)

Before presenting any draft:
1. Re-check every rule in [agents-md-rules.md](./agents-md-rules.md) and [authoring-rules.md](../../shared/authoring-rules.md).
2. Remove any section that's empty or only filler.
3. Verify total length is under 150 lines and no section exceeds 40 lines.

Fix any violations before showing the draft.

## Non-interactive mode (`--yes`)

When `--yes` (or `-y`) is set, skip the interview entirely — no `AskUserQuestion`, no per-section confirms, no waiting for replies. Build every section from Phase 1 reconnaissance alone, accepting your own inferred proposals, in both paths:

- **Inferable sections** (What is this, Stack, Directory index, Commands) — keep the content you proposed.
- **Package manager** — take it from the lock file or manifest instead of asking.
- **Gotchas** and the **Section 2 production-system probe** — omit them; no repo signal exists to infer them from.

Run the Self-review, then write per Phase 5 without the Phase 4 approval step. After writing, tell the developer the file was generated non-interactively, name any omitted section (Gotchas), and note that re-running without `--yes` adds the experience-based context.

---

## Create from scratch (when AGENTS.md does not exist)

### Phase 1: Silent reconnaissance

Gather what you can from the repo before asking anything. Use Read and Glob — do not shell out, so the skill runs on any platform.

- Dependency manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `composer.json`, or equivalent)
- `README`, the top-level directory listing (Glob `*`), any existing `.claude/` config, CI config, and container config
- **Persisted TRACE config.** Read `.claude/.trace/config.json` if present — or `.claude/.playbook/config.json`, its pre-1.0 location — and take `docs_folder` as the authoritative durable-context folder for Section 3.
- **Likely docs roots.** If no config, note which candidate folders exist per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — Section 3 needs to point at the right one.

Do not show the developer your findings yet; this is preparation for the interview.

### Phase 2: Interview — five sections, one at a time

In non-interactive mode, don't run the interview — assemble all five sections from Phase 1 and go to Phase 3 (see Non-interactive mode).

Work through the sections in order, one at a time, applying the interview mechanics above. Don't present multiple sections at once or ask the developer to "review this draft" mid-interview. Close each section with the conversational confirm (`ok` / change / skip) — no per-section chip.

**Section 1 — What is this**

_One short paragraph: what the repo does, who it's for. No history, no roadmap._

Propose a 2–3 sentence description from the README and structure. If the README is thin or absent, say so plainly rather than padding. Ask whether anything is wrong or missing.

**Section 2 — Stack**

_Key pieces only: framework, language/runtime, styling, data layer, package manager. No version numbers, no dev-tool noise._

List the stack pieces visible in dependency files and config. Then:

- Call `AskUserQuestion` for the **package manager** (`npm` / `pnpm` / `yarn` / `bun`) even when a lock file is present — lock files can be stale or committed by accident.
- In chat, ask whether any are wrong and whether anything in the *running* system wouldn't show up in this repo (e.g. a Redis the deployed service uses) — the one place to probe beyond the source tree. Anchor it in what exists in production, not what might be added.

**Section 3 — Directory index**

_Short table mapping top-level dirs (plus select subdirs) to what they contain. Not a file tree._

Propose a directory index from the actual folder structure and ask whether any descriptions are wrong or any subdirectories were left out.

Then append the docs-folder row plus the layout sub-block below, so an agent reading AGENTS.md knows where in `<docs-folder>` to place files without opening the docs README. Resolve `<docs-folder>` using the precedence in [docs-folder-resolution.md](../../shared/docs-folder-resolution.md):

| Path | What's there |
|------|-------------|
| `<docs-folder>/` | Durable project context. Sub-folder layout below shows where each kind of doc goes. |

````
<docs-folder>/
├── system/         ← what the code does today (updated as code changes)
├── architecture/   ← what the system must do (updated when rules change)
├── adr/            ← architecture decisions (immutable once shipped)
├── reference/      ← long-form rationale (append-only)
└── working-notes/  ← research; NOT authoritative — rules live in architecture/ + adr/
````

The sub-block mirrors the Layout in `<docs-folder>/README.md` so an agent picks up routing — "research → working-notes/", "rules → architecture/" — without reading another file. Substitute the actual `<docs-folder>` path in both the table row and the tree (e.g., `docs/` or `documentation/`). Default to keeping the block; the developer can trim or replace it in their `ok`/change reply.

**Section 4 — Commands**

_How to run, test, build, lint, and any commands the agent is likely to need. Only those that aren't obvious from the project type._

Read the script definitions (`package.json` scripts, `Makefile` targets, `justfile`, etc.) and propose a shortlist. In chat, ask only about what exists: are any scripts non-obvious in behaviour (needs a running DB, a specific env file), or standard-looking but different here? If none are non-obvious, omit the section.

**Section 5 — Gotchas**

_Non-obvious, scope-wide things that come from human experience: configuration quirks, implicit dependencies, values that look arbitrary but aren't, things that break silently. A gotcha confined to one subsystem belongs in that subsystem's context file. Highest value-per-word in the file._

You have nothing to propose from the repo here. Ask the developer to draw on lived experience — has anything broken silently, are there values that look arbitrary but have a reason, has anything caught a new developer off guard? If they have nothing concrete, omit the section. Do not press or pad with speculation.

### Phase 3: Self-review

Apply the **Self-review** checklist above.

### Phase 4: Present and confirm

In non-interactive mode, skip this phase — go straight to Phase 5 (see Non-interactive mode).

Show the complete assembled draft (all sections in order). Call `AskUserQuestion`: **Write to disk / Edit / Discard**. If they pick Edit, ask what to change in chat, apply, re-present, and ask again. Do not write the file until they pick **Write to disk**.

### Phase 5: Write to disk

Write the approved content to `AGENTS.md` at the repo root. Then write a one-line `CLAUDE.md` at the repo root containing exactly:

```
See @AGENTS.md for more information.
```

The forwarder ensures Claude Code's native CLAUDE.md discovery still finds the project context. If a `CLAUDE.md` already exists at the root, overwrite it — per TRACE's convention only AGENTS.md is canonical, so the old CLAUDE.md content (if any) is treated as not-yet-set-up state.

---

## Review and update (when AGENTS.md already exists)

### Phase 1: Read the existing file

Read the current `AGENTS.md` and assess it against [agents-md-rules.md](./agents-md-rules.md): does it follow the five-section structure, is anything outdated against the repo (dependency changes, new directories, removed scripts), is anything violating the quality rules (too long, padded, decorative)?

Also check whether a sibling `CLAUDE.md` forwarder exists at the root. If it doesn't, note it — Phase 5 will create one alongside the updated AGENTS.md.

### Phase 2: Walk through each section

In non-interactive mode, don't walk through with the developer — apply every inferred correction yourself and go to Phase 3 (see Non-interactive mode).

Go section by section with the developer, applying the interview mechanics above. For each section:
1. Use the same header + italic-blurb opener as the create flow.
2. Quote what the section currently says.
3. Note anything outdated or inconsistent with the current repo, anchored in a specific file or directory.
4. Ask whether anything should be added, removed, or corrected, and close with the conversational confirm (`ok` / change / skip).

If a section that should exist is missing (e.g. no Gotchas but the developer has some when prompted), propose adding it using the create-flow template. If a section doesn't belong (e.g. "Future plans"), point it out and offer to remove it — handle both in that section's conversational confirm.

For the directory index specifically, check whether the scope's durable-context folder is listed *with* the sub-folder layout block (the ASCII tree showing `system/`, `architecture/`, `adr/`, `reference/`, `working-notes/`). Resolve the docs-folder candidate using [docs-folder-resolution.md](../../shared/docs-folder-resolution.md). If the row is missing entirely, or only the older single `<docs-folder>/` row exists without the layout sub-block, propose adding the full block from create-flow Section 3; default to adding it. An AGENTS.md written before this version of TRACE landed should be brought up to date this way. If the block exists but its `working-notes/` line still reads as a plain label (e.g. "active research, in motion until promoted") rather than stating non-authority, upgrade that line to the create-flow wording (`← research; NOT authoritative — rules live in architecture/ + adr/`).

### Phase 3: Self-review

Apply the **Self-review** checklist above to the updated version.

### Phase 4: Present changes

In non-interactive mode, skip this phase — go straight to Phase 5 (see Non-interactive mode).

Show what changed — a before/after diff or a clean updated version, whichever is clearer. Call `AskUserQuestion`: **Apply changes / Edit further / Discard**. Do not modify the file until they pick **Apply changes**.

### Phase 5: Apply changes

Write the approved updates to `AGENTS.md`. If the root `CLAUDE.md` forwarder was missing in Phase 1, write it now (one line: `See @AGENTS.md for more information.`).
