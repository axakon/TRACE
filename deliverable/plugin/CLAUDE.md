# CLAUDE.md

This file is for agents working on the `playbook` plugin itself (repo: `ai-playbook`). It is excluded from plugin distribution via `.gitattributes`. Per the Claude Code docs, a CLAUDE.md at a plugin's root is not loaded as project context for plugin consumers — plugins contribute context through skills only.

## What is this

Source repository for the `playbook` Claude Code plugin (repo name: `ai-playbook`): a consultancy playbook for AI-assisted development. The plugin ships ten skills (`init`, `agents-md-setup`, `scaffold-docs`, `spec-workflow`, `epic-workflow`, `adr`, `distil`, `doctor`, `pr-description`, `commit-message`) plus shared instructions, hooks, and a bundled MCP server.

The original design intent lives in [`docs/working-notes/ai-playbook-research.md`](../../docs/working-notes/ai-playbook-research.md) in the TRACE repo.

## Stack

| Piece | Choice |
|-------|--------|
| Format | Markdown skill content, JSON config, small Node.js scripts |
| Runtime | Runs inside Claude Code. Hook scripts require Node.js ≥ 18 on PATH (the same runtime Claude Code itself ships on). Hook and skill scripts use only Node's built-in modules — no test framework, no package manager. One exception: `viewer/` builds a browser bundle (marked + mermaid) with esbuild on the maintainer machine; `viewer/dist/viewer.bundle.js` is committed so consumers never run a build |
| Validation | Install locally and invoke skills in a test project |

## Directory index

| Path | What's there |
|------|-------------|
| `.claude-plugin/plugin.json` | Plugin manifest (name, version, description). Lives next to the plugin source under `deliverable/plugin/.claude-plugin/` |
| `<repo-root>/.claude-plugin/marketplace.json` | Marketplace catalog at the **repo root** (not inside this plugin folder), so the repo is installable via `/plugin marketplace add axakon/TRACE`. Claude Code only finds marketplace catalogs at the repo root — putting it under `deliverable/plugin/.claude-plugin/` broke discovery. The catalog lists the single `playbook` plugin with `"source": "./deliverable/plugin"`. Marketplace name is `ai-playbook`; consumers install `playbook@ai-playbook` |
| `skills/<skill-name>/SKILL.md` | Skill entry point; supporting files (templates, rules) live alongside the SKILL.md |
| `shared/` | Cross-skill content: authoring rules, distillation criteria, text injected by hooks. `docs-folder-resolution.md` is the single source of truth for how a scope's durable-context folder is resolved — `init`, `agents-md-setup`, and `distil` all reference it instead of carrying their own copy. Keep it that way; the precedence used to be duplicated across all three and drifted |
| `scripts/` | Hook and skill helper scripts, all Node.js for cross-platform support. `inject.js` is a generic file-to-additionalContext emitter that also expands `${VAR}` env-var placeholders in the file contents. `set-sentinel.js` and `check-sentinel.js` implement the soft auto-trigger for `/distil` (see Gotchas). `doctor.js` (check/refs/migrate) is the deterministic convention validator behind `/playbook:doctor`; it detects and renames, but never rewrites ADR references — that judgment stays in the skill. `plan-server.js` is the localhost playbook viewer (renders `~/.claude/plans` and the `~/.claude/epics` kanban board via the committed bundle); `plan-viewer-open.js` and `plan-viewer-context.js` are its ExitPlanMode hooks, `epic-viewer-open.js` opens the epic board for the epic-workflow skill — `--preview` opens the `~/.claude/epics/.preview/<slug>/` staging area the skill writes drafts into before confirmation, served at `/epic-preview/<slug>` and invisible to the `/epics` index. All share port/server discovery in `plan-viewer-common.js` |
| `viewer/` | Plan-viewer browser bundle: `src/main.js` (markdown + mermaid rendering, revision marks, draft user stories), built with `npm run build` (esbuild) into the committed `dist/viewer.bundle.js`. `fixtures/` holds the demo plan and demo epic served by the repo-root `.claude/launch.json` |
| `hooks/hooks.json` | Plugin-level hooks: SessionStart context7 injection, PostToolUse Write/Edit/MultiEdit sentinel writer, UserPromptSubmit sentinel-reading reminder, and the plan-viewer pair on ExitPlanMode (PermissionRequest opens the browser during review, PostToolUse injects the viewer URL after approval) |
| `.mcp.json` | Bundled MCP server config (Context7, disabled by default) |
| `../../docs/working-notes/ai-playbook-research.md` | The original research note (in the TRACE repo, not this plugin folder). Source of intent, not source of truth (see Gotchas) |
| `../../docs/working-notes/open-questions.md` | Design decisions deferred during implementation, with context for the next pass (in the TRACE repo, not this plugin folder) |

## Commands

No build or test commands. To verify changes end-to-end:

- Load locally for testing: `claude --plugin-dir <repo>/deliverable/plugin` in a test project — loads the working copy directly for that session, no marketplace needed. The flag expects the **plugin root** (the directory containing `.claude-plugin/plugin.json`), not the repo root — passing the repo root silently loads zero plugins. Verify with `/plugin` in the session before testing
- Invoke a skill via its namespaced slash command: `/playbook:<skill-name>`
- Reload after edits without restarting: `/reload-plugins`
- Consumer install path (what the README documents): the repo ships `.claude-plugin/marketplace.json` **at the repo root** so `/plugin marketplace add axakon/TRACE` can discover it. The marketplace catalog's plugin entry uses `"source": "./deliverable/plugin"` (relative path to the plugin folder within the repo). Consumers install as `playbook@ai-playbook`. The earlier layout — marketplace.json nested under `deliverable/plugin/.claude-plugin/` with `"source": "./"` — does not work; Claude Code only looks for marketplace catalogs at the repo root
- A non-interactive CLI mirrors the `/plugin` slash commands for scripted setup: `claude plugin marketplace add <owner>/ai-playbook`, `claude plugin install playbook@ai-playbook`, `claude plugin update playbook@ai-playbook`, `claude plugin list`. Add `-s/--scope user|project|local` to target a scope. Changes apply after a restart of any running session
- When `viewer/src/` changes, run `npm run build` in `viewer/` and commit the regenerated `dist/viewer.bundle.js` in the same change — the committed bundle is what ships, and a stale one ships silently
- **The GitHub marketplace serves pushed commits, not your working tree.** Maintainers who install `playbook@ai-playbook` from GitHub (rather than via `--plugin-dir`) get whatever is on the pushed branch. The release loop is therefore: bump `plugin.json` `version` → commit → push → `claude plugin update playbook@ai-playbook`. Without the version bump the update is a no-op (see the version-caching gotcha). To exercise *uncommitted* changes, use the `--plugin-dir` path above instead — it bypasses the marketplace and version cache entirely

## Skill authoring

Skill bodies are read by both Claude and humans, and once a skill loads its full text stays in context every turn — so every line is a recurring cost. Write to the [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) and Cursor skill guidance:

- **State what to do, not why the instruction exists.** Cut compliance-justification and meta-commentary ("this step is mandatory because…", "this is intentional", "this keeps it cross-platform"). Assume Claude is capable.
- **Keep rationale only when it guides a judgment the instruction leaves open** (e.g. "promote to a higher scope only when genuinely cross-cutting").
- **Prefer structure over prose** — bold lead-ins, tight lists, numbered phases — over explaining in sentences.
- **`when_to_use` must require an explicit ask, not a generic "wrapping up" signal.** The `UserPromptSubmit` sentinel for `/playbook:distil` fires on "done", "ship it", "ready to commit" — a skill whose `when_to_use` matches those same phrases collides with it and surfaces at the wrong moment. Phrase the trigger around explicit verbs the developer would actually say ("write a commit message", "open a PR for this"), and include an explicit non-trigger line for the wrap-up signals. The `commit-message` and `pr-description` skills both carry such a non-trigger line.

## Gotchas

- **Do not assume what Claude Code supports — look up the docs.** Plugin, hook, and skill APIs have non-obvious boundaries: `SubagentStart` does not support `additionalContext` but `PostToolUse` does; skill-frontmatter hooks exist and are scoped to the skill's lifetime; `${CLAUDE_PLUGIN_ROOT}` works in hook commands but only `${CLAUDE_SKILL_DIR}` substitutes inside skill markdown. Before claiming a feature exists or designing around it, fetch the relevant page yourself with WebFetch — start at https://code.claude.com/docs/en/hooks, https://code.claude.com/docs/en/skills, and https://code.claude.com/docs/en/plugins-reference. Do not rely on agent-summarized answers when correctness matters; subagents have hallucinated and contradicted themselves on these specifics multiple times in this project.

- **The research file is intent, not specification.** Where `ai-playbook-research.md` conflicts with the Claude Code docs, the docs win and the implementation deviates. Document the deviation when it happens (e.g. the spec-workflow `SubagentStart` hook described in the research was dropped because the event doesn't support context injection).

- **Shared files are referenced three different ways depending on who reads them.** Skill markdown bodies reference them via relative paths (`../../shared/<file>.md`) because the agent reads them with the Read tool. Hook command strings in `hooks.json` reference them via `${CLAUDE_PLUGIN_ROOT}/shared/<file>.md` because Claude Code substitutes that variable into the command before executing. **Inside file contents that are emitted as `additionalContext` from a hook, `${CLAUDE_PLUGIN_ROOT}` is not substituted by Claude Code** — substitution only applies to skill content, agent content, hook commands, monitor commands, and MCP/LSP config (per the plugins reference). To work around that, `scripts/inject.js` expands `${VAR}` placeholders from its own environment before emitting the JSON, so shared files injected via that helper can still reference plugin-relative paths.

- **Hook scripts must exit 0 silently when their input is missing.** Failing a SessionStart or PostToolUse hook with a non-zero exit pollutes the user's session. All three Node scripts in `scripts/` return 0 with no output when a required file or argument is absent.

- **Cross-platform constraint.** The plugin targets both macOS and Windows. Hook scripts are written in Node.js (no bash, jq, or `envsubst`) and invoked via `node "${CLAUDE_PLUGIN_ROOT}/scripts/<file>.js"` so the same command line runs in zsh, bash, and `cmd.exe`. Skill bodies avoid `!`shell`` dynamic-context injection because the default shell for that feature is bash, which is not present by default on Windows; existence checks and listings use the Glob/Read tools instead.

- **The plugin is content-only.** No code is compiled or tested. The "verification" of changes is manual end-to-end invocation. There is no CI to catch a broken hook script or a malformed `plugin.json` — broken changes will only surface when a developer installs the plugin.

- **The `/distil` auto-trigger is a sentinel pattern, not a forced invocation.** No hook output field invokes a skill, so `/distil` cannot be called directly by the plugin. Instead, `set-sentinel.js` (PostToolUse) writes `.claude/.playbook/distillation-pending` after each Write/Edit/MultiEdit — unless the edited file is documentation (markdown-family extension or a `.claude/` path, judged from `tool_input.file_path`; an unidentifiable path falls through to setting the sentinel) — and `check-sentinel.js` (UserPromptSubmit) reads it to inject a reminder via `additionalContext`. The agent is told to surface `/playbook:distil` only when the developer's current message reads as "wrapping up". `/distil` clears the sentinel as its final phase. The state directory is self-gitignored. Past attempts to use the `Stop` hook for this failed because Stop cannot inject `additionalContext` and cannot invoke skills — see [open-questions.md](../../docs/working-notes/open-questions.md) for the trade-space.

- **No hook can put a link in the message that presents a plan** — Claude writes that message before any hook runs. The plan viewer therefore uses two hooks: `PermissionRequest` (matcher `ExitPlanMode`) opens the browser during review but cannot emit `additionalContext`; `PostToolUse` injects the viewer URL only after approval. `ExitPlanMode`'s `tool_input.plan`/`planFilePath` are version-dependent (empty on older Claude Code versions); the plan-viewer scripts exit 0 silently when they're absent. Concurrent viewers coexist by walking ports 7526–7535 and identifying each other via `GET /api/info` (matching on `plansDir`).

- **The user-story sentence shape is a shared contract.** `viewer/src/main.js`'s `STORY_RE` styles bullets matching "As a/an `<role>`, I want `<capability>`, so that `<consequence>`" into cards, and the board's **+** button emits the same shape. The spec-workflow and epic-workflow/epic-template story guidance produce it. Changing the phrasing in any one place requires changing all of them — and rebuilding the bundle.

- **AGENTS.md is canonical; CLAUDE.md is only a forwarder.** At every level — root project context, per-folder durable-context marker — `AGENTS.md` holds the content and a sibling `CLAUDE.md` contains exactly `See @AGENTS.md for more information.`. The plugin enforces this: `agents-md-setup` writes both files; `init`, `distil`, and `scaffold-docs` write both files when marking a durable-context folder; scope detection looks only for `AGENTS.md` (an `AGENTS.md`-less directory with a `CLAUDE.md` is treated as not-yet-set-up, even if the `CLAUDE.md` has real content from an earlier plugin version or hand-written). The convention reason: `AGENTS.md` is the multi-tool standard (Cursor, Codex, and Claude Code all read it); `CLAUDE.md` exists for Claude Code's native discovery only. Do not partially revert this in any skill — they all assume the same rule.

- **Bump `plugin.json` `version` on every release, or installed users get nothing.** The plugin uses explicit semver, and Claude Code caches the installed copy by version string — pushing commits without bumping `version` means `/plugin update` reports "already at the latest version" and consumers stay stale. Bump it in the same commit as the change (MAJOR breaking / MINOR feature / PATCH fix) and add a matching `CHANGELOG.md` entry. `marketplace.json` deliberately omits a `version` for the plugin entry so `plugin.json` is the single source (and `plugin.json` wins over the marketplace entry regardless).
