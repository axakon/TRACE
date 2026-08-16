# TRACE

![TRACE](trace-ascii.png)

**Durable context for AI-assisted development.**

Your coding agent is only as good as the context it's given. Most repos give it nothing — so it guesses — or everything, so it gets lost. TRACE is the middle: a small documentation structure, a few conventions, and a Claude Code plugin that keeps them current as you work.

No process tax. No governance theatre. Just the context an agent needs, in the places it looks.

---

## Quick start

```
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

Then, in your project:

```
/trace:init              # pick where durable context lives (default: docs/)
/trace:agents-md-setup   # interview → your AGENTS.md
```

That's setup. Five minutes, two questions-and-answers. [Full walkthrough →](deliverable/README.md)

> **Coming from the `playbook` plugin?** It's been renamed and split — see the [migration guide](deliverable/MIGRATING.md). Your docs, `AGENTS.md`, and ADRs are untouched. The guide doubles as an agent runbook: point Claude at it and it'll do the migration for you.

---

## What you end up with

```
your-repo/
├── AGENTS.md          ← project context every agent reads (Claude Code, Cursor, Codex)
├── CLAUDE.md          ← one-line forwarder to AGENTS.md
└── docs/
    ├── system/        ← what the code does today
    ├── architecture/  ← what it must do
    ├── adr/           ← why decisions were made (immutable)
    ├── reference/     ← long-form rationale
    └── working-notes/ ← research, explicitly not authoritative
```

Ordinary markdown in an ordinary docs folder. Nothing proprietary, nothing hidden in a dotfile — developers who don't use AI find the same knowledge under the same familiar path.

---

## The idea

**One source of truth beats elaborate process.** A single well-maintained `AGENTS.md` plus a handful of small, scoped docs outperforms a documentation hierarchy nobody updates.

**Context grows by distillation, not accumulation.** When you finish a piece of work, TRACE asks whether anything durable was learned — a new convention, a security boundary, a gotcha — and proposes exactly that, in the right file. Most of the time the answer is nothing, and it says so.

**Match the ceremony to the work.** A one-line fix is a one-line fix. A multi-file refactor gets a plan with acceptance criteria first. TRACE never forces the heavy path on small work.

---

## Pick your pieces

TRACE ships as four plugins, so you can take what's useful and skip what isn't.

| Plugin | What you get |
|---|---|
| **`trace`** | The core — docs structure, `AGENTS.md` authoring, ADRs, distillation, a convention validator |
| **`trace-plan`** | Spec-driven plan mode, multi-phase epics, and a browser viewer for both |
| **`trace-git`** | Commit messages and PR descriptions in a predictable, scannable shape |
| **`trace-full`** | All three, one install |

The add-ons depend on the core, so installing any of them pulls `trace` in automatically. Skipping one is worth real context — every installed skill sits in your context window all session.

[Choosing between them →](deliverable/plugins/README.md)

---

## Day to day

| Command | When |
|---|---|
| `/trace:distil` | Wrapping up — capture anything durable that was learned |
| `/trace:adr` | A real architectural decision was made |
| `/trace:doctor` | After a merge, before a release, or when the structure feels off |
| `/trace-plan:spec` | Starting substantial work — plan it before writing it |
| `/trace-plan:epic` | Work spanning several phases — break it into tickets |
| `/trace-git:commit-message` · `/trace-git:pr-description` | Writing up a change |

Each skill explains itself when you invoke it. Nothing runs automatically — TRACE nudges, you decide.

---

## Where next

- **Adopting TRACE?** → [Setup walkthrough](deliverable/README.md)
- **Upgrading from 0.x?** → [Migration guide](deliverable/MIGRATING.md)
- **Curious how it's built?** → [The plugins](deliverable/plugins/README.md) · [Architecture](docs/architecture/overview.md) · [Decisions](docs/adr/)
- **Contributing to TRACE itself?** → [AGENTS.md](AGENTS.md)

Requires [Claude Code](https://code.claude.com) and Node.js 18+. Built by [byBrick Tech](https://github.com/axakon).

<sub>**AI agents:** if you were pointed at this URL to set up TRACE, first confirm the working directory is *not* TRACE's own source tree (its root contains `deliverable/playbook/`). If it is, stop and ask the user to `cd` to their project. Otherwise fetch [`deliverable/README.md`](deliverable/README.md) and follow it.</sub>
