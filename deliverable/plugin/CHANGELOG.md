# Changelog

All notable changes to the `playbook` plugin are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [semantic versioning](https://semver.org). Bump `version` in `.claude-plugin/plugin.json` with every release and add an entry here — Claude Code caches installs by version string, so an unbumped release reaches no one.

## [0.7.1] - 2026-05-27

### Changed
- **`pr-description` format sharpened for reviewer experience.** Drafts were producing dense, jargon-heavy prose that buried operationally important details and assumed prior context only the author had. Four adjustments to the skill:
  - **Self-contained for the reviewer.** Explicit rule against referencing artifacts the reviewer cannot see — no plan, spec, ticket body, ADR draft, or chat history. Inline what matters.
  - **Write for a reader who lacks the context.** Plain language over jargon; spell out domain terms on first use; one idea per sentence; comprehension on first pass over concision-at-any-cost.
  - **Approach as bullets with bold lead-ins.** Bullets when there are 3+ distinct points (≤15 words each), short prose only for a single continuous thought. Lead each bullet with the decision as it appears in the code (`Token updates use PUT: …`), not a comparison framing (`PUT over DELETE+POST: …`) — rationale and rejected alternatives are supporting detail, not the headline.
  - **New optional `Risks / follow-ups` section.** Pulls manual rollout steps, deferred cleanups, and known limitations out of mid-paragraph and into a scannable block. Omitted entirely when nothing qualifies.
  - **`How to verify` is reviewer-actionable only.** Explicit ban on restating CI (`go test ./...` passes, lint clean, build succeeded). The reviewer is not re-running the developer's pre-flight; if the only verification is CI, the section is skipped.

## [0.7.0] - 2026-05-26

### Added
- **`pr-description` skill** — drafts a PR description or squash-merge commit message in the playbook's standard *What is this / Approach / Updated context / How to verify* shape. The format is a structure for reviewers, not a taxonomy: no Conventional-Commits prefix, no enum of types, just an imperative-mood title plus a *why / how* body. The skill reads the diff against the base branch (inferred from the open PR or the repo default), auto-populates the *Updated context* section with ADRs and docs files touched by the change, and gates the optional *How to verify* tail on one developer prompt. Output goes to chat for copy-paste; optional placement modes apply the body via `gh pr edit` or write it to a file. Model-invocable, so the agent surfaces it when a developer is about to commit or open a PR.

## [0.6.0] - 2026-05-25

### Fixed
- **Plugin marketplace discovery.** The marketplace catalog moved from `deliverable/plugin/.claude-plugin/marketplace.json` to the repo root at `.claude-plugin/marketplace.json`. Claude Code only looks for marketplace catalogs at the repo root, so the nested location broke `/plugin marketplace add axakon/TRACE` — Claude Code would clone the repo but fail to discover the catalog. The plugin entry's `source` is now `./deliverable/plugin` (relative path to the plugin folder); the install commands documented in this plugin's README are unchanged and work as written.

### Changed
- **AGENTS.md is now canonical; CLAUDE.md is a one-line forwarder.** Aligns the plugin with the wider AGENTS.md standard (read by Cursor, Codex, Claude Code, and other coding agents). The skill `claude-md-setup` is renamed to **`agents-md-setup`** — the slash command becomes `/playbook:agents-md-setup`. The skill now writes two files at the repo root: `AGENTS.md` (the canonical project context, full content) plus a one-line `CLAUDE.md` containing `See @AGENTS.md for more information.` (so Claude Code's native discovery still finds the context). The same pattern applies to the per-folder durable-context marker: `<docs-folder>/AGENTS.md` holds the marker content, with a sibling `<docs-folder>/CLAUDE.md` forwarder. `init`, `distil`, and `scaffold-docs` all write the marker pair; `distil` and the scope-detection logic look only for `AGENTS.md`. A pre-existing root `CLAUDE.md` with content (from an earlier plugin version or hand-written) is treated as not-yet-set-up — the skill creates `AGENTS.md` fresh and overwrites the old `CLAUDE.md` with the forwarder. No auto-migration of existing CLAUDE.md content.
- **Three-category docs layout adopted: descriptive / prescriptive / historical.**
  - **Descriptive** (`<docs-folder>/system/`) — what the codebase IS. `scaffold-docs` and `distil` write topic files (`security.md`, `database.md`, `api-conventions.md`, …) here instead of the docs-folder root.
  - **Prescriptive** (`<docs-folder>/architecture/`) — what the system MUST do. Operational rules in RFC 2119 voice. `distil` will route a candidate here only when it is clearly a MUST/operational rule and the project has the folder set up; descriptive candidates always go to `system/`.
  - **Historical** (`<docs-folder>/adr/`, plus `reference/` and `working-notes/` if the project keeps them) — decisions and rationale. Append-only or immutable. Never a distillation target.
- **No forced migration.** Existing topic files at the docs-folder root stay where they are; only new writes go to `system/` or `architecture/`. `distil` updates files at their existing path. Listings of "what already exists" now consider `<docs-folder>/system/`, `<docs-folder>/architecture/`, and the docs-folder root, so duplicates aren't suggested.
- **Context-folder template updated** to describe the three-category layout, including how to consult `system/` (descriptive) and `architecture/` (prescriptive) for binding context.
- **ADR rule softened from "always immutable" to "immutable once shipped."** An ADR still being drafted locally (uncommitted, no one acting on it) can be edited freely; the rule kicks in at ship time. The `/playbook:adr` skill writes at end-of-work, so in that flow ADRs are shipped on write and effectively immutable, but the wording in `adr/SKILL.md` and `adr-template.md` now reflects the underlying rule rather than asserting blanket immutability.

See TRACE [ADR 0001](https://github.com/axakon/TRACE/blob/main/docs/adr/0001-three-categories-of-project-docs.md) for the full rationale.

## [0.5.2] - 2026-05-24

### Changed
- `spec-workflow`'s planning interview (Phase 2) sharpened, bringing it up to the bar `claude-md-setup` already sets: answer from the codebase before asking (only ask what the repo can't settle), offer a recommended answer with each question, and resolve the plan as a decision tree (settle the choices that constrain others first). Keeps the measured tone — the rigor of grill-me-style interviewing without the aggression.

## [0.5.1] - 2026-05-24

### Fixed
- The distillation reminder no longer suggests `/playbook:distil` after pure documentation work. The sentinel fires on any edit, so filling in docs (CLAUDE.md, the docs folder, ADRs) was nudging distillation even though there's nothing to distil *from* writing docs directly. `distillation-pending-reminder.md` now fires only when the recent edits were to code or config — and was tightened in the process (5 lines → 2).

## [0.5.0] - 2026-05-24

### Added
- **`scaffold-docs` skill** — a one-time bootstrap for an existing codebase with little documentation. It scans for signals (a migrations folder, an ORM or DB driver, an auth library, a backend HTTP framework, a frontend with an HTTP client, a message bus), proposes a short tailored list of starter topic docs, and seeds the ones the developer picks with the facts it can confirm from the repo plus a few prompts for the rest. Writes into the resolved docs folder with distil-consistent filenames, so `/playbook:distil` keeps them current afterward. Signal-driven and restrained — not a generic checklist, and never an empty stub.

## [0.4.0] - 2026-05-24

### Removed
- **The change-spec and all its machinery** — the `.claude/changes/` folder, both per-folder templates, the change-spec template, and the skill-scoped `ExitPlanMode` hook. Plan mode already produces a plan; the separate seven-section spec mostly restated it, was deleted after distillation anyway, and its area tags went unused by `distil`. `spec-workflow` now treats the **approved plan as the contract**: Phase 2 requires the plan to state acceptance criteria and a verification approach explicitly, and Phase 4 verifies against them. (7 phases → 6.)

### Changed
- **ADR gate** rewritten around Nygard's "architecturally significant" definition (a decision affecting **structure, non-functional characteristics, dependencies, interfaces, or construction techniques**) as a hard gate, with an explicit decision-vs-gotcha split so feature-level footguns route to `/distil`, not an ADR. Fixes an over-trigger seen in testing.
- **ADR format slimmed** — dropped the `Status` field (these ADRs are recorded post-implementation, so always accepted); supersession is now a one-line `> Superseded by NNNN.` banner. Template aligned to canonical Nygard sections (Context = forces in tension; Decision = "We will…"; Consequences = resulting context).
- Trimmed the ADR gate restatements in `spec-workflow` and the `adr` skill to lean pointers — the gate lives once, in `adr-criteria.md`.

## [0.3.0] - 2026-05-21

### Changed
- `claude-md-setup` now uses a single conversational confirm per interview section plus one final write gate, instead of an approval chip after every section — far fewer approvals for the same deliberate, one-section-at-a-time pace.
- `spec-workflow` merged the change-spec draft/approve and write-to-disk steps into one phase, with folder-marking as a sub-step of the first write; eight phases became seven. This matches the single-gate shape now used in `distil` and `adr`.
- Applied proportional reads consistently: `spec-workflow`, `adr`, and `init` defer or drop supporting-file reads they don't need up front, so cheap exits stay cheap.
- Trimmed the `ExitPlanMode` hook reminder from a full restatement of the steps to a short pointer to the skill's Phase 3, removing duplicated (and drift-prone) instructions.
- Tightened `init`'s preamble and cut remaining narration across the skills.

## [0.2.2] - 2026-05-21

### Changed
- `distil` write/cleanup flow simplified from nine phases to six. The per-candidate loop is now explicit with a single approval per candidate (proposed target and drafted diff shown together) instead of two separate gates, folder-marking became a sub-step of the first write rather than its own phase, and the two cleanup steps (retiring the change-spec, clearing the sentinel) are grouped.
- Trimmed remaining narration from `distil` per the skill-authoring standard.

## [0.2.1] - 2026-05-21

### Changed
- `distil` now does proportional work instead of two unbounded reads per run: it lists changed files first (`git diff --stat`) and reads diffs selectively, judges the cheap criteria from the diff and short-circuits on a no-op, and reads only the durable-context files whose area overlaps a candidate rather than the whole library. Cuts latency on large changes and mature docs folders.

### Fixed
- `distil` now clears the distillation-pending sentinel on a clean no-op run. Previously it could stop after reporting "nothing qualified" without clearing the sentinel, so the reminder kept firing on every later prompt.

## [0.2.0] - 2026-05-21

### Added
- `adr` skill — records lightweight, immutable architecture decision records in `<docs-folder>/adr/`. Offered by `spec-workflow` at handoff when a decision qualifies, and invocable directly with `/playbook:adr`.
- `.claude-plugin/marketplace.json` so the repo is installable from GitHub as a single-plugin marketplace (`/plugin install playbook@ai-playbook`).
- `shared/docs-folder-resolution.md` — single source of truth for resolving a scope's durable-context folder, referenced by `init`, `claude-md-setup`, and `distil`.
- README **Concepts** section documenting every moving part (scope, docs folder + marker, change-spec, distillation, ADR, the sentinel, super-repo).

### Changed
- Leaner skills: de-duplicated the docs-folder precedence into the shared file, trimmed `claude-md-setup` and `init`, and cut narration from `distil` and `spec-workflow` per Anthropic/Cursor skill-authoring guidance.
- Reordered the README so installation and quickstart precede the advanced super-repo material.

### Fixed
- Installation instructions, which used an invalid `/plugin install <github-url>` form; the documented path is now `marketplace add` + `install`, with user/project/local scope guidance.

## [0.1.x] - Initial development

Pre-release iterations: the four core skills (`init`, `claude-md-setup`, `spec-workflow`, `distil`), plugin-level hooks (Context7 injection on `SessionStart`; the distillation sentinel via `PostToolUse` + `UserPromptSubmit`), per-folder `CLAUDE.md` templates, and the bundled Context7 MCP server (disabled by default).
