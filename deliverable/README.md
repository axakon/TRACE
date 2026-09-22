# Setting up TRACE

Setup takes three steps: install the plugins, choose a docs folder, and write `AGENTS.md`.

TRACE builds its Claude Code and Codex packages from one source and releases them together. It is tested on macOS.

**Using Codex?** Install with the [Codex instructions](plugins/README.md#codex-desktop-and-cli), then run `$trace-full:init` and `$trace-full:agents-md-setup`. The full package puts every skill under `$trace-full:`, such as `$trace-full:spec` and `$trace-full:epic`. The individual packages use their own names. The steps below apply to both hosts, but the install commands and slash commands are written for Claude Code.

> **Using the `playbook` plugin already?** Follow the [migration guide](MIGRATING.md) instead. This page is for new installs.

> **AI agents:** check that the working directory is the user's project. Its root must NOT contain `deliverable/playbook/`. If it does, stop and ask the user to `cd` to their project. Ask the user to confirm they want TRACE here before you change anything.

**Before you start**, you need Claude Code open in your project, Node.js 18 or later, and permission to edit `.claude/settings.json` or `~/.claude/settings.json`.

## 1. Install the plugins

```
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

To check the install, type `/trace`. The list should now include `/trace:init`.

**Turn on auto-update.** Open `/plugin`, go to **Marketplaces**, select `trace`, and select **Enable auto-update**. Claude Code turns auto-update off by default for marketplaces outside Anthropic, so without this step you stay on the version you installed. With it, Claude Code updates all four TRACE plugins in the background after each start.

<details>
<summary><b>Updating without auto-update</b></summary>

<br>

`claude plugin update trace-full@trace` updates only the bundle. It does not update `trace`, `trace-plan`, or `trace-git`, which hold the actual skills. Update each installed plugin by name, then restart Claude Code:

```bash
claude plugin update trace-full@trace
claude plugin update trace@trace
claude plugin update trace-plan@trace
claude plugin update trace-git@trace
```

For a project scope install, add `--scope project` to each command.

</details>

<details>
<summary><b>Installing only some plugins</b></summary>

<br>

TRACE is four plugins. Each installed skill adds its name and description to the agent's context for the whole session, so install only what you will use:

| Install | Contents | Skip it if |
|---|---|---|
| `trace` | The core: docs structure, `AGENTS.md`, ADRs, distillation, convention checker | You can't. The other plugins depend on it |
| `trace-plan` | Plans with acceptance criteria, epics, browser viewer | You already have a planning process you like |
| `trace-git` | Commit messages and PR descriptions | Your team uses Conventional Commits |
| `trace-full` | All three | You want to choose plugins yourself |

```
/plugin install trace@trace          # core only
/plugin install trace-plan@trace     # planning; installs the core as well
```

You can add or remove plugins later without reinstalling the others.

</details>

<details>
<summary><b>Installing for a team</b></summary>

<br>

`/plugin install` uses **user scope** by default. That means every project on your machine, and nothing is committed. For a team, use project scope. It writes the marketplace and the enabled plugins into the repository's `.claude/settings.json`:

```
/plugin marketplace add axakon/TRACE --scope project
/plugin install trace-full@trace --scope project
```

**Each team member still has to install once.** The committed `settings.json` shares which plugins are *enabled*, but it does not install them. When a team member trusts the folder, Claude Code adds the `trace` marketplace without asking. It does not install plugins from an outside source on its own, though. Instead, it reports TRACE as not installed and prints this command:

```bash
claude plugin install trace-full@trace --scope project
```

The command uses the marketplace from the committed settings, so nobody needs to add it again.

</details>

<details>
<summary><b>Installing by editing settings</b></summary>

<br>

Merge this into `.claude/settings.json` (project) or `~/.claude/settings.json` (user). Don't replace the whole file:

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

**List the plugin you want and every plugin it depends on.** Claude Code does not add dependencies for you here. If a dependency is missing from `enabledPlugins`, Claude Code disables the plugin with `dependency-unsatisfied`. `trace-full` has no content of its own, so the block above lists all four. An install through the CLI or `/plugin` writes the same four entries for you.

**This enables TRACE but does not install it.** Claude Code does not download a plugin from an outside marketplace just because `enabledPlugins` names it. It reports the plugin as not installed and prints a `claude plugin install` command. Use the CLI instead, unless you are preparing a repository for other people.

For a smaller install, keep `trace@trace` and the add-on you want. `trace-plan` and `trace-git` both depend on the core:

```json
{ "enabledPlugins": { "trace@trace": true, "trace-git@trace": true } }
```

Then run `/reload-plugins`.

</details>

## 2. Choose where the docs live

```
/trace:init
```

This asks where the docs should live, with `docs/` as the default, and creates this structure:

```
docs/
├── README.md
├── system/         ← what the code does today
├── architecture/   ← what the code must do
├── adr/            ← why decisions were made
├── reference/      ← longer explanations
└── working-notes/  ← research; not authoritative
```

TRACE saves your choice in `.claude/.trace/config.json`. Run the command once per repository. You can run it again to move the folder.

> Leave the new folders empty for now. They fill up as you work.

## 3. Write AGENTS.md

```
/trace:agents-md-setup
```

The skill reads the repository first. Then it asks about what it could not work out, across five sections: what the project is, the stack, where things are, the commands, and the gotchas. It writes two files:

- **`AGENTS.md`**: the project context, which Claude Code, Cursor, and Codex all read.
- **`CLAUDE.md`**: a single line that points to `AGENTS.md`, so Claude Code finds it.

To skip the questions, run `/trace:agents-md-setup --yes`. The skill then writes only what it can infer. Review the result and add the gotchas yourself.

Setup is now complete.

## Optional: starter docs for an existing codebase

```
/trace:scaffold-docs
```

This helps most in a project with a lot of code and few docs. The skill looks for signs such as a migrations folder, an ORM, an auth library, or a frontend framework. It then offers a short list of starter docs, and you choose which ones to keep.

## Commands for everyday work

| Command | Use it when |
|---|---|
| `/trace:distil` | You are finishing a piece of work. It reads what changed and proposes recording anything that will stay true, such as a convention, a security rule, or a gotcha. Most runs find nothing, which is expected. |
| `/trace:adr` | A decision shaped the system's structure, a dependency, or an interface. It records the decision in `docs/adr/`, where it is never edited. |
| `/trace:doctor` | After a merge, before a release, or when the docs look out of order. It checks the structure and walks you through the fixes, including ADR numbers that clash after parallel branches. |
| `/trace:context-graph` | You want to see how much instruction text an agent loads in each folder, and which files make it large. |
| `/trace-plan:spec` | You are starting a larger change. It asks questions until it has a plan with acceptance criteria, then implements the plan and checks it. Small edits don't need it. |
| `/trace-plan:epic` | The work spans several phases. It splits the work into tickets that each fit one spec, on a kanban board. |
| `/trace-git:commit-message`<br>`/trace-git:pr-description` | You are writing up a change. Ask for one directly, or ask the agent to commit or open the PR. |

Each skill explains what it does when you run it. The skills never run on their own. After code edits, the core plugin reminds the agent to *offer* `/trace:distil` when you seem to be finishing.

## Files TRACE creates

| Path | Contents |
|---|---|
| `AGENTS.md` | Your project's context for AI agents |
| `CLAUDE.md` | One line that points to `AGENTS.md` |
| `docs/` | The docs structure, with six READMEs that explain what goes where |
| `.claude/.trace/config.json` | The docs folder you chose |
| `.claude/settings.json` | The marketplace and enabled plugins (project scope only) |

## Migrating from `playbook`

If you use the pre-1.0 `playbook@ai-playbook` plugin, read the **[migration guide](MIGRATING.md)**.

For a single install at user scope, run these commands **in this order**. The old and new marketplaces are the same repository, so adding the new one before removing the old one does nothing:

```bash
claude plugin uninstall playbook@ai-playbook
claude plugin marketplace remove ai-playbook
claude plugin marketplace add axakon/TRACE
claude plugin install trace-full@trace
```

Restart Claude Code, then run `/trace:init` once in each project. The migration does not change your files: the docs folder, `AGENTS.md`, and ADRs stay as they are.

The [full guide](MIGRATING.md) covers the renamed commands, installs at several scopes, committed team settings, and references in your repository. It is written as step-by-step instructions, so an agent can follow it and do the migration for you.

## Troubleshooting

**No `/trace:` commands after a reload.** Check that the marketplace entry and the `enabledPlugins` entry are in the *same* `settings.json`, and that the JSON is valid. The most common cause is a typo in the marketplace name. The marketplace is `trace`, and the plugin names are `trace@trace`, `trace-plan@trace`, `trace-git@trace`, and `trace-full@trace`.

**A command from a new release is missing.** The bundle is new, but the plugins inside it are old. Run `claude plugin list` and compare the versions of `trace-full@trace` and `trace@trace`. If they differ, follow "Updating without auto-update" in step 1, and turn on auto-update.

**Only some commands appear.** You installed one plugin rather than the bundle. The `/trace-plan:` and `/trace-git:` commands come from the add-ons. Install those, or install `trace-full@trace` for everything.

**Claude Code won't disable `trace`.** An add-on still depends on it. The error names the add-ons and gives a command that disables them in the right order.

**Something else failed.** Stop and report the problem instead of skipping the step. Once it is fixed, you can continue from the step that failed.
