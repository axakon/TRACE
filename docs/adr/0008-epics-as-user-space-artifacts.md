# 0008. Store epics in user space, not the repository

*2026-07-08*

## Context

The epic-workflow skill produces epics — multi-phase feature intent decomposed into spec-seeding tickets — and they need a home. The natural-looking options were repo locations: `<docs-folder>/epics/` (team-visible, resolvable through existing docs machinery, but it adds a work-tracking category to a durable-context structure the doctor validates), a top-level `epics/` folder (same team visibility, new resolution convention), or `.claude/.playbook/epics/` (playbook-owned but self-gitignored, so invisible to the team either way). All repo options treat epics as project artifacts. The developer's intent is the opposite: epics are *personal work-staging* — a way to turn a large discussion into locally tracked tickets — not deliverables to commit, and planning residue should not land in the repository.

## Decision

We will store epics in user space at `~/.claude/epics/<epic-slug>/` — `epic.md` plus `tickets/NNN-<slug>.md` — parallel to Claude Code's own `~/.claude/plans/`. Ticket files carry YAML frontmatter (`status: todo | in-progress | done`, `depends_on`) as the machine-readable contract; the future kanban viewer reads this directory the way the plan viewer reads the plans directory.

## Consequences

Epics never pollute repositories or reviews, work across every project without per-repo setup, and the existing viewer infrastructure (localhost server, port discovery by served directory) extends naturally to a kanban UI. The trade-offs: epics are single-machine and invisible to teammates — a shared board needs a different mechanism and would be a new ADR — and nothing in git history records why a series of spec runs happened; the epic is the only narrative, and it lives outside the repo. The frontmatter vocabulary is now a compatibility contract: the viewer and any future tooling must parse exactly `todo | in-progress | done`, so changing it means migrating existing epic folders.
