# 0011. Explicit previews with native approval controls

*2026-09-07*

## Context

TRACE's plan viewer depends on Claude's ExitPlanMode tool and a version-dependent plan-file payload. Codex does not expose that same workflow contract. The epic workflow already opens its preview explicitly. This decision supersedes ADR 0004's conversation-only storage choice while retaining the approved plan as the implementation contract.

## Decision

We will make spec and epic skills open their previews explicitly through one shared viewer operation. Each harness will use its available planning and question controls, with conversational approval when native controls are unavailable.

## Consequences

Preview rendering no longer depends on a plan-exit hook. A saved plan renders the same contract presented for approval; it does not introduce a separate change-spec artifact. Saving or opening a preview never authorizes implementation. The active harness mode and filesystem permissions still apply. Explicit viewer calls can report failures and fall back to presenting the draft in chat.
