# 0001. Separate descriptive, prescriptive, and historical docs

*2026-05-25*

## Context

Three different kinds of writing about a project keep ending up in the same `docs/` folder, with no clear separation:

- **Descriptive** — what the codebase *is* right now. The plugin's `scaffold-docs` and `distil` produce these as flat topic files (`database.md`, `security.md`, `api-conventions.md`). Updated as the code changes; readers treat them as live truth.
- **Prescriptive** — what the system *must do*. Integration specs and operational rules: "MUST refresh the bearer token every 5 minutes," "endpoint X MUST be retried with exponential backoff." Distilled from references, ADRs, external API contracts, business rules, compliance requirements, or post-incident learnings. Updated when the rules change.
- **Historical** — how decisions were made and why. ADRs record the decisions; reference docs hold the long-form argument; working notes capture in-progress thinking. Append-only or immutable, frozen at the time of writing.

Mixing them confuses readers because they have different update semantics and serve different purposes. A reader looking at "current rules I have to follow" needs to know the doc is live and authoritative; a reader looking at "what the code currently does" needs to know it tracks reality; a reader looking at "why we chose this" needs to know it's frozen at a moment in time.

Alternatives considered:

1. **Flat with naming convention** — all docs at the `docs/` root, distinguished by name. Confusing as the folder grows; readers can't tell at a glance what kind of doc they're looking at.
2. **Two categories — descriptive vs. process** — what was originally proposed in an earlier draft of this ADR. Doesn't accommodate prescriptive specs as a distinct kind, and conflates "rules the system must satisfy" with "rationale for why."
3. **Three categories with subfolders** — descriptive in `system/`, prescriptive in `architecture/`, historical in `adr/` + `reference/` + `working-notes/`. Each category is visually distinct and its update semantics are unambiguous.

## Decision

We will organize `docs/` into three categories by what kind of knowledge each file holds:

- **Descriptive** → `<docs-folder>/system/`. What the codebase IS. Updated as code changes.
- **Prescriptive** → `<docs-folder>/architecture/`. What the system MUST do. Operational rules and integration specs in imperative (MUST / MUST NOT / SHOULD) voice, plus the structural `overview.md`. Updated when requirements change.
- **Historical** → `<docs-folder>/adr/`, `<docs-folder>/reference/`, `<docs-folder>/working-notes/`. Decisions, rationale, and research. Append-only or immutable; supersede rather than rewrite.

The plugin's `scaffold-docs` and `distil` write descriptive files into `<docs-folder>/system/`. The playbook (phase 1) directs adopters to author prescriptive specs in `architecture/` as integration contracts and operational rules emerge. ADRs and reference docs remain in their existing folders with their existing semantics.

`architecture/` and `system/` use parallel filenames — `architecture/api.md` is the rules the API client must satisfy; `system/api.md` is the description of what the client looks like in code. Readers move between the two for the same area.

## Consequences

Three distinct categories give readers an unambiguous answer to "what kind of doc am I looking at?" — current state, current rules, or frozen history. Each has its own update semantics, so writers know when to revise in place vs. append vs. supersede.

The `architecture/` folder gains a real job. Before this decision, it was vaguely "the system-level overview" with no sole purpose; now it holds operational rules in MUST voice alongside the structural map (`overview.md`). It is *prescriptive living* — distinct from descriptive living (system/) and from historical (adr/, reference/, working-notes/).

The plugin's mental model is unchanged at the implementation level: `scaffold-docs` and `distil` already write descriptive docs (now into `system/`). The plugin does not write to `architecture/`; adopters or future skills do. A skill for scaffolding architecture spec files becomes a future possibility, not part of this decision.

For existing plugin installations, no migration: descriptive files at the docs-folder root stay where they are; new descriptive files go to `system/`; `architecture/` is created the first time an adopter or future skill writes there.

Downstream: the playbook's phase 1 ("Assess") produces the three-folder structure as the canonical doc tree adopters create. Phase 2 ("Document") populates `system/` and `architecture/` with starter content. The reference-doc-structure deliverable mirrors the same three-category layout so adopters can copy the convention wholesale.
