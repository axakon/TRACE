# TRACE

A playbook for AI-first software development. Adopt it in your repository to get a documentation structure, an opinionated plugin, and a set of conventions that keep an AI agent productive across a project's lifetime — without the process tax that usually comes with "AI governance."

Adopting TRACE in a fresh repo takes a few minutes and produces:

- A `docs/` tree organized by what each file *is*: living description of the codebase (`system/`), prescriptive rules the system MUST follow (`architecture/`), and historical decisions and rationale (`adr/`, `reference/`, `working-notes/`).
- A root `AGENTS.md` describing your project's conventions (one source of truth, loaded automatically by Claude Code, Cursor, Codex).
- The `playbook` Claude Code plugin installed, which automates the parts of the workflow most often skipped: writing the initial context file, scaffolding starter docs, planning substantial work with explicit acceptance criteria, recording decisions as ADRs, and distilling durable knowledge as work happens.

The fastest way to adopt TRACE is to point Claude Code at this repository from inside your own project and let it walk you through setup. The next section explains how.

---

## For AI agents pointed at this URL

You are an AI coding agent running in a user's project directory. The user wants to adopt TRACE in this project. Follow these steps.

### Hard precondition

Before doing anything, verify that your working directory is **not TRACE itself**. If the directory contains `deliverable/playbook/` at its root, you are inside TRACE's own source tree — stop and tell the user to `cd` to their target project first.

### If you are reading this file via HTTP (no local clone of TRACE)

1. Ask the user where to clone TRACE locally. Default suggestion: `~/.trace-cache/`. Confirm before cloning.
2. Run `git clone https://github.com/axakon/TRACE.git <chosen-path>` (replace `axakon/TRACE` with the actual repo URL if different).
3. Read `<chosen-path>/deliverable/README.md` — that file is the adopter walkthrough. Follow it from the user's project directory (your current working directory).

### If you are already reading this from a local clone of TRACE

Continue to `deliverable/README.md` in this clone. Follow the walkthrough there, with the user's project directory as your working directory (not the clone).

### Notes for agents during the walkthrough

- The user's project (your cwd) is the target. The TRACE clone is read-only reference material.
- The walkthrough is three steps: set up the `docs/` folder structure, install the plugin, hand off to plugin skills. Stop after step 3 — don't invent additional steps.
- Each step states its preconditions and "Done when" criteria explicitly. Don't proceed past a step until those are satisfied.
- If you hit something the walkthrough doesn't cover, ask the user rather than guessing.

---

## For working on TRACE itself

If you're contributing to TRACE — adding to the playbook, editing the plugin, or working through the research substrate — start at [`AGENTS.md`](AGENTS.md). That file is for agents working on this repo, not for agents adopting TRACE elsewhere.
