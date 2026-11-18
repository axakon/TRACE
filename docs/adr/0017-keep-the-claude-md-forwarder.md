# 0017. Keep the CLAUDE.md forwarder beside every AGENTS.md

*2026-11-18*

## Context

ADR 0015 dropped the one-line `CLAUDE.md` forwarder (`See @AGENTS.md for more information.`) because Claude Code 2.1.277 and later reads `AGENTS.md` itself. TRACE 2.1.0 shipped that, and doctor offered to delete existing forwarders. This ADR supersedes 0015.

Claude Code's **Project instructions** setting decides which file it reads. The default, `claude-md-or-agents-md`, reads `AGENTS.md` only when no `CLAUDE.md`, `CLAUDE.local.md`, or `.claude/CLAUDE.md` sits in that folder or a folder above it. `claude-md-and-agents-md` reads both. Fresh `claude -p` runs with canary files on Claude Code 2.1.327, on 2026-11-18, showed under the default:

- `AGENTS.md` alone loads.
- A `CLAUDE.md` without an import, or a `CLAUDE.local.md`, beside `AGENTS.md`: only the CLAUDE file loads.
- A `CLAUDE.md` or `.claude/CLAUDE.md` in a parent folder: only the CLAUDE file loads.
- A `CLAUDE.md` that imports `@AGENTS.md`: both load.
- A root forwarder and a subfolder with only `AGENTS.md`: reading a file in the subfolder does not load the subfolder's `AGENTS.md`. With a forwarder in the subfolder too, it loads.

With `claude-md-and-agents-md`, every case loaded `AGENTS.md`. The maintainer had that set, which is why 2.1.0 looked fine in this repo.

A repo cannot choose the setting for its teammates. Claude Code reads it from user settings, a `--settings` file, or managed settings, and ignores it in a project's `.claude/settings.json`. A forwarder does not make Claude Code read `AGENTS.md` twice under either setting, per the Claude Code memory docs.

So under the default, one personal `CLAUDE.local.md`, a parent repo's `CLAUDE.md`, or the forwarder at the root hides `AGENTS.md` without a sign. 2.1.0's doctor reported those cases (`agents-md-hidden`), but only for developers who run doctor.

## Decision

We will write the forwarder beside every `AGENTS.md` again, as before ADR 0015. `init`, `agents-md-setup`, and `distil` write it, and doctor warns when it is missing or is not the exact one-line forwarder, beside the scope root and docs-folder `AGENTS.md`.

Doctor goes back to its 2.0.0 checks. It drops `legacy-forwarder` and `agents-md-hidden`, and it does not report CLAUDE files above the scope. Working around the default setting beyond the forwarder is Claude Code's job, not TRACE's.

One 2.0.0 behaviour stays fixed: doctor no longer accepts a forwarder whose import is in backticks, since Claude Code does not follow it.

## Consequences

`AGENTS.md` loads in Claude Code under every setting, on versions before 2.1.277 too, and beside any other CLAUDE file. Every folder with an `AGENTS.md` carries a second, one-line file again.

Adopters who deleted their forwarders on 2.1.0's advice get a doctor warning for each, and doctor's auto-fix writes them back.

A CLAUDE file above the scope, such as a stray `~/.claude/CLAUDE.md` when `CLAUDE_CONFIG_DIR` points elsewhere, still loads as project instructions. Doctor no longer says so.
