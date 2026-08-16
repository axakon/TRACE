# TRACE

## What is this

A playbook for AI-first software development. This repo is the workspace where the playbook is researched, synthesized, and written — and the deliverable itself, once it stabilizes. TRACE is a writing project, not a code project: the "build" is markdown synthesis. Every framework-level decision made while working here becomes empirical input for the playbook itself — the project is its own first dogfood example. See `@docs/architecture/overview.md` for the loop.

**If you are an AI agent pointed at this repository to adopt TRACE in a different project:** start at `@deliverable/README.md` — that file is the adopter walkthrough. The rest of *this* file is for agents working on TRACE itself. Different audience, different rules.

## Stack

Writing tooling only:

- Markdown, GitHub-flavored. Mermaid for diagrams, inline in the doc that uses them.
- No build system, no package manager, no tests. Plain files, plain Git. One exception: the plan-viewer bundle under `deliverable/plugins/trace-plan/viewer/` has an npm build — rules in `deliverable/plugins/AGENTS.md`.
- The plugins under `deliverable/plugins/` ship small Node.js scripts; working on them has its own rules in `deliverable/plugins/AGENTS.md`.

## Directory index

| Path | What's there |
|------|-------------|
| `deliverable/` | What adopters consume — the playbook prose, the plugins, the awesome-list, examples. Each folder inside is a deliverable in its own right |
| `deliverable/plugins/` | The four Claude Code plugins — `trace` (core), `trace-plan`, `trace-git`, and the `trace-full` bundle. Read its `AGENTS.md` before working on any of them |
| `docs/` | TRACE applying its own conventions to itself. The READMEs inside describe **conventions**, not TRACE-specific facts, so adopters can copy the structure verbatim |
| `scripts/` | Repo-level maintenance. `sync-shared.js` propagates the shared instruction files that cross a plugin boundary |
| `CHANGELOG.md` | One changelog for all four plugins — they share a version and ship together |

```
docs/
├── system/         ← what the code does today (updated as code changes)
├── architecture/   ← what the system must do + the structural overview
├── adr/            ← framework decisions (immutable once shipped)
├── reference/      ← long-form rationale (append-only)
└── working-notes/  ← research; NOT authoritative — rules live in architecture/ + adr/
```

Entry points: what TRACE is, the four-phase playbook hypothesis, the self-feeding loop → `@docs/architecture/overview.md`. The funnel of written knowledge → `@docs/README.md`. Each folder has its own `README.md` describing what belongs there — read it before writing into that folder.

## Commands

No build, test, or lint commands — the "build" is markdown synthesis, verified by reading. Commands for exercising the plugins locally and the release loop are in `deliverable/plugins/AGENTS.md`.

## Gotchas

- NEVER pre-author content. Don't fill empty playbook stubs, don't draft reference docs from notes that are still moving, don't author skills before the friction has been felt.
- NEVER promote a working note to `reference/` or `playbook/` without explicit go-ahead. Promotion is a deliberate act, not a cleanup pass. A note is promoted only when its opinions stop moving; the original note stays as a frozen record, not deleted.
- NEVER write architectural rationale, domain explanations, or long examples directly into this AGENTS.md. Pointers go here; content goes in the linked file.
- Framework-level decisions (a structural choice, a recommendation, a deferred question resolved) are recorded as ADRs in `docs/adr/` **as part of the same change**. Don't make one in conversation without writing it up, and don't defer the ADR.
- Playbook layout is flat numbered files: `deliverable/playbook/01-assess.md`, `02-document.md`, `03-equip.md`, `04-operate.md`. Don't create a phase file until that phase has real, synthesized content.
- Before non-trivial edits (promoting a note, drafting a playbook section, writing an ADR): read `docs/architecture/overview.md` and the relevant working note(s). If the change crosses files (e.g. a new ADR that affects an existing playbook section), update both in the same change — drift is caught at decision time, not retroactively.
