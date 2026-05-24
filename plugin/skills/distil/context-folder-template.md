# CLAUDE.md (template for a scope's durable-context folder)

This template is written verbatim into `<scope>/<docs-folder>/CLAUDE.md` the first time the distil skill writes a file into that folder. The default `<docs-folder>` is `docs/` at the scope root; future versions of the playbook will let the developer pick a different folder per scope, and this template applies wherever the folder ends up.

---

# Durable project context

This folder holds the project's durable context — distilled, persistent knowledge that should outlive any single change. It is intentionally placed in the project's regular documentation folder so developers and agents find it under the same familiar path.

## How to consult this folder

Files in this folder are meant to be read by agents working anywhere in the codebase, not just inside the folder. Before substantive work in a given area, read the relevant scoped file:

- Touching auth, sessions, tokens, or anything trust-related → read `security.md` (or whatever scoped file covers the area)
- Touching the API surface, request handling, or external interfaces → read `api-conventions.md` (or equivalent)
- Touching the data layer, schema, or persistence → read `data-model.md` (or equivalent)

If a file scoped to your current area exists, treat its contents as binding. They outrank general defaults and training-data assumptions. If multiple files seem related, read them all — these files are kept short specifically so reading several is cheap.

## What `/playbook:distil` writes here

- Conventions future work should follow
- Security and trust boundaries
- Durable design choices and the constraints they imply
- Non-obvious gotchas that span multiple changes

## What `/playbook:distil` does not write here

- Implementation details that the code itself documents
- Information already in the root `CLAUDE.md` (this folder supplements it, not duplicates it)
- Decision rationale and alternatives considered — those go in an immutable ADR under `adr/`, written by `/playbook:adr`. Distilled files record the *resulting convention*; ADRs record *why it was chosen*
- Aspirational or speculative content — only describe current state

The `adr/` subfolder holds the project's architecture decision records. The folder may also contain other documentation the team maintains by hand (architecture notes, runbooks). All of these coexist with the distilled context; this `CLAUDE.md` describes the distilled files specifically.

## File naming for distilled files

Files written by distil should be scoped to a meaningful concept: `security.md`, `data-model.md`, `kafka-events.md`, `api-conventions.md`. Not so narrow they fragment the context (no `that-blue-button.md`), not so broad they become a dump.
