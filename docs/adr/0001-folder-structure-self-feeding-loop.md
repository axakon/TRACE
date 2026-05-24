# 0001 — Folder Structure and Self-Feeding Loop

**Status:** Accepted
**Date:** 2026-05-10

## Context

TRACE needs a folder structure that does two jobs at once: house the deliverable (playbook, reference, awesome-list, examples, onboarding skills) and dogfood the same documentation pattern TRACE recommends to adopting teams, so every decision made while building the framework becomes empirical input for it.

This decision was synthesized from [proposed-doc-structure.md](../working-notes/proposed-doc-structure.md), with supporting input from [agents-md-contents.md](../working-notes/agents-md-contents.md). Several open choices needed resolution: how aggressively to dogfood, where research notes vs deliverable prose live, how to lay out the playbook, and where decisions get captured.

Before this decision, the repo had only a `README.md`, two loose working notes, and empty `examples/` and `awesome-list/` folders.

## Decision

Adopt the following structure:

- `AGENTS.md` + `CLAUDE.md` + `docs/architecture/overview.md` + `docs/adr/` — the minimum dogfooded structure from `proposed-doc-structure.md`, applied to TRACE itself.
- `docs/working-notes/` → `docs/reference/` → `docs/playbook/` — single-tree, status-driven lifecycle. Promotion is a deliberate act; the original note is preserved as historical substrate.
- `docs/adr/` is the only structured decision log. Raw observations and open questions stay inside working notes.
- Playbook layout is flat numbered files (`01-assess.md`, `02-document.md`, `03-equip.md`, `04-operate.md`). Phase files are not created until that phase has real, synthesized content — no placeholder stubs.
- Onboarding skills (v1 deliverable) live in `onboarding/` at the repo root, separate from `.claude/skills/` (TRACE-internal helpers used while building TRACE).
- The awesome-list and examples remain at their existing top-level locations (`awesome-list/`, `examples/`).

The self-feeding loop runs: work on TRACE → friction observed → captured in `docs/working-notes/` and distilled into an ADR → periodic synthesis pass → promoted into `docs/reference/` and `docs/playbook/` → shipped to adopting teams → feedback returns as new working notes.

## Consequences

- Every framework-level decision becomes empirical input for the playbook itself; the structure stress-tests itself on TRACE before adopting teams hit it.
- The lifecycle (note → reference → playbook) is visible on disk, making promotion a deliberate, reviewable act rather than implicit drift.
- AGENTS.md stays short because pointers do the work; the don't-pre-author guardrail is encoded explicitly so empty folders remain intentional.
- Onboarding-skill placement at the root signals "deliverable surface" while TRACE-internal skills stay under `.claude/skills/`. A skill's graduation from internal to deliverable becomes an explicit, reviewable move.
- Cost: a small upfront ceremony (root files, ADR overhead) and a continuous discipline against pre-authoring. Mitigated by guardrails in `AGENTS.md` and a drift check at every decision.
- Follow-on: when the next architectural choice arrives, an ADR is written as part of the same change. No retroactive drift-cleanup passes.
