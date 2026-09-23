---
status: done
depends_on: []
---

# 001. Event collector

## Why

The digest needs a buffered record of notification-worthy events per user; today events go straight to the mailer.

## Scope

Add a collector that subscribes to the existing notification event stream and buffers events per user per week in the `digest_events` table. No rendering, no sending — just reliable collection with a retention window.

## Out of scope

Digest rendering and sending (002). Preference handling (003).
