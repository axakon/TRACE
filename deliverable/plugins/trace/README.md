# trace

The core of [TRACE](../../../README.md): durable context for AI-assisted development.

A single well-maintained `AGENTS.md` plus a handful of small, scoped docs beats a documentation hierarchy nobody updates. This plugin sets that up and keeps it current as you work — six skills, three hooks, no ceremony.

Planning lives in [`trace-plan`](../trace-plan/); commit and PR drafting in [`trace-git`](../trace-git/). Both depend on this one.

---

## Install

```
/plugin marketplace add axakon/TRACE
/plugin install trace@trace
/reload-plugins
```

Commands are namespaced `/trace:`. For everything TRACE ships, install `trace-full@trace` instead.

[Full setup walkthrough →](../../README.md) covers scopes, team installs, and editing `settings.json` by hand.

---

## Skills

| Command | What it does |
|---|---|
| `/trace:init` | Picks where durable context lives and lays down the doc structure. Once per repo. |
| `/trace:agents-md-setup` | Interviews you into a root `AGENTS.md` (plus its `CLAUDE.md` forwarder). Re-run later to review and update. |
| `/trace:scaffold-docs` | One-time bootstrap for a codebase with little documentation — scans for signals, proposes starter docs. |
| `/trace:adr` | Records an architectural decision immutably in `<docs-folder>/adr/`. |
| `/trace:distil` | Reads what changed and proposes capturing anything durable. Most runs find nothing. |
| `/trace:doctor` | Validates the scope against TRACE's conventions and guides the fixes. |

---

## The pieces

**Scope.** A repo or sub-repo with its own `AGENTS.md`. Everything resolves relative to a scope, which is what lets a monorepo's sub-projects each stay self-contained.

**`AGENTS.md` + `CLAUDE.md`.** `AGENTS.md` holds the content — it's the multi-tool standard, read by Claude Code, Cursor, and Codex. `CLAUDE.md` is a one-line forwarder so Claude Code's own discovery finds it. TRACE keeps `AGENTS.md` under five sections and ~150 lines; longer than that means content belongs in the docs folder.

**Docs folder.** Where distilled knowledge lives, `docs/` by default. TRACE recognises its own folder by a marker — an `AGENTS.md` inside it headed `# Durable project context`. Keeping it a normal docs folder means developers who don't use AI find the same knowledge under the same path.

**Distillation.** How context grows. Finish a piece of work, run `/trace:distil`, and it evaluates the diff against five criteria — new conventions, security boundaries, durable design choices, non-obvious gotchas, corrections to existing context — and proposes updates. You approve each destination; nothing is written silently.

**ADRs.** Distilled context is *living* and records the convention ("what to do now"). An ADR is *immutable* and records the rationale ("why this, over the alternatives"). Changing course means a new ADR that supersedes the old one, never an edit.

---

## What it creates in your project

| Path | From | What it is |
|---|---|---|
| `AGENTS.md` | `agents-md-setup` | Canonical project context |
| `CLAUDE.md` | `agents-md-setup` | One-line forwarder |
| `docs/` | `init` | The doc structure, each folder with a README explaining what belongs there |
| `<docs-folder>/adr/` | `adr` | Immutable, numbered decision records |
| `.claude/.trace/config.json` | `init` | Which docs folder you chose |
| `.claude/.trace/distillation-pending` | a hook | The distillation sentinel; self-gitignored |

---

## Hooks

Three, all quiet:

| Event | What happens |
|---|---|
| `SessionStart` | Suggests using Context7 for library docs, when that MCP server is on. Harmless when off. |
| `PostToolUse` on edits | Sets the distillation sentinel. Documentation edits don't count — nothing to distil from writing docs. |
| `UserPromptSubmit` | If the sentinel is set, reminds the agent to *offer* `/trace:distil` when you sound like you're wrapping up. |

Claude Code hooks can inject text but cannot invoke a skill, so nothing here runs `/trace:distil` for you. It's a nudge, and you stay the gate.

<details>
<summary><b>Deeper: the doctor, monorepos, and Context7</b></summary>

<br>

### What doctor checks

Missing canonical READMEs or marker pairs, a root `AGENTS.md` outside its spec, ADR filename and numbering problems, shipped ADRs edited beyond a supersession banner, working notes missing their non-authority banner, and relative links that don't resolve.

Unambiguous fixes are applied directly — every change is an uncommitted edit, so `git diff` is your review. You're asked only about genuinely uncertain cases (batched into one question) and anything that would overwrite prose you wrote. Record-level problems, like an edited shipped ADR, are reported with a recommendation and never auto-fixed.

Its speciality is the **ADR number collision** — two merged branches minting the same number. Doctor renumbers one file mechanically (whichever shipped first keeps the number), then inventories every reference to the old number across the repo and resolves each by reading it in context. Confident resolutions apply; ambiguous ones come back to you. References are never bulk-rewritten.

### Monorepos and super-repos

A *super-repo* carries shared domain knowledge; each sub-repo carries its own self-sufficient `AGENTS.md`. Claude Code loads both via directory traversal, so context is found where it's needed without one bloated file — and each sub-repo stays documented in isolation for anyone who clones just that one.

- **Install once at user scope** so every repo has TRACE without committing it into each.
- **Set up sub-scopes from the root.** `init`, `agents-md-setup`, and `scaffold-docs` take an optional path: `/trace:init services/api` writes config, structure, and the marker inside `services/api/`. A typical bootstrap is all three in a row, from the root.
- **`doctor check --all`** discovers every scope and reports per scope in one pass. A sub-project with a bare `AGENTS.md` and no docs folder is listed as `context_only` rather than failed — adopting a scope is a decision, not a repair.
- **`distil` is funnel-aware.** It reads ancestor scopes too, so a sub-scope candidate is deduplicated against what the super-repo already records, and promotes upward when the diff touches shared code.

Nothing special-cases the hierarchy; it falls out of every operation being relative to where you're working.

### Bundled MCP server

**Context7** fetches current library and framework docs on demand, so the agent works from the real API instead of recalling one. Disabled by default in `.mcp.json` — enable it per project. The SessionStart instruction is phrased conditionally, so it stays harmless while it's off.

</details>

---

## Why it's shaped this way

| Principle | How it's enforced |
|---|---|
| **One source of truth beats elaborate process.** | `agents-md-setup` maintains one `AGENTS.md`; `distil` keeps the docs folder small. Nothing else is written by default. |
| **Match the ceremony to the work.** | Small edits take the direct path — no skill, no overhead. Substantial work takes `/trace-plan:spec`. TRACE never forces the heavy path. |
| **Gate on artifacts, not conversations.** | Only what's confirmed from the codebase, your input, or config gets written. `distil` works from the diff, never from what was claimed in chat. |
| **Humans at handoffs, not throughout.** | Approval gates at the moments that matter. No silent writes anywhere, no nagging in between. |
| **Context grows by distillation, not accumulation.** | Every finished change is evaluated against five criteria — and usually produces nothing, which is the point. |
