# TRACE plugins

For agents working on the TRACE plugins themselves. Adopters never read this file — it sits above every plugin root, so it is not part of any plugin's distributed contents.

## What is this

Source for the four Claude Code plugins TRACE ships, distributed through the `trace` marketplace catalog at the repo root:

| Plugin | Skills | Hooks | Scripts |
|---|---|---|---|
| `trace` | `init`, `agents-md-setup`, `scaffold-docs`, `adr`, `distil`, `doctor` | SessionStart, PostToolUse (edits), UserPromptSubmit | `inject.js`, `set-sentinel.js`, `check-sentinel.js`, `clear-sentinel.js`, `copy-doc-structure.js`, `doctor.js` |
| `trace-plan` | `spec`, `epic` | PermissionRequest + PostToolUse on `ExitPlanMode` | `plan-server.js`, `plan-viewer-{common,open,context}.js`, `epic-viewer-open.js` |
| `trace-git` | `commit-message`, `pr-description` | none | none |
| `trace-full` | none — manifest is a `dependencies` array | none | none |

Consumer-facing docs are the per-plugin READMEs plus [`README.md`](README.md) for the suite. The original design intent lives in [`ai-playbook-research.md`](../../docs/working-notes/ai-playbook-research.md); deferred decisions in [`open-questions.md`](../../docs/working-notes/open-questions.md). Both are in the TRACE repo, not here.

## Stack

| Piece | Choice |
|-------|--------|
| Format | Markdown skill content, JSON config, small Node.js scripts |
| Runtime | Runs inside Claude Code. Hook scripts require Node.js ≥ 18 on PATH. Hook and skill scripts use only Node's built-in modules — no test framework, no package manager. One exception: `trace-plan/viewer/` builds a browser bundle (marked + mermaid) with esbuild on the maintainer machine; `dist/viewer.bundle.js` is committed so consumers never run a build |
| Validation | `claude --plugin-dir <plugin-root>` in a test project, then invoke the skills |

## Directory index

| Path | What's there |
|------|-------------|
| `<plugin>/.claude-plugin/plugin.json` | Manifest: name, version, description, and (for the add-ons) `dependencies` |
| `<repo-root>/.claude-plugin/marketplace.json` | Marketplace catalog, at the **repo root** — Claude Code only finds catalogs there. Name `trace`; each entry's `source` is a relative path like `./deliverable/plugins/trace` |
| `<plugin>/skills/<name>/SKILL.md` | Skill entry point; supporting files (templates, examples, rules) live alongside it |
| `trace/shared/` | Cross-skill content for the core: authoring rules, criteria, hook-injected text, and `doc-structure/` (the canonical READMEs `init` copies). `docs-folder-resolution.md` is the single source of truth for resolving a scope's durable-context folder — `init`, `agents-md-setup`, and `distil` reference it rather than carrying copies. Keep it that way; the precedence drifted when it was duplicated |
| `trace-plan/shared/authoring-rules.md`, `trace-git/shared/authoring-rules.md` | **Synced copies** of `trace/shared/authoring-rules.md`. See the cross-plugin gotcha below |
| `trace-plan/viewer/` | `src/main.js` (markdown + mermaid rendering, revision marks, story cards) built with `npm run build` into the committed `dist/viewer.bundle.js`. `fixtures/` holds the demo plan and epic served by the repo-root `.claude/launch.json` |
| `<repo-root>/scripts/sync-shared.js` | Propagates the shared files that cross a plugin boundary; `--check` fails on drift |

## Commands

No build or test commands. To verify changes end-to-end:

- **Load one plugin locally:** `claude --plugin-dir <repo>/deliverable/plugins/trace` in a test project. The flag expects the **plugin root** (the directory containing `.claude-plugin/plugin.json`) — passing the repo root or `deliverable/plugins/` silently loads zero plugins. Repeat the flag to load several at once. Verify with `/plugin` before testing
- **Invoke a skill:** `/trace:<skill>`, `/trace-plan:<skill>`, `/trace-git:<skill>`
- **Reload after edits:** `/reload-plugins`
- **Check shared-file sync:** `node scripts/sync-shared.js --check` from the repo root; `node scripts/sync-shared.js` to repair
- **Rebuild the viewer:** `npm run build` in `trace-plan/viewer/`, and commit `dist/viewer.bundle.js` in the same change
- **Consumer install path:** `/plugin marketplace add axakon/TRACE`, then `/plugin install trace-full@trace` (or an individual plugin). The CLI mirrors this: `claude plugin marketplace add axakon/TRACE`, `claude plugin install trace@trace`, `claude plugin update`, `claude plugin list`, with `-s/--scope user|project|local`
- **Release:** `/release` — see [.claude/skills/release/SKILL.md](../../.claude/skills/release/SKILL.md)

## Skill authoring

Skill bodies are read by both Claude and humans, and once a skill loads its full text stays in context every turn — so every line is a recurring cost. Write to the [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) and Cursor skill guidance:

- **State what to do, not why the instruction exists.** Cut compliance-justification and meta-commentary ("this step is mandatory because…", "this is intentional", "this keeps it cross-platform"). Assume Claude is capable.
- **Keep rationale only when it guides a judgment the instruction leaves open** (e.g. "promote to a higher scope only when genuinely cross-cutting").
- **Prefer structure over prose** — bold lead-ins, tight lists, numbered phases — over explaining in sentences.
- **An `example-*.md` is how a skill sets length, not a rule in the body.** Rules can say what to include and what to cut. They cannot convey depth. Every skill that writes prose ships an example, and the paragraph above it states the target length outright — "each section is a few sentences", "322 words over 33 lines". A skill that writes prose without one drifts long. State measured numbers in that paragraph, and re-measure when the example changes. The example is the standard, so a false claim about its own length is worse than no claim.
- **`when_to_use` must require an explicit ask, not a generic "wrapping up" signal.** The `UserPromptSubmit` sentinel for `/trace:distil` fires on "done", "ship it", "ready to commit" — a skill whose `when_to_use` matches those same phrases collides with it and surfaces at the wrong moment. Phrase the trigger around explicit verbs the developer would actually say ("write a commit message", "open a PR for this"), and include an explicit non-trigger line for the wrap-up signals. `commit-message` and `pr-description` both carry such a line.
- **Every skill description is always-on context.** All installed skills' frontmatter loads into every session regardless of whether the skill runs. A verbose `description`/`when_to_use` is a tax every user pays every session — this is the cost the plugin split exists to let people opt out of. Keep them tight.

## Gotchas

- **A plugin cannot read files outside its own directory.** Claude Code copies each plugin into its own cache directory; paths that traverse out (`../other-plugin/shared/x.md`) resolve to nothing after install. Two consequences, both load-bearing:
  - **Add-ons delegate, they don't read.** `/trace-plan:spec` invokes `/trace:adr` rather than reading core's `adr-criteria.md`; `/trace-git:pr-description` detects ADRs from diff paths rather than resolving the docs folder. Cross-plugin *skill invocation* works fine — it is just a slash command in the same session.
  - **`authoring-rules.md` is physically duplicated** into `trace-plan/shared/` and `trace-git/shared/`. `trace/shared/` is the source; `scripts/sync-shared.js` propagates it and the release preflight fails on drift. Adding another cross-boundary file means adding a row to that script's `TARGETS` — never hand-copy.

- **Writing rules split by layer: `authoring-rules.md` is the base, and per-plugin style files only add.** `trace-git/shared/change-summary-style.md` covers what is specific to a change summary and defers everything about word choice and sentences to `authoring-rules.md`. Do not restate a base rule in a style file — a restatement drifts, and the more concrete of two competing rules wins. This is not hypothetical. `change-summary-style.md` once said "lead with the decision as it appears in the code". That told the agent to write with the words the repo uses, which is the one thing `authoring-rules.md` forbids, and `trace-git` could not see `authoring-rules.md` to say otherwise.

- **Hook ownership is exclusive.** `trace` owns SessionStart and the two sentinel hooks; `trace-plan` owns the two `ExitPlanMode` hooks; `trace-git` ships none. Registering the same hook in two plugins makes it fire twice for anyone with both installed. When moving a skill between plugins, move its hooks with it.

- **All four plugins share one version.** They bump together every release even when only one changed, so `^1.0.0` constraints stay trivially satisfiable and one version number means one thing. Claude Code caches installs by version string — an unbumped version reaches no one. Dependency version constraints resolve against git tags named `<plugin>--v<version>`, so a release that skips a per-plugin tag breaks resolution for anyone pinning a range.

- **Do not assume what Claude Code supports — look up the docs.** Plugin, hook, and skill APIs have non-obvious boundaries: `SubagentStart` does not support `additionalContext` but `PostToolUse` does; skill-frontmatter hooks exist and are scoped to the skill's lifetime; `${CLAUDE_PLUGIN_ROOT}` works in hook commands but only `${CLAUDE_SKILL_DIR}` substitutes inside skill markdown. Before claiming a feature exists or designing around it, fetch the page yourself with WebFetch — start at https://code.claude.com/docs/en/hooks, https://code.claude.com/docs/en/skills, https://code.claude.com/docs/en/plugins-reference, and https://code.claude.com/docs/en/plugin-dependencies. Do not rely on agent-summarized answers when correctness matters; subagents have hallucinated and contradicted themselves on these specifics multiple times in this project.

- **The research file is intent, not specification.** Where `ai-playbook-research.md` conflicts with the Claude Code docs, the docs win and the implementation deviates. Document the deviation when it happens.

- **Shared files are referenced three different ways depending on who reads them.** Skill markdown bodies use relative paths (`../../shared/<file>.md`) because the agent reads them with the Read tool. Hook command strings in `hooks.json` use `${CLAUDE_PLUGIN_ROOT}/shared/<file>.md` because Claude Code substitutes that before executing. **Inside file contents emitted as `additionalContext` from a hook, `${CLAUDE_PLUGIN_ROOT}` is not substituted** — substitution applies only to skill content, agent content, hook commands, monitor commands, and MCP/LSP config. `scripts/inject.js` works around that by expanding `${VAR}` from its own environment before emitting the JSON.

- **Hook scripts must exit 0 silently when their input is missing.** Failing a SessionStart or PostToolUse hook with a non-zero exit pollutes the user's session. Every script returns 0 with no output when a required file or argument is absent.

- **Cross-platform constraint.** Targets macOS and Windows. Hook scripts are Node.js (no bash, jq, or `envsubst`) and invoked via `node "${CLAUDE_PLUGIN_ROOT}/scripts/<file>.js"` so the same command line runs in zsh, bash, and `cmd.exe`. Skill bodies avoid `!`shell`` dynamic-context injection because its default shell is bash, absent by default on Windows; existence checks use Glob/Read instead.

- **The plugins are content-only.** No code is compiled or tested, and there is no CI. The release preflight in `/release` is the only gate — a broken hook script or malformed manifest otherwise surfaces when a consumer installs it.

- **The `/distil` auto-trigger is a sentinel pattern, not a forced invocation.** No hook output field invokes a skill. `set-sentinel.js` (PostToolUse) writes `.claude/.trace/distillation-pending` after each Write/Edit/MultiEdit — unless the edited file is documentation (markdown-family extension or a `.claude/` path, judged from `tool_input.file_path`; an unidentifiable path falls through to setting it) — and `check-sentinel.js` (UserPromptSubmit) reads it to inject a reminder. `/trace:distil` clears it as its final phase. The state directory is self-gitignored. `Stop` cannot inject `additionalContext` or invoke skills — see [open-questions.md](../../docs/working-notes/open-questions.md) for the trade-space.

- **The per-scope state folder moved to `.claude/.trace/` at 1.0.0.** Resolution reads `.claude/.playbook/config.json` as a fallback (`doctor.js`'s `readConfiguredDocsFolder`, and the precedence in `docs-folder-resolution.md`), and `/trace:init` migrates the old file. Keep both readers in step if the precedence changes again.

- **No hook can put a link in the message that presents a plan** — Claude writes that message before any hook runs. The plan viewer therefore uses two: `PermissionRequest` (matcher `ExitPlanMode`) opens the browser during review but cannot emit `additionalContext`; `PostToolUse` injects the viewer URL only after approval. `ExitPlanMode`'s `tool_input.plan`/`planFilePath` are version-dependent (empty on older Claude Code versions); the scripts exit 0 silently when absent. Concurrent viewers coexist by walking ports 7526–7535 and identifying each other via `GET /api/info`.

- **Tab reuse rides on the content-refresh poll, not a socket.** `plan-server.js` holds `pendingFocus` plus `lastFocusPollAt`; `GET /api/focus` stamps the timestamp and *consumes* the pending target, so of N open tabs exactly one navigates. `POST /api/focus` parks a target only when a tab polled within `FOCUS_STALE_MS`, and answers `{live}` so `focusOrOpen` in `plan-viewer-common.js` knows whether to spawn a browser instead. Two things to preserve if you touch it: the 90s staleness window exists because browsers throttle hidden tabs to roughly one timer tick per minute — shortening it to "a few seconds" makes every background tab look dead and reintroduces the tab pile-up — and `FOCUS_SCRIPT` lives in `pageShell`, not in `viewer/src/main.js`, so every page type gets it and no bundle rebuild is needed.

- **The viewer's service identity string appears in two files.** `plan-viewer-common.js` defines `SERVICE` and `plan-server.js` hardcodes the same literal in its `/api/info` response. They must match or viewers stop recognising each other; `plan-server.js` does not import the constant.

- **The user-story sentence shape is a shared contract.** `viewer/src/main.js`'s `STORY_RE` styles bullets matching "As a/an `<role>`, I want `<capability>`, so that `<consequence>`" into cards, and the board's **+** button emits the same shape. The `spec` and `epic` skills' story guidance produces it. Changing the phrasing anywhere requires changing all of them — and rebuilding the bundle.

- **AGENTS.md is canonical; CLAUDE.md is only a forwarder.** At every level — root project context, per-folder durable-context marker — `AGENTS.md` holds the content and a sibling `CLAUDE.md` contains exactly `See @AGENTS.md for more information.`. The plugins enforce this: `agents-md-setup` writes both; `init`, `distil`, and `scaffold-docs` write both when marking a durable-context folder; scope detection looks only for `AGENTS.md` (an `AGENTS.md`-less directory with a `CLAUDE.md` is treated as not-yet-set-up, even if that `CLAUDE.md` has real content). `AGENTS.md` is the multi-tool standard (Cursor, Codex, and Claude Code all read it); `CLAUDE.md` exists for Claude Code's native discovery only. Do not partially revert this in any skill — they all assume the same rule.
