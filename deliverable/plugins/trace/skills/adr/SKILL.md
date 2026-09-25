---
name: "adr"
description: "Record an architecture decision as a lightweight, immutable ADR in the scope's docs folder. Owns the ADR template, numbering, and write. Invokable directly for a direct-path decision, or by /trace:spec at handoff."
argument-hint: "[short decision title]"
allowed-tools: "Glob Read Write AskUserQuestion"
---

Use Claude Code’s Read, Glob, Write, and Edit tools for file operations. Use AskUserQuestion for closed choices and normal chat for open questions. Invoke referenced skills with the Skill tool. Resolve script paths from this installed skill; respect the session’s permissions.


You are recording an architecture decision as an ADR — a short, immutable record of a single significant choice. An ADR captures *why this, over the alternatives*; it is not edited after it lands (a later change of course is a new ADR that supersedes it).

Before doing anything, read [adr-criteria.md](../../shared/adr-criteria.md) (the bar, for Phase 2) and [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) (folder lookup, for Phase 3). You'll read [adr-template.md](./adr-template.md) and [authoring-rules.md](../../shared/authoring-rules.md) in Phase 4, only if the decision clears the bar.

## Phase 1: Establish the decision

Find the decision you are recording.

- **Invoked by /trace:spec, or mid-conversation:** the decision is in the conversation — the approved plan and the discussion. Use that. Do not re-interview from scratch.
- **Invoked directly with an argument** (`/trace:adr "use Redis for sessions"`): use `$ARGUMENTS` as the working title.
- **Invoked bare:** ask one open question — "What decision do you want to record?" — and wait for the answer.

## Phase 2: Check it warrants an ADR

Apply [adr-criteria.md](../../shared/adr-criteria.md), hard gate first. If the decision doesn't clear it, say so and point the developer to `/trace:distil` — don't write a low-value ADR.

If an existing ADR covers the same ground, this is likely a **supersession** (Phase 5), not a new standalone record.

## Phase 3: Resolve the target folder and next number

Resolve the scope's docs folder using [docs-folder-resolution.md](../../shared/docs-folder-resolution.md). ADRs live in `<docs-folder>/adr/`.

List `<docs-folder>/adr/*.md`. The next number is the highest existing four-digit prefix plus one, zero-padded to four digits (`0001`, `0002`, …). If the folder is empty or absent, start at `0001`.

## Phase 4: Draft the ADR

Fill the [adr-template.md](./adr-template.md) sections — Context, Decision, Consequences — from what you know, then confirm the gaps with the developer. [example-adr.md](./example-adr.md) shows the target depth: a few sentences per section, alternatives as prose inside Context. The rationale and the alternatives considered are the point of an ADR; if the conversation didn't make them explicit, ask. Record the decision and its rationale, not the mechanism the code and plan already document. Apply [authoring-rules.md](../../shared/authoring-rules.md): plain prose, only what was actually decided, no padding.

Choose a kebab-case `<short-title>` slug. The filename is `<NNNN>-<short-title>.md`.

Show the developer the drafted ADR and its target path. Wait for explicit approval. Apply edits if requested.

## Phase 5: Write (and supersede, if applicable)

Write the approved ADR to `<docs-folder>/adr/<NNNN>-<short-title>.md`. Create the ADR directory if it does not exist.

If this ADR supersedes an earlier one:
- In the new ADR's Context, name the one it supersedes (e.g. "Supersedes 0003.").
- Add a `> Superseded by {NNNN}.` line under the **old** ADR's title — the only permitted edit to an existing ADR. Show the developer this edit and confirm before applying it.

## Notes

- ADRs become immutable **once shipped** (merged to the default branch, usually `main` or `master`). The skill writes ADRs at end-of-work, so treat the body as final once written. Change it before the merge only when the developer or a reviewer asks. Course corrections are a *new* ADR that supersedes the old one.
- This skill does not mark the docs folder as the durable-context folder and does not touch the directory index — those are `init`/`distil`/`agents-md-setup` concerns. ADRs are discoverable through the docs-folder entry those skills maintain.
- One ADR per decision. If the work settled several distinct decisions, record them as separate ADRs.

When to use: When an *architecturally significant* decision has been made — one affecting the system's structure, non-functional characteristics, a foundational dependency, a public interface, or a reused construction technique, with a real choice between alternatives. Spec-workflow invokes this at handoff when a planning decision qualifies; a developer can invoke it directly too. Not for a choice localized to one feature or module, a conventional default, or a routine/cheap-to-reverse implementation choice — route those to /trace:distil.
