# playbook/

## Purpose

The deliverable. A phased, imperative, scannable guide for implementing AI in software projects. This is what adopters of TRACE read and follow to bootstrap their own repository.

## What goes here

Flat numbered files, one per phase:

- `01-assess.md` — understand the project. Brownfield: reverse-engineer. Greenfield: capture intent.
- `02-document.md` — produce the artifacts AI needs to work effectively.
- `03-equip.md` — set up the tooling layer (skills, MCP servers, rules, repo conventions).
- `04-operate.md` — day-to-day: starting tasks, reviewing output, handling failure modes, keeping docs in sync.

Brownfield is the default path. Greenfield is handled as called-out variations within each phase, not a separate document.

Each phase file follows a consistent shape: **Why this matters** (short, for humans) → **Preconditions** → **Done when** (artifact-based, so an agent can resume) → **Agent instructions** (imperative steps) → **Variations** (greenfield, monorepo, etc.).

## What does NOT go here

- Rationale, tradeoffs, or "why we chose this approach" prose → that's [`../../docs/reference/`](../../docs/reference/). The playbook links back; it does not duplicate.
- Decision records → [`../../docs/adr/`](../../docs/adr/).
- Active research or alternatives still being weighed → [`../../docs/working-notes/`](../../docs/working-notes/).
- Empty stub files. A phase file does not exist until its content does. **Empty folders are intentional.**

## Authoring discipline

Phase files are created only when the phase has real, synthesized content drawn from `../../docs/reference/` and `../../docs/adr/`. Do not draft from a working note that is still moving. Do not stub an empty phase file as a placeholder.

Promotion path into this folder:

```
docs/working-notes/   →   docs/reference/ (+ docs/adr/)   →   deliverable/playbook/<NN>-<phase>.md
```

A playbook section is the distilled output of one or more stabilized reference docs. It is the **last** thing written about a phase, not the first.

## Conventions

- Imperative voice. "Do X." Not "you might want to do X" or "we recommend X."
- Each section short enough to be scannable. Long arguments belong in `../../docs/reference/`, linked.
- Every non-obvious instruction links back to the reference doc or ADR that justifies it.
- Variations are called out inline, not split into separate documents.

## Current contents

This folder is currently empty. Phase files will appear as their content stabilizes.
