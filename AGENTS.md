# TRACE

A playbook for AI-first software development. This repo is the workspace where the playbook is researched, synthesized, and written — and the deliverable itself, once it stabilizes.

## How this project works

TRACE is a writing project, not a code project. The "build" is markdown synthesis. Every framework-level decision made while working here becomes empirical input for the playbook itself — the project is its own first dogfood example. See `@docs/architecture/overview.md` for the loop.

## Stack (writing tooling only)

- Markdown, GitHub-flavored. Mermaid for diagrams, inline in the doc that uses them.
- No build system, no package manager, no tests. Plain files, plain Git.

## Conventions

- **Working notes** live in `docs/working-notes/` and use a `Status:` header (`Research note` / `Stabilizing` / `Promoted`), plus `Resolved` and `Open questions` sections.
- **Decisions** about the framework are recorded as ADRs in `docs/adr/` using the lightweight Nygard template (Context / Decision / Consequences). Don't make a framework-level decision in conversation without writing it up.
- **Promotion lifecycle:** working note → reference doc → playbook section. A note is promoted only when its opinions stop moving. The original note stays as historical substrate, frozen.
- **Playbook layout** is flat numbered files: `docs/playbook/01-assess.md`, `02-document.md`, `03-equip.md`, `04-operate.md`. Do not create a phase file until that phase has real, synthesized content.

## Guardrails

- NEVER pre-author content. Don't fill empty playbook stubs, don't draft reference docs from notes that are still moving, don't author skills before the friction has been felt.
- NEVER promote a working note to `reference/` or `playbook/` without explicit go-ahead. Promotion is a deliberate act, not a cleanup pass.
- NEVER write architectural rationale, domain explanations, or long examples directly into this AGENTS.md. Pointers go here; content goes in the linked file.
- When making a framework-level decision (a structural choice, a recommendation, a deferred question resolved), write the ADR as part of the same change. Don't defer it.

## When to read what

- What TRACE is, the four-phase playbook hypothesis, the self-feeding loop:
  → `@docs/architecture/overview.md`
- Framework-level decisions and their rationale:
  → `@docs/adr/README.md`
- Research substrate (notes still moving, with open questions):
  → `@docs/working-notes/`
- Long-form rationale promoted from working notes:
  → `@docs/reference/`
- The deliverable prose (imperative how-to, by phase):
  → `@docs/playbook/`
- Onboarding skills authored for adopting teams (v1 deliverable):
  → `@onboarding/`
- Curated external skills, MCP servers, and rules:
  → `@awesome-list/`
- Example projects applying the framework:
  → `@examples/`

## When making non-trivial edits

Before promoting a note, drafting a playbook section, or writing an ADR: read `docs/architecture/overview.md` and the relevant working note(s). If the change crosses files (e.g., a new ADR that affects an existing playbook section), update both as part of the same change — drift is caught at decision time, not retroactively.
