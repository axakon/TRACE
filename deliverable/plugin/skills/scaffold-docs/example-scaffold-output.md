# Example: scaffolded topic files

Fictional examples (same Meridian API project as `agents-md-setup`'s example) showing the target shape of Phase 4's output. Use them as references, not templates to copy.

Notice the calibration: confirmed facts are one to three sentences stating what the repo evidences, with exact paths and names. Everything uncertain is a question under `## Still to document` — never a claim. A scaffolded file this short is correct; it's a seed for `/playbook:distil` and the developer, not finished documentation.

---

## `docs/system/data-layer.md` (descriptive — every chosen topic gets one of these)

```markdown
# Data layer

PostgreSQL 15 accessed through Prisma; schema and migrations live in `prisma/`.
Redis holds sessions and rate-limit counters only — no durable data.

## Still to document

- Which tables are append-only vs. updated in place?
- Is there a soft-delete convention, or are rows deleted for real?
- How are migrations applied and rolled back in production?
```

## `docs/architecture/security.md` (prescriptive — scaffolded only for the `security` pair)

```markdown
# Security

Operational rules in MUST voice; cite the source (ADR, contract, incident) for each.

## Still to document

- What MUST be true about JWT expiry and refresh?
- What MUST be validated at the webhook trust boundary before an event is accepted?
- Which endpoints MUST be rate-limited, and what MUST happen on breach?
```
