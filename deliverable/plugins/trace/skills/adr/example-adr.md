# Example: well-formed ADR

A fictional example (same Meridian API project as `agents-md-setup`'s example) showing the target depth and length. Use it as a reference, not a template to copy — the template is [adr-template.md](./adr-template.md).

Notice the calibration: each section is a few sentences, the alternatives live inside Context as sentences (not a scored comparison table), and Consequences names both what got easier and the trade-off accepted. If a draft grows past roughly two screens, the surplus belongs in a reference doc the ADR links to.

---

# Process billing webhooks through the job queue

*2025-11-14*

## Context

Stripe delivers billing events (invoice paid, payment failed, subscription changed) as webhooks. Processing them inline in the HTTP handler tied our response time to downstream work — provisioning, email dispatch, ledger updates — and a crash mid-handler lost the event, since Stripe treats a 200 as delivered. Alternatives: keep inline processing but make handlers transactional (still couples response time to downstream work, and doesn't survive a process crash), or poll the Stripe API on a schedule instead of receiving webhooks (simpler failure model, but adds minutes of latency and burns API quota).

## Decision

We will acknowledge webhooks immediately and process them asynchronously: the handler verifies the signature, persists the raw event, enqueues a BullMQ job, and returns 200. All billing side-effects run in workers under `src/jobs/`.

## Consequences

Webhook handlers become trivial and fast; retries, backoff, and dead-lettering come from BullMQ instead of custom code; a crash after acknowledgement no longer loses the event because the raw payload is persisted first. The trade-off is eventual consistency — a paid invoice is reflected in the account seconds, not milliseconds, after Stripe sends the event — and every job handler must be idempotent, since BullMQ guarantees at-least-once execution. New billing side-effects must be added as jobs, not inline code; the persisted raw events double as an audit log.

---

## A weak Decision section, for contrast

An ADR is immutable once written, so its wording outlives the session that produced it. This is the failure to watch for — a different project's decision, written with borrowed vocabulary:

> ## Decision
>
> We will close the ADR-0005 read gap with new delegation-shaped, relationship-gated RPCs, rather than opening `Issues.Get` to relationship callers. This establishes the precedent for every contractor-facing read after it.

Four invented compounds, and abstract nouns ("the read gap", "the precedent") standing where a fact belongs. Most of that vocabulary comes from ADR 0005 — cite an earlier ADR and its jargon travels into yours, then into the next one that cites you.

The same decision, plainly:

> ## Decision
>
> We will add new RPCs that check the delegation row before they return an issue. The alternative was to open the existing `Issues.Get` to the screens a contractor uses, and we rejected it. The reads we add later will follow the same pattern.

Same facts, same rejected alternative, no invented terms.
