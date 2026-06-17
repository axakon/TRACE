# TRACE

![TRACE](trace-ascii.png)

A playbook for AI-first software development. Adopt it in your repository to get a documentation structure, an opinionated plugin, and a set of conventions that keep an AI agent productive across a project's lifetime — without the process tax that usually comes with "AI governance."

### The thinking behind it

AI agents are only as good as the context they're given. Most projects either give them nothing (the agent guesses) or dump everything (the agent gets lost). TRACE draws a line between the two:

- **A structured `docs/` tree** that separates *what the system is* from *what it must do* from *why decisions were made* — so an agent always knows where to look.
- **A single `AGENTS.md`** at the repo root: conventions, architecture notes, gotchas. One file, loaded automatically by Claude Code, Cursor, and Codex. No duplication, no drift.
- **A Claude Code plugin** that keeps context current as you work — automatic reminders to record decisions as ADRs, distil durable knowledge at the end of a session, plan substantial changes before touching code.

The result: agents that stay useful as the project grows, without requiring a separate documentation discipline.

### Setup

Adopting TRACE takes a few minutes and produces a `docs/` tree, a root `AGENTS.md`, and the plugin installed in Claude Code.

## Where to go next

- **Adopting TRACE in your project?** Start with [`deliverable/README.md`](deliverable/README.md).
- **Working on TRACE itself?** Go to [`AGENTS.md`](AGENTS.md). Different audience, different rules.

If you're an AI agent that was pointed at this URL: first check that you are **not** running inside TRACE's own source tree (the cwd does not contain `deliverable/playbook/` at its root). If you are, stop and tell the user to `cd` to their target project. Otherwise, fetch [`deliverable/README.md`](deliverable/README.md) and continue from there.
