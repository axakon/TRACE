# 0003. Soft sentinel pattern for auto-triggering distillation

*2026-07-04 — recorded retroactively; decided during initial development (v0.1.x), reminder tightened in v0.5.1 (May 2026).*

## Context

Distillation only keeps context current if it actually runs, but Claude Code hooks cannot invoke a skill — the available primitives are `additionalContext` injection and `decision: "block"`. The mechanisms considered:

1. **No automation** — rely on the developer remembering `/playbook:distil`. The failure mode the playbook exists to prevent.
2. **Stop-hook block** — force an extra agent turn after edits, directing the agent to run distil. Costs a turn even when there is nothing to distil, and blocks every edit-then-stop cycle unless throttled.
3. **Soft sentinel** — a PostToolUse hook on `Write|Edit|MultiEdit` marks the project as having pending changes (`.claude/.playbook/distillation-pending`); a UserPromptSubmit hook reads the marker and injects a reminder telling the agent to surface `/playbook:distil` only when the developer's message reads as wrapping up; distil clears the marker as its final phase.

Distillation is also deliberately developer-gated: the plugin proposes, the developer approves. A forced invocation would cut against that.

## Decision

We will use the soft sentinel pattern: set on edits, read at prompt time, injected as a reminder rather than a forced turn, cleared by a completed distil run.

## Consequences

Wrap-up moments get a nudge at near-zero cost — no extra agent turns, no blocked responses, and the developer stays the gate. The reminder can be ignored by the agent, which is accepted: `spec-workflow` hands off to distil anyway, and the skill is invocable at any time, so the loop survives without the sentinel.

The pattern's known weakness is false positives — the sentinel fires on any edit, including documentation work with nothing to distil from. v0.5.1 addressed this in the reminder text (fire only when recent edits were code or config). The sentinel is explicitly on probation: if false positives keep recurring, the machinery (set/check/clear scripts, both hooks, distil's clear phase) is removed entirely rather than patched further — see the open-questions working note for the escalation trade-space (PostToolBatch nudge, Stop-hook block) that remains on the table.
