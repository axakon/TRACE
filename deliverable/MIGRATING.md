# Migrating from `playbook` 0.x to TRACE 1.0

The `playbook@ai-playbook` plugin has been renamed and split into four: `trace`, `trace-plan`, `trace-git`, and the `trace-full` bundle. This guide takes you from one to the other.

**Nothing you've written is affected.** Your `AGENTS.md`, docs folder, and ADRs stay exactly as they are. What changes is the plugin install, the slash commands, and one config folder.

> **Pointing an agent at this file?** That works — it's written as a runbook. Skip to [For agents](#for-agents) and follow the phases in order.

---

## The short version

If you have a single user-scope install and no committed plugin config:

```bash
claude plugin uninstall playbook@ai-playbook
claude plugin marketplace remove ai-playbook
claude plugin marketplace add axakon/TRACE
claude plugin install trace-full@trace
```

Restart Claude Code. Then in each project you use TRACE in, run `/trace:init` once — it moves `.claude/.playbook/config.json` to `.claude/.trace/` and cleans up.

That's it for most people. The rest of this page covers multi-scope installs, committed team config, and repo references to the old command names.

---

## What actually changed

### Commands

| 0.x | 1.0 |
|---|---|
| `/playbook:init` | `/trace:init` |
| `/playbook:agents-md-setup` | `/trace:agents-md-setup` |
| `/playbook:scaffold-docs` | `/trace:scaffold-docs` |
| `/playbook:adr` | `/trace:adr` |
| `/playbook:distil` | `/trace:distil` |
| `/playbook:doctor` | `/trace:doctor` |
| `/playbook:spec-workflow` | `/trace-plan:spec` |
| `/playbook:epic-workflow` | `/trace-plan:epic` |
| `/playbook:commit-message` | `/trace-git:commit-message` |
| `/playbook:pr-description` | `/trace-git:pr-description` |

### Plugin ids

| 0.x | 1.0 |
|---|---|
| marketplace `ai-playbook` | marketplace `trace` |
| `playbook@ai-playbook` | `trace-full@trace` (everything), or `trace@trace` / `trace-plan@trace` / `trace-git@trace` |

### Everything else

| Thing | 0.x | 1.0 | Breaks if you do nothing? |
|---|---|---|---|
| Per-scope config | `.claude/.playbook/config.json` | `.claude/.trace/config.json` | **No** — the old path is still read as a fallback |
| Viewer env vars | `PLAYBOOK_PLAN_VIEWER`, `PLAYBOOK_PLAN_VIEWER_PORT` | `TRACE_PLAN_VIEWER`, `TRACE_PLAN_VIEWER_PORT` | **No** — old names still honoured |
| Your docs, `AGENTS.md`, ADRs | — | unchanged | **No** — nothing moves |
| Committed `.claude/settings.json` naming the old plugin | — | must be updated | **Yes** — collaborators get prompts for a marketplace that no longer resolves |
| Repo text referencing `/playbook:` commands | — | should be updated | Not technically, but the instructions become wrong |

---

## Choosing what to install

0.x was one plugin containing everything. 1.0 lets you drop what you don't use — worth doing, because every installed skill's description sits in your context window all session.

| Install | If you |
|---|---|
| `trace-full@trace` | Want what you had before. Straight swap. |
| `trace@trace` | Only ever used the docs side — `init`, `agents-md-setup`, `distil`, `adr`, `doctor` |
| `trace@trace` + `trace-plan@trace` | Also used `spec-workflow` / `epic-workflow` |
| `trace@trace` + `trace-git@trace` | Also used the commit / PR skills |

The add-ons depend on `trace`, so naming an add-on pulls the core in automatically.

---

## For agents

You are migrating this user's TRACE install from 0.x to 1.0. Work through the phases in order. **Do not skip the inventory** — the install is frequently spread across more scopes than the user remembers.

### Ground rules

- **Confirm before changing anything.** Phase 0 is read-only; report what you found and get a yes before Phase 2.
- **Use the `claude plugin` CLI, not `/plugin` slash commands.** Slash commands are typed by the user; you can't invoke them. The CLI is runnable from Bash.
- **Never commit.** Leave every file change uncommitted so the user reviews the diff.
- **Never edit shell profiles** (`.zshrc`, `.bashrc`, `.envrc`) — the old env var names still work, so report them and let the user decide.
- **On any failure, stop and report.** Do not improvise a repair or continue to the next phase.

### Phase 0 — Inventory (read-only)

Run all of these and hold the results:

```bash
claude plugin list --json
claude plugin marketplace list
```

From the JSON, note every entry whose `id` is `playbook@ai-playbook`, with its `scope` and `projectPath`. There is usually more than one. Git worktrees appear as separate `projectPath` entries but share their parent repo's committed settings — fixing the parent fixes them.

In the current repo, find the leftover state and references:

```bash
# per-scope config from 0.x (a monorepo can have several)
find . -type d -name .playbook -path '*/.claude/*' -not -path '*/node_modules/*'

# committed plugin config naming the old plugin
grep -rln 'ai-playbook' --include=settings.json --include=settings.local.json .

# repo text still telling people to run the old commands
grep -rn '/playbook:' --include='*.md' --include='*.json' --include='*.yml' --include='*.yaml' . | grep -v node_modules
```

**Report to the user before continuing:** which scopes have the old plugin, which other repos are affected (from `projectPath`), how many `.playbook` config folders are in this repo, and how many files mention the old commands. Then ask whether to proceed.

### Phase 1 — Decide what to install

Ask which plugins they want, using the [table above](#choosing-what-to-install). Default to `trace-full@trace` — it is the straight swap and the safe answer if they're unsure.

### Phase 2 — Swap the plugin

Do this **once per scope** found in Phase 0. Project scope acts on the current working directory's project, so a project-scope install in another repo has to be done from that repo — note it for the final report rather than trying to reach it from here.

User scope:

```bash
claude plugin uninstall playbook@ai-playbook --scope user
claude plugin marketplace add axakon/TRACE --scope user
claude plugin install trace-full@trace --scope user
```

Project scope (from inside that repo):

```bash
claude plugin uninstall playbook@ai-playbook --scope project
claude plugin marketplace add axakon/TRACE --scope project
claude plugin install trace-full@trace --scope project
```

Once no scope references it any more, drop the old marketplace:

```bash
claude plugin marketplace remove ai-playbook
```

Omitting `--scope` on `marketplace remove` removes the declaration from every scope. Only do this after the last `playbook@ai-playbook` install is gone — check with `claude plugin list --json`.

### Phase 3 — Move the per-scope config

For each `.claude/.playbook/` directory found in Phase 0:

1. If `config.json` exists, create `.claude/.trace/` alongside it and move `config.json` across unchanged.
2. Delete the whole `.claude/.playbook/` directory. Anything else in there is the distillation sentinel — ephemeral, safe to drop.

Keep the same relative position: `services/api/.claude/.playbook/` becomes `services/api/.claude/.trace/`.

This step is optional in the sense that 1.0 still reads the old path, and `/trace:init` migrates it interactively. Doing it here just means the user never sees the fallback.

### Phase 4 — Update repo references

**Committed plugin config.** In any `settings.json` / `settings.local.json` from Phase 0, rewrite:

```json
{
  "extraKnownMarketplaces": {
    "trace": {
      "source": { "source": "github", "repo": "axakon/TRACE" }
    }
  },
  "enabledPlugins": { "trace-full@trace": true }
}
```

Remove the old `ai-playbook` marketplace entry and the `playbook@ai-playbook` key. Merge into the existing JSON — do not replace the file, and leave unrelated keys alone.

**Text references.** Rewrite every `/playbook:<skill>` hit from Phase 0 using the [command table](#commands). Check `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, the docs folder, and CI configs.

Two exceptions — leave these alone:

- **Immutable ADRs** (`<docs-folder>/adr/NNNN-*.md`). They are historical records of what was true when written. If one is now materially misleading, tell the user; a new superseding ADR is the correct fix, never an edit.
- **Anything that reads as a historical note** — changelogs, frozen working notes, meeting records.

**Env vars.** If Phase 0 found `PLAYBOOK_PLAN_VIEWER` or `PLAYBOOK_PLAN_VIEWER_PORT` in repo files (`.env`, `launch.json`, CI config), update them to the `TRACE_` names. Report any in shell profiles rather than editing them.

### Phase 5 — Verify

```bash
claude plugin list --json          # expect trace / trace-plan / trace-git; no playbook@ai-playbook
claude plugin marketplace list     # expect trace; no ai-playbook
```

Then confirm nothing stale is left in the repo:

```bash
find . -type d -name .playbook -path '*/.claude/*' -not -path '*/node_modules/*'   # expect nothing
grep -rn 'ai-playbook' --include=settings.json --include=settings.local.json .      # expect nothing
```

If the core plugin is installed and the user's project already had TRACE set up, run the validator:

```bash
claude plugin list --json | grep -q '"id": "trace@trace"' && echo "core present"
```

and have the user run `/trace:doctor` in their next session — it validates the docs structure end to end. You cannot invoke it yourself.

### Phase 6 — Report

Tell the user:

1. **What changed** — scopes migrated, plugins now installed, config folders moved, files edited.
2. **What they must do** — restart Claude Code (plugin changes apply on restart), then check tab-completion on `/trace`.
3. **What's left for them** — any other repos from the Phase 0 `projectPath` list that still have a project-scope install, any env vars in shell profiles, and the reminder to review and commit the working-tree changes.
4. **Anything you deliberately didn't touch** — ADRs, historical notes, shell profiles.

---

## Rolling back

Nothing is destroyed by this migration, so rolling back is a reinstall:

```bash
claude plugin uninstall trace-full@trace
claude plugin marketplace remove trace
claude plugin marketplace add axakon/TRACE
claude plugin install playbook@ai-playbook
```

0.x reads `.claude/.playbook/config.json`, so if Phase 3 already moved it, move it back — or just re-run `/playbook:init` and pick the same folder. Any `git checkout` of the Phase 4 edits restores the old text references.

---

## Troubleshooting

**`/trace:` commands don't appear.** Restart Claude Code — plugin changes apply on restart, not reload. Then check that the `trace` marketplace and the `enabledPlugins` key are in the *same* `settings.json`.

**Both old and new commands appear.** An install of `playbook@ai-playbook` survives at a scope you haven't migrated. `claude plugin list --json` shows which.

**`marketplace remove ai-playbook` fails.** A plugin from it is still installed. Uninstall at every scope first.

**Claude Code refuses to uninstall or disable `trace`.** An add-on depends on it. The error names them and gives you a command that handles the set in the right order.

**The docs folder isn't being found.** Run `/trace:init` and confirm the folder — it rewrites `.claude/.trace/config.json`. Then `/trace:doctor` to check the structure.
