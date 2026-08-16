# When a decision warrants an ADR

An ADR records one *architecturally significant* decision (Nygard's term): the choice, its context, and its consequences. It is immutable — a later change of course is a new ADR that supersedes it. The bar is high; most durable knowledge is distil-tier, not an ADR. Significant is not the same as architectural, and costly-to-reverse is not the same as architectural — gate on the dimensions below, not on how consequential or hard-to-undo the choice feels.

## Hard gate — architectural significance

Record an ADR only if the decision affects at least one of (Nygard's definition):

- **Structure** — how the system is organised; module or service boundaries.
- **Non-functional characteristics** — performance, security, scalability, availability, and the like.
- **Dependencies** — a foundational external dependency or integration.
- **Interfaces** — a public API, contract, or protocol others build against.
- **Construction techniques** — a framework, build/deploy approach, or pattern reused across the codebase.

A choice localized to one feature or module touches none of these → distil-tier, not an ADR, even if durable and non-obvious.

## Also required

- A **real choice between alternatives** — not a forced option, and not the conventional default.
- **Non-obvious rationale** — a future contributor would ask "why?" and the answer isn't self-evident from the code.

## Route elsewhere — not an ADR

- A **gotcha or constraint** a future dev must respect (a footgun, an ordering requirement) → distilled gotcha.
- A **localized feature decision**, or the **conventional solution** to a problem → distil.
- **Already covered by an ADR** → write a superseding ADR that references the original.

Below the gate but still durable → distilled context (see [distillation-criteria.md](distillation-criteria.md)).
