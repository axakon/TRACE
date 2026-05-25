# adr/

## Purpose

Architecture Decision Records. Discrete decisions with downstream consequences, recorded **immutably** at the moment they are made.

ADRs are the project's structural memory. When a future contributor asks "why is it like this?", an ADR is the canonical answer. Without ADRs, decisions exist only in the heads of whoever made them — and those people leave, change teams, or simply forget.

## What goes here

- Numbered files: `0001-<short-kebab-name>.md`, `0002-<...>.md`, etc., strictly sequential.
- One decision per file.
- Nygard-lite template — minimum sections: **Status**, **Context**, **Decision**, **Consequences**.
- The foundational record `0000-record-architecture-decisions.md` — declares that this project uses ADRs and how. Created once at project setup.

## What does NOT go here

- Active deliberation, alternatives still being weighed → that's [`../working-notes/`](../working-notes/). An ADR captures a *resolved* decision, not the debate that led to it.
- Long-form rationale or essay-style argument → that's [`../reference/`](../reference/). ADRs are minutes; reference docs are essays. If your ADR has grown past two screens, the substance probably belongs in a reference doc that the ADR links to.
- Implementation details, runbooks, how-to guides → those belong in the codebase or a project guide, not here.
- General "thoughts" or unstructured notes — an ADR records exactly one decision.

## Lifecycle

ADRs are **immutable**. The point of the format is that a future reader sees the decision as it stood at the time, with the context that produced it.

- **Never edit a past ADR in place** to change the decision. If course corrects, write a new ADR that supersedes the old one.
- The superseded ADR's `Status:` is updated to `Superseded by <NNNN>` — this is the only allowed in-place edit. The body stays untouched.
- The new ADR's `Status:` is `Accepted`, and its body explains what changed and why.
- Numbers are strictly sequential. Never renumber, never reuse a number for a different decision.

A typical `Status:` line: `Accepted`, `Proposed`, `Superseded by 0007`, or `Deprecated`.

## When to write one

Write an ADR when a decision has consequences a future contributor would want to know about — typically:

- A structural choice (folder layout, module boundaries, naming convention).
- A library, framework, or service selected over alternatives.
- A constraint accepted (latency budget, supported platforms, data retention).
- A pattern declared canonical for a recurring problem.

Do not write one for trivial choices (variable names, formatting), tactical decisions reversed within days, or anything fully captured by the code itself.

## Naming

`<NNNN>-<short-kebab-title>.md` — four-digit zero-padded number, kebab-case title that reads as a noun phrase (e.g., `0007-use-postgres-for-event-storage.md`).
