# 0002. Cross-scope knowledge map as a generated catalog, not embeddings

*2026-06-26*

## Context

A TRACE monorepo holds many scopes — an org-level root plus one durable-context folder per service. Agents have missed knowledge that already existed in another scope: documentation in a sibling service, or a binding ADR at the root, that the agent never reached before acting. This is a discovery problem (the agent didn't know to look across the boundary), not a search-quality problem (the keyword search would have worked had it been aimed).

The forces in tension:

- The consumer is Claude Code, which already has `Grep`/`Read` — it can retrieve content once pointed at it. What it lacks is a *map* of where knowledge lives across scopes.
- The plugin is content-only: Node built-ins, no build step, no package manager, cross-platform (macOS + Windows). See [ADR 0001](0001-three-categories-of-project-docs.md) for the doc structure this builds on.
- The map must not go stale or generate churn.

Alternatives considered:

1. **Embeddings / vector store.** Solves semantic ranking the consumer doesn't need, adds a model dependency and a re-index step, and violates the no-build-step constraint. Context-stripped chunks are a poor fit for code and for short structured docs.
2. **A committed index file.** Churns on every doc edit (noisy diffs, merge conflicts across dozens of services) and goes stale whenever regeneration is forgotten.
3. **An ephemeral generated catalog.** A script reads the structure TRACE already enforces and emits a map into context; nothing is persisted.

## Decision

We will generate an ephemeral cross-scope knowledge map with a Node script (`scripts/build-catalog.js`) and inject it at `SessionStart`, with a `knowledge-map` skill exposing the same script on demand. The map walks the git-root tree, finds every scope (a directory with its own `AGENTS.md`, excluding durable-context markers), and lists each scope's `system/` and `architecture/` topic filenames plus `adr/` titles, reading only resolved durable-context folders. It is filenames and titles, not content — drill-down stays the agent's normal `Read`/`Grep`. No embeddings, no committed index.

## Consequences

Agents see what every scope documents, and which ADRs bind them, before acting — the launch scope and the org root are ordered first, so the most relevant context is unmissable. Because the map is regenerated each run, there is no file to keep fresh, no churn, and no new dependency.

The trade-offs accepted: the `SessionStart` map reflects the launch cwd's repository tree once per session, so an agent that moves into a different scope mid-session refreshes via the skill; resolving all scopes means descending the whole tree, which relies on a static ignore set (`node_modules`, `.git`, build/VCS dirs) rather than `.gitignore` parsing; and the catalog is structural, not semantic — it points, it does not rank. The approach scales to dozens of scopes (a few thousand tokens); a repo with hundreds of scopes would lean on the skill's subtree argument rather than whole-tree auto-injection. Docs-folder resolution honors the persisted `config.json` `docs_folder` and otherwise defaults to `docs/`, a deliberate simplification of the full [docs-folder-resolution](../../deliverable/plugin/shared/docs-folder-resolution.md) precedence.
