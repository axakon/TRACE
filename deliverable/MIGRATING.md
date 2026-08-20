# Migrating from `playbook` 0.x to TRACE 1.0

The `playbook@ai-playbook` plugin has been renamed and split into four: `trace`, `trace-plan`, `trace-git`, and the `trace-full` bundle. This guide takes you from one to the other.

**Nothing you've written is affected.** Your `AGENTS.md`, docs folder, and ADRs stay exactly as they are. What changes is the plugin install, the slash commands, and one config folder.

> **Pointing an agent at this file?** That works — it's written as a runbook. Skip to [For agents](#for-agents) and follow the phases in order.

---

## The short version

If you have a single user-scope install and no committed plugin config, run these **in this order**:

```bash
claude plugin uninstall playbook@ai-playbook
claude plugin marketplace remove ai-playbook
claude plugin marketplace add axakon/TRACE
claude plugin install trace-full@trace
```

> **The order matters.** `ai-playbook` and `trace` are the *same GitHub repo*, and Claude Code keys a marketplace by its source. Add before removing and you get `Marketplace 'ai-playbook' already on disk` — nothing happens, because it's already registered under the old name. Remove first, then add, and it registers as `trace`.

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
| Committed `.claude/settings.json` naming the old plugin | — | must be updated | **Yes** — collaborators end up enabling a plugin id that no longer exists in the catalog |
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

The add-ons depend on `trace`, so naming an add-on in `claude plugin install` pulls the core in automatically. Hand-editing `settings.json` is different — there you must name the core yourself, as [Phase 4](#phase-4--update-repo-references) shows.

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

**`claude plugin list` is not the whole picture.** Two separate records decide what you are looking at, and they disagree more often than you would expect:

| Record | Where it lives | Committed? |
|---|---|---|
| **Enablement** — the `enabledPlugins` key | `settings.json` at each scope | Project scope is, and travels to everyone who clones the repo |
| **Install** — what `claude plugin` acts on | `~/.claude/plugins/installed_plugins.json` | Never — it is per machine |

A repo whose committed `settings.json` enables the plugin gives every collaborator the *enablement* without the *install record*. Phase 2's CLI steps only work where an install record exists, so decide now which case you are in:

```bash
# does THIS machine hold a project-scope install record for THIS repo?
claude plugin list --json | python3 -c '
import json, os, sys
here = os.path.realpath(".")
mine = [p for p in json.load(sys.stdin)
        if p["id"] == "playbook@ai-playbook" and p.get("scope") == "project"
        and os.path.realpath(p.get("projectPath", "")) == here]
print("install record present -> Phase 2 CLI path" if mine
      else "no install record for this repo -> Phase 2 settings-edit path")
'
```

`claude plugin list --json` reports project entries for *every* repo on the machine, so match on `projectPath` — a project-scope install in a different repo does not make the CLI path work here. If `python3` is unavailable, read the JSON and check `projectPath` by eye.

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

**The four steps must run in this order at each scope.** `ai-playbook` and `trace` are the same GitHub repo, and Claude Code keys a marketplace by its source — so adding before removing is a silent no-op (`Marketplace 'ai-playbook' already on disk`), and the plugins stay keyed `@ai-playbook`.

User scope:

```bash
claude plugin uninstall playbook@ai-playbook --scope user
claude plugin marketplace remove ai-playbook --scope user
claude plugin marketplace add axakon/TRACE --scope user
claude plugin install trace-full@trace --scope user
```

Project scope (from inside that repo):

```bash
claude plugin uninstall playbook@ai-playbook --scope project
claude plugin marketplace remove ai-playbook --scope project
claude plugin marketplace add axakon/TRACE --scope project
claude plugin install trace-full@trace --scope project
```

Installing the bundle auto-installs `trace`, `trace-plan`, and `trace-git` — expect all four in `claude plugin list`, and all four written into that scope's `enabledPlugins`. That is correct, not redundant: `trace-full` ships no content of its own, and Claude Code writes an explicit `true` for a plugin *and* each of its dependencies at the target scope.

**No install record at this scope?** Then the CLI cannot help you, and the two scope flags will appear to contradict each other:

```
$ claude plugin uninstall playbook@ai-playbook --scope local
  ... is enabled at project scope (.claude/settings.json, shared with your team)
$ claude plugin uninstall playbook@ai-playbook --scope project
  ... is not installed in project scope. Use --scope to specify the correct scope.
```

Both are true. The first reads the enablement record, the second reads the install record. Do not go looking for a third scope value — no scope flag reaches an enablement that has no install behind it. Do this instead:

1. **Edit `.claude/settings.json` by hand** to drop the `ai-playbook` marketplace entry and the `playbook@ai-playbook` key. Only the file holds them, so only a file edit removes them. [Phase 4](#phase-4--update-repo-references) has the full target shape.
2. **Then run the install**, which writes the new marketplace and all four `enabledPlugins` keys for you, and creates the install record this machine was missing:

   ```bash
   claude plugin marketplace add axakon/TRACE --scope project
   claude plugin install trace-full@trace --scope project
   ```

Letting the CLI write step 2 is better than hand-writing the JSON: it registers the install, so every later `claude plugin` command at this scope works normally.

**Verify the marketplace re-keyed.** `claude plugin marketplace list` should now show `trace`, not `ai-playbook`. If it still says `ai-playbook`, the remove didn't happen at that scope: the new plugins will still install, but as `trace-full@ai-playbook`, which works yet leaves the old name wired in permanently. Redo the remove/add pair at that scope.

**If you only want the catalog refreshed** — for example a scope you can't re-key yet — `claude plugin marketplace update ai-playbook` re-fetches the catalog, and the four new plugins become installable as `<name>@ai-playbook`. Treat that as a stopgap, not the destination.

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
  "enabledPlugins": {
    "trace-full@trace": true,
    "trace@trace": true,
    "trace-plan@trace": true,
    "trace-git@trace": true
  }
}
```

Remove the old `ai-playbook` marketplace entry and the `playbook@ai-playbook` key. Merge into the existing JSON — do not replace the file, and leave unrelated keys alone.

**Name every plugin, not just the bundle.** `trace-full` ships no content — its manifest is a `dependencies` array, and the three plugins it names carry every skill. Claude Code writes an explicit `true` for a plugin *and* each of its dependencies at the same scope, so the four keys above are what a CLI install produces. Write only `trace-full@trace` and its dependencies stay disabled, which Claude Code reports as `dependency-unsatisfied`.

If Phase 1 chose a narrower set, name the core alongside the add-on — `trace-plan` and `trace-git` both depend on `trace`:

```json
{ "enabledPlugins": { "trace@trace": true, "trace-git@trace": true } }
```

**This file enables TRACE, it does not install it.** Claude Code does not fetch a plugin from an external marketplace just because `enabledPlugins` names it — after trusting the folder a collaborator sees the plugin reported as not installed, with a `claude plugin install` command to run. So every machine, including this one, still needs the Phase 2 install. Say so in the Phase 6 report: each collaborator runs `claude plugin install trace-full@trace --scope project` once, and it resolves from the marketplace this file now carries.

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
3. **What's left for them** — any other repos from the Phase 0 `projectPath` list that still have a project-scope install, any env vars in shell profiles, and the reminder to review and commit the working-tree changes. If you changed a committed `settings.json`, add that each collaborator runs `claude plugin install trace-full@trace --scope project` once after pulling — the commit shares the enablement, not the install.
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

**`uninstall` gives two different answers about the same scope.** `--scope local` reports the plugin enabled at project scope, `--scope project` reports it not installed there. Both are correct — they read different records. `enabledPlugins` in the committed `settings.json` says the plugin is *enabled*, and `~/.claude/plugins/installed_plugins.json` on your machine has no *install* for it, which is the normal state after cloning a repo that ships TRACE in its settings. No scope flag resolves this. Edit `.claude/settings.json` directly, as [Phase 4](#phase-4--update-repo-references) describes, and restart.

**`dependency-unsatisfied` on `trace-full`, or no skills after a hand-edit.** `enabledPlugins` names the bundle but not the three plugins it depends on. Add `trace@trace`, `trace-plan@trace`, and `trace-git@trace` alongside it — see [Phase 4](#phase-4--update-repo-references).

**`marketplace add axakon/TRACE` says "already on disk".** The old `ai-playbook` declaration points at the same repo, so there is nothing to add. Remove it at that scope first (`claude plugin marketplace remove ai-playbook --scope <scope>`), then add again.

**`marketplace remove ai-playbook` fails.** A plugin from it is still installed. Uninstall at every scope first.

**Commands install as `trace-full@ai-playbook`.** The marketplace kept its old settings key — the key in `settings.json` wins over the `name` in the repo's `marketplace.json`. Everything works, but redo the remove/add pair to get the `trace` key.

**Claude Code refuses to uninstall or disable `trace`.** An add-on depends on it. The error names them and gives you a command that handles the set in the right order.

**The docs folder isn't being found.** Run `/trace:init` and confirm the folder — it rewrites `.claude/.trace/config.json`. Then `/trace:doctor` to check the structure.
