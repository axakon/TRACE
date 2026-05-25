---
name: init
description: Configure the playbook for this scope — choose where durable project context lives, mark the folder, and persist the choice. Recommended as the first playbook command in a fresh repo, before /playbook:claude-md-setup. Safe to re-run to change the location.
disable-model-invocation: true
allowed-tools: Glob Read Write Edit AskUserQuestion
---

You are configuring the playbook for the current scope — choosing where this scope's durable context lives (the folder `/playbook:distil` writes into), persisting that to `<scope>/.claude/.playbook/config.json`, and marking the folder with a small `CLAUDE.md`.

The scope is the current working directory; init does not walk upward. A root `CLAUDE.md` is not required — the recommended order is `/playbook:init` then `/playbook:claude-md-setup`, so a missing one is normal on a fresh setup.

Before doing anything, read:
- [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — the marker definition and the precedence the rest of the playbook reads
- [context-folder-template.md](../distil/context-folder-template.md) — the marker file you write into the chosen folder

## Phase 1: Check for existing config

Read `<scope>/.claude/.playbook/config.json` if it exists. If it does, show the current `docs_folder` value and call `AskUserQuestion`: **Keep as-is** (exit, no changes) / **Change location** (proceed) / **Cancel** (exit).

If the file does not exist, proceed.

## Phase 2: Discover candidates and choose

Use the Glob tool to list top-level directories. Identify two kinds of candidate:

- **Already playbook-marked** — a folder whose `CLAUDE.md` is playbook-marked (see the marker definition in [docs-folder-resolution.md](../../shared/docs-folder-resolution.md)). Read the first ~30 lines of each candidate folder's `CLAUDE.md` to check.
- **Existing docs roots** — `docs/`, `documentation/`, `wiki/`: folders that look like documentation homes even without a marker.

Show concisely what you found. Do not auto-pick. Then call `AskUserQuestion` with up to four options, ordered by strength, including only the rows that apply (the auto-added "Other" covers anything else):

- The strongest already-marked candidate, if any — e.g. **Use existing marked folder `docs/`**
- One reasonable existing docs root, if different from the above — e.g. **Use existing `documentation/`**
- **Create or use `docs/`** — the playbook default, whether or not `docs/` exists
- **Type a custom path** — for `claude-context/`, `internal/docs/`, etc.

If the developer picks a folder that already contains hand-written content, tell them in plain text before continuing: a small `CLAUDE.md` marker will be written into it describing what `/playbook:distil` writes there, and that hand-written docs alongside it are fine. Confirm once in chat (no second `AskUserQuestion`).

## Phase 3: Mark the folder

Write `<chosen-folder>/CLAUDE.md` using the body of [context-folder-template.md](../distil/context-folder-template.md), dropping the leading "# CLAUDE.md (template for...)" preamble — start from the `# Durable project context` heading. The Write tool creates parent directories, so a non-existent folder is fine.

If `<chosen-folder>/CLAUDE.md` already exists:

- If it is already playbook-marked, leave it alone and report no change in Phase 6.
- If it differs, show the existing content briefly and call `AskUserQuestion`: **Overwrite with template** / **Leave existing** / **Cancel init**.

## Phase 4: Persist the choice

Write `<scope>/.claude/.playbook/config.json` with the chosen folder path, relative to the scope root:

```json
{
  "docs_folder": "docs/"
}
```

Substitute the developer's actual choice; keep a trailing slash. Overwrite if it already exists — the chosen value supersedes any previous one.

## Phase 5: Update the root CLAUDE.md directory index (only if one exists and is stale)

Skip entirely if no `CLAUDE.md` exists at the scope root — `/playbook:claude-md-setup` reads the config you just wrote and seeds the entry itself.

If a `CLAUDE.md` exists, check its `## Directory index`. If the chosen folder is already listed with a reasonable description, do nothing. If the index is missing the folder, or still points at a different/old location (e.g. after a re-run that changed the location), propose an Edit adding or correcting the row and call `AskUserQuestion`: **Apply** / **Skip**. Standard description text (matches `claude-md-setup`):

> Durable project context — distilled conventions, security boundaries, design choices, and gotchas. Maintained by `/playbook:distil` in small files scoped to one area each. Consult related files before substantive work in the area they cover; they outrank general defaults.

## Phase 6: Summarise

One short message listing only the bullets that apply: the chosen folder (created or pre-existing); whether the marker was written, already present, or overwritten; whether the root index was updated or skipped; the config path `.claude/.playbook/config.json`; and — if no root `CLAUDE.md` exists — a single line suggesting `/playbook:claude-md-setup` next.

## Notes

- Init is per-scope. In a super-repo, run it once per scope; the repo root and each sub-repo are independent.
- The config file is plain JSON. Developers can edit it by hand later, or re-run `/playbook:init` to update marker, index, and config in one step.
- Both `/playbook:distil` and `/playbook:claude-md-setup` read this config. If it is absent, both fall back to the precedence in [docs-folder-resolution.md](../../shared/docs-folder-resolution.md).
- Init does not move files or run shell commands. It only writes the scope's chosen-folder marker, the config file, and (with approval) the root CLAUDE.md index entry.
