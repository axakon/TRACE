---
name: init
description: Configure the playbook for this scope — choose where durable project context lives, copy the canonical three-category doc structure into it, mark the folder, and persist the choice. Recommended as the first playbook command in a fresh repo, before /playbook:agents-md-setup. Safe to re-run to change the location.
disable-model-invocation: true
argument-hint: [path]
allowed-tools: Glob Read Write Edit AskUserQuestion
---

You are configuring the playbook for the current scope. Init does four things, in order:

1. Choose where this scope's durable context lives (the folder `/playbook:distil` writes into).
2. Lay down the canonical three-category doc structure inside it (`system/`, `architecture/`, `adr/`, `reference/`, `working-notes/`, each with a README copied verbatim from the plugin).
3. Mark the folder with `AGENTS.md` + `CLAUDE.md` forwarder so the rest of the playbook recognises it.
4. Persist the choice to `<scope>/.claude/.playbook/config.json`.

Resolve the scope per [scope-resolution.md](../../shared/scope-resolution.md) — `$ARGUMENTS` if given, otherwise cwd. A root `AGENTS.md` is not required — the recommended order is `/playbook:init` then `/playbook:agents-md-setup`. Init does **not** touch any `AGENTS.md` outside the chosen folder; the directory index is `/playbook:agents-md-setup`'s job.

Before doing anything, read:
- [scope-resolution.md](../../shared/scope-resolution.md) — how the optional `[path]` argument resolves into a scope root
- [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — the marker definition and the resolution precedence the rest of the playbook reads
- [context-folder-template.md](../distil/context-folder-template.md) — the marker file written in Phase 4

## Phase 1: Check for existing config

Read `<scope>/.claude/.playbook/config.json` if it exists. If it does, show the current `docs_folder` value and call `AskUserQuestion`: **Keep as-is** (exit) / **Change location** (proceed) / **Cancel** (exit).

If the file does not exist, proceed.

## Phase 2: Discover candidates and choose

Glob the top-level directories. Identify:

- **Already playbook-marked** — a folder whose `AGENTS.md` is playbook-marked (see [docs-folder-resolution.md](../../shared/docs-folder-resolution.md)). Read the first ~30 lines to check. A `CLAUDE.md` without a sibling `AGENTS.md` does **not** count.
- **Existing docs roots** — `docs/`, `documentation/`, `wiki/`: folders that look like documentation homes even without a marker.

Show concisely what you found. Then call `AskUserQuestion` with up to four options, ordered by strength, including only rows that apply (the auto-added "Other" covers anything else):

- The strongest already-marked candidate, if any.
- One reasonable existing docs root, if different.
- **Create or use `docs/`** — the playbook default.
- **Type a custom path** — for `claude-context/`, `internal/docs/`, etc.

If the developer picks a folder that already contains hand-written content, tell them in plain text before continuing: the playbook's three-category structure and marker will be laid down alongside whatever is there. Confirm once in chat — no second `AskUserQuestion`.

## Phase 3: Copy the canonical doc structure

Copy each of these six files from the plugin's `shared/doc-structure/` to `<chosen-folder>/`, preserving sub-paths. Read each source via the Read tool (`../../shared/doc-structure/<path>` relative to this skill), then Write to the target. The Write tool creates parent directories.

| Source | Target |
|---|---|
| `../../shared/doc-structure/README.md` | `<chosen-folder>/README.md` |
| `../../shared/doc-structure/system/README.md` | `<chosen-folder>/system/README.md` |
| `../../shared/doc-structure/architecture/README.md` | `<chosen-folder>/architecture/README.md` |
| `../../shared/doc-structure/adr/README.md` | `<chosen-folder>/adr/README.md` |
| `../../shared/doc-structure/reference/README.md` | `<chosen-folder>/reference/README.md` |
| `../../shared/doc-structure/working-notes/README.md` | `<chosen-folder>/working-notes/README.md` |

For each target, if it already exists:

- If its content is byte-identical to the source, skip silently — the structure is already in place.
- Otherwise, show what's there briefly and call `AskUserQuestion`: **Overwrite with canonical** / **Leave existing** / **Cancel init**.

Author nothing beyond these six READMEs. In particular, do not create `architecture/overview.md`, `adr/0000-record-architecture-decisions.md`, or any topic files under `system/` — those land later, with real content, via other skills or the developer. Pre-authoring empty stubs is a violation of the playbook's guardrails.

## Phase 4: Mark the folder

Write `<chosen-folder>/AGENTS.md` using the body of [context-folder-template.md](../distil/context-folder-template.md), dropping the leading "# AGENTS.md (template for...)" preamble — start from the `# Durable project context` heading.

Write `<chosen-folder>/CLAUDE.md` as the one-line forwarder:

```
See @AGENTS.md for more information.
```

If `<chosen-folder>/AGENTS.md` already exists:

- If it is already playbook-marked, leave it alone.
- If it differs, show the existing content briefly and call `AskUserQuestion`: **Overwrite with template** / **Leave existing** / **Cancel init**.

If `<chosen-folder>/CLAUDE.md` exists with content other than the one-line forwarder, overwrite it — per the plugin's convention CLAUDE.md is always just a forwarder.

## Phase 5: Persist the choice

Write `<scope>/.claude/.playbook/config.json`:

```json
{
  "docs_folder": "docs/"
}
```

Substitute the developer's actual choice; keep the trailing slash. Overwrite if present — the chosen value supersedes any previous one.

## Phase 6: Summarise

One short message listing only the bullets that apply:

- The chosen folder (created or pre-existing).
- Which of the six canonical README files were written, already present, or overwritten.
- Whether the marker pair (`AGENTS.md` + `CLAUDE.md` forwarder) was written, already present, or overwritten.
- The config path `.claude/.playbook/config.json`.
- If no `AGENTS.md` exists at the scope root, one line suggesting `/playbook:agents-md-setup` next (pass the same path argument when the scope isn't cwd) — that skill owns the scope's AGENTS.md, and without it `/playbook:distil` won't recognise this folder as its own scope.

## Notes

- Init is per-scope. In a super-repo, run it once per scope; the repo root and each sub-repo are independent.
- The six READMEs describe the three-category model (descriptive / prescriptive / historical). They are reference material for readers of the docs folder, not content the playbook fills in for the developer.
- Both `/playbook:distil` and `/playbook:agents-md-setup` read this scope's config. If it is absent, both fall back to the precedence in [docs-folder-resolution.md](../../shared/docs-folder-resolution.md).
