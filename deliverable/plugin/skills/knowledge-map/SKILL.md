---
name: knowledge-map
description: Generate the cross-scope knowledge map — a catalog of what every TRACE scope in the repo documents (system/ and architecture/ topics, ADR titles). Use to discover which scope documents a topic, or to check for binding ADRs in another scope, before working in an unfamiliar area. The map is also injected at session start; invoke this to refresh it after moving into a different scope, or to scan a specific subtree. Not a wrap-up signal — that's /playbook:distil.
allowed-tools: Bash(node *) Glob Read Grep
---

You are surfacing the cross-scope knowledge map so cross-service docs and binding ADRs are visible before acting.

## Run

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/build-catalog.js" --mode=text
```

To limit the scan to one subtree (a single service in a large monorepo), pass its path:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/build-catalog.js" services/payments --mode=text
```

The script discovers every scope (a directory with its own `AGENTS.md`) from the git root down, and lists each scope's docs folder — `system/` and `architecture/` topic filenames plus `adr/` titles. It reads only resolved durable-context folders, never arbitrary `.md`.

## Use the output

- The map is a **directory, not the content**. Treat it as the index of where knowledge lives.
- Before working in an area, open the listed file with `Read` (and narrow with `Grep`) rather than acting on the title alone.
- ADRs are binding within their scope — read the relevant ADR when the work touches its area, including ADRs in the org root and sibling scopes.
- If the map is empty, the repo has no playbook-marked scopes yet; suggest `/playbook:init` for the relevant scope.
