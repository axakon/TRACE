# Plan: knowledge-map (cross-scope doc catalog)

Status: implemented on branch `feat/knowledge-map` (v0.19.0), pending end-to-end
testing in a real monorepo. This note is research/intent — not authoritative;
the binding decision is [ADR 0002](../adr/0002-knowledge-map-cross-scope-doc-catalog.md).

## Problem (felt, not speculative)

In a monorepo of ~40 services where every service implements TRACE plus a root
org-level implementation, agents have **missed existing info on the first pass**
and **missed binding ADRs** — the knowledge existed in another scope (a sibling
service or the org root) but the agent never crossed the boundary to find it.

This is a **discovery** problem, not a search-quality problem. The fix is to put
a scoped map of what's documented where in front of the agent *before it acts* —
not to rank text better. Embeddings address neither symptom and are explicitly
out of scope.

## Why not the alternatives

- **Embeddings / vector store** — solves a problem we don't have (the consumer
  is Claude Code, which already has `Grep`/`Read`); adds a model dependency and
  a re-index step; violates the plugin's "Node built-ins only, no build step"
  constraint. Context-stripped chunks are worse for code anyway.
- **A committed index file** — churns on every doc edit (noisy diffs, merge
  conflicts across 40 services) and goes stale when regeneration is forgotten.
- **Indexing code comments** — high volume, low signal, per-language parsing,
  and comments are meaningless out of their surrounding code. Dropped.

## Approach

The "index" is **ephemeral** — generated on demand by a Node script and emitted
into the agent's context. Nothing is committed; there is no file to keep fresh,
so no PostToolUse regeneration step. This reuses the existing
`scripts/inject.js` shape (script → `additionalContext` at `SessionStart`).

### What's a scope

A scope is any directory with its own `AGENTS.md` (a repo or sub-repo root) —
per `shared/scope-resolution.md`. A bare `CLAUDE.md` doesn't count. In the target
monorepo: the root TRACE implementation plus each of the ~40 services that
carries an `AGENTS.md` — ~41 scopes, each with its own docs folder.

### Catalog content (all scopes)

The catalog resolves **every scope in the repo**, not just the ancestors of the
launch cwd. Descend from the repo root, find every `AGENTS.md`, and for each
scope's docs folder emit:

- `system/` filenames (descriptive topics)
- `architecture/` filenames (prescriptive topics)
- `adr/` entries: number + title, with a `(superseded)` flag when the file
  carries a `> Superseded by NNNN.` line. **No status field exists** — shipped
  ADRs are accepted by convention.

Frontmatter `description:` is read when present to annotate a topic; absent is
fine (ADRs and most docs here have none).

Sizing: filenames + ADR titles only (never content) — ~100–150 tokens per scope,
so ~41 scopes ≈ 4–6k tokens. Cheap enough to resolve the whole tree and, if
desired, auto-inject it whole. Ordering: put the launch cwd's scope (and the
root) first so the agent's own context is unmissable, then the rest.

### Emitted format (illustrative)

```
## Knowledge map (generated — read the relevant file before acting in its area)
You are in: services/payments

<root> (org-level)
  system/        tenancy, auth
  adr/           0001. Monorepo over polyrepo
                 0004. ADRs are scope-local  (superseded by 0007)

services/payments   ← your scope
  system/        data-model, webhooks, idempotency
  architecture/  retry-policy
  adr/           0001. Token-bucket rate limiting
                 0003. Idempotency keys

services/billing
  system/        invoicing, tax
  adr/           0001. Money as integer minor units

services/notifications
  system/        templates, delivery
  …(all remaining scopes follow)

ADRs are binding within their scope. Read a file before working in its area.
```

## Scoping guarantees (no random MD)

The script **never globs `**/*.md`**. It only reads from each scope's resolved
durable-context folder, and only the known subfolders within it:

- Resolve each scope's docs folder via `shared/docs-folder-resolution.md`
  precedence (config `docs_folder` → playbook-marked folder → existing `docs/` →
  default `docs/`). This is the same folder `/playbook:distil` writes into — so
  the catalog reads exactly the TRACE docs folder, not arbitrary directories.
- Inside that folder, read only `system/`, `architecture/`, and `adr/`. Skip
  `reference/` and `working-notes/` — they're historical/in-progress, not the
  current binding knowledge the map is for (this very plan file lives in
  `working-notes/` and must not appear in the catalog).
- A stray `.md` anywhere else in the tree (repo root, a service's `src/`, a
  `CHANGELOG.md`) is invisible to the catalog by construction.

**Directory traversal ignores package/build/vcs folders.** Resolving all scopes
means descending the whole tree from the repo root to find every `AGENTS.md`, so
this ignore set is load-bearing (not optional). The descent skips a static set —
`node_modules`, `.git`, `dist`, `build`, `out`, `target`, `vendor`, `.next`,
`coverage`, `.venv`, `__pycache__` — and does not recurse into them. Static set
over `.gitignore` parsing: simpler, no deps, cross-platform. Stop descending into
a scope's own subfolders once found, except to keep looking for *nested* scopes
(a sub-repo inside a sub-repo).

## Components

1. **`scripts/build-catalog.js`** — pure Node, built-ins only, cross-platform.
   - Input: optional root path to scan (arg; defaults to repo root / cwd).
   - Descends the tree from there to discover **every** scope (`AGENTS.md`),
     skipping the ignore set — per `shared/scope-resolution.md` for what counts
     as a scope and `shared/docs-folder-resolution.md` for finding each scope's
     docs folder.
   - For each scope's docs folder, lists `system/`/`architecture/` filenames and
     parses `adr/` for number + title + superseded marker. Reads only those
     subfolders — see Scoping guarantees; never globs arbitrary `*.md`.
   - Output modes (one script, no shell piping — Windows has no bash):
     - `--mode=session` (default for the hook): emits the JSON `additionalContext`
       envelope, exactly like `inject.js`.
     - `--mode=text`: emits the plain catalog block for the on-demand skill.
   - Exits 0 silently when there's no `AGENTS.md` / no docs folder found, so it
     never pollutes a session (matches the other scripts' contract).

2. **SessionStart hook entry** in `hooks/hooks.json` — runs
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/build-catalog.js"` from the repo root,
   `timeout` small. Injects the full monorepo map before the agent does anything,
   with the launch cwd's scope + root ordered first.

3. **`skills/knowledge-map/SKILL.md`** — on-demand refresh / re-query.
   **Model-invocable** (so the agent can pull the map when it moves into an
   unfamiliar scope), with a non-trigger line keeping it clear of the `/distil`
   wrap-up signal; `allowed-tools` `Bash(node *) Glob Read Grep`. Re-runs the
   script in `--mode=text`, optionally narrowed to a subtree path. Same script,
   second entry point.

4. **ADR** under `docs/adr/` — records the framework decision:
   catalog-over-embeddings, ephemeral-over-committed, scoped-injection-over-
   on-demand-only. Written as part of this change (AGENTS.md guardrail).

## Constraints to honor

- Node built-ins only; no deps; no build step.
- Cross-platform (macOS + Windows): no bash/jq/piping in hook commands; invoke
  via `node "..."`.
- Hook scripts exit 0 silently on missing input.
- Bump `plugin.json` `version` (MINOR — new feature) + `CHANGELOG.md` entry in
  the same commit.

## Resolved

- **Scope coverage** — resolve **all** scopes in the repo (full-tree
  discovery), not just ancestors. Fixes sibling-misses; ~4–6k tokens is fine.
- **Auto-inject** — inject the full map at SessionStart, launch-cwd scope + root
  ordered first.

## Open questions to settle before/while building

1. **`description:` usage** — annotate topics with frontmatter description when
   present? Adds value but lengthens the block. Lean: include for `system/`/
   `architecture/`, omit for ADRs (title is enough).
2. **Very large repos** — 40 scopes is fine; if this is ever pointed at a repo
   with hundreds of scopes the auto-inject could get heavy. Acceptable to defer
   (the on-demand skill + a subtree-path arg is the escape hatch), but note it.

## Testing this branch (on another machine)

Two paths (full detail in plugin `CLAUDE.md` → Commands):

- **Fast iteration — `--plugin-dir`** (no push, no version bump; loads the
  working tree, even uncommitted): in a test repo run
  `claude --plugin-dir <path-to>/TRACE/deliverable/plugin`, then start a session
  inside a scope and confirm the map is injected; try `/playbook:knowledge-map`.
- **Consumer install path — branch-pinned marketplace** (confirms the real
  install/update story). The branch must be pushed. Either add the marketplace
  at the branch `ref`, or add a beta plugin entry pinned with `git-subdir` +
  `"ref": "feat/knowledge-map"`. Gotcha: `plugin.json` sets a `version`, so
  `/plugin update` is a no-op until the version string changes — use a
  prerelease string per iteration, or prefer `--plugin-dir` for the loop.

## Verification (manual — no CI)

- `claude --plugin-dir <repo>` in a synthetic monorepo with 2–3 nested scopes +
  root, launched from a sub-scope; confirm the injected map shows **all** scopes,
  the launch scope marked, with correct ADR titles and a superseded flag.
- Run the on-demand skill; confirm `--mode=text` output matches.
- Launch from a non-scope directory; confirm silent no-op (exit 0, no noise).
- Drop a stray `README.md` at a service root and a `node_modules/foo/README.md`;
  confirm neither appears in the catalog — only the resolved docs folder's
  `system/`/`architecture/`/`adr/` content does.
