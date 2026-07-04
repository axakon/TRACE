# 0004. The approved plan is the contract — change-spec removed

*2026-07-04 — recorded retroactively; decided in plugin v0.4.0 (2026-05-24).*

## Context

The spec path originally transformed each approved plan into a seven-section change-spec file under `.claude/changes/`, written by an `ExitPlanMode` hook and consumed downstream. In practice two of its three purposes had eroded: it was deleted after distillation, so it never served as a durable record, and `distil` routes candidates by diff path, so the spec's area tags went unused. The residual value — a structured, checkable acceptance-criteria contract — duplicated the plan itself, which the planning interview already produces. The alternatives were to keep the spec as a durable artifact (contradicting its delete-after-distil lifecycle), slim it, or remove it and make the plan carry its remaining job.

## Decision

We will remove the change-spec and all its machinery — the `.claude/changes/` folder, the templates, and the `ExitPlanMode` hook — and treat the approved plan as the contract. `spec-workflow`'s planning phase must produce explicit acceptance criteria and a verification approach in the plan, and its verification phase checks against them.

## Consequences

The spec path drops a whole artifact class and a hook; less machinery to maintain, and no ceremony that produces files nobody reads back. The precedent it set — drop machinery that doesn't earn its keep — was later applied to put the distillation sentinel on probation (0003).

The accepted trade-off: the plan lives in the conversation, not on disk. For work spanning multiple sessions it can scroll out of context with no file to fall back on; `spec-workflow` documents re-establishing the plan manually. If session-spanning loss proves painful in practice, persisting the plan's acceptance criteria to a file would be reconsidered — knowingly a lighter change-spec by another name.
