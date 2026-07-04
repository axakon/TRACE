# Durable project context

This folder holds the project's durable context — distilled, persistent knowledge that should outlive any single change. It is intentionally placed in the project's regular documentation folder so developers and agents find it under the same familiar path.

The folder is organized into three categories by what kind of knowledge each file holds:

- **Descriptive** — what the codebase *is* right now. Lives in `system/`. Updated as code changes.
- **Prescriptive** — what the system *must* do. Lives in `architecture/`. Operational rules in MUST / MUST NOT / SHOULD voice; updated as rules change.
- **Historical** — how decisions were made and why. Lives in `adr/` (decisions), `reference/` (rationale), and `working-notes/` (research). Append-only or immutable.

The three categories have different update semantics, and an agent needs to know which kind it is reading before it can use the file.

## How to consult this folder

Files in `system/` and `architecture/` are binding context — meant to be read by agents working anywhere in the codebase, not just inside the folder. Before substantive work in a given area, read the relevant scoped files:

- Touching auth, sessions, tokens, or anything trust-related → read `system/security.md` for what exists, and `architecture/security.md` (if present) for the rules.
- Touching the API surface, request handling, or external interfaces → read `system/api-conventions.md` and `architecture/api-conventions.md` (if present).
- Touching the data layer, schema, or persistence → read `system/data-model.md` and `architecture/data-model.md` (if present).

If a file scoped to your current area exists, treat its contents as binding. Rules in `architecture/` outrank training-data assumptions and general defaults; descriptions in `system/` outrank training-data assumptions about how the code is laid out. If multiple files seem related, read them all — files here are kept short specifically so reading several is cheap.

## What `/playbook:distil` writes here

`/playbook:distil` routes each distilled candidate to one of two destinations based on what kind of knowledge it is:

- **Descriptive** (the default) → `system/<topic>.md`. Conventions in force, durable design choices, non-obvious gotchas, security boundaries observed in the code.
- **Prescriptive** → `architecture/<topic>.md` (only if `architecture/` exists in the project). Operational rules in MUST voice — typically distilled from an ADR's consequence, an external contract, a compliance requirement, or a post-incident learning.

New files always land under `system/` or `architecture/`. Files that already live at the folder root (from earlier versions of the plugin) are updated at their existing path — no forced migration.

## What `/playbook:distil` does not write here

- Implementation details that the code itself documents.
- Information already in the root `AGENTS.md` (this folder supplements it, does not duplicate it).
- Decision rationale and alternatives considered — those go in an immutable ADR under `adr/`, written by `/playbook:adr`. `system/` files record the *resulting convention*; `architecture/` files record the *resulting rule*; ADRs record *why it was chosen*.
- Long-form rationale — that's `reference/` (if the project uses it).
- Aspirational or speculative content — only describe current state.

## File naming

Files scoped to a meaningful concept: `security.md`, `data-model.md`, `kafka-events.md`, `api-conventions.md`. Not so narrow they fragment the context (no `that-blue-button.md`), not so broad they become a dump (`misc.md`).

When the same area has both descriptive and prescriptive content, **use the same filename in both folders**: `system/api.md` describes the API client; `architecture/api.md` constrains it. Readers move between them for the same area.
