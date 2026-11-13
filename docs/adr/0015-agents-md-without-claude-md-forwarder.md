# 0015. Write AGENTS.md only, without a CLAUDE.md forwarder

*2026-11-10*

## Context

Every TRACE skill that writes an `AGENTS.md` also wrote a one-line `CLAUDE.md` beside it: `See @AGENTS.md for more information.` Claude Code read only `CLAUDE.md`, and the forwarder's import was the only way it reached `AGENTS.md`.

Claude Code 2.1.277 added native AGENTS.md support. A controlled test on 2.1.322, with hooks off and no tools, showed:

- A folder with only `AGENTS.md` loads it, and `@path` imports inside it resolve.
- A nested `AGENTS.md` loads when Claude reads a file in that folder.
- A `CLAUDE.md`, `CLAUDE.local.md`, or `.claude/CLAUDE.md` in the same folder or a folder above stops Claude Code reading `AGENTS.md`. A root `CLAUDE.md` with its own content hid a nested `AGENTS.md` too.
- The user's own `CLAUDE.md` in the Claude config folder doesn't count. With `CLAUDE_CONFIG_DIR` set to another folder, `~/.claude/CLAUDE.md` is no longer that file, and it hid `AGENTS.md` in every project under the home folder. A proxy log of the API requests confirmed it.
- A forwarder written as ``See `@AGENTS.md` `` loads nothing: Claude Code does not follow an import inside backticks. This repo's root `CLAUDE.md` had that form.
- The old forwarder still works. It loads `AGENTS.md` once.

The other harnesses checked on 2026-11-10: Codex, Copilot (cloud agent, CLI, and VS Code), Cursor, Windsurf, Amp, OpenCode, Zed, Junie, Kiro, Roo Code, and Factory Droid read `AGENTS.md` natively. Gemini CLI needs `context.fileName` set, and Aider needs `--read`. Neither reads `CLAUDE.md` either, so the forwarder never helped them.

Alternatives considered:

1. **Keep the forwarder.** It costs one file per folder and still works on Claude Code before 2.1.277. But it is a second file every adopter has to keep exact, and doctor warned whenever one went missing.
2. **Delete forwarders automatically in doctor.** Deleting one forwarder while a parent `CLAUDE.md` stays hides the `AGENTS.md` below it, so the choice needs a look at the whole scope.

## Decision

We will write `AGENTS.md` only. `init`, `agents-md-setup`, and `distil` no longer write a `CLAUDE.md`, and doctor no longer warns that one is missing.

Doctor reports two new findings. `legacy-forwarder` marks an old forwarder, and the doctor skill offers to delete every forwarder in the scope together. It keeps a forwarder where another CLAUDE file sits beside it, and when a CLAUDE file above the scope would hide `AGENTS.md` (`kept_by`). `agents-md-hidden` marks a `CLAUDE.md`, `CLAUDE.local.md`, or `.claude/CLAUDE.md` that hides `AGENTS.md` because it has no `@AGENTS.md` import. It also marks an `AGENTS.md` that a CLAUDE file in a parent folder hides, and lists those files in `hidden_by`. When `CLAUDE_CONFIG_DIR` is set elsewhere and `~/.claude/CLAUDE.md` is one of them, the message says to move it into the config folder.

The setup skills leave existing forwarders alone. Doctor removes them, because only it looks at every forwarder in the scope at once.

## Consequences

New adopters get one instruction file. Claude Code users need 2.1.277 or later. On older versions, Claude Code loads no project instructions from a TRACE setup.

Adopters from 2.0.0 and earlier keep working until they run doctor. A developer who adds a CLAUDE file later, or keeps `~/.claude/CLAUDE.md` with a custom `CLAUDE_CONFIG_DIR`, hides `AGENTS.md` from Claude Code without noticing; doctor reports it.

The context graph still counts an `AGENTS.md` that a `CLAUDE.md` hides. That is listed as a known simplification in `docs/architecture/context-graph.md`.
