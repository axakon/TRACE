# Example: distilled entries

Fictional examples (the Meridian API project from `agents-md-setup`'s example) showing the target length and tone of a Phase 5 draft. Use them as references, not templates to copy.

Notice the calibration: two to four sentences, stating what the code does now and the one fact the reader could not get from reading it. No rationale essay, no restating the diff, no lead-in about why the entry exists.

---

## Added to `docs/system/rate-limiting.md` (new descriptive file)

```markdown
# Rate limiting

Every route gets its limit from the `RateLimiter` middleware in
`src/middleware/rate-limit.ts`. Routes do not implement their own counters.

Thresholds live in `config/rate-limits.ts`, keyed by route group. They are not
environment variables — a misconfigured env var disabled rate limiting in
production once, so the values moved into code.
```

## Added to the `Gotchas` section of `AGENTS.md` (scope-wide gotcha)

```markdown
- Redis is required for rate limiting, not optional. If Redis is unreachable
  the middleware fails open and every request passes. Watch the
  `rate_limit_backend_down` counter in staging before assuming a limit works.
```

## Added to `docs/architecture/security.md` (prescriptive — MUST voice, cited)

```markdown
Webhook handlers MUST verify the Stripe signature before reading the payload.
The raw body MUST be persisted before any downstream work runs, because Stripe
treats a 200 as delivered. (ADR 0004)
```

## What a weak draft looks like

```markdown
# Rate limiting

This document provides comprehensive context around the rate limiting
mechanism layer that was recently introduced into the codebase. A robust
rate limiting strategy is important to ensure the API remains performant
under load. The implementation leverages a middleware-based approach...
```

Three sentences, no facts. It names no file, no config key, and no threshold — a reader learns nothing the diff would not have told them faster.
