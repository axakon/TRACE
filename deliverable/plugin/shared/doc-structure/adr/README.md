# adr/

## Purpose

Architecture Decision Records. One record per decision, with downstream consequences, **immutable once shipped**.

ADRs are the project's structural memory. When a future contributor asks "why is it like this?", an ADR is the canonical answer.

## What goes here

- Numbered files: `0001-<short-kebab-name>.md`, `0002-<...>.md`, etc., strictly sequential.
- One decision per file.
- Three sections, in order: **Context** (the forces in tension, alternatives considered), **Decision** (what we will do, in active voice), **Consequences** (what becomes easier, what becomes harder).
- No `Status` field. A shipped ADR is accepted by definition; an unshipped one is still being edited. Supersession adds a `> Superseded by <NNNN>.` line under the title — the only edit allowed on a shipped ADR.
- The foundational record `0000-record-architecture-decisions.md` declares that this project uses ADRs and how. Created once at project setup.

## What does NOT go here

- Active deliberation, alternatives still being weighed → [`../working-notes/`](../working-notes/). An ADR captures a *resolved* decision, not the debate that led to it.
- Long-form rationale or essay-style argument → [`../reference/`](../reference/). ADRs are short minutes; reference docs are full essays. If your ADR has grown past two screens, the substance probably belongs in a reference doc that the ADR links to.
- Implementation details, runbooks, how-to guides → those belong in the codebase or a project guide, not here.
- General "thoughts" or unstructured notes — an ADR records exactly one decision.

## Lifecycle

ADRs become **immutable once shipped**. Two phases:

- **Draft (local, unpushed, no one has acted on it).** Edit freely. Reshape the framing, fix mistakes, sharpen the wording. The ADR is not yet a record anyone else relies on, and a tidy revised version is more useful than a `0001 + 0002 (supersedes 0001)` pair where both are one day old.
- **Shipped (committed, pushed, or already acted on by other work).** Immutable. A future reader needs to see the decision as it stood when it was made; downstream commits, ADRs, and implementations may quote or rely on its exact wording. From here on, course corrections are a *new* ADR that supersedes the old one.

The rule of thumb: if anyone else has had reason to read this ADR, treat it as shipped.

When superseding a shipped ADR:

- Add a `> Superseded by <NNNN>.` line under the **old** ADR's title — the only permitted edit to a shipped ADR. The body stays untouched.
- The new ADR's body explains what changed and why, and references the superseded one by number in its Context.
- Numbers are strictly sequential. Never renumber, never reuse a number for a different decision.

## When to write one

Write an ADR when a decision has consequences a future contributor would want to know about — typically:

- A structural choice (folder layout, module boundaries, naming convention).
- A library, framework, or service selected over alternatives.
- A constraint accepted (latency budget, supported platforms, data retention).
- A pattern declared canonical for a recurring problem.

Do not write one for trivial choices (variable names, formatting), tactical decisions reversed within days, or anything fully captured by the code itself.

## Naming

`<NNNN>-<short-kebab-title>.md` — four-digit zero-padded number, kebab-case title that reads as a noun phrase (e.g., `0007-use-postgres-for-event-storage.md`).
