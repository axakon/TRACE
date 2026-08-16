# Resolving a scope's durable-context folder

Several skills need to know where a scope's durable project context lives — the folder `/trace:distil` writes distilled knowledge into. This file is the single source of truth for that resolution. `distil` and `agents-md-setup` follow the precedence below to *find* the folder; `init` is the interactive command that *writes* the config this precedence reads.

A *scope* is a repo or sub-repo root — any directory with its own `AGENTS.md`. Resolve the folder per scope, never globally. An existing `CLAUDE.md` without a sibling `AGENTS.md` does **not** make a directory a scope — per TRACE's convention, only AGENTS.md is canonical, and CLAUDE.md only exists as a one-line forwarder.

## The marker

TRACE recognises its own durable-context folder by a marker: an `AGENTS.md` inside the folder whose first non-blank heading is `# Durable project context`. That heading comes from the context-folder template TRACE writes. A folder carrying it is "TRACE-marked".

Alongside the AGENTS.md marker TRACE also writes a one-line `CLAUDE.md` forwarder (`See @AGENTS.md for more information.`) into the same folder, so Claude Code's native CLAUDE.md discovery finds the marker too. The forwarder is **not** what TRACE checks for — the marker is always the AGENTS.md.

## Precedence

For a given scope, take the **first** match:

1. **Persisted config.** Read `<scope>/.claude/.trace/config.json`. If it has a `docs_folder` field, that path (relative to the scope root) is authoritative. This is what `/trace:init` writes. If that file is absent, read `<scope>/.claude/.playbook/config.json` — the pre-1.0 location — and treat it the same way. `/trace:init` migrates the old file when it runs; until then the fallback keeps existing adopters resolving correctly.
2. **TRACE-marked folder.** A folder at the scope whose `AGENTS.md` is TRACE-marked (see above). If exactly one exists, use it.
3. **Existing `docs/`.** If `<scope>/docs/` exists, use it — even without a marker.
4. **Default.** `<scope>/docs/`, which may not exist yet.

## Marking on first write

In cases 3 and 4 the folder may not yet be TRACE-marked. When a skill writes the first distilled file into an unmarked folder, it also writes the marker pair — `<docs-folder>/AGENTS.md` (from the context-folder template) plus a one-line `<docs-folder>/CLAUDE.md` forwarder — and tells the developer the marker is landing alongside any existing content. A folder reached via case 1 or 2 is already marked — do not re-mark it.
