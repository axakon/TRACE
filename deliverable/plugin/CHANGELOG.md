# Changelog

All notable changes to the `playbook` plugin are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [semantic versioning](https://semver.org). Bump `version` in `.claude-plugin/plugin.json` with every release and add an entry here — Claude Code caches installs by version string, so an unbumped release reaches no one.

## [0.24.0] - 2026-08-16

Readability pass on generated content. Plans and epics carried no writing rules at all, and `distil` read the rules but had no worked example to calibrate against.

### Added
- **Worked examples for `distil` and `epic-workflow`** — `example-distillation.md` (a `system/` file, an AGENTS.md gotcha, a MUST-voice rule, plus a weak draft for contrast) and `example-epic.md` (a filled epic and ticket). Both skills had templates or rules but no specimen of the target length and tone. `distil` (Phase 5), `epic-workflow` (Phase 3), and `spec-workflow` (Phase 2) read the rules at draft time and re-check the draft before showing it.
- **A weak Decision section and its rewrite** at the end of `example-adr.md` ("close the ADR-0005 read gap with new delegation-shaped, relationship-gated RPCs…"), showing how borrowed vocabulary reads once it is committed to an immutable file.

### Changed
- **`shared/authoring-rules.md` gained checkable language rules** — active voice with a named actor, every sentence needs a verb, one term per concept — plus four named patterns to avoid: an abstract noun where a fact belongs, an invented compound, an everyday word upgraded, and vocabulary borrowed from repo text. The previous Language section was three abstract bullets with no test attached. Listed words are illustrations of each pattern, not a checklist to extend; `architecture/` files keep RFC 2119 voice regardless.
- **Codebase terms are for naming, not describing.** Real names (identifiers, filenames, flags, status values) are copied exactly; the repo's *describing* words are not approved vocabulary, because agents wrote most of that text and borrowing it recycles the jargon into each new file.
- **The rules now cover plans, epics, and tickets.** Their scope line named a closed list that excluded all three, so `spec-workflow` and `epic-workflow` loaded no writing guidance. Both now read the file at draft time. The scope stays limited to files on disk — the plugin does not govern how the agent talks in the session.

## [0.23.0] - 2026-07-08

The playbook viewer release: plans and epics get a browser surface, and multi-phase work gets its own tier above specs.

### Added
- **The playbook viewer** — a localhost server (`scripts/plan-server.js`, Node built-ins only) rendering `~/.claude/plans` and `~/.claude/epics` through a committed browser bundle (marked + mermaid via esbuild — consumers never build; see ADR 0007). Mermaid diagrams, styled user-story cards, tables, live reload, light/dark toggle, and a settings panel (font, size, line height), all persisted per user. Servers bind 127.0.0.1, walk ports 7526–7535, and identify each other via `GET /api/info`, so fixture and real servers coexist.
- **Plan review in the browser.** Two new hooks: `PermissionRequest` on `ExitPlanMode` opens the presented plan in the viewer while the approval dialog is up; `PostToolUse` injects the plan's URL after approval. Select text to attach inline revision comments, add missing user stories with a + button, and copy one combined revision prompt to paste back into the session. Marks re-anchor across live reloads; unmatched ones survive as orphans in the prompt.
- **`epic-workflow` skill** — for work spanning multiple phases: an architecture-altitude interview produces an epic (core user stories, mermaid diagrams) decomposed into tickets, each sized to seed one later `spec-workflow` run. Epics live in user space at `~/.claude/epics/` (ADR 0008) with machine-readable ticket frontmatter (`status`, `depends_on`). Drafts stage at `~/.claude/epics/.preview/<slug>/` and open in the viewer for revision before anything is written; create and manage both end by opening the board (`scripts/epic-viewer-open.js`).
- **Epic kanban board** in the viewer: todo / in-progress / done columns with dependency chips, click-to-move status (rewrites ticket frontmatter and regenerates the epic's board table), per-ticket **copy seed** for handoff into `spec-workflow`, ticket detail pages, and a top navbar for switching between plans and epics. Revision marks work on epic and ticket pages too.
- **Story and diagram guidance in `spec-workflow`**: plans now open with a `## Core user stories` section tied to acceptance criteria, and carry mermaid diagrams where structure beats prose (user journeys as sequence diagrams, branching flows, state machines, schema changes).

### Changed
- `PLAYBOOK_PLAN_VIEWER=0` disables all viewer hooks and scripts.
- Local plugin testing docs corrected: `--plugin-dir` takes the plugin root (`deliverable/plugin`), not the repo root.

## [0.22.0] - 2026-07-04

Driven by the first `check --all` run on a production monorepo: three classes of noise in the report were doctor design flaws, not repo problems.

### Changed
- **`check --all` validates only playbook-adopted scopes.** A directory with a bare `AGENTS.md` but no `.claude/.playbook/config.json` and no marked docs folder — thin context for a tooling or infra sub-project — was failed with "docs folder does not exist" plus AGENTS.md-spec warnings, applying the project-root standard to scopes that never opted in. Such scopes now come back under `context_only` with a note ("run `/playbook:init <scope>` if it should carry the canonical tree"): visible, not failed — adopting a scope is a decision, not a repair. If nothing under the root is adopted, `--all` falls back to a full check of the root so a fresh repo still gets actionable output.
- **An `AGENTS.md` inside another scope's docs folder is never a scope.** Folder guides and format specs living under `docs/reference/…` were discovered as scopes needing their own canonical tree. Scope discovery no longer descends into an adopted scope's resolved docs folder, and reference inventories (`refs`/`migrate` `nearest_scope`) use the same discovery semantics, so docs-content AGENTS.md files neither fail checks nor claim ADR references.

### Fixed
- **Supersession-banner variants no longer trip the immutability check.** Normalization only stripped the canonical `> Superseded by NNNN.` form, so a hand-written variant (`> Superseded by 0031 (see …)`) counted as a post-ship edit and produced a false warning. Any blockquote line beginning "Superseded by" is now treated as a banner.

## [0.21.0] - 2026-07-04

### Fixed
- **The ADR immutability check now works for monorepo sub-scopes.** `git show <commit>:<path>` resolves the path against the repository root, so for a scope that is a subdirectory of its repo (TRACE adopted at project level inside a monorepo) the comparison silently failed and reported nothing — an edited shipped ADR in `services/api` passed as clean, with no `skipped` entry either. The pathspec is now cwd-relative (`:./<path>`), and when the first committed version genuinely can't be read the report says so per file in `skipped` instead of staying silent.

### Added
- **`doctor.js check --all` sweeps every scope in a monorepo.** Discovers each directory under the root carrying its own AGENTS.md (the durable-context marker doesn't count — that AGENTS.md marks a docs folder, not a scope), runs the full check per scope, and returns one JSON with per-scope reports (`scope_rel` per scope, rollup `ok`). Per-scope docs-folder resolution applies; `--docs` remains single-scope only.
- **ADR reference inventories carry `nearest_scope`.** Every scope numbers its own ADRs from 0001, so in a monorepo "ADR 0003" is only meaningful relative to the nearest scope of the file that says it. `refs` and `migrate` now attribute each hit by walking up to the closest non-marker AGENTS.md directory, and `/playbook:doctor`'s collision flow leaves references belonging to a different scope's sequence unchanged by default instead of treating them as candidates.

## [0.20.0] - 2026-07-04

### Added
- **`doctor` skill and `scripts/doctor.js` — a deterministic validator for the playbook's own conventions.** `node doctor.js check [scope]` reports, as JSON: missing canonical READMEs and marker pairs (AGENTS.md marker + CLAUDE.md forwarder, at the root and the docs folder), the root AGENTS.md against its spec (five sections, 50–150 lines, ≤40 per section), ADR filename pattern and strictly-sequential numbering, number collisions, shipped ADRs edited beyond a supersession banner (via git, skipped gracefully without it), working notes missing the non-authority banner or `Status:` header, and relative markdown links that don't resolve (fenced/inline code excluded). Findings are data — the script exits 0 and the skill decides what to do.
- **ADR number-collision resolution, split between script and judgment.** When two merged branches minted the same ADR number, `doctor.js migrate <file> <NNNN>` renames one file and rewrites its title heading, then returns `references_to_old_number` — every mention of the old number across the scope (code comments, docs, other ADRs, supersession banners) with file, line, and text. `doctor.js refs <NNNN>` runs the same inventory standalone. The script never rewrites references: each one was written before the merge and means one specific decision, so `/playbook:doctor` reads each reference in context and resolves it — applying confident resolutions directly and batching only the genuinely ambiguous ones (supersession banners chief among them) into a single question.
- **`/playbook:doctor`** wraps the validator: triages the report and fixes findings by class — missing forwarders/markers, canonical READMEs (via `copy-doc-structure.js`), note banners, and moved-link repairs apply automatically, since every fix is an uncommitted edit reviewable with `git diff`. The developer is asked only when the right fix is genuinely uncertain or would overwrite hand-written content, batched into one question. AGENTS.md spec problems route to `/playbook:agents-md-setup`; numbering gaps and post-ship ADR edits are reported with a recommendation, never auto-fixed.

### Changed
- **`distil` verifies its own writes.** Phase 6 runs `doctor.js check` when the run wrote files and repairs anything the run itself introduced; pre-existing findings are mentioned, not fixed.
- **Forwarder check tolerates backticks.** `See @AGENTS.md for more information.` and its backticked variant are both accepted as the CLAUDE.md forwarder.

## [0.19.0] - 2026-07-04

### Added
- **Worked examples for ADRs and scaffolded topic files.** `agents-md-setup` had `example-output.md` to calibrate depth; the other writing skills relied on templates and rules alone. The `adr` skill gains `example-adr.md` (a fictional Meridian-API decision showing the target length: a few sentences per section, alternatives as prose inside Context) and `scaffold-docs` gains `example-scaffold-output.md` (one descriptive `system/` file and the prescriptive `architecture/security.md` stub, showing that confirmed-facts-plus-prompts and nothing more is the correct shape). Both are referenced from their skill's Phase 4 as references, not templates to copy.

### Changed
- **Documentation edits no longer set the distillation sentinel.** `set-sentinel.js` now reads `tool_input.file_path` from the hook payload and exits without writing the sentinel when the edited file is markdown-family (`.md`, `.mdx`, `.markdown`, `.rst`, `.adoc`, `.txt`) or under a `.claude/` path — the deterministic half of the false-positive fix that 0.5.1 made on the reminder side. No config reading or docs-folder resolution in the hook; an unidentifiable path falls through to setting the sentinel as before. The reminder-side code-or-config check stays, covering mixed code+doc sessions where a code edit legitimately set the marker.
- **`init` validates the chosen docs path before laying down structure.** Phase 2 now checks that no *file* sits at the chosen path or at any of the five sub-paths (`system`, `architecture`, `adr`, `reference`, `working-notes`) and re-asks instead of proceeding into a copy that can't succeed.
- **`distil`'s no-git branch is explicit about failing commands.** Phase 1 now says to treat failing git commands (`git` not installed, folder not a repository) as the no-git case — ask the developer to describe what changed — rather than stopping on the error.
- **Working-note banner de-emojified.** The non-authority banner prescribed by `doc-structure/working-notes/README.md` opened with a ⚠️, contradicting `authoring-rules.md`'s "No emojis" — adopters following the template violated the rule. The banner is now plain bold text; the rule stands unqualified.

### Fixed
- **`copy-doc-structure.js` reports write failures instead of crashing.** A file sitting where a directory is needed (e.g. a file named `system` at the target) made the script die on `mkdirSync` with a raw Node error, leaving `init` without a report. Failures are now caught per-file into an `errors` array (`{ path, message }`) in the JSON report, other files still copy, and `init`'s Phase 3 tells the developer what blocked the write and stops; re-running after resolving is safe since already-written files are skipped.

## [0.18.1] - 2026-06-10

### Fixed
- **Documented the `agents-md-setup --yes` flag in the plugin README.** The 0.18.0 feature shipped without updating the Usage section, which still described the skill as interview-only. The "Day one" usage block now shows the `--yes` / `-y` non-interactive invocation, names what it omits (Gotchas, the Section 2 production-system probe), and notes that it combines with the `[path]` argument and applies in review-and-update mode too. Docs only — no skill or behaviour change.

## [0.18.0] - 2026-06-10

### Added
- **`agents-md-setup` accepts a `--yes` / `-y` flag for non-interactive generation.** Passing `--yes` (alongside or instead of the optional `[path]`) skips the section-by-section interview — no `AskUserQuestion`, no per-section confirms — and builds the file from Phase 1 reconnaissance alone, accepting the skill's own inferred proposals before writing straight to disk. Inferable sections (What is this, Stack, Directory index, Commands) keep their proposed content and the package manager is read from the lock file rather than asked; the two sections with no repo signal — Gotchas and the Section 2 production-system probe — are omitted, and the skill says so after writing so the developer can add them when reviewing the file on disk. Applies to both the create and review-and-update paths.

## [0.17.0] - 2026-06-02

### Changed
- **Re-anchored the ADR suggestion bar on architectural significance, closing drift between the gate and the surfaces that advertise it.** The enforced gate (`adr-criteria.md`, applied by the `adr` skill's Phase 2 and `spec-workflow`'s Phase 5) already required Nygard architectural significance, but two suggestive surfaces had stayed looser and over-suggested ADRs for non-architectural decisions: the `adr/README.md` "When to write one" list gated on "a decision has consequences a future contributor would want to know about" and named "naming convention" as a typical case, and the `adr` skill's `when_to_use` framed the bar around "lasting consequences" / "not cheap to reverse." Both now re-anchor on the gate's own language — affects the system's structure, non-functional characteristics, dependencies, interfaces, or a reused construction technique — and carry the explicit "a choice localized to one feature or module is distil-tier, not an ADR" exclusion. `adr-criteria.md` gains a one-line discriminator in its intro: *significant is not the same as architectural, and costly-to-reverse is not the same as architectural*. Guidance and wording only — the gate logic, the template, and the skill flow are unchanged.

## [0.16.0] - 2026-06-02

### Changed
- **Working notes now carry an explicit "not authoritative" signal at three levels, so a note's own "Resolved / no open questions" cues can't be read as settled truth.** An agent working in a TRACE repo had treated a note's `Resolved` section as decided fact because the in-note "this is resolved" cue overrode the folder-level "just research" framing. The fix layers the same rule — *a working note is never authoritative; binding rules live in `architecture/` and `adr/`* — at three distances so no single in-note cue can win: (1) the AGENTS.md directory-index line `agents-md-setup` writes (and now repairs on existing files) changed from a descriptive label to a rule — `working-notes/ ← research; NOT authoritative — rules live in architecture/ + adr/` — since it is the only signal loaded into an adopter's context every turn; (2) `working-notes/README.md` gained an imperative "nothing here is binding" statement and now prescribes a one-line non-authority banner as every note's first line, the only layer that survives a note read in isolation; (3) `Resolved` keeps its name but the README clarifies it means resolved *within the note*, not promoted into a rule. The parent doc-structure READMEs had their working-notes one-liner aligned to the same wording. Convention and wording only — no new hook, no ADR.

## [0.15.0] - 2026-05-31

### Changed
- **`distil` reserves the AGENTS.md Gotchas section for scope-wide gotchas.** Previously any criterion-4 "non-obvious gotcha" tended to land in AGENTS.md Gotchas because the Phase 4 routing rule sent a candidate there whenever it "extends something already there" — and an AGENTS.md almost always already has a Gotchas section. Over time that grew the section unboundedly with subsystem-specific detail. The routing rule now gates the AGENTS.md target on the gotcha's *nature*, decided up front: a gotcha that would catch out work anywhere in the scope goes to AGENTS.md Gotchas; one confined to a single area routes to that area's `system/<topic>.md` instead. No length check or triage — the reason something stays out of Gotchas is that it is local, not that the section got long. The Gotchas definition in `agents-md-rules.md` and the `agents-md-setup` Section 5 blurb gain the same "scope-wide" framing so both skills hold one bar.

## [0.14.0] - 2026-05-31

### Changed
- **`init` copies the canonical doc structure with one call instead of six Read+Write pairs.** Phase 3 previously read each of the six `shared/doc-structure/` READMEs into the agent's context and wrote each back out — ~290 lines round-tripped through context for a copy the agent never needs to reason about. It now invokes a new `scripts/copy-doc-structure.js` (Node, cross-platform like the other hook helpers) that copies only missing files and prints a JSON report of `written` / `skipped_identical` / `conflicts`. The greenfield case (no docs folder yet) writes all six with zero content through context; only genuine `conflicts` — a target that exists and differs — still route through the Read + `AskUserQuestion` overwrite path. `init` gains `Bash(node *)` in `allowed-tools`, matching `distil`'s existing use of the same pattern.

## [0.13.0] - 2026-05-29

### Changed
- **`commit-message` and `pr-description` no longer ask how to place their output.** Both skills dropped the final `AskUserQuestion` placement menu (Copy from chat / Write to a file / Apply to PR) that interrupted with a clipboard-style prompt. They now print the drafted text in a fenced block and act on the original request: when the developer only asked for the text, they stop; when the developer asked the agent to perform the commit or open/update the PR, the agent carries it out in its normal flow using the drafted content. `pr-description`'s "How to verify" inclusion is now a skill judgment (skip for trivial/refactor, include for behavioural/bugfix/user-facing) rather than an `AskUserQuestion`.
- **Removed the self-contradicting "never commit / never push / never open a PR" lines.** They fought the skills' own perform-the-action trigger — a developer who said "commit this" or "open a PR" would get a draft followed by a refusal. The rule is now "match the request": draft-only when the text was requested, perform the action when it was. Commit and PR creation run through the agent's normal permission flow — neither `git commit`/`git push` nor placement tools were added to `allowed-tools`, so nothing new is pre-approved. `AskUserQuestion` is dropped from both skills' `allowed-tools` since it is no longer used.

## [0.12.0] - 2026-05-28

### Added
- **`init`, `agents-md-setup`, and `scaffold-docs` accept an optional `[path]` argument** so a sub-scope in a monorepo can be set up from the super-repo root without `cd`-ing. With no argument the skills resolve scope to the current working directory (unchanged behaviour). With an argument, the path is resolved relative to cwd, validated to be an existing directory under cwd (absolute or `../`-escaping paths are rejected), and used as the scope root — config, docs structure, the marker pair, and `scaffold-docs`' Phase 2 signal scan all operate inside it. Typical monorepo flow becomes `/playbook:init services/api` → `/playbook:agents-md-setup services/api` → `/playbook:scaffold-docs services/api`, all from the repo root. `adr` is deliberately not extended — it is mostly invoked via `spec-workflow` or mid-conversation where cwd already matches the intended scope, and its `$ARGUMENTS` slot is owned by the decision title.

### Changed
- **`distil` reads ancestor scopes, not only the affected one.** Phase 3 now walks from the changed file upward through every ancestor `AGENTS.md` to the project root and globs filenames in each scope's docs folder (full reads only when an area overlaps a candidate). Two consequences in a funnelled monorepo: a sub-scope candidate is dedup'd against domain-wide context that was previously invisible to distil, and the criterion 5 correction check catches claims invalidated at *any* level of the funnel, not only the local one.
- **`distil` surfaces hoist signals actively in Phase 4.** Three named promotion signals — *parent already covers the area* / *diff touches shared code* / *candidate references sibling scopes* — flip the default proposed target from local to the upward scope when any of them fires. When none fire but the candidate still feels domain-wide (a general rule rather than scope-specific behaviour), distil now calls `AskUserQuestion` explicitly (**Keep at `<local>`** / **Hoist to `<parent>`** / **Skip**) rather than guessing silently. The per-candidate chip in Phase 5 remains the developer's final say.

## [0.11.0] - 2026-05-28

### Changed
- **`agents-md-setup` now embeds the docs sub-folder layout in the root `AGENTS.md`.** Section 3 (Directory index) keeps a single row for `<docs-folder>/` but appends a small ASCII tree mirroring the Layout in `<docs-folder>/README.md` — `system/` (what the code does today), `architecture/` (what it must do), `adr/`, `reference/`, `working-notes/`. The point is routing: when a developer asks for research or rules, an agent reading AGENTS.md sees the destination folder without opening the docs README first. Review-and-update flow checks for the layout block and proposes adding it if only the older single `<docs-folder>/` row is present. The previous one-row description ("Durable project context — distilled conventions, security boundaries, …") is replaced; the routing semantics now live in the tree.

## [0.10.0] - 2026-05-28

### Changed
- **`scaffold-docs` aligned with the TRACE three-category model.** The skill still seeds small, signal-driven topic files (`security`, `data-layer`, `migrations`, `api`, `api-integration`, `events`), but now writes to `<docs-folder>/system/` for descriptive content and, for `security` only, also seeds a paired `<docs-folder>/architecture/security.md` stub in MUST voice. The pairing demonstrates the system+architecture filename convention TRACE uses for areas with both descriptive and prescriptive content; other topics stay descriptive-only at scaffold time. Defaults renamed where TRACE expects paired filenames: `database.md` → `data-layer.md`, `api-conventions.md` → `api.md`.
- **`scaffold-docs` now requires `/playbook:init` to have run.** With init owning structure setup (including the marker pair), scaffold no longer writes the docs-folder marker itself. If `system/README.md` or `architecture/README.md` is missing, scaffold tells the developer to run `/playbook:init` first and stops. This removes the duplicated marker-writing logic and keeps each skill focused on one job.

## [0.9.0] - 2026-05-28

### Added
- **`init` scaffolds the TRACE three-category doc structure.** The plugin now bundles the six canonical README files (`<docs-folder>/README.md` plus one in each of `system/`, `architecture/`, `adr/`, `reference/`, `working-notes/`) under `shared/doc-structure/`, and `init` copies them into the chosen docs folder. Adopters get the opinionated structure as part of plugin setup instead of copying READMEs by hand from the TRACE clone. Existing files at any target path prompt for overwrite/leave/cancel; byte-identical existing files are skipped silently. The skill still does not pre-author content — no `architecture/overview.md`, no `adr/0000-record-architecture-decisions.md`, no `system/<topic>.md`.

### Changed
- **`init` no longer touches the root `AGENTS.md` directory index.** The previous Phase 5 was the main source of scope creep — `init` editing AGENTS.md crossed into `agents-md-setup`'s territory. Init now only writes to the chosen docs folder and to `.claude/.playbook/config.json`; the summary suggests `/playbook:agents-md-setup` when no root `AGENTS.md` exists. `agents-md-setup` already covers the directory-index entry from its create and review flows.

## [0.8.0] - 2026-05-27

### Added
- **`commit-message` skill** — drafts a single commit's message in a leaner shape than `pr-description`: imperative-mood title, then a 1–3 sentence body covering the *why*, then optional decision bullets only when there are non-obvious choices worth surfacing. No *Risks / follow-ups*, no *Updated context*, no *How to verify* — those belong on a PR, not on one commit. The body is plain text, not markdown: no `##` headers, no `**bold**`, lines wrapped at ~72 characters so the message reads cleanly in `git log` and a terminal. Phase 1 picks scope (the staged diff, `HEAD`, or a commit-ish argument) and shows the developer which it chose; output goes to chat for copy-paste, with an optional Write target (e.g. `.git/COMMIT_EDITMSG`). Never runs `git commit` or rewrites history. **Model-invocable on an explicit ask only** — the agent surfaces it when the developer asks for a commit message ("write a commit message", "draft the commit") or asks the agent to commit on their behalf ("commit this"), and explicitly **not** when the developer merely signals they are wrapping up; "done", "ship it", and staged-changes-with-no-commit-ask remain the territory of `/playbook:distil`.

### Changed
- **Shared change-summary style extracted to `shared/change-summary-style.md`.** The writing-discipline rules used by both summary skills — imperative-mood title ≤72 chars, no Conventional-Commits prefix, "write for a reader who lacks the context", self-contained for the reader, skip-what-the-diff-makes-obvious, lead-in bullets — moved into a single shared file. `pr-description` and `commit-message` both reference it instead of carrying their own copy, so the two skills can't drift apart.
- **`pr-description` triggers sharpened.** Frontmatter rewritten so the agent surfaces the skill only on an explicit ask — "write the PR description", "draft the PR body", "open a PR for this", "update the PR description" — and explicitly **not** on a generic "wrapping up" or "ship it" signal, which belongs to `/playbook:distil`. Also defers explicitly to `/playbook:commit-message` for single-commit messages so the two skills no longer compete for the same intent.

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
