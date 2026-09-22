# TRACE

![TRACE](trace-ascii.png)

TRACE is a small set of documentation conventions for projects that use AI coding agents, plus plugins for Claude Code and Codex that help you follow them.

An agent works from what it can read in the repository. If a project has no written context, the agent guesses. If it has a lot, the agent reads more than it needs. TRACE gives you one `AGENTS.md` file and a short docs folder, and the plugins help keep both up to date.

## Quick start

Install the plugins in Claude Code:

```
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

Then run two commands in your project:

```
/trace:init              # choose where the docs live (docs/ by default)
/trace:agents-md-setup   # answer a few questions to write AGENTS.md
```

The [setup guide](deliverable/README.md) covers Codex, team installs, and partial installs.

If you use the older `playbook` plugin, read the [migration guide](deliverable/MIGRATING.md) first. The migration leaves your docs, `AGENTS.md`, and ADRs unchanged. An agent can follow the guide and do the migration for you.

## What it adds to a project

```
your-repo/
├── AGENTS.md          ← project context for agents (Claude Code, Cursor, Codex)
├── CLAUDE.md          ← one line that points Claude Code to AGENTS.md
└── docs/
    ├── system/        ← what the code does today
    ├── architecture/  ← what the code must do
    ├── adr/           ← why decisions were made; never edited after the fact
    ├── reference/     ← longer explanations
    └── working-notes/ ← research; not authoritative
```

These are plain markdown files in a normal docs folder. People who don't use AI tools can read the same files.

## How it works

- **One source of truth.** A single `AGENTS.md` and a few small docs are easier to keep current than a large documentation tree.
- **Write down only what lasts.** When you finish a piece of work, `/trace:distil` checks whether you learned anything worth keeping. That could be a convention, a security rule, or a gotcha. It proposes an edit to the right file. Usually it finds nothing, and it tells you so.
- **Plan in proportion to the work.** A one-line fix needs no plan. A change across many files can start with a written plan and acceptance criteria. TRACE leaves that choice to you.

## The plugins

TRACE ships as four plugins, so you can install only the ones you need.

| Plugin | Contents |
|---|---|
| `trace` | The core: docs structure, `AGENTS.md` setup, ADRs, distillation, a checker for the conventions, and a context size report |
| `trace-plan` | Plans with acceptance criteria, multi-phase epics, and a browser viewer for both |
| `trace-git` | Commit messages and PR descriptions in a fixed shape |
| `trace-full` | All three |

`trace-plan` and `trace-git` depend on `trace`, so installing either one installs the core as well. Each installed skill adds its name and description to the agent's context for the whole session, so it can help to install fewer. [How to choose →](deliverable/plugins/README.md)

## Commands

| Command | Use it when |
|---|---|
| `/trace:distil` | You are finishing a piece of work and want to record what you learned |
| `/trace:adr` | You made an architecture decision |
| `/trace:doctor` | After a merge, before a release, or when the docs look out of order |
| `/trace:context-graph` | You want to see how much instruction text an agent loads in each folder |
| `/trace-plan:spec` | You are starting a larger change and want a plan first |
| `/trace-plan:epic` | The work spans several phases and needs tickets |
| `/trace-git:commit-message`, `/trace-git:pr-description` | You are writing up a change |

The skills run only when you call them. The core plugin's hooks add a reminder to offer `/trace:distil` after code edits, but they never run it.

## More

- [Setup guide](deliverable/README.md)
- [Migration guide](deliverable/MIGRATING.md) for users of the 0.x `playbook` plugin
- [The plugins](deliverable/plugins/README.md), [architecture](docs/architecture/overview.md), and [decisions](docs/adr/)
- [AGENTS.md](AGENTS.md), for contributors to TRACE itself

TRACE needs [Claude Code](https://code.claude.com) or Codex (desktop or CLI), and Node.js 18 or later. It is built by [byBrick Tech](https://github.com/axakon).

<sub>**AI agents:** if you were sent to this page to set up TRACE, first check that the working directory is not TRACE's own source. TRACE's root contains `deliverable/playbook/`. If it does, stop and ask the user to `cd` to their project. Otherwise, fetch [`deliverable/README.md`](deliverable/README.md) and follow it.</sub>
