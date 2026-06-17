# Adopting TRACE in your repository

Three steps: **install the plugin → run `/playbook:init` → run `/playbook:agents-md-setup`**.

No clone of TRACE is needed. This file can be followed directly from GitHub. The doc structure and plugin skills ship inside the plugin you install in step 1.

> **If you are an AI agent:** before doing anything, confirm the working directory is the user's target project — the cwd must NOT contain `deliverable/playbook/` at its root. If it does, stop and tell the user to `cd` to their project. Also confirm the user explicitly wants to set up TRACE here before making any changes.

---

## Prerequisites

- Claude Code is installed and open in the target project.
- You have permission to edit `.claude/settings.json` (project scope) or `~/.claude/settings.json` (user scope).

---

## Step 1 — Install the plugin

### The quick way (inside Claude Code)

Run these two slash commands in Claude Code, then reload:

```
/plugin marketplace add axakon/TRACE
/plugin install playbook@ai-playbook
/reload-plugins
```

That's it. Skip to [Step 2](#step-2--run-playbookinit).

### Choosing a scope

By default, `/plugin install` installs at **user scope** (`~/.claude/settings.json`) — the plugin is available across all your projects but isn't committed to the repo.

For **team adoption**, install at project scope so collaborators get the plugin when they trust the folder:

```
/plugin marketplace add axakon/TRACE --scope project
/plugin install playbook@ai-playbook --scope project
/reload-plugins
```

### Manual install (editing settings.json directly)

If the slash commands aren't available, add this to `.claude/settings.json` (project scope) or `~/.claude/settings.json` (user scope). Merge into the existing JSON — don't replace the whole file.

```json
{
  "extraKnownMarketplaces": {
    "ai-playbook": {
      "source": { "source": "github", "repo": "axakon/TRACE" }
    }
  },
  "enabledPlugins": { "playbook@ai-playbook": true }
}
```

Then run `/reload-plugins` or restart Claude Code to activate.

### Verify

After reloading, the `/playbook:` skills should be available. Type `/playbook` and check that tab-completion shows options like `/playbook:init`.

---

## Step 2 — Run `/playbook:init`

**Run `/playbook:init` and follow the prompts.**

The skill asks where durable context should live (default: `docs/`), then creates six canonical README files in that folder:

```
docs/README.md
docs/system/README.md
docs/architecture/README.md
docs/adr/README.md
docs/reference/README.md
docs/working-notes/README.md
```

It also writes `.claude/.playbook/config.json` to remember the chosen folder.

> **Note:** Do not pre-author `architecture/overview.md`, `adr/0000-record-architecture-decisions.md`, or a root `AGENTS.md` at this stage. Those need real content from your project. The root `AGENTS.md` is created in step 3.

---

## Step 3 — Run `/playbook:agents-md-setup`

**Run `/playbook:agents-md-setup` and follow the prompts.**

The skill interviews you about your project and produces two files at the repo root:

- `AGENTS.md` — canonical project context for AI agents (conventions, architecture, gotchas).
- `CLAUDE.md` — a one-line forwarder: `See @AGENTS.md for more information.`

Once both files exist, setup is complete.

### What's optional next

`/playbook:scaffold-docs` is a one-time bootstrap for projects that already have code but little documentation. It scans for signals (auth libraries, migration folders, HTTP frameworks, …) and proposes a short list of starter docs to create under `docs/system/`. Run it if useful — it's not required.

The remaining skills (`/playbook:spec-workflow`, `/playbook:adr`, `/playbook:distil`) come into play during ongoing work, not at setup.

---

## What got created

| Path | What it is |
|---|---|
| `.claude/settings.json` or `~/.claude/settings.json` | Plugin install |
| `docs/` (six READMEs) | Canonical doc structure |
| `.claude/.playbook/config.json` | Plugin config (chosen docs folder) |
| `AGENTS.md` | Project context for AI agents |
| `CLAUDE.md` | One-line forwarder to AGENTS.md |

---

## Troubleshooting

**Plugin commands don't appear after `/reload-plugins`:** confirm the marketplace entry and `enabledPlugins` key are both present in the same `settings.json`. A typo in the marketplace name is the most common cause.

**`/playbook:init` or `/playbook:agents-md-setup` not available:** the plugin didn't load. Check that you ran `/reload-plugins` after editing settings, and that the JSON is valid (no trailing commas, balanced braces).

**Step fails for any other reason:** stop and report to the user. Do not skip ahead or fabricate state. The user can resolve and resume from where it stopped.
