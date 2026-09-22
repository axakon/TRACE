# TRACE packages

For maintainers of TRACE. Adopters receive the generated plugin folders, not this file.

## Source and distribution

| Path | Purpose |
|---|---|
| `plugin-src/` | Authored skills, templates, scripts, and viewer source |
| `plugin-src/catalog.json` | One version and metadata for every package |
| `plugin-src/adapters/` | Claude and Codex tool, question, and approval instructions |
| `deliverable/plugins/<name>/` | Generated Claude packages; existing marketplace paths |
| `plugins/<name>/` | Generated native Codex packages |
| `.claude-plugin/marketplace.json` | Generated Claude catalog |
| `.agents/plugins/marketplace.json` | Generated Codex catalog |
| `scripts/generate-plugins.js` | Deterministic package generation and drift check |
| `scripts/verify-plugins.js` | Automated checks and release version check |

Paths in this table are repository-relative. Read [package architecture](../../docs/architecture/plugin-distribution.md) and [release procedure](../../docs/system/releasing.md) for the contracts and commands.

## Working rules

- Edit `plugin-src/`, then generate both harnesses. Never patch generated output directly.
- Keep skills, scripts, and shared files self-contained after installation. Add-ons invoke core skills through their harness. They never read a sibling plugin cache directory.
- Keep shared behaviour in one source. Harness differences belong in adapters. The generator rejects unknown or unresolved adapter fields.
- Keep one version in `catalog.json`. Both distributions and all plugin identities ship together.
- Use Node built-ins for scripts and tests. Consumers need Node.js 18 or later and never install build dependencies. The viewer build uses its existing locked npm toolchain.
- Validate on macOS. Keep portable Node code; Windows validation is outside the current support claim.
- Keep AGENTS.md canonical and CLAUDE.md the exact one-line forwarder: `See @AGENTS.md for more information.`
- Preserve the docs-folder precedence and old `.claude/.playbook/config.json` compatibility read. Change all readers together if that contract changes.
- Keep scope discovery, docs-folder resolution, and markdown helpers in `plugin-src/trace/scripts/trace-lib.js`. `doctor.js` and `context-graph.js` both require it; do not copy a helper into a script.
- `scripts/tests/fixtures/context-graph/` and its `context-graph.expected.json` are the output contract for `context-graph.js`, written down in `docs/architecture/context-graph.md`. Change the contract first, then the golden file. Never regenerate the golden file to make a test pass.
- Preserve existing configuration and epic file formats. No session transfer mechanism is required.
- Preserve hand-authored templates and examples. Do not pre-author playbook content or promote working notes while maintaining plugins.

## Skills and hooks

- Keep skill descriptions short and discriminating. Keep explicit-only invocation policies when generating Codex metadata.
- Adding or removing a skill changes the expected counts in `scripts/validate-packages.js` (`expectedSkills`). Update them in the same change, or `verify-plugins.js` fails with `Wrong skill inventory`.
- Read `plugin-src/trace/shared/authoring-rules.md` before changing prose. Plugin-specific style files add to those rules; they must not contradict or restate them.
- Prose-authoring skills use their existing examples to establish depth. If an example has a stated word or line count, remeasure after changing it.
- Preserve real approval points. Preview creation is authorized planning work; implementation and final epic writes wait for the developer's approval.
- Use each host's available question controls. Codex skills must not assume Claude tools or environment substitutions exist.
- Core owns SessionStart, edit observation, and UserPromptSubmit. Planning skills explicitly call the viewer; there are no ExitPlanMode viewer hooks.
- Hook scripts return quietly for missing or malformed input. Set `TRACE_DEBUG_HOOKS=1` to diagnose failures. Explicit viewer commands report errors and return a working URL only after verifying it.
- The distillation sentinel is a soft reminder. Do not force a skill invocation from a hook. Normalize both Claude file paths and Codex patch commands before filtering documentation edits.
- Read current official host documentation before changing plugin, hook, skill, or dependency contracts. The runtime and actual installed-package tests take precedence over assumptions.

## Viewer invariants

- Keep the browser bundle committed. Rebuild from `plugin-src/trace-plan/viewer/` when its source changes, then regenerate packages.
- Keep service identity consistent between discovery and the server. Match the served directory and skill command before reusing a server.
- Scan the whole port range before choosing a free port. A free lower port must not hide a running compatible server.
- Preserve the 90-second focus staleness window; hidden browser tabs are throttled. The server consumes each pending focus target once.
- Keep the story sentence contract in skills and renderer together: `As a <role>, I want <capability>, so that <consequence>`.
- Ticket frontmatter is authoritative. The board table is derived from it. Preview status edits must not modify the final epic.

## Verification

Run `node scripts/generate-plugins.js`, then `node scripts/verify-plugins.js`. The latter runs Node tests, package checks, doctor, and version checks. CI repeats the checks on macOS and rejects any tracked or untracked generated drift.

If `verify-plugins.js` fails at the drift check with `obsolete:` lines under `.claude/` in a package folder, a local plugin session wrote state there. The files are gitignored, so `git status` stays clean. A plain `node scripts/generate-plugins.js` removes them.

For a release, follow the shared procedure. Script tests alone do not establish native interview or approval behaviour, so try changed skills in a live client.
