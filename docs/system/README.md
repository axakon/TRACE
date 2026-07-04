# system/

## Purpose

Notes about what your code does today. One file per area — your database, your auth, your API — so a new teammate (or an AI assistant) can get up to speed without reading every file.

If you're working in an area that has a file here, trust it. It's the most accurate picture of how things actually work.

## What goes here

- One file per meaningful area of the codebase, kebab-case filename (`database.md`, `security.md`, `api-conventions.md`, `kafka-events.md`).
- Concise prose. State conventions, name files and modules, link to the code. Do not restate what the code already documents.
- A short heading per topic, followed by the facts a reader needs to act correctly in that area.

## What does NOT go here

- Rationale for *why* the system looks this way → that's [`../adr/`](../adr/) (the decision) or [`../reference/`](../reference/) (the long-form argument). System docs record the *resulting convention*; they do not restate the reasoning.
- Active deliberation, alternatives being weighed → [`../working-notes/`](../working-notes/).
- The structural model of the whole system → [`../architecture/`](../architecture/).
- Aspirational, planned, or speculative content. Files here describe what *is*, not what *will be*.
- Implementation details the code itself documents. If you can read the function and know, the doc doesn't need to repeat it.

## Lifecycle

Files here are **updated as the code changes**. Unlike process docs (`adr/`, `working-notes/`, `reference/`) which are append-only or immutable, system docs track moving reality.

- A change that introduces a new convention, security boundary, or pattern produces an update here — usually via `/playbook:distil` at the end of the change.
- A change that invalidates an existing file (the auth library swapped, the schema migrated) requires the file to be corrected in the same change. Stale system docs are worse than missing ones.
- Files are not renamed when their topic narrows or broadens; instead, split or merge deliberately when the scope shifts.

## Naming

`<topic>.md` in kebab-case. Use the project's own vocabulary — if the codebase calls it "the gateway," the file is `gateway.md`, not `api-gateway.md`. Scope each file to one meaningful concept: not so narrow they fragment (`that-blue-button.md` is wrong), not so broad they become a dump (`misc.md` is wrong).

## Reading order

Agents do not read this folder front-to-back. Before substantive work in an area, read the relevant scoped file:

- Touching auth, sessions, tokens, or anything trust-related → `security.md` (or whatever scoped file covers the area)
- Touching the API surface, request handling, or external interfaces → `api-conventions.md` (or equivalent)
- Touching the data layer, schema, or persistence → `database.md` (or equivalent)

If multiple files seem related, read them all — files here are kept short specifically so reading several is cheap.
