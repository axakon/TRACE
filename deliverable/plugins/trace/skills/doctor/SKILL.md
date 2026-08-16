---
name: doctor
description: Validate a TRACE-adopted scope against TRACE's own conventions — doc structure, marker pairs, AGENTS.md spec, ADR numbering and immutability, working-note banners, relative links — then guide the fixes. Owns the resolution flow for ADR number collisions left by merged branches. Useful after merges, before releases, or whenever the structure feels off.
disable-model-invocation: true
argument-hint: [path]
allowed-tools: Bash(node *) Bash(git log*) Glob Read Edit Write AskUserQuestion
---

You are running TRACE's structure validator: a deterministic script finds the violations; you fix them.

**Bias to act.** Every fix lands as an uncommitted edit the developer reviews with `git diff` and can revert, so apply fixes automatically when you are confident. Ask only when you are genuinely unsure which fix is right, or when the action would overwrite content that can't be reconstructed. When you do ask, batch every uncertain item into one question — never a drip of approvals.

Before doing anything, read [scope-resolution.md](../../shared/scope-resolution.md) — how the optional `[path]` argument resolves into a scope root.

## Phase 1: Run the check

Resolve the scope per [scope-resolution.md](../../shared/scope-resolution.md) — `$ARGUMENTS` if given, otherwise cwd. Then:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.js" check <scope-root>
```

The JSON report covers: canonical doc structure and marker pairs, the root AGENTS.md against its spec, ADR filenames / sequential numbering / collisions / post-ship edits, working-note banners and `Status:` headers, and relative-link resolution across the docs tree and root AGENTS.md. If the resolved `docs_folder` in the report is wrong, re-run with `--docs <folder>`.

**Monorepos:** when the scope contains nested scopes (project-level `AGENTS.md` files under the root), add `--all` — the script discovers every scope and returns one report per TRACE-adopted scope (`scope_rel` names each). Triage and fix per scope; the phases below apply to each in turn. Two things `--all` deliberately does not validate: an `AGENTS.md` inside another scope's docs folder is docs content (a folder guide), never a scope; and a scope with a bare `AGENTS.md` but no TRACE config or marked docs folder comes back under `context_only` — mention those as information ("run `/trace:init <scope>` if it should carry the tree"), since adopting a scope is a decision, not a repair.

## Phase 2: Triage the report

Clean report (`ok: true`, no warnings): say so in one line and stop.

Otherwise, list the findings in one short block (errors first, plain language, file + convention broken; note any `skipped` checks), sort each into **auto-fix** or **needs input** per the rules in Phases 3–4, state the split in one line ("fixing N automatically; M need your input"), and proceed. No approval gate to start — the working tree is the approval surface.

## Phase 3: Resolve ADR number collisions (when the report has `adr-collision`)

Two files sharing a number is almost always a branch merge: each branch minted the same next number for a different decision. The files are fixed mechanically; the *references* to that number are not — a comment written before the merge means one specific decision, and only reading it tells which. Never bulk-rewrite references.

1. **Decide which file keeps the number.** The file that shipped first keeps it (check with `git log --diff-filter=A --format="%aI %H" -- <each-file>`); its number has been citable for longer. A clear date order decides it — announce the choice and proceed. Ask only when the signal is genuinely absent (no git, same commit, identical dates).

2. **Renumber the other file** to the report's `suggested_free` number:

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.js" migrate <file> <NNNN> <scope-root>
   ```

   The script renames the file, rewrites its own title heading, and returns `references_to_old_number` — every place in the scope (code comments, docs, other ADRs, supersession banners) that mentions the old number, with file, line, and the line's text.

3. **Resolve each reference by reading it.** Every scope numbers its own ADRs, so first check each entry's `nearest_scope`: a reference whose nearest scope differs from the collided ADR's scope refers to *that* scope's own sequence — leave it unchanged; it isn't part of this collision. For the rest, open enough surrounding context to judge which decision the reference means, then split by confidence:
   - **Confident** — the line names the slug or filename, or the surrounding context plainly matches one decision's subject and not the other's. Apply directly: leave it (means the keeper) or rewrite to the new number/filename (means the renumbered one).
   - **Uncertain** — the context fits both decisions, or there's no context to read. Collect these and ask once, quoting each line with your best guess. A `> Superseded by <old-number>.` banner is always in this bucket unless the superseding ADR's own text names its target — pointing it at the wrong decision silently corrupts the record.

4. Re-run `refs <old-number>` afterwards; every remaining hit should be one you deliberately left. Include the full resolution list (reference → kept / rewritten → why) in the Phase 5 summary.

## Phase 4: Fix the remaining findings

**Auto-fix (apply, then report):**

- **Missing or non-forwarder `CLAUDE.md`** → write the forwarder (`See @AGENTS.md for more information.`). Overwriting is safe only when the existing content is a forwarder variant; anything with real content goes to the ask bucket.
- **Missing docs-folder marker `AGENTS.md`** → write it from [context-folder-template.md](../distil/context-folder-template.md) — only when no `AGENTS.md` exists there at all.
- **Working-note banner / `Status:` missing** → insert the banner line right under the title and `Status: Research note`.
- **Broken relative links where the target clearly moved** (the file exists elsewhere in the scope under the same name) → fix the path.
- **Missing canonical READMEs / structure** → run the copy directly: `node "${CLAUDE_PLUGIN_ROOT}/scripts/copy-doc-structure.js" <docs-folder>` (copies only missing files; never overwrites).

**Needs input (batch into one question):**

- **An existing `AGENTS.md` or `CLAUDE.md` with real, non-template content** in the way of a marker or forwarder — never overwrite prose you didn't write.
- **Broken links whose target never existed or is ambiguous** (several same-named candidates, or none).

**Report only (never auto-fix):**

- **Root AGENTS.md out of spec** → recommend `/trace:agents-md-setup` (review mode); piecemeal patching fights that skill's interview.
- **Shipped ADR edited beyond a supersession banner** → show what changed (`git diff` against the adding commit) and recommend reverting or a superseding ADR via `/trace:adr`. Rewriting records is not doctor's call.
- **ADR numbering gaps** → a gap is history, not damage; renumbering shipped ADRs breaks references.

## Phase 5: Confirm clean and summarise

Re-run the check. Summarise: every fix applied (this list is the developer's review guide — all of it is uncommitted, `git diff` shows the exact changes), the collision resolution list from Phase 3, what was asked and decided, and what was left with the reason.

## Notes

- Other skills and agents can run the script directly as a cheap deterministic check — `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.js" check` — without invoking this skill's fix flow.
- The script never rewrites ADR references itself; that judgment is this skill's Phase 3. Confident resolutions apply automatically; the developer is asked only about the genuinely ambiguous ones.
- On a repo that deviates from the canonical structure on purpose (no plugin, hand-rolled docs), findings are information, not orders — say so rather than pushing fixes.
