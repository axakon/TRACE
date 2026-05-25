# TRACE — Architecture Overview

## What TRACE is

TRACE is a curated, opinionated playbook for how to implement AI in software projects, plus the supporting research, examples, and tooling that make the playbook adoptable.

The deliverable is a Git repository. A team clones it, follows the Quick Start, and runs the onboarding skill in their own codebase — within ~30 minutes they have an `AGENTS.md`, an architecture overview, and an ADR scaffold committed. The playbook (and the reference layer behind it) is what they read afterwards, when real work generates real questions.

## The four-phase playbook (working hypothesis)

1. **Assess** — understand the project. Brownfield: reverse-engineer reality. Greenfield: capture intent.
2. **Document** — produce the artifacts AI needs to work effectively. Same artifacts in both cases; different production methods.
3. **Equip** — set up the tooling layer (skills, MCP servers, rules, repo conventions).
4. **Operate** — the ongoing day-to-day. Starting tasks, reviewing AI output, handling failure modes, keeping docs in sync.

Brownfield is the default path; greenfield is handled as called-out variations within each phase.

## Repo layout — deliverable vs. workshop

The repo is split in two:

- **`deliverable/`** — what adopters consume. `playbook/` (the prose), `plugin/` (the Claude Code plugin), `awesome-list/` (curated third-party resources), `examples/` (TRACE applied to real projects).
- **`docs/`** — the workshop. TRACE applying its own conventions on itself. Working notes, reference rationale, ADRs, and the architecture overview you are reading now. The READMEs inside `docs/` are generic — describing the convention an adopter is following — so they double as templates.

The reference layer (`docs/reference/`) holds the rationale behind every playbook step; each `deliverable/playbook/<phase>.md` links back to the reference doc(s) and ADR(s) that justify it.

The v2 accelerator skills (skills that walk Claude through implementing the playbook itself) will live in `deliverable/plugin/` when authored.

## The self-feeding loop

TRACE is built using the same AI-first practices it advocates. Every friction observed while working here is empirical input for the framework. The loop:

```
work on TRACE (with Claude)
    ↓ friction / decision observed
captured as a working note in docs/working-notes/, distilled into an ADR
    ↓ periodic synthesis pass
promoted into docs/reference/ (rationale) and deliverable/playbook/ (imperative steps)
    ↓
shipped to adopting teams via the deliverable/ folder
    ↓
their feedback returns as new working notes — loop continues
```

The lifecycle is visible on disk:

1. **`docs/working-notes/`** — research substrate. The `Status:` header signals stage (`Research note` → `Stabilizing` → `Promoted`).
2. **`docs/adr/`** — structured decision capture. The friction log. Decisions only; raw observations stay in working notes.
3. **`docs/reference/`** — rationale extracted from a stabilized note. The note is frozen, not deleted.
4. **`deliverable/playbook/`** — imperative how-to extracted from `reference/`. Each section links back to its reference doc(s) and ADR(s).

## Conventions that override defaults

- **Don't pre-author.** Empty folders are intentional. Files emerge from real work, not speculation. This applies recursively — to the playbook (don't draft phase 4 before phase 1 has content), to skills (don't author one before the friction has been felt twice), to reference docs (don't write rationale until the underlying opinion stops moving).
- **AGENTS.md is canonical.** `CLAUDE.md` is a one-line forwarder (`@AGENTS.md`). Same convention TRACE recommends to adopting teams.
- **Markdown only.** No build, no toolchain. The repo browses on GitHub as-is.
- **Mermaid for diagrams.** Inline in the doc that uses them. Shared diagrams (used by 2+ docs) graduate to `docs/architecture/diagrams/` if and when that bar is met.

## Recursive structure — why TRACE looks like what it advocates

The proposed structure (`AGENTS.md` + `docs/architecture/overview.md` + `docs/adr/`) is recursive: it applies at every level of nesting. TRACE itself uses it at the root. If TRACE's structure ever fails on TRACE — e.g., the minimum is too heavy, or pointers stop resolving cleanly — that's empirical evidence the recommendation needs to change.

This is the project's strongest feedback signal. Don't suppress it.

## Evolution state

v1 in progress. Research notes are maturing toward the first stabilized opinions. Playbook prose has not yet been written; the reference layer is empty. The minimum dogfooded structure is in place. Onboarding skills, the awesome-list, and examples are scaffolded but not populated.

v2 (deferred): accelerator skills authored from the finished playbook.
