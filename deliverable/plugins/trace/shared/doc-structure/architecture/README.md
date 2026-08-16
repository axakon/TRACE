# architecture/

## Purpose

The rules your system has to follow, written as plain "must do" statements. One file per area.

`system/` says what your code does — "we use Postgres 16; auth handler is at `src/auth.ts`." `architecture/` says what your code must keep doing — "events MUST publish to Kafka within 5 seconds." Where `adr/` records the decision behind a rule, this folder records the rule itself.

## What goes here

- **`overview.md`** — the structural map. What subsystems exist, how they talk to each other, the high-level sequences and integration patterns. Prose + Mermaid diagrams. MUST voice not required here.
- **`<area>.md`** — operational rules for one area, integration, or subsystem. Imperative voice, scannable, with each rule linked to its source (an ADR, a contract, a reference doc, an incident report). Filename pairs with the `system/` file for the same area: `system/api.md` describes the client; `architecture/api.md` constrains it.

## What does NOT go here

- **Decisions with alternatives considered** — those are ADRs in [`../adr/`](../adr/). An ADR records what was chosen and why; `architecture/` records the resulting rule in operational form.
- **Long-form rationale** — that's [`../reference/`](../reference/). Spec files cite the reference doc for "why this rule"; they don't reproduce the argument.
- **Descriptions of the current implementation** — that's [`../system/`](../system/). If you can read the function and know the answer, the spec file doesn't need to repeat it.
- **Active research or proposed rules** — those are [`../working-notes/`](../working-notes/) until they stabilize.
- **Aspirational rules nobody intends to enforce.** Every rule here is binding.

## Sources of architecture rules

Operational rules come from multiple upstream sources. The spec file should cite the source per rule:

| Source | Example rule |
|---|---|
| An ADR ("we chose Kafka over RabbitMQ") | "Events MUST publish to Kafka topic `<X>` within 5s of state change." |
| An external API contract | "We MUST refresh the bearer token every 5 minutes — Acme expires tokens at 6 minutes." |
| A compliance or business requirement | "User deletion MUST cascade within 30 days (GDPR)." |
| A post-incident learning | "Endpoint `/orders` MUST throttle to 10 req/sec — incident 2025-11-12." |

If a rule has no nameable source, that's a smell: either it's not actually a rule (move to a working note), or the rationale needs to be written up in `reference/` and linked from here.

## Format

Spec files use imperative voice — **MUST / MUST NOT / SHOULD / SHOULD NOT**. Short, scannable, no padding:

```markdown
# API — Acme integration

## Authentication
- MUST refresh the bearer token every 5 minutes via the background job at `src/jobs/token-refresh.ts`.
- MUST attempt an on-the-fly refresh on 401, as a safety net.
- Source: [ADR 0007](../adr/0007-token-refresh-strategy.md).

## Reliability
- Endpoint `/orders` MUST be wrapped in a retry loop with exponential backoff (max 3 attempts).
- Endpoint `/inventory` MUST NOT be retried — it is not idempotent.
- Source: [reference/api-reliability.md](../reference/api-reliability.md).

## Sequencing
- Order creation MUST complete before inventory adjustment.
- On inventory failure, the system MUST emit `OrderRollbackRequested`.
- Source: [ADR 0009](../adr/0009-saga-rollback-flow.md).
```

Style points:

- Avoid soft verbs like "we recommend," "ideally," or "try to." Use MUST / MUST NOT / SHOULD / SHOULD NOT.
- **Each rule names what it constrains** — an endpoint, an area, a sequence, a contract — so the reader knows when it applies.
- **Each rule cites its source.** A rule without a source can't be evaluated for "is this still true?"
- **No prose explaining the rule.** The argument lives in `reference/` or the ADR. If a rule needs three paragraphs of justification, the justification belongs upstream and the rule itself stays terse.

## Conventions

- **Pair filenames with `system/`.** `architecture/<area>.md` and `system/<area>.md` describe the same area from prescriptive and descriptive sides. Readers should be able to flip between them without translation.
- **Rules here change when the rules change** — a contract revises, a new ADR lands, a compliance requirement shifts. Distinct from `system/` (updated when code changes) and from `adr/` (immutable once shipped).
- **Keep prose tight.** A spec file is a list of rules with sources, not an essay. If a section is becoming an essay, it belongs in `reference/`, linked from the rule.
- **`overview.md` is the exception** — it's allowed prose and diagrams because the structural map needs them. But it stays terse: long arguments still go to `reference/`.
