# ai-playbook

A Claude Code plugin that gives a small, opinionated workflow for AI-assisted development. The premise: a single well-maintained `CLAUDE.md` plus a small set of distilled-context files in the project's docs folder beats elaborate process documentation, and a thorough up-front plan with explicit acceptance criteria is the right governance for substantial work — not a meeting.

The plugin contains six skills, three plugin-level hooks, and an optional bundled MCP server. Together they automate the parts of the workflow most often skipped: configuring where durable context lives, writing the initial context file, seeding starter docs for an existing codebase, planning substantial changes properly, recording the decisions behind them, and keeping the permanent context current as work happens.

## Installation

Register the marketplace, then install the plugin from it:

```
/plugin marketplace add SlinkyBMajor/ai-playbook
/plugin install playbook@ai-playbook
```

Commands are namespaced `/playbook:<skill>`. After installing, run `/reload-plugins` (or restart) to activate it.

### Scopes — user vs project

`/plugin install` installs at **user scope** by default: available in every project on your machine, which is what you usually want. To choose a different scope, run `/plugin`, open the **Discover** tab, press **Enter** on `playbook`, and pick:

- **User** (default) — for you, across all your projects.
- **Project** — for everyone working in this repository; the choice is written to the repo's checked-in `.claude/settings.json`, so collaborators are prompted to install it when they trust the folder.
- **Local** — for you, in this repository only.

Or target a scope directly from the command line:

```
claude plugin install playbook@ai-playbook --scope project
```

### Updating

Refresh the marketplace, then update the plugin:

```
/plugin marketplace update ai-playbook
/plugin update playbook@ai-playbook
```

Then `/reload-plugins` (or restart) to load the new version.

### Auto-install for a team

To have a repository offer the playbook to everyone who opens it, commit both the marketplace and the plugin to that project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "ai-playbook": {
      "source": { "source": "github", "repo": "SlinkyBMajor/ai-playbook" }
    }
  },
  "enabledPlugins": { "playbook@ai-playbook": true }
}
```

Collaborators are prompted to install it when they trust the folder. Update later with `/plugin marketplace update ai-playbook` followed by `/reload-plugins`.

## Quickstart

Run these in order in a fresh repo. Each is explained under [Usage](#usage).

1. `/playbook:init` — pick where durable context will live (defaults to `docs/`). Once per repo.
2. `/playbook:claude-md-setup` — interview to produce the root `CLAUDE.md`.
3. `/playbook:scaffold-docs` — on an existing codebase with few docs, suggest and seed starter topic files. Optional, once.
4. Do work. Small change → just edit (the **direct path**). Substantial change → `/playbook:spec-workflow` (the **spec path**).
5. `/playbook:distil` — when wrapping up, capture anything durable into permanent context.

## Concepts

The whole playbook is built from a handful of moving parts. This section names each one so the architecture is legible.

- **Scope.** A repo or sub-repo with its own `CLAUDE.md`. Every file the playbook reads or writes is resolved relative to a scope, which is what lets a super-repo and its sub-repos each stay self-contained.

- **`CLAUDE.md`.** The root context file Claude Code loads automatically every session. The playbook keeps it to five sections (what it is, stack, directory index, commands, gotchas) and under ~150 lines; anything longer is a signal that content belongs in the docs folder instead.

- **Docs folder + marker.** Where distilled durable knowledge lives — `docs/` by default, configurable via `init`. The playbook recognises its own folder by a *marker*: a `CLAUDE.md` inside it headed `# Durable project context`. Keeping durable knowledge in a normal docs folder means non-Claude developers find the same thing under a familiar path. (Resolution precedence: [shared/docs-folder-resolution.md](shared/docs-folder-resolution.md).)

- **The two paths.** Small, contained changes take the **direct path** — just edit, no overhead. Substantial work (multiple files, a new pattern, acceptance criteria you can't hold in your head) takes the **spec path**, which runs a thorough plan — with explicit acceptance criteria — before any code is written, then verifies the result against it. The playbook never forces the spec path on small work.

- **Distillation.** The closing step of both paths: lifting anything a future developer would want to know out of a finished change and into permanent context (`CLAUDE.md` or the docs folder). This is how permanent context grows by distillation rather than accumulation — specs don't pile up, they distil and retire.

- **ADR (architecture decision record).** An immutable, numbered record of a single significant decision — the choice, its context, and its consequences — in `<docs-folder>/adr/`. Where distilled context is *living* and records the resulting convention ("what to do now"), an ADR is *immutable* and records the rationale ("why this, over the alternatives"). A later change of course is a new ADR that supersedes the old one, never an edit. `spec-workflow` offers one at handoff when a planning decision warrants it; you can also record one directly with `/playbook:adr`.

- **The sentinel.** A small marker file at `.claude/.playbook/distillation-pending`. Claude Code hooks can inject text into the agent's context but **cannot invoke a skill**, so the plugin can't auto-run `/playbook:distil`. Instead: a `PostToolUse` hook drops the sentinel after any edit, and a `UserPromptSubmit` hook reads it and reminds the agent to *suggest* distillation when your message reads as "wrapping up." `distil` clears the sentinel when it finishes. It is a soft, developer-gated nudge — never an automatic action. The directory is self-gitignored.

- **Super-repo.** An optional hierarchy where a parent repo carries shared context and each sub-repo carries its own. Supported out of the box; see [Super-repo and monorepo setups](#super-repo-and-monorepo-setups).

## Usage

### Day zero — pick where durable context lives

```
/playbook:init
```

Configures the scope: which folder will hold the project's distilled durable context. By default `docs/` at the repo root, but init lets you pick any folder — useful when the project already has `documentation/`, `wiki/`, or a custom location. The choice is persisted to `.claude/.playbook/config.json` and the folder is marked so future agents recognise it. Run once per scope; safe to re-run later to change the location.

### Day one — set up the project's CLAUDE.md

```
/playbook:claude-md-setup
```

Walks you through the five sections one at a time: what the project is, the stack, where things live, commands, and gotchas. The skill reads the repo first and only asks about what it can't infer. Output is a concise `CLAUDE.md` at the repo root. If you ran `/playbook:init` first, the directory index automatically points at the docs folder you chose. If a `CLAUDE.md` already exists, the same skill switches into review-and-update mode.

### Day one (optional) — seed starter docs for an existing codebase

```
/playbook:scaffold-docs
```

Most useful on a project that already has code but little documentation. The skill scans for signals — a migrations folder, an ORM, an auth library, a frontend framework — and proposes a short, tailored list of topic docs (`database.md`, `security.md`, `api-conventions.md`, …). You pick which to create; it seeds each with the facts it can confirm from the repo plus a few prompts for what to fill in. A one-time head start — `/playbook:distil` keeps the files current afterward.

### Doing substantial work — the spec path

Describe the work in plain language — *"let's add rate limiting to the API"*, *"help me refactor the payments module"* — and the agent will recognise the scope and offer the spec workflow. Or invoke it directly:

```
/playbook:spec-workflow
```

Either way, the skill enters plan mode and interviews you thoroughly — capturing explicit acceptance criteria and a verification approach into the plan before code gets written. You approve the plan; implementation follows; the agent verifies its work against those acceptance criteria one by one when it thinks the work is done.

Phase 1 confirms scope, so if the agent triggers the skill on borderline work you can redirect with one sentence. If you know the work is small, skip the skill — the direct path exists for a reason.

At handoff, if the work settled a real architectural decision, the skill offers to record an **ADR** (it delegates to `/playbook:adr`). Most changes won't warrant one, so the offer only appears when the decision clears the bar. You can also record a decision made outside the spec path at any time with `/playbook:adr "short title"`.

### Doing small work — the direct path

Just edit. Use Claude however you usually do. The plugin still helps: after every `Write`, `Edit`, or `MultiEdit`, the sentinel is set, and on your next prompt the agent gets a soft reminder to surface `/playbook:distil` if you're wrapping up. Nothing fires automatically.

### Closing the loop — distillation

```
/playbook:distil
```

Reads the recent changes (uncommitted diff first, recent commits if the tree is clean), evaluates them against five criteria — new conventions, security boundaries, durable design choices, non-obvious gotchas, corrections to existing context — and proposes updates to either `CLAUDE.md` or a file in the scope's docs folder. You're asked where each addition should land; nothing is written until you approve. If nothing qualifies, the skill says so and stops — a turn that produces no distillation is the common case, not a failure. After a successful run it clears the sentinel.

## Skills

| Command | When to use | Invocation |
|---|---|---|
| `/playbook:init` | First time configuring the playbook in a scope, or changing where durable context lives | User only |
| `/playbook:claude-md-setup` | Project has no `CLAUDE.md`, or the existing one needs review | User or agent |
| `/playbook:scaffold-docs` | Existing codebase with little or no documentation — suggest and seed starter topic docs | User only |
| `/playbook:spec-workflow` | Work touches multiple files, introduces a new pattern, or has acceptance criteria you can't hold in your head | User or agent |
| `/playbook:adr` | A significant architectural decision was made and should be recorded immutably | User or agent (offered by `spec-workflow`) |
| `/playbook:distil` | Recent changes may have produced durable knowledge worth capturing | User only |

## Hooks

The plugin installs three hooks that run automatically:

| Event | Behaviour |
|---|---|
| `SessionStart` | Injects an instruction telling the agent to use Context7 for up-to-date library docs when the MCP server is enabled. Harmless when disabled. |
| `PostToolUse` on `Write\|Edit\|MultiEdit` | Sets the distillation sentinel so the next user prompt carries a reminder. |
| `UserPromptSubmit` | Reads the sentinel; if present, injects the reminder text into the agent's context. |

## Files the plugin creates in your project

| Path | Created by | Purpose |
|---|---|---|
| `CLAUDE.md` | `claude-md-setup` | Root context file loaded on every session |
| `.claude/.playbook/config.json` | `init` | Per-scope playbook configuration — currently just `docs_folder` |
| `docs/` (or your chosen docs folder) | `init`, `scaffold-docs`, or `distil` (lazy) | Permanent, distilled knowledge — small files scoped to one area each, marked with a per-folder `CLAUDE.md` |
| `<docs-folder>/adr/` | `adr` (lazy) | Immutable, numbered architecture decision records |
| `.claude/.playbook/distillation-pending` | PostToolUse hook | The distillation sentinel; the directory is self-gitignored |

The docs folder carries its own slim per-folder `CLAUDE.md` describing what belongs there, and defaults to `docs/` so non-Claude developers find the durable knowledge under the familiar path.

## Super-repo and monorepo setups

The setup we recommend internally — and the one the playbook fits naturally — is a hierarchy of repos. A *super-repo* (the local dev environment) carries the shared domain knowledge that spans the whole system, and each *sub-repo* inside it carries its own self-sufficient `CLAUDE.md` and `.claude/` folder describing only what's specific to it. When the agent works inside a sub-repo, Claude Code loads both the super-repo's CLAUDE.md and the sub-repo's via nested-directory traversal, so context is discovered where it's needed without anyone maintaining a single bloated file. Each sub-repo also remains documented in isolation — useful when someone clones just that repo.

The playbook supports this out of the box:

- **Install once at user scope** so every repo has the playbook without committing it into each sub-repo.
- **Run `/playbook:init` and `/playbook:claude-md-setup` independently in each repo** that benefits from its own context — the super-repo for shared concerns, each sub-repo for its specific ones. Both skills write to the current working directory, so `cd` to the repo you're documenting first.
- **`/playbook:distil` is hierarchy-aware.** It looks at where the changed files live and routes durable knowledge to the nearest-ancestor scope that has a `CLAUDE.md`. Cross-cutting knowledge gets promoted to the super-repo; sub-repo-specific knowledge stays inside the sub-repo. You confirm the routing every time, so any over-correction is one keystroke to redirect.

Nothing special-cases the hierarchy — it works equally well in a flat single-repo project. The hierarchy support is just a consequence of every file operation being relative to where you're working, plus distillation knowing how to find the right scope.

## Bundled MCP servers

**Context7** — fetches current library and framework documentation on demand. Disabled by default in `.mcp.json`. Enable it in your project if you want the agent to verify API usage against up-to-date docs. The SessionStart instruction is phrased conditionally, so it remains harmless when Context7 is off.

## Philosophy

Most AI playbooks fail by governing everything upfront — the overhead exceeds the benefit, the documents go stale, and developers route around the process. The opposite extreme leaves useful context unwritten and durable knowledge trapped in whoever did the work. This playbook is the deliberate middle: the minimum structure that keeps an agent productive across a project's lifetime without becoming a process tax.

Five principles drive the design. Each maps to a specific piece of the plugin that enforces it.

| Principle | Implemented by |
|---|---|
| **One source of truth beats elaborate process.** A single well-maintained `CLAUDE.md` plus a small set of distilled-context files outperforms a documentation hierarchy. | `claude-md-setup` produces and maintains the root `CLAUDE.md`. `distil` keeps the docs folder small and current. Nothing else is written to disk by default. |
| **Match the path to the size of the work.** Forcing a one-line fix through a plan is theatre; letting a multi-file refactor proceed without an agreed contract is reckless. | Two paths. Direct path: just edit, no skill needed. Spec path: `spec-workflow` enters plan mode and interviews verbosely to produce a plan with explicit acceptance criteria before any code is written. |
| **Gate on artifacts, not conversations.** Document the *product* of the work — the code, the diff, the observed behaviour — not what was said about it. A claim made in chat shouldn't be recorded as fact when the code doesn't reflect it. | `authoring-rules.md` permits only what's confirmed from the codebase, developer input, or config — no speculation. `distil` works from the diff, and `spec-workflow` verifies acceptance with observed evidence, not assertions. |
| **Humans at handoffs, not throughout.** Constant approval gates train developers to rubber-stamp. Surfacing the right moments preserves judgment where it matters. | `spec-workflow` pauses at three explicit gates — scope, plan, verification. `distil` confirms every routing decision before writing. No silent writes anywhere; no nagging in between. |
| **Permanent context grows by distillation, not accumulation.** Docs that pile up uncurated go stale; knowledge never captured stays in heads. | After substantial work, `distil` evaluates the change against five criteria and proposes updates to the permanent context. For direct-path work, the sentinel surfaces `/playbook:distil` at the right moment so direct edits aren't silently exempt. |

The plugin is small on purpose: six skills and three plugin-level hooks. It automates the parts of the workflow tedious enough to be skipped — picking where durable context lives, writing the initial context, seeding starter docs for an existing codebase, planning substantial work with explicit acceptance criteria, recording the decision behind it, prompting for distillation at the right moment — and leaves every judgment call to the developer.
