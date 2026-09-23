# Setting up TRACE

Setup takes three steps: install the plugin, choose a docs folder, and write `AGENTS.md`.

TRACE builds its Claude Code and Codex packages from one source and releases them together. It is tested on macOS.

**Using Codex?** Install with the [Codex instructions](plugins/README.md#codex-desktop-and-cli), then run `$trace:init` and `$trace:agents-md-setup`. The steps below apply to both hosts, but the install commands and slash commands are written for Claude Code.

> **Using the `playbook` plugin already?** Follow the [migration guide](MIGRATING.md) instead. This page is for new installs.
>
> **Using `trace-plan`, `trace-git`, or `trace-full`?** Those plugins are now part of `trace`. Follow [Moving to the single plugin](#moving-to-the-single-plugin).

> **AI agents:** check that the working directory is the user's project. Its root must NOT contain `deliverable/playbook/`. If it does, stop and ask the user to `cd` to their project. Ask the user to confirm they want TRACE here before you change anything.

**Before you start**, you need Claude Code open in your project, Node.js 18 or later, and permission to edit `.claude/settings.json` or `~/.claude/settings.json`.

## 1. Install the plugin

```
/plugin marketplace add axakon/TRACE
/plugin install trace@trace
/reload-plugins
```

To check the install, type `/trace`. The list should now include `/trace:init`.

**Turn on auto-update.** Open `/plugin`, go to **Marketplaces**, select `trace`, and select **Enable auto-update**. Claude Code turns auto-update off by default for marketplaces outside Anthropic, so without this step you stay on the version you installed. With it, Claude Code updates TRACE in the background after each start.

<details>
<summary><b>Updating without auto-update</b></summary>

<br>

Run this command, then restart Claude Code:

```bash
claude plugin update trace@trace
```

For a project scope install, add `--scope project`.

</details>

<details>
<summary><b>Installing for a team</b></summary>

<br>

`/plugin install` uses **user scope** by default. That means every project on your machine, and nothing is committed. For a team, use project scope. It writes the marketplace and the enabled plugins into the repository's `.claude/settings.json`:

```
/plugin marketplace add axakon/TRACE --scope project
/plugin install trace@trace --scope project
```

**Each team member still has to install once.** The committed `settings.json` shares which plugins are *enabled*, but it does not install them. When a team member trusts the folder, Claude Code adds the `trace` marketplace without asking. It does not install plugins from an outside source on its own, though. Instead, it reports TRACE as not installed and prints this command:

```bash
claude plugin install trace@trace --scope project
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
    "trace@trace": true
  }
}
```

**This enables TRACE but does not install it.** Claude Code does not download a plugin from an outside marketplace just because `enabledPlugins` names it. It reports the plugin as not installed and prints a `claude plugin install` command. Use the CLI instead, unless you are preparing a repository for other people.

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
| `/trace:spec` | You are starting a larger change. It asks questions until it has a plan with acceptance criteria, then implements the plan and checks it. Small edits don't need it. |
| `/trace:epic` | The work spans several phases. It splits the work into tickets that each fit one spec, on a kanban board. |
| `/trace:commit-message`<br>`/trace:pr-description` | You are writing up a change. Ask for one directly, or ask the agent to commit or open the PR. |

Each skill explains what it does when you run it. The skills never run on their own. After code edits, the plugin reminds the agent to *offer* `/trace:distil` when you seem to be finishing.

## Files TRACE creates

| Path | Contents |
|---|---|
| `AGENTS.md` | Your project's context for AI agents |
| `CLAUDE.md` | One line that points to `AGENTS.md` |
| `docs/` | The docs structure, with six READMEs that explain what goes where |
| `.claude/.trace/config.json` | The docs folder you chose |
| `.claude/settings.json` | The marketplace and enabled plugins (project scope only) |

## Moving to the single plugin

Up to version 1.2.0, TRACE was four plugins: `trace`, `trace-plan`, `trace-git`, and the `trace-full` bundle. From version 2.0.0, `trace` holds every skill. Your docs, `AGENTS.md`, ADRs, plans, epics, and `.claude/.trace/config.json` stay as they are.

You already have `trace`, because the other three plugins depended on it. The move updates `trace` and removes the other three.

**What you see before you move.** After Claude Code fetches the 2.0.0 catalog, the old plugins stop loading. `claude plugin list` shows them as `failed to load` with `Plugin trace-full not found in marketplace trace`. This is expected, and no command appears twice. Until `trace` itself updates to 2.0.0, though, the planning and git commands are missing. With auto-update on, Claude Code updates `trace` for you. You still need steps 3 to 5 to remove the old plugins.

### 1. Find every scope

TRACE can be installed at user scope and at project scope in several repositories. Run this, and note each scope and project that lists `trace-full`, `trace-plan`, or `trace-git`:

```bash
claude plugin list
```

### 2. Fetch the new catalog

```bash
claude plugin marketplace update trace
```

### 3. Move each scope

Run these commands once for each scope from step 1. For user scope, run them anywhere. For project scope, run them from inside that repository.

```bash
claude plugin update trace@trace --scope user
claude plugin install trace@trace --scope user
claude plugin uninstall trace-full@trace --scope user
claude plugin uninstall trace-plan@trace --scope user
claude plugin uninstall trace-git@trace --scope user
```

For project scope, replace `--scope user` with `--scope project`.

Do not skip the `install` line, even though `trace` is already installed. Claude Code marked `trace` as installed only because another plugin needed it. Once the other plugins are gone, `claude plugin prune` would remove `trace`. The `install` line marks it as installed on purpose.

An `uninstall` line for a plugin you never installed prints `not found in installed plugins`. You can ignore it.

### 4. Commit the project settings

At project scope, the `uninstall` commands also remove the old plugins from the repository's `.claude/settings.json`. Only `"trace@trace": true` stays. Review the change and commit it.

Each teammate must then run step 2 and the project scope commands from step 3 once, after they pull. The committed file does not remove the old plugins from their machines.

### 5. Check the result

Restart Claude Code. `claude plugin list` must show `trace@trace` at version 2.0.0 for each scope, and nothing else from TRACE. Type `/trace:` and check that the list includes `/trace:spec`.

### 6. Update the old command names

Four commands have new names:

| Before | Now |
|---|---|
| `/trace-plan:spec` | `/trace:spec` |
| `/trace-plan:epic` | `/trace:epic` |
| `/trace-git:commit-message` | `/trace:commit-message` |
| `/trace-git:pr-description` | `/trace:pr-description` |

If your repository's `AGENTS.md`, docs, or scripts mention the old names, update them. This command finds them:

```bash
grep -rn -E '/trace-(plan|git):' --include='*.md' --include='*.json' --include='*.yml' . | grep -v node_modules
```

Leave ADRs and changelogs as they are. They record what was true when someone wrote them.

### Codex

In Codex, the skills move from `$trace-full:`, `$trace-plan:`, and `$trace-git:` to `$trace:`. Remove the old TRACE packages in the Plugins view. Then install `trace` as shown in the [Codex instructions](plugins/README.md#codex-desktop-and-cli), and start a new session.

## Migrating from `playbook`

If you use the pre-1.0 `playbook@ai-playbook` plugin, read the **[migration guide](MIGRATING.md)**.

For a single install at user scope, run these commands **in this order**. The old and new marketplaces are the same repository, so adding the new one before removing the old one does nothing:

```bash
claude plugin uninstall playbook@ai-playbook
claude plugin marketplace remove ai-playbook
claude plugin marketplace add axakon/TRACE
claude plugin install trace@trace
```

Restart Claude Code, then run `/trace:init` once in each project. The migration does not change your files: the docs folder, `AGENTS.md`, and ADRs stay as they are.

The [full guide](MIGRATING.md) covers the renamed commands, installs at several scopes, committed team settings, and references in your repository. It is written as step-by-step instructions, so an agent can follow it and do the migration for you.

## Troubleshooting

**No `/trace:` commands after a reload.** Check that the marketplace entry and the `enabledPlugins` entry are in the *same* `settings.json`, and that the JSON is valid. The most common cause is a typo in the marketplace name. The marketplace is `trace`, and the plugin name is `trace@trace`.

**A command from a new release is missing.** Your installed version is old. Follow "Updating without auto-update" in step 1, and turn on auto-update.

**`claude plugin list` shows `trace-full`, `trace-plan`, or `trace-git` as `failed to load`.** These plugins were merged into `trace` in 2.0.0. Follow [Moving to the single plugin](#moving-to-the-single-plugin).

**Something else failed.** Stop and report the problem instead of skipping the step. Once it is fixed, you can continue from the step that failed.
