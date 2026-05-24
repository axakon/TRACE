# Playbook

The deliverable: a phased, imperative, scannable guide for implementing AI in software projects.

## Layout

Flat numbered files, one per phase:

- `01-assess.md` — understand the project (brownfield: reverse-engineer; greenfield: capture intent)
- `02-document.md` — produce the artifacts AI needs to work effectively
- `03-equip.md` — set up the tooling layer (skills, MCP servers, rules, repo conventions)
- `04-operate.md` — day-to-day: starting tasks, reviewing output, handling failure modes, keeping docs in sync

Brownfield is the default path; greenfield is handled as called-out variations within each phase.

## Authoring discipline

Phase files are not created until the phase has real, synthesized content drawn from `docs/reference/` and `docs/adr/`. Do not draft from a working note that is still moving. Do not stub an empty phase file as a placeholder — empty folders are intentional.

This folder is currently empty.
