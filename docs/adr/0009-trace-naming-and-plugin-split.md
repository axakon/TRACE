# 0009. Converge on the TRACE name and split the plugin into a core plus opt-in add-ons

*2026-08-16*

## Context

The tooling shipped as one plugin, `playbook@ai-playbook`, with skills namespaced `/playbook:`. Two problems had accumulated.

**The name was overloaded and drifting.** "Playbook" meant three things: the plugin, the slash-command namespace, and the prose deliverable at `deliverable/playbook/`. "TRACE" meant the repo and the framework. The drift was already visible — the plugin's own `CLAUDE.md` called the repo `ai-playbook` in three places while the working install path was `axakon/TRACE`, and it claimed a `.gitattributes` exclusion for a file that did not exist. No ADR had ever recorded the name, so nothing anchored it.

**There was no way to take part of the tooling.** All ten skills, five hooks, the plan-viewer server, and the committed browser bundle arrived together. Measured, the always-on cost is 1032 words of skill frontmatter loaded into every session regardless of what the developer is doing. The split falls out unevenly: the six docs skills account for 381 words, the two planning skills 269, and the two git skills 382 — so a team on Conventional Commits paid more for skills they would never invoke than for the entire core. Installing the planning skills also drags a 921-line Node server and an npm-built bundle into a project that may only want the docs structure.

Alternatives considered for the split mechanism:

1. **Keep one plugin, add configuration** to disable skill groups. No supported mechanism disables individual skills, and skill frontmatter would still load.
2. **Separate marketplaces per plugin.** Cross-marketplace dependencies are blocked by default and require an allowlist in the root marketplace; no benefit over one catalog.
3. **An `npx`-style installer** that writes the right `settings.json`. Redundant — Claude Code's `dependencies` field already resolves and installs a plugin's dependencies automatically, and a manifest that is nothing but a `dependencies` array is the documented way to bundle a curated set behind one install.

The constraint that shaped the design: **a plugin cannot read files outside its own directory.** Claude Code copies each plugin into its own cache directory, and paths that traverse out resolve to nothing after install. "The core is the thing the add-ons build upon" therefore cannot mean add-ons reading core's `shared/` folder.

## Decision

We will rename the tooling to TRACE and split it into four plugins in a single marketplace named `trace`:

- **`trace`** — the core: `init`, `agents-md-setup`, `scaffold-docs`, `adr`, `distil`, `doctor`, the shared instruction files, the doc-structure templates, and the SessionStart and distillation-sentinel hooks. Depends on nothing.
- **`trace-plan`** — `spec` and `epic` (renamed from `spec-workflow` and `epic-workflow`), the plan-viewer server and bundle, and the two `ExitPlanMode` hooks.
- **`trace-git`** — `commit-message` and `pr-description`. No hooks, no scripts.
- **`trace-full`** — a manifest consisting only of a `dependencies` array; installing it installs the other three.

Both add-ons declare `trace` as a dependency, so the core arrives with either. The word "playbook" is retired from the tooling and means only the prose deliverable.

Three rules follow from the no-cross-plugin-reads constraint:

1. **Add-ons delegate to core skills rather than reading core files.** `/trace-plan:spec` invokes `/trace:adr` and lets it apply the gate, instead of reading `adr-criteria.md`. `/trace-git:pr-description` detects ADRs from diff paths instead of resolving the docs folder. Cross-plugin skill invocation works; cross-plugin file reads do not.
2. **Files that genuinely must exist in two plugins are duplicated from a single source.** Only `authoring-rules.md` qualifies. `trace/shared/` is the source, `scripts/sync-shared.js` propagates it, and the release preflight fails on drift.
3. **Hook ownership is exclusive.** No hook may be registered by two plugins, or it fires twice for anyone with both installed.

All four plugins share one version and ship together, tagged `v<version>` for the repo plus `<plugin>--v<version>` per plugin.

## Consequences

Adopters can install the docs core alone and pay none of the planning or delivery context cost; a core-only install has no npm-built artifact and no plan-viewer server at all. Adding an add-on later is one command, and Claude Code refuses to disable `trace` while a dependent is installed, so the dependency direction is enforced rather than documented.

The cost is a one-time break for every existing adopter. `playbook@ai-playbook` does not resolve any more: the marketplace, the plugin ids, and every slash command change, and a team with the old plugin named in a checked-in `.claude/settings.json` must update and commit it. The migration is documented in `deliverable/README.md`. On-disk artifacts — docs folders, `AGENTS.md`, ADRs — are untouched. The per-scope state folder moved from `.claude/.playbook/` to `.claude/.trace/`, with a fallback read of the old path and migration in `/trace:init`, so adopters who delay the migration still resolve correctly; the two readers (`docs-folder-resolution.md` and `doctor.js`) must stay in step. The `PLAYBOOK_PLAN_VIEWER` env vars gained `TRACE_`-prefixed names with the old ones still honoured.

Splitting fragments the slash-command namespace: `/trace-plan:spec` replaces `/playbook:spec-workflow`. Shortening the skill names absorbs some of that, but a two-plugin command is inherently longer than a one-plugin command, and this is accepted as the price of opting out.

Maintenance gets three new failure modes that did not exist with one plugin, each with a guard: a stale duplicated shared file (caught by `sync-shared.js --check` in the release preflight), a double-registered hook (no automated check — the exclusive-ownership rule is written into `deliverable/plugins/AGENTS.md`), and a missing `<plugin>--v<version>` tag, which breaks dependency resolution for anyone pinning a range. Lockstep versioning is what keeps the last one tractable; independent version lines would multiply the tagging surface and make the constraint matrix real work.

Superseded in part: ADR 0002 recorded shipping the tooling as *a single* Claude Code plugin. Its reasoning about plugins as the delivery vehicle stands; the "single" is what changes here. The bundled Context7 MCP server and its SessionStart injection stayed in the core rather than becoming a fourth content plugin — it is unrelated to durable context and is a candidate for extraction if the always-on injection proves unwanted.
