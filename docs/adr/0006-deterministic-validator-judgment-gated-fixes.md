# 0006. Enforce conventions with a deterministic validator; keep fixes judgment-gated

*2026-07-04*

## Context

The playbook's conventions — canonical doc structure, marker pairs, the AGENTS.md spec, sequential immutable ADRs, working-note banners, resolving links — were enforced only by agents reading the folder READMEs and complying. Mechanical verification (link resolution, numbering, banner presence) is exactly the work agents do slowly and unreliably and a script does instantly. One failure mode needs more than detection: after a branch merge, two ADRs can share a number, and every existing reference to that number ("see ADR 0007" in a code comment) becomes ambiguous — it was written before the merge and means one specific decision. Alternatives considered: agent-only validation (status quo — hope-based, token-expensive); CI linting (adopters may have no CI, and the playbook's home is the editor session); a fully automatic fixer that also rewrites ADR references (unsafe — two decisions share the number, so a bulk rewrite guesses).

## Decision

We will ship a deterministic validator, `scripts/doctor.js`, with three subcommands — `check` (full convention report as JSON), `refs` (inventory of every reference to an ADR number across the scope, with file/line/context), and `migrate` (renumber one colliding ADR file and return the reference inventory for the old number) — wrapped by a `/playbook:doctor` skill. The split is fixed: the script detects and performs mechanical renames but never rewrites references; the agent interprets each reference and applies the fix directly when confident. Developer approval is reserved for genuine ambiguity and for actions that would overwrite hand-written content — every applied fix is an uncommitted working-tree edit, so `git diff` is the review surface, not a per-fix approval gate.

## Consequences

Every convention in the folder READMEs becomes checkable instead of hoped-for, at the cost of one `node` call — cheap enough that other skills use it too (`distil` verifies its own writes with `check`). Collision resolution gets a safe path: rename mechanically, then resolve references one by one with full context, instead of either ignoring the collision or bulk-rewriting. Confidence-gated automation keeps the interaction cost near zero on the common path (mechanical fixes and obvious resolutions just happen), while the two hard edges — ambiguous references and overwriting human prose — still stop for a decision.

The new coupling: the validator encodes the conventions, so a convention change (a README rule, the marker heading, the forwarder line, the ADR filename pattern) now has two places to update, and drift between them makes doctor report violations that aren't. The validator also treats deviation as a finding even where a repo deviates deliberately — the skill is instructed to present findings on such repos as information, not orders.
