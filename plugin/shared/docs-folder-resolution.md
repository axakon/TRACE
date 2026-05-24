# Resolving a scope's durable-context folder

Several skills need to know where a scope's durable project context lives — the folder `/playbook:distil` writes distilled knowledge into. This file is the single source of truth for that resolution. `distil` and `claude-md-setup` follow the precedence below to *find* the folder; `init` is the interactive command that *writes* the config this precedence reads.

A *scope* is a repo or sub-repo root — any directory with its own `CLAUDE.md`. Resolve the folder per scope, never globally.

## The marker

The playbook recognises its own durable-context folder by a marker: a `CLAUDE.md` inside the folder whose first non-blank heading is `# Durable project context`. That heading comes from the context-folder template the playbook writes. A folder carrying it is "playbook-marked".

## Precedence

For a given scope, take the **first** match:

1. **Persisted config.** Read `<scope>/.claude/.playbook/config.json`. If it has a `docs_folder` field, that path (relative to the scope root) is authoritative. This is what `/playbook:init` writes.
2. **Playbook-marked folder.** A folder at the scope whose `CLAUDE.md` is playbook-marked (see above). If exactly one exists, use it.
3. **Existing `docs/`.** If `<scope>/docs/` exists, use it — even without a marker.
4. **Default.** `<scope>/docs/`, which may not exist yet.

## Marking on first write

In cases 3 and 4 the folder may not yet be playbook-marked. When a skill writes the first distilled file into an unmarked folder, it also writes the marker `CLAUDE.md` (from the context-folder template) and tells the developer the marker is landing alongside any existing content. A folder reached via case 1 or 2 is already marked — do not re-mark it.
