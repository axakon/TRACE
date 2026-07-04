# 0002. Ship the tooling as a Claude Code plugin of skills, hooks, and shared files

*2026-07-04 — recorded retroactively; decided during the plugin's initial development (v0.1.x, May 2026).*

## Context

The playbook needs a tooling layer that adopters install once and that then drives the conventions (docs structure, AGENTS.md authoring, ADRs, distillation) during real work. Alternatives considered:

1. **Conventions only, no tooling** — a document adopters follow by hand. Zero install cost, but nothing keeps context current; every convention depends on developer discipline.
2. **A standalone CLI** — language-agnostic and tool-agnostic, but it can't participate in the agent's session: it can't interview, propose diffs, or react to what the agent just did.
3. **Copied `.claude/commands/` files per repo** — no install step, but every adopting repo gets a divergent snapshot with no update path.
4. **A Claude Code plugin** — versioned skills, plugin-level hooks, and shared instruction files, distributed via a marketplace catalog at the repo root and updated through version bumps.

## Decision

We will ship the playbook's tooling as a single Claude Code plugin (`playbook@ai-playbook`) composed of three layers: **skills** for every developer-gated operation (setup, authoring, distillation, records), **hooks** backed by small cross-platform Node scripts for ambient behaviour (context injection, the distillation sentinel), and **shared instruction files** as single sources of truth (scope resolution, docs-folder resolution, authoring rules, criteria) referenced by skills instead of duplicated into them.

## Consequences

Adopters get one install command, a real update path (version bump → `plugin update`), and skills that participate in the session — interviewing, proposing diffs, gating writes on approval. Shared files keep the skills from drifting apart; the docs-folder precedence drifted when it was duplicated across three skills, and hasn't since it was centralised.

The cost is coupling to Claude Code: hooks and skills are Claude Code concepts, so adopters on other agents get the conventions and doc structure but not the automation. Hook scripts must stay dependency-free Node (no bash, jq, or platform tools) to run on macOS and Windows alike. The plugin is content-only with no CI — a broken script or malformed manifest surfaces only when a consumer installs it. Releases must bump `plugin.json` `version` or installed users silently receive nothing.
