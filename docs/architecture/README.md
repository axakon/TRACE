# architecture/

## Purpose

The system-level picture of this project: what it is, how its major pieces fit together, what hypothesis or model the design is built around. The first thing a new contributor should read.

## What goes here

- `overview.md` — the canonical entry point. Purpose, top-level structure, the model the project is organized around.
- Additional architecture docs only when they describe a *structural* aspect that doesn't fit in `overview.md` (e.g., a diagram of how data flows, a model of the system's lifecycle).
- Diagrams (Mermaid inline) co-located with the doc that uses them. Shared diagrams graduate to a `diagrams/` subfolder only when used by 2+ docs.

## What does NOT go here

- Rationale for a specific decision → that's an ADR in [`../adr/`](../adr/) or a reference doc in [`../reference/`](../reference/).
- Active thinking or research → [`../working-notes/`](../working-notes/).
- Implementation guides or how-to → those belong elsewhere (a project guide, a runbook, or the codebase itself).

## Conventions

- Architecture docs are revised in place when the system's shape changes. They are not append-only.
- When a structural change is made, the ADR recording the decision links back here, and this folder is updated in the same commit.
- Keep prose tight. If a section grows long enough to become a self-contained essay, it likely belongs in `reference/` and should be linked from here.
