# Adopting TRACE in your repository

This walkthrough is the operational guide for setting up TRACE in a project. A human can read it to understand what gets created; an AI agent reads it to execute the setup step by step.

The working directory throughout is **the user's target project**. No clone of TRACE is needed: this file can be followed directly from GitHub, and the canonical doc structure ships inside the plugin installed in step 1.

Three steps, in order: **install the plugin → run `/playbook:init` → run `/playbook:agents-md-setup`**. After step 3, the walkthrough stops. Anything beyond that is the plugin's job or the user's.

---

## Preconditions

Before starting, an agent following this walkthrough must verify both:

1. **The working directory is the user's target project**, not TRACE itself. Check: the cwd does NOT contain `deliverable/playbook/` at its root. If it does, stop and tell the user to `cd` to their project.
2. **The user has confirmed they want to set up TRACE in this project.** A bare "look at TRACE" prompt is not consent; ask explicitly: "Set up TRACE in `<cwd>`? It will install the playbook plugin, create a `docs/` tree, and write a root `AGENTS.md`."

Only proceed once both hold.

---

## Step 1 — Install the plugin

### Done when

- A `settings.json` file at the chosen scope contains the `extraKnownMarketplaces` and `enabledPlugins` entries for the playbook plugin.
- The user has been told to run `/reload-plugins` (or restart Claude Code) to activate the plugin.

### Agent instructions

1. **Ask the user which scope** to install at:
   - **Project scope (default)** — writes to `<cwd>/.claude/settings.json`. Commits to the repo; collaborators are prompted to install when they trust the folder. Recommended for team adoption.
   - **User scope** — writes to `~/.claude/settings.json`. Available across all the user's projects, not committed.
2. **Write the install snippet** to the chosen `settings.json`. If the file already exists, merge into the existing JSON (add the keys without removing other settings); do not overwrite. The snippet:

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

   Use the marketplace identifier exactly as published: `axakon/TRACE`. (Local-path sources are not supported by Claude Code's marketplace mechanism — the install always goes through GitHub.)
3. **Tell the user** what was written, and instruct them to run `/reload-plugins` to activate the plugin commands. If they prefer, a Claude Code restart works too. The agent cannot invoke `/reload-plugins` itself — it is a user-issued slash command.
4. Once the user confirms the plugin reloaded, proceed to step 2. If reloading fails or the commands don't appear, troubleshoot before continuing.

---

## Step 2 — Run `/playbook:init`

### Done when

- A `docs/` tree exists at the project root (or whichever folder the user picked) with the six canonical README files: `docs/README.md`, `docs/system/README.md`, `docs/architecture/README.md`, `docs/adr/README.md`, `docs/reference/README.md`, `docs/working-notes/README.md`.
- The chosen folder carries a marker `AGENTS.md` + one-line `CLAUDE.md` forwarder.
- `<cwd>/.claude/.playbook/config.json` records the chosen folder.
- Nothing else has been authored. In particular `architecture/overview.md`, `adr/0000-record-architecture-decisions.md`, and a root `AGENTS.md` are **not** created here.

### Agent instructions

1. **Tell the user to run `/playbook:init`.** Wait for them to do it. The skill is interactive — it asks where durable context should live (defaulting to `docs/`), copies the six canonical READMEs from the plugin bundle into that folder, and persists the choice. The agent cannot invoke it — it is a user-issued slash command.
2. **After the user confirms `/playbook:init` finished**, verify the six READMEs exist at the expected paths and that `.claude/.playbook/config.json` was written. If anything is off, flag it to the user rather than silently patching.
3. **Do not pre-author** `architecture/overview.md`, `adr/0000-record-architecture-decisions.md`, or a root `AGENTS.md`. Those need real content drawn from the user's project; fabricating them would violate TRACE's "never pre-author" guardrail. The root `AGENTS.md` is created in step 3 via `/playbook:agents-md-setup`; the other two appear when the user has real architecture or a first decision to record.

---

## Step 3 — Author AGENTS.md and hand off

### Done when

- `<cwd>/AGENTS.md` exists with real content describing the project, produced by the plugin's `/playbook:agents-md-setup` skill.
- `<cwd>/CLAUDE.md` exists as a one-line forwarder: `See @AGENTS.md for more information.` (also produced by the skill.)
- The user knows the next optional skill (`/playbook:scaffold-docs`) and the agent has stopped.

### Agent instructions

1. **Tell the user to run `/playbook:agents-md-setup`.** Wait for them to do it. The skill is an interactive interview that produces a canonical `AGENTS.md` at the project root, plus a one-line `CLAUDE.md` forwarder so Claude Code's native discovery still finds it. The agent cannot invoke it — it is a user-issued slash command, and it expects a fresh skill-loaded context. Do not try to substitute for it.
2. **After the user confirms `/playbook:agents-md-setup` finished**, verify both files exist at the project root: `AGENTS.md` (full content from the interview) and `CLAUDE.md` (one line: `See @AGENTS.md for more information.`). If something is off — e.g., the skill produced a `CLAUDE.md` with content instead of a forwarder — flag it to the user rather than silently patching; that's a plugin bug worth surfacing.
3. **Suggest `/playbook:scaffold-docs` as optional.** Tell the user: if their project already has code, this skill scans for signals (a migrations folder, an auth library, an HTTP framework, …) and proposes a short list of starter system-state docs to create under `docs/system/`. It's a one-time bootstrap — not necessary, but useful on a project that has code but little documentation.
4. **Stop.** Do not invent further steps. The remaining plugin skills (`/playbook:spec-workflow`, `/playbook:adr`, `/playbook:distil`) come into play during ongoing work, not at setup.
5. Tell the user setup is complete and summarize what's been created:
   - `<cwd>/.claude/settings.json` (or `~/.claude/settings.json`) with the plugin install.
   - `<cwd>/docs/` tree with the six canonical READMEs and a marker `AGENTS.md` + `CLAUDE.md` forwarder.
   - `<cwd>/AGENTS.md` (canonical project context) + `<cwd>/CLAUDE.md` (forwarder).

---

## When something goes wrong

If a step's "Done when" cannot be satisfied — plugin won't reload in step 1, `/playbook:init` not available in step 2, `agents-md-setup` not available in step 3 — **stop and report to the user**. Do not fabricate state, do not skip ahead, do not retry blindly. The user can resolve and resume.

If you are an agent and you reach a question this walkthrough does not answer, ask the user rather than guessing. The walkthrough is deliberately narrow; if something is missing, that's worth surfacing.
