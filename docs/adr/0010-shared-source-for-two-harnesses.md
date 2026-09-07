# 0010. Shared source for Claude Code and Codex packages

*2026-09-07*

## Context

TRACE's Claude plugin installs partly in Codex, but its tool assumptions and planning hooks do not provide the complete workflow. Separate hand-maintained copies would require every update twice and could drift. This decision extends ADR 0002's delivery choice and ADR 0009's plugin split to two harnesses.

## Decision

We will author shared workflows and small harness adapters, then generate complete Claude and Codex packages into the repository. We will release both distributions under one version and require CI to reject stale generated output.

## Consequences

Maintainers change shared behaviour once. Consumers keep installing committed packages without building them. Maintainers must regenerate and commit both outputs with source changes. Native packaging and controls can differ while workflow outcomes remain equivalent. macOS is the validation target; Windows validation is excluded from this change.
