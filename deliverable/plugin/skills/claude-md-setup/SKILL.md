---
name: claude-md-setup
description: Set up or review the project's CLAUDE.md through an interactive interview with the developer
when_to_use: When a developer opens a project without a CLAUDE.md, asks about project setup or conventions, or wants to update an existing CLAUDE.md
allowed-tools: Glob Read Edit Write AskUserQuestion
---

You are helping a developer set up or update their project's CLAUDE.md file. This file gives Claude persistent context about the project — what it is, how it's built, where things live, how to run it, and what's non-obvious.

Before you write anything, read these supporting files:
- [claude-md-rules.md](./claude-md-rules.md) — quality rules your draft must satisfy
- [authoring-rules.md](../../shared/authoring-rules.md) — cross-cutting writing standards
- [example-output.md](./example-output.md) — a concrete example of a well-formed CLAUDE.md
- [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — how to find the scope's durable-context folder for the directory index

Determine whether `CLAUDE.md` already exists at the repo root (Glob pattern `CLAUDE.md` or the Read tool). If it exists, follow **Review and update**. If not, follow **Create from scratch**.

## Interview mechanics (both paths)

These rules govern every question you ask, in either path.

1. **Probe what exists, never what might be added.** Anchor every question in something observable in the repo or in the developer's lived experience. Don't invite the developer to brainstorm tooling, scripts, or processes that aren't already in place — if it isn't there, it doesn't belong in CLAUDE.md or in your question.

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
1. Re-check every rule in [claude-md-rules.md](./claude-md-rules.md) and [authoring-rules.md](../../shared/authoring-rules.md).
2. Remove any section that's empty or only filler.
3. Verify total length is under 150 lines and no section exceeds 40 lines.

Fix any violations before showing the draft.

---

## Create from scratch (when CLAUDE.md does not exist)

### Phase 1: Silent reconnaissance

Gather what you can from the repo before asking anything. Use Read and Glob — do not shell out, so the skill runs on any platform.

- Dependency manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `composer.json`, or equivalent)
- `README`, the top-level directory listing (Glob `*`), any existing `.claude/` config, CI config, and container config
- **Persisted playbook config.** Read `.claude/.playbook/config.json` if present; its `docs_folder` is the authoritative durable-context folder for Section 3.
- **Likely docs roots.** If no config, note which candidate folders exist per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — Section 3 needs to point at the right one.

Do not show the developer your findings yet; this is preparation for the interview.

### Phase 2: Interview — five sections, one at a time

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

Then append the playbook-managed entry below so the agent can discover the playbook's output once it appears. Resolve `<docs-folder>` using the precedence in [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) (the same logic distil uses, so the index is accurate even before the first distillation):

| Path | What's there |
|------|-------------|
| `<docs-folder>/` | Durable project context — distilled conventions, security boundaries, design choices, and gotchas. Maintained by `/playbook:distil` in small files scoped to one area each. Consult related files before substantive work in the area they cover; they outrank general defaults. |

Explain it's added by convention so future agents find the playbook's output; if the docs folder already holds hand-written docs, note the distilled files live alongside them. Default to keeping it — the developer can drop it in their `ok`/change reply.

**Section 4 — Commands**

_How to run, test, build, lint, and any commands the agent is likely to need. Only those that aren't obvious from the project type._

Read the script definitions (`package.json` scripts, `Makefile` targets, `justfile`, etc.) and propose a shortlist. In chat, ask only about what exists: are any scripts non-obvious in behaviour (needs a running DB, a specific env file), or standard-looking but different here? If none are non-obvious, omit the section.

**Section 5 — Gotchas**

_Non-obvious things that come from human experience: configuration quirks, implicit dependencies, values that look arbitrary but aren't, things that break silently. Highest value-per-word in the file._

You have nothing to propose from the repo here. Ask the developer to draw on lived experience — has anything broken silently, are there values that look arbitrary but have a reason, has anything caught a new developer off guard? If they have nothing concrete, omit the section. Do not press or pad with speculation.

### Phase 3: Self-review

Apply the **Self-review** checklist above.

### Phase 4: Present and confirm

Show the complete assembled draft (all sections in order). Call `AskUserQuestion`: **Write to disk / Edit / Discard**. If they pick Edit, ask what to change in chat, apply, re-present, and ask again. Do not write the file until they pick **Write to disk**.

### Phase 5: Write to disk

Write the approved content to `CLAUDE.md` at the repo root.

---

## Review and update (when CLAUDE.md already exists)

### Phase 1: Read the existing file

Read the current `CLAUDE.md` and assess it against [claude-md-rules.md](./claude-md-rules.md): does it follow the five-section structure, is anything outdated against the repo (dependency changes, new directories, removed scripts), is anything violating the quality rules (too long, padded, decorative)?

### Phase 2: Walk through each section

Go section by section with the developer, applying the interview mechanics above. For each section:
1. Use the same header + italic-blurb opener as the create flow.
2. Quote what the section currently says.
3. Note anything outdated or inconsistent with the current repo, anchored in a specific file or directory.
4. Ask whether anything should be added, removed, or corrected, and close with the conversational confirm (`ok` / change / skip).

If a section that should exist is missing (e.g. no Gotchas but the developer has some when prompted), propose adding it using the create-flow template. If a section doesn't belong (e.g. "Future plans"), point it out and offer to remove it — handle both in that section's conversational confirm.

For the directory index specifically, check whether the scope's durable-context folder is listed. Resolve the docs-folder candidate using [docs-folder-resolution.md](../../shared/docs-folder-resolution.md). If it's missing, propose adding it with the standard description (from create-flow Section 3); default to adding it. A CLAUDE.md written before the playbook landed should be brought up to date this way.

### Phase 3: Self-review

Apply the **Self-review** checklist above to the updated version.

### Phase 4: Present changes

Show what changed — a before/after diff or a clean updated version, whichever is clearer. Call `AskUserQuestion`: **Apply changes / Edit further / Discard**. Do not modify the file until they pick **Apply changes**.

### Phase 5: Apply changes

Write the approved updates to `CLAUDE.md`.
