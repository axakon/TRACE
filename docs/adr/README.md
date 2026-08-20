# adr/

> Canonical adopter copy: [`deliverable/playbook/reference-doc-structure/docs/adr/`](../../deliverable/playbook/reference-doc-structure/docs/adr/).

## Purpose

Architecture Decision Records. One record per decision, with downstream consequences, **immutable once shipped**.

ADRs are the project's structural memory. When a future contributor asks "why is it like this?", an ADR is the canonical answer.

## What goes here

- Dated files: `<YYYY-MM-DD>-<short-kebab-name>.md`, using the day you wrote the record. Older projects also hold `0001-<...>.md` files from the earlier sequential scheme. Both forms are valid, and one folder can carry a mix.
- One decision per file.
- Three sections, in order: **Context** (the forces in tension, alternatives considered), **Decision** (what we will do, in active voice), **Consequences** (what becomes easier, what becomes harder).
- No `Status` field. A shipped ADR is accepted by definition; an unshipped one is still being edited. Supersession adds a `> Superseded by <filename without .md>.` line under the title — the only edit allowed on a shipped ADR.
- The foundational record `<YYYY-MM-DD>-record-architecture-decisions.md` declares that this project uses ADRs and how. Created once at project setup.

## What does NOT go here

- Active deliberation, alternatives still being weighed → [`../working-notes/`](../working-notes/). An ADR captures a *resolved* decision, not the debate that led to it.
- Long-form rationale or essay-style argument → [`../reference/`](../reference/). ADRs are short minutes; reference docs are full essays. If your ADR has grown past two screens, the substance probably belongs in a reference doc that the ADR links to.
- Implementation details, runbooks, how-to guides → those belong in the codebase or a project guide, not here.
- General "thoughts" or unstructured notes — an ADR records exactly one decision.

## Lifecycle

ADRs become **immutable once shipped**. Two phases:

- **Draft (local, unpushed, no one has acted on it).** Edit freely. Reshape the framing, fix mistakes, sharpen the wording. The ADR is not yet a record anyone else relies on, and a tidy revised version is more useful than two records one day apart where the second only replaces the first.
- **Shipped (committed, pushed, or already acted on by other work).** Immutable. A future reader needs to see the decision as it stood when it was made; downstream commits, ADRs, and implementations may quote or rely on its exact wording. From here on, course corrections are a *new* ADR that supersedes the old one.

The rule of thumb: if anyone else has had reason to read this ADR, treat it as shipped.

When superseding a shipped ADR:

- Add a `> Superseded by <filename without .md>.` line under the **old** ADR's title — the only permitted edit to a shipped ADR. The body stays untouched.
- The new ADR's body explains what changed and why, and names the superseded one by filename in its Context.
- Never rename a shipped ADR, and never reuse a filename for a different decision.

## When to write one

Write an ADR only for an *architecturally significant* decision — one affecting the system's structure, a non-functional characteristic (performance, security, scalability…), a foundational dependency, a public interface, or a construction technique reused across the codebase. The test is not "is this significant?" but "is this *architectural*?" — its implications are scattered system-wide, not localized to one feature.

Typical cases:

- A module or service boundary, or a structural convention the whole codebase follows.
- A library, framework, or platform chosen over real alternatives.
- A constraint accepted system-wide (latency budget, supported platforms, data retention).
- A pattern declared canonical for a recurring problem.

Not an ADR:

- A choice localized to one feature or module, even if durable and non-obvious → `/trace:distil`.
- A gotcha or constraint to respect (a footgun, an ordering requirement) → a distilled gotcha.
- A conventional default, a trivial choice (naming, formatting), or anything the code already captures.
- Costly-to-reverse on its own — time-consuming to change is not the same as architectural.

## Naming

`<YYYY-MM-DD>-<short-kebab-title>.md` — the date you wrote the record, then a kebab-case title that reads as a noun phrase (e.g., `2026-08-20-use-postgres-for-event-storage.md`).

The date replaces the sequence number that older ADR conventions use. Two branches working in parallel each pick the next number and land the same one, which merges cleanly and leaves two records sharing an identifier. Two branches cannot produce the same dated filename unless they also chose the same title, and git reports that as a conflict.

Files named `<NNNN>-<short-kebab-title>.md` under the older scheme stay exactly as they are. Never renumber or rename one.
