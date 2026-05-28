# TRACE

A playbook for AI-first software development. Adopt it in your repository to get a documentation structure, an opinionated plugin, and a set of conventions that keep an AI agent productive across a project's lifetime — without the process tax that usually comes with "AI governance."

Adopting TRACE in a fresh repo takes a few minutes and produces:

- A `docs/` tree organized by what each file *is*: living description of the codebase (`system/`), prescriptive rules the system must follow (`architecture/`), and historical decisions and rationale (`adr/`, `reference/`, `working-notes/`).
- A root `AGENTS.md` describing your project's conventions (one source of truth, loaded automatically by Claude Code, Cursor, Codex).
- The `playbook` Claude Code plugin installed, which automates the parts of the workflow most often skipped: writing the initial context file, scaffolding starter docs, planning substantial work with explicit acceptance criteria, recording decisions as ADRs, and distilling durable knowledge as work happens.

## Where to go next

- **Adopting TRACE in your project?** Read [`deliverable/README.md`](deliverable/README.md). It's the three-step walkthrough — both readable by humans and executable by an AI agent. No clone needed; the doc structure ships inside the plugin, and the walkthrough can be followed directly from GitHub.
- **Working on TRACE itself?** Go to [`AGENTS.md`](AGENTS.md). Different audience, different rules.

If you're an AI agent that was pointed at this URL: first check that you are **not** running inside TRACE's own source tree (the cwd does not contain `deliverable/playbook/` at its root). If you are, stop and tell the user to `cd` to their target project. Otherwise, fetch [`deliverable/README.md`](deliverable/README.md) and continue from there.
