# Example: well-formed ADR

A fictional example (same Meridian API project as `agents-md-setup`'s example) showing the target depth and length. Use it as a reference, not a template to copy — the template is [adr-template.md](./adr-template.md).

Notice the calibration: each section is a few sentences, the alternatives live inside Context as prose (not a scored comparison table), and Consequences names both what got easier and the trade-off accepted. If a draft grows past roughly two screens, the surplus belongs in a reference doc the ADR links to.

---

# 0004. Process billing webhooks through the job queue

*2025-11-14*

## Context

Stripe delivers billing events (invoice paid, payment failed, subscription changed) as webhooks. Processing them inline in the HTTP handler tied our response time to downstream work — provisioning, email dispatch, ledger updates — and a crash mid-handler lost the event, since Stripe treats a 200 as delivered. Alternatives: keep inline processing but make handlers transactional (still couples response time to downstream work, and doesn't survive a process crash), or poll the Stripe API on a schedule instead of receiving webhooks (simpler failure model, but adds minutes of latency and burns API quota).

## Decision

We will acknowledge webhooks immediately and process them asynchronously: the handler verifies the signature, persists the raw event, enqueues a BullMQ job, and returns 200. All billing side-effects run in workers under `src/jobs/`.

## Consequences

Webhook handlers become trivial and fast; retries, backoff, and dead-lettering come from BullMQ instead of custom code; a crash after acknowledgement no longer loses the event because the raw payload is persisted first. The trade-off is eventual consistency — a paid invoice is reflected in the account seconds, not milliseconds, after Stripe sends the event — and every job handler must be idempotent, since BullMQ guarantees at-least-once execution. New billing side-effects must be added as jobs, not inline code; the persisted raw events double as an audit log.
