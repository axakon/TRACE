# examples/

## Purpose

Projects where the TRACE framework has been applied. Each example shows the structure in real use — `AGENTS.md`, `docs/architecture/overview.md`, `docs/adr/`, folder READMEs — populated for a concrete codebase. Adopters read examples to see what "done" looks like.

## What goes here

- A folder per example, named after the project.
- Inside each example folder: a `README.md` describing what kind of project it is (greenfield/brownfield, language, scale), which playbook phases shaped it, and what to look at first.
- Either a full copy of the example repo's TRACE-touched files, or a link to the actual repo if it's public.
- Notes on what *didn't* work — variations, departures from the playbook, lessons learned. The diff between the playbook and reality is the most useful part.

## What does NOT go here

- The playbook prose → [`../playbook/`](../playbook/). Its rationale → [`../../docs/`](../../docs/).
- The plugin source → [`../plugins/`](../plugins/).
- Third-party resources → [`../awesome-list/`](../awesome-list/).
- Fictional or aspirational examples — only real applications.

## Conventions

- One folder per example. No mixing.
- Each example's README links back to the playbook phases it exercised, so a reader can follow the trail.
- Examples are added as the playbook is applied to real customer and internal projects. They are not pre-fabricated to fill the folder.

## Index

- **TRACE itself** — the minimum dogfooded structure. See the repo root. The repository you are reading right now is itself the first example.

_(more to come)_
