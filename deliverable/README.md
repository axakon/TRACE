# Setting up TRACE

Install the plugins, run two commands, done. About five minutes.

> **Already using the `playbook` plugin?** Start with the [migration guide](MIGRATING.md) instead — this page is for fresh installs.

> **AI agents:** confirm the working directory is the user's target project — its root must NOT contain `deliverable/playbook/`. If it does, stop and ask the user to `cd` to their project. Confirm they want TRACE set up here before changing anything.

**You'll need:** Claude Code open in your project, Node.js 18+, and permission to edit `.claude/settings.json` (or `~/.claude/settings.json`).

---

## 1. Install

```
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

Type `/trace` — tab-completion should now show `/trace:init` and friends.

<details>
<summary><b>Installing only some of it</b></summary>

<br>

TRACE is four plugins. Every installed skill sits in your context window all session, so take what you'll use:

| Install | You get | Skip if |
|---|---|---|
| `trace` | The core: docs structure, `AGENTS.md`, ADRs, distillation, validator | — everything depends on it |
| `trace-plan` | Plan mode with acceptance criteria, epics, browser viewer | You have a planning workflow you like |
| `trace-git` | Commit messages and PR descriptions | Your team uses Conventional Commits |
| `trace-full` | All three | You'd rather choose |

```
/plugin install trace@trace          # core only
/plugin install trace-plan@trace     # core + planning (core comes along)
```

Add or drop add-ons later without reinstalling anything.

</details>

<details>
<summary><b>Installing for a whole team</b></summary>

<br>

`/plugin install` defaults to **user scope** — every project on your machine, not committed. For team adoption use project scope, which writes the marketplace and the enabled plugins into the repo's `.claude/settings.json`:

```
/plugin marketplace add axakon/TRACE --scope project
/plugin install trace-full@trace --scope project
```

**Each collaborator still runs the install once.** Committing `settings.json` shares the *enablement*, not the install. Trusting the folder adds the `trace` marketplace without a further prompt, but Claude Code does not auto-install a plugin from an external source — it reports TRACE as not installed and prints the command to run. That command is:

```bash
claude plugin install trace-full@trace --scope project
```

It reads the marketplace already in the committed settings, so nobody has to add it again.

</details>

<details>
<summary><b>Installing by hand</b></summary>

<br>

Merge this into `.claude/settings.json` (project) or `~/.claude/settings.json` (user) — don't replace the file:

```json
{
  "extraKnownMarketplaces": {
    "trace": {
      "source": { "source": "github", "repo": "axakon/TRACE" }
    }
  },
  "enabledPlugins": {
    "trace-full@trace": true,
    "trace@trace": true,
    "trace-plan@trace": true,
    "trace-git@trace": true
  }
}
```

**Name the plugin you want *and* everything it depends on.** Claude Code does not expand a dependency array for you here — a plugin whose dependency is missing from `enabledPlugins` is disabled with `dependency-unsatisfied`. `trace-full` ships no content of its own, so the block above lists all four. Installing through the CLI or `/plugin` writes the same four keys for you; this is only for hand-editing.

**This enables TRACE, it does not install it.** Claude Code will not fetch a plugin from an external marketplace just because `enabledPlugins` names it — it reports the plugin as not installed and prints a `claude plugin install` command. Prefer the CLI above unless you are pre-seeding a repo for other people.

For a narrower install, keep `trace@trace` and the add-on you want — `trace-plan` and `trace-git` both depend on the core:

```json
{ "enabledPlugins": { "trace@trace": true, "trace-git@trace": true } }
```

Then `/reload-plugins`.

</details>

---

## 2. Pick where context lives

```
/trace:init
```

Asks where durable context should live — `docs/` by default — and creates the structure:

```
docs/
├── README.md
├── system/         ← what the code does today
├── architecture/   ← what it must do
├── adr/            ← why decisions were made
├── reference/      ← long-form rationale
└── working-notes/  ← research, not authoritative
```

Your choice is remembered in `.claude/.trace/config.json`. Run it once per repo; safe to re-run to move the folder.

> Don't pre-fill these folders yet. They fill up from real work, not from templates.

---

## 3. Write your AGENTS.md

```
/trace:agents-md-setup
```

Interviews you through five sections — what the project is, the stack, where things live, commands, gotchas — reading the repo first so it only asks what it can't work out. You get:

- **`AGENTS.md`** — your project's context, read by Claude Code, Cursor, and Codex alike
- **`CLAUDE.md`** — a one-line forwarder so Claude Code's own discovery finds it

In a hurry? `/trace:agents-md-setup --yes` skips the interview and writes what it can infer. Review the result and fill in the gotchas yourself.

**Setup is done.**

---

## Optional: seed docs for an existing codebase

```
/trace:scaffold-docs
```

Worth running once on a project that has plenty of code and few docs. It looks for signals — a migrations folder, an ORM, an auth library, a frontend framework — and offers a short list of starter docs. You pick which to keep.

---

## Then, as you work

| Command | Reach for it when |
|---|---|
| `/trace:distil` | You're wrapping up. It reads what changed and proposes capturing anything durable — a convention, a security boundary, a gotcha. Most runs find nothing; that's normal. |
| `/trace:adr` | A decision shaped the system's structure, a dependency, or an interface. Records it immutably in `docs/adr/`. |
| `/trace:doctor` | After a merge, before a release, or when the docs structure feels off. Validates and guides the fixes — including ADR number collisions left by parallel branches under the older numbering. |
| `/trace-plan:spec` | Starting substantial work. Interviews you to a plan with acceptance criteria, implements against it, verifies. Small edits don't need it. |
| `/trace-plan:epic` | Work spans several phases. Produces spec-sized tickets on a kanban board. |
| `/trace-git:commit-message`<br>`/trace-git:pr-description` | Writing up a change. Ask explicitly, or ask the agent to commit or open the PR. |

Every skill explains itself when invoked. Nothing fires on its own — after code edits, TRACE quietly reminds the agent to *offer* `/trace:distil` when you sound like you're wrapping up.

---

## What got created

| Path | What it is |
|---|---|
| `AGENTS.md` | Your project's context for AI agents |
| `CLAUDE.md` | One-line forwarder to `AGENTS.md` |
| `docs/` | The doc structure, six READMEs explaining what belongs where |
| `.claude/.trace/config.json` | Which folder you chose |
| `.claude/settings.json` | The plugin install (project scope only) |

---

## Migrating from `playbook`

Already on the pre-1.0 `playbook@ai-playbook` plugin? **→ [Migration guide](MIGRATING.md)**

The short version, if you have a single user-scope install — **in this order**, because the old and new marketplace are the same repo and adding before removing does nothing:

```bash
claude plugin uninstall playbook@ai-playbook
claude plugin marketplace remove ai-playbook
claude plugin marketplace add axakon/TRACE
claude plugin install trace-full@trace
```

Restart Claude Code, then run `/trace:init` once per project. **Your files are untouched** — docs folder, `AGENTS.md`, and ADRs all stay exactly as they are.

The [full guide](MIGRATING.md) covers the command renames, multi-scope installs, committed team config, and repo references. It's written as a runbook, so you can also point an agent at it and have it do the migration for you.

---

## Troubleshooting

**No `/trace:` commands after reloading.** Check that the marketplace entry and `enabledPlugins` key are both in the *same* `settings.json`, and that the JSON is valid. A typo in the marketplace name is the usual culprit — it's `trace`, and the plugin ids are `trace@trace`, `trace-plan@trace`, `trace-git@trace`, `trace-full@trace`.

**Only some commands showed up.** You installed one plugin rather than the bundle. `/trace-plan:` and `/trace-git:` come from the add-ons — install those, or `trace-full@trace` for everything.

**Claude Code won't let you disable `trace`.** An add-on still depends on it. The error names them and gives you a command that disables the set in the right order.

**Something else failed.** Stop and report it rather than skipping ahead. You can resolve and resume from where it stopped.
