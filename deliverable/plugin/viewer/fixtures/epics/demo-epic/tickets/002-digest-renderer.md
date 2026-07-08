---
status: in-progress
depends_on: ["001"]
---

# 002. Digest renderer and weekly send

## Why

Collected events are worthless until they reach the user as one readable weekly email.

## Scope

A scheduled job that reads each user's buffered week from `digest_events`, renders a grouped summary email (per project, newest first), sends it through the existing mailer, and marks the window consumed. Includes send observability: a metric per run and a log line per failed recipient.

## Out of scope

Cadence choices — this ticket ships weekly-only (003 adds preferences). Collector changes (001).
