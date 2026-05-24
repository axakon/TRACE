# 0000 — Record architecture decisions

**Status:** Accepted
**Date:** 2026-05-10

## Context

TRACE is a research-and-synthesis project: opinions form over time, then get promoted from working notes into reference and playbook prose. Decisions made along the way (structural choices, pattern recommendations, scope calls) need to be findable and reviewable later — both for our own consistency and as empirical input for the playbook itself.

Conversation history is unreliable. Working notes capture in-progress thinking but blur decisions with open questions. We need a structured place where "we decided X, here's why" lives.

## Decision

Record framework-level decisions as ADRs in `docs/adr/`, using the Michael Nygard template (Context / Decision / Consequences). One decision per file, numbered sequentially, never deleted — superseded ADRs reference their successor.

ADRs cover decisions about TRACE itself (the framework, its structure, its scope). Decisions inside the prose of the playbook are the playbook's content, not ADRs about it.

## Consequences

- Every framework-level decision is written down at the moment it's made, not retroactively reconstructed.
- The ADR log is the loop's input layer: when it's time to synthesize working notes into reference or playbook prose, ADRs are the authoritative record of what was already decided.
- New decisions trigger a check: does this affect existing reference, playbook, AGENTS.md, or onboarding content? Drift is caught at decision time.
- The `docs/adr/README.md` index is hand-maintained. If volume grows past ~30 ADRs, generate the index instead.
