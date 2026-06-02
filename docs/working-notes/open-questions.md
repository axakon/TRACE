# Open questions

> ⚠️ **Working note — not authoritative.** Binding rules live in `architecture/` and `adr/`. Nothing here is a rule until it's promoted — however settled it reads.

Design decisions deferred during initial implementation. Each entry: the question, what we know, what we deferred, and what a future pass should reconsider.

This file is for plugin maintainers, not consumers. Excluded from distribution via `.gitattributes`.

## Auto-triggering `/distil` — escalation beyond soft awareness

**Status:** Soft sentinel pattern is implemented. Open question is whether to escalate.

**Current mechanism.** A PostToolUse hook on `Write|Edit|MultiEdit` writes a per-project sentinel at `.claude/.playbook/distillation-pending`. A UserPromptSubmit hook reads the sentinel and injects an `additionalContext` reminder telling the agent to surface `/playbook:distil` when the developer's current message indicates work is wrapping up. `/distil` clears the sentinel in its final phase. See the Gotcha in [CLAUDE.md](CLAUDE.md) for the full pattern.

**Why it's not stronger.** Hook outputs cannot invoke a skill, slash command, or tool. The available primitives are `additionalContext` injection and `decision: "block"`. We chose injection because:

- Distillation is supposed to be developer-gated, not agent-driven.
- Block-based escalation costs an extra agent turn even when distillation finds nothing worth capturing.
- Soft reminders avoid noise on every edit-then-stop cycle.

**Mechanism options that remain on the table.**

- **PostToolBatch nudge.** Same `additionalContext` text, but injected immediately after each batch of edit calls instead of waiting for the next user prompt. More immediate, slightly noisier. Equivalent agent behaviour expected.
- **Stop hook block.** Forces a turn at end-of-response when the sentinel is set. Reason text directs the agent to invoke `/distil`. Requires `disable-model-invocation: false` on the distil skill (currently `true`). Cost: one extra agent turn per cycle, even on no-op distil runs. Risk: blocks every turn after edits unless throttled by a "blocked-recently" marker.
- **Combination.** Sentinel pattern as today plus a Stop block escalation when the agent ignores the reminder for N consecutive turns. Adds state complexity.

**What a future pass should reconsider.**

- Whether the soft reminder is actually heeded in practice. If agents routinely ignore it and edits accumulate without distillation, escalate to PostToolBatch or Stop.
- Whether a future hook event lets a plugin invoke a skill directly. If so, the trade-space changes — block-and-invoke becomes feasible without the `disable-model-invocation` flip.
- Whether the sentinel granularity should change. Per-project (current) is the simplest; per-task granularity would be more precise but requires inferring task boundaries.
- **False positives on documentation work (seen in testing, 0.5.1).** The sentinel fires on any `Write|Edit|MultiEdit`, so editing the playbook's own outputs — CLAUDE.md, the docs folder, ADRs — tripped a distil suggestion even though there's nothing to distil *from* writing docs. Fixed softly in 0.5.1 by tightening `distillation-pending-reminder.md` to skip the suggestion when recent edits were only documentation. A deterministic alternative — make `set-sentinel.js` path-aware so doc edits never set the sentinel — was rejected: it needs the hook to read `config.json` and resolve the docs folder per scope (logic a trivial hook shouldn't carry), and it still wouldn't cover mixed code+doc sessions, so the reminder fix is needed regardless.
- **The sentinel is on probation.** It's the softest, least-proven mechanism in the plugin and it mis-fired on its first real outing. One clean fix is fine; if false positives keep recurring, remove the sentinel entirely (the `set`/`check`/`clear` scripts, the two hooks, distil's clear phase) rather than patching further — distil is invocable any time and `spec-workflow` already hands off to it, so the loop survives. Same call we made on the change-spec: drop machinery that doesn't earn its keep.

## Mirror distilled content into `.claude/rules/` for native discoverability

**Status:** Deferred. Discoverability is currently solved by seeding the scope's docs folder (defaulting to `docs/`) into the root CLAUDE.md directory index so agents working anywhere in the project know to consult it. This works but relies on the agent actually reading the index and choosing to load files.

**The alternative.** Per the Claude Code hook docs, `.claude/rules/*.md` files are auto-loaded into context (the `InstructionsLoaded` event fires with `load_reason: path_glob_match` for them). Mirroring distilled content from `docs/` into `.claude/rules/` (or routing some candidates there instead of `docs/`) would make every distilled file load automatically every session, no agent action required.

**Why we did not do this.**

- The playbook deliberately puts durable context in the project's docs folder so non-Claude developers find the same knowledge under a familiar path. `.claude/rules/` is invisible to anyone not using Claude Code. Splitting distilled content across both locations risks divergence; auto-loading from `.claude/rules/` only would lose the "humans find it too" property.
- "Rules" reads as imperative ("you must do X"); the distilled content is informational ("here is how this project works") — conventions, security boundaries, design choices — not commandments.
- Auto-loading every distilled file every session bypasses the "read what is relevant when it is relevant" pattern. For a project with ten files totalling a few thousand tokens, that is fine. For a project that has been distilled aggressively for a year, it becomes a context-window tax paid on every session regardless of what the work needs.

**What a future pass should reconsider.**

- Whether the directory-index pointer is enough in practice. If agents routinely ignore the docs folder despite the index entry, native auto-load becomes more attractive.
- Whether a hybrid is worth shipping: a small set of "always-load" files at `.claude/rules/` plus the broader docs-folder library for on-demand reads. The distil skill would need to route candidates between the two based on how universally relevant they are, and the human-readable docs folder would still be the canonical home.
- Whether Claude Code grows a third option (e.g. lazy-glob-load on file pattern match, or auto-loading files inside a configured docs folder) that captures the best of both — load context files when the agent touches related code, ignore them otherwise.

## Hook reference correctness

Earlier passes worked from an incomplete list of hook events. The full set is documented at https://code.claude.com/docs/en/hooks — there are roughly 30 events including `PostToolBatch`, `SessionEnd`, `TaskCompleted`, `InstructionsLoaded`, etc., several of which support `additionalContext` and were not considered in initial design. When revisiting any hook-driven mechanism, fetch the docs first and inventory which events apply.

## ADR gate calibration

**Status:** Tightened in 0.4.0 after a real over-trigger in testing.

A localized feature decision (one feature's data model in a single-user app, with a non-obvious PUT-coupling gotcha) was offered as — and recorded as — an ADR. The original `adr-criteria.md` gated on *real choice + lasting consequences + non-obvious rationale + costly to reverse*, which ordinary feature work clears. The fix anchored the gate on Nygard's **"architecturally significant"** definition (the decision must affect the system's structure, non-functional characteristics, dependencies, interfaces, or construction techniques), kept a short *real-choice + non-obvious-rationale* check, and added an explicit **decision-vs-gotcha split** (constraints and footguns route to `/distil`, not an ADR).

**What a future pass should watch:** the opposite failure mode. The bar is now high; if genuinely system-shaping decisions start getting missed (no ADR offered when one was warranted), soften the significance gate. Target calibration: ADRs are rare but not absent.

## Dropping the change-spec

**Status:** Removed in 0.4.0.

The spec path originally transformed the approved plan into a seven-section change-spec file at `.claude/changes/`. On review, two of its three purposes had eroded: it was deleted after distillation (so not a durable record), and distil routes by diff path rather than the spec's area tags. The residual value — a structured, checkable acceptance-criteria contract — overlapped heavily with the plan, which the Phase 2 interview already drives. So the change-spec, its templates, the `.claude/changes/` folder, and the `ExitPlanMode` hook were removed; `spec-workflow` now treats the **approved plan as the contract**, and Phase 2 explicitly requires the plan to state acceptance criteria + verification approach.

**Tradeoff to watch:** the plan lives in the conversation, not on disk. For work spanning multiple sessions, the plan can scroll out of context with no file to fall back on. If that bites in practice, reconsider persisting the plan (or just its acceptance criteria) to a file — but that is a lighter change-spec by another name, so only do it if the session-spanning pain is real.
