# Working Note: Proposed Documentation Structure (v0)

> ⚠️ **Working note — not authoritative.** Binding rules live in `architecture/` and `adr/`. Nothing here is a rule until it's promoted — however settled it reads.

> **Status:** Promoted — substance lifted into [ADR 0001](../adr/0001-three-categories-of-project-docs.md) and the reference-doc-structure deliverable on 2026-05-25. This note is now historical substrate; the three-category framing (descriptive / prescriptive / historical) replaces the structure proposed below. Kept frozen for the reasoning trail.
> Synthesized from the discourse scan (HumanLayer, Augment, AI Hero, Mitchell Hashimoto, OpenAI Harness Engineering, Matthew Groff, arc42, Stack Overflow, Thoughtworks).

## Purpose

A proposed shape for how documentation lives in a project that uses AI coding agents — readable by both developers and agents, with each file having a clear role and the root rules file kept small.

The premise is that *one big AGENTS.md* doesn't scale: it pollutes every agent's context regardless of relevance, and it's hostile to humans who want to learn the system.

## The structure

```text
/AGENTS.md                          # ~80 lines: TOC + commands + guardrails
/docs/
  architecture/
    overview.md                     # arc42-flavored: 5-10 system concepts, prose
    bounded-contexts.md             # the module / service / domain map
    cross-cutting.md                # auth, errors, observability, transactions
    diagrams/                       # only for shared, referenced-from-multiple-places diagrams
  adr/
    README.md                       # generated index of all ADRs
    0000-record-architecture-decisions.md
    0001-...
    0002-...
  runbooks/                         # operational, when needed
    incident-response.md
    deployment.md
/.claude/
  skills/                           # task-specific playbooks (Tier 2)
    add-event-handler/SKILL.md
    write-migration/SKILL.md
  agents/                           # sub-agent definitions (if used)
  commands/                         # slash-command definitions (if used)
```

In a brownfield repo we're adopting AI tooling for, this gets added incrementally — `AGENTS.md` and `docs/architecture/overview.md` first, ADRs as decisions come up, skills as repetitive workflows emerge.

## Minimum structure

The full tree above is the *target*. The *minimum* is much smaller — five files:

```text
/AGENTS.md                          # the rules file
/docs/
  architecture/
    overview.md                     # the system primer
  adr/
    README.md                       # the index, even if empty
    0000-record-architecture-decisions.md   # the meta-ADR
```

That's it. AGENTS.md tells the agent where to look. `docs/architecture/overview.md` is what it points at. `docs/adr/` exists so the moment a decision is worth recording, the place is ready. Everything else from the full tree is added later, when the project actually needs it.

**Adding a file is always promotion from "section in another file" to "its own file".** A small project keeps its module map as a section inside `overview.md`. When that section starts feeling crowded — long enough to scroll past, hard to find things in, distracting from the rest of the doc — it gets promoted to its own `bounded-contexts.md`. Same logic for cross-cutting concerns, runbooks, shared diagrams.

The thresholds are judgment calls, not arithmetic. The point is *when in doubt, leave it as a section*. Files are easy to add; deleting them later is socially harder.

What gets promoted, and roughly when:

- `bounded-contexts.md` — when the module section in overview.md is hard to scan
- `cross-cutting.md` — when cross-cutting concerns are taking over the overview
- `diagrams/` (folder) — when a second doc needs the same diagram
- `runbooks/` — when the first operational procedure is written down
- `.claude/skills/` — when the first repeated-workflow friction is felt, or when pulling skills from the awesome-list
- `.claude/agents/`, `.claude/commands/` — only with a specific reason
- Nested `docs/` inside a service — when the service has its first service-local decision

## Order of operations

When adopting the structure in a new (or newly-AI-equipped) project:

1. **Create `AGENTS.md`.** Start with the one-line project description, stack non-defaults, build/test/run commands, hard guardrails, and pointers to the docs you're about to create.
2. **Create `docs/architecture/overview.md`.** Walk the 5–10 concepts list. Most sections will be a paragraph or two; some will be a single line. Don't pad.
3. **Create `docs/adr/README.md` and `docs/adr/0000-record-architecture-decisions.md`.** Both are template-shaped and quick.
4. **Stop.** Don't pre-author ADRs. Don't create `bounded-contexts.md` or `cross-cutting.md`. Don't author skills. The minimum is now in place.
5. **Iterate as real work generates pressure.** First architectural decision → write ADR-0001. First repeated workflow friction → first skill (or pull one from the awesome-list). First time the module section in overview.md feels crowded → promote to `bounded-contexts.md`.

Step 4 is the important one. The temptation when adopting a structure is to fill it in completely up front. That produces stale docs nobody trusts. The discipline is to let real work pull each addition into existence.

The onboarding skills (when authored) automate steps 1–3 and then stop, telling the team what to expect for steps 4–5.

## The structure is recursive

This is the most important property of the layout, and the reason it scales.

**The same shape applies at every level of nesting.** A monorepo with multiple services has the structure at the root *and* inside each service. A multi-repo setup has it inside each repo, and optionally at a parent "platform" level (a meta-repo, a docs site, a Confluence space — wherever cross-repo concerns live).

```text
/                                   # platform / monorepo root
  AGENTS.md                         # cross-cutting rules, pointers to platform docs
  docs/
    architecture/overview.md        # how the platform fits together
    adr/                            # cross-cutting decisions (auth model, event bus choice)
  services/
    orders/
      AGENTS.md                     # orders-specific rules, pointer to its overview
      docs/
        architecture/overview.md    # how the orders service is structured
        adr/                        # orders-local decisions (its persistence, its projections)
      src/...
    catalog/
      AGENTS.md
      docs/
        architecture/overview.md
        adr/
      src/...
```

The agent (and the human) reads from the outside in. Root AGENTS.md establishes platform-wide context; the nested AGENTS.md adds service-specific detail and overrides where appropriate. Same for ADRs: cross-cutting decisions live at root, service-local decisions live in the service. A choice of message bus that all services use is a root ADR. A choice to use event sourcing inside the orders service is an orders-level ADR.

**Why this matters:**

- **Context budget.** An agent working on the catalog service shouldn't have to load orders-specific decisions into its context. Nesting makes scoping automatic — the agent loads root docs plus the docs of the service it's working in.
- **Ownership.** Each service team owns its own `docs/`. Cross-cutting docs are owned by whoever owns cross-cutting decisions (platform team, architecture group, the most-senior person who cares).
- **Reusability.** The structure is portable. We can drop it into any new repo or service without redesigning. A team starting a new service knows exactly where to put their first ADR.
- **Brownfield adoption.** We can introduce the structure at one level first (just the repo root, or just one critical service) and let it grow into the rest as decisions get documented.

**Where decisions belong, in one rule:** an ADR lives at the *narrowest* scope that fully contains the decision. If the decision affects only one service, it goes there. If it affects two or more, it goes up a level. If you find yourself copy-pasting the same ADR into multiple services, it should have been at the parent level instead.

This recursion is the same idea the Datadog monorepo writeup uses for nested AGENTS.md, extended to the whole `docs/` tree. It's also why we don't want to over-think arc42's twelve sections — at deeper nesting levels, you only need a small subset, and the structure should adapt.

## What each piece is for

### `/AGENTS.md` — the rules file

**Audience:** AI agents, primarily. Loaded into every session.

**Size target:** Under ~100 lines. HumanLayer's own is ~60. AI Hero recommends "ruthless about what goes here."

**Contents:**
- One-line project description
- Package manager, language, framework versions (only if non-default)
- Build, test, run commands — exact strings
- Hard guardrails ("never commit `.env`", "never modify `migrations/` retroactively")
- **Pointers** to the deeper layers: `@docs/architecture/overview.md`, `@docs/adr/`

**Not in here:** architectural rationale, domain explanations, file/folder structure (paths drift), conventions that the linter or formatter already enforces, library lists, anything an agent can derive from `package.json` / `*.csproj` / `pom.xml`.

**Note on Claude:** Claude Code reads `CLAUDE.md`, not `AGENTS.md`. Since we've standardized on AGENTS.md as canonical, projects that use Claude Code add a `CLAUDE.md` containing a single line: `@AGENTS.md`. (Symlinks work too but are fragile on Windows and in some Git workflows; the one-line import is portable.)

### `/docs/architecture/overview.md` — the system primer

**Audience:** Both. New developers AND AI agents loading context for an architecturally-sensitive task.

**Size target:** A few pages. Prose, with diagrams if useful.

**Contents — the 5–10 concepts** a reader needs before they can work effectively:

1. **Project purpose** — what the system does, who uses it (one paragraph)
2. **Domain vocabulary** — the 5–15 nouns that show up everywhere, with non-obvious distinctions
3. **Architectural style and the *why*** — "event-sourced because audit", "modular monolith because we're not at scale yet", style + reasoning
4. **Communication topology** — sync/async, which buses/queues, what's RPC vs eventing, idempotency expectations
5. **Persistence model** — where state lives, what's authoritative, projection/read-model strategy
6. **Module / bounded-context map** — major pieces, responsibilities, what they don't own (capabilities, not file paths)
7. **Cross-cutting concerns** — auth/authz, error handling philosophy, logging/telemetry, transactional boundaries
8. **Conventions that override defaults** — "we use Result<T> not exceptions", "no nullable returns from repositories", the non-obvious house style
9. **Evolution state** — where we're mid-migration; new code goes in direction X
10. **Forbidden patterns** — hard "do nots", usually scar tissue from past incidents

Items 3, 4, 5, 9, 10 materially affect AI quality on brownfield work. Items 2, 6, 7, 8 can be lighter — agents can reverse-engineer most of them from code.

The format here is loosely arc42 Sections 4 (Solution Strategy) and 8 (Cross-Cutting Concepts). We don't need to adopt all twelve arc42 sections; this is the substrate.

### `/docs/architecture/bounded-contexts.md` — the module map

**Audience:** Both.

The list of major pieces (services, modules, bounded contexts), their *capabilities* (not their file paths — those drift), and the boundaries between them. Per-context, a few lines: "What it owns. What it doesn't own. How it talks to others."

For a brownfield system this is often the single most-valuable doc, because it's the thing that's hardest to derive from code and the thing AI agents most often get wrong.

### `/docs/architecture/cross-cutting.md` — concerns that aren't owned by any one module

**Audience:** Both.

Auth, error handling, logging, telemetry, transactional boundaries, idempotency, retries, feature flags. Each concern: how it works, where the seams are, what an agent (or developer) needs to know before touching it.

### Diagrams

**Default: Mermaid, inline.** Diagrams live in the document they illustrate (overview.md, an ADR, a runbook), as fenced ` ```mermaid ` blocks. Mermaid because it's plain text — agents can read and edit it, GitHub renders it natively, no tooling required.

**Exception: shared diagrams** (system context, canonical bounded-context map) earn their own files in `docs/architecture/diagrams/`. The bar is two-or-more docs needing the same diagram.

We prefer Mermaid wherever applicable. Image-based diagrams (Excalidraw, draw.io, screenshots) are acceptable only when Mermaid genuinely can't express what's needed.

### `/docs/adr/` — the decision log

**Audience:** Both. See the separate ADR discussion.

`README.md` is the index — generated, with one-line summaries. The numbered files are the decisions.

### `/docs/runbooks/` — operational procedures

**Audience:** Humans first, agents secondary.

How to deploy, how to respond to incidents, how to run the chaos test suite, etc. Optional in v0 but worth a placeholder.

### `/.claude/` — Claude Code's working directory

**Audience:** AI agents (Claude Code specifically).

This playbook is opinionated for Claude Code in v0. The `.claude/` directory holds the things Claude Code reads natively: skills, sub-agents, slash commands, hooks. Other tools (Cursor, Copilot, Aider, OpenCode, Factory) have their own conventions for these primitives — `.cursor/rules/`, `.github/instructions/`, `.factory/droids/`, etc.

**Why we don't try to be tool-neutral here.** The cross-vendor standardization stops at AGENTS.md. Below that, every tool ships its own machinery with its own directory. There is no `.agents/skills/` standard yet — proposals exist, but no major tool defaults there. Hedging would mean either symlinks (fragile, especially on Windows) or maintaining the same content in multiple locations.

If a team adopts a different harness, they translate the contents — the *concepts* (skills, sub-agents) carry over even when the directory and file format don't. AGENTS.md remains portable; the rest is harness-specific.

**Skills (Tier 2):** small folders with a `SKILL.md` and (optionally) supporting scripts or templates. Loaded *on demand* when the task matches — not every session. The bar for creating one: *"this is a workflow we do more than once a week, and it has steps an agent gets wrong without being told."* Examples: writing a database migration, adding a new event handler, regenerating the ADR index, generating release notes.

Three categories of skill matter for this project, with different relationships to our deliverable:

1. **Onboarding skills — we author.** Walk a team through adopting this structure in their own project. One-time use per repo (scaffold the folders, draft the initial AGENTS.md, write the meta-ADR). Out of scope for v1's deliverable but planned as the next concrete artifact.
2. **Awesome-list skills — we curate, not author.** Skills authored by others that we recommend. Users download and drop them in if they want them. Per the project description, the awesome-list is part of v1.
3. **Accelerator skills — deferred to v2.** Skills *we* author later that walk Claude through implementing the playbook itself. Out of scope for v1.

A repo's `.claude/skills/` directory is empty in v0 of any *adopting* project. Skills emerge from observed friction or get pulled in from the awesome-list — they aren't designed up front.

**Sub-agents and commands** are even more situational. Don't add them until you have a specific reason.

## Working principles

These are the principles the structure encodes. Worth keeping visible.

1. **Progressive disclosure.** Root file is a table of contents. Deep content is only loaded when needed.
2. **The structure is recursive.** Same shape at every level of nesting — repo root, service, sub-module. Decisions live at the narrowest scope that fully contains them.
3. **Dual-purpose docs are a feature, not a compromise.** With discipline, the same prose serves humans and agents. The Stack Overflow piece is right that good docs are good docs.
4. **Document capabilities, not structure.** File paths drift. Domain concepts and rationale don't. (Aihero, Augment.)
5. **Rationale belongs near decisions.** Not in code comments, not in PR descriptions, not in chat history. ADRs.
6. **The root file is sacred.** Every line costs context budget for every session. Be ruthless.
7. **Skills emerge, they aren't designed.** Don't pre-author skills. Watch for repeated friction, then codify.

## Open questions to revisit

*(none currently — see Resolved below)*

## Resolved

- **AGENTS.md vs CLAUDE.md as the canonical file.** AGENTS.md, always. It's the open standard (Linux Foundation stewards it; OpenAI, Anthropic, Block, Google, Cursor, Sourcegraph, etc. support it). Projects using Claude Code add a `CLAUDE.md` containing the single line `@AGENTS.md` to forward Claude into the canonical file. We never write content to CLAUDE.md.
- **Documentation drift.** Caught at decision time, not retroactively. The plan/spec skill (used during the Document and Operate phases) must include an explicit step: *"Does this change affect anything documented in `docs/architecture/`, `docs/adr/`, or AGENTS.md? If yes, update it as part of this change."* Drift becomes a review item on every architecturally-significant PR rather than a periodic cleanup task. This is research-stage — worth validating once the spec/plan skill exists.
- **arc42 vs C4 vs neither.** Neither, wholesale. They are inspirational only. Borrow arc42's section list as a *checklist* of "have we thought about this?" (especially Solution Strategy and Cross-Cutting Concepts). Borrow C4's *levels of zoom* as discipline when drawing diagrams (don't mix levels). Don't adopt either framework as-is.
- **Per-service vs per-repo ADRs.** Both. An ADR lives at the narrowest scope that fully contains the decision — service-local at the service, cross-cutting at the root. See "The structure is recursive" above.
- **Tool neutrality below AGENTS.md.** We're opinionated for Claude Code in v0. Skills, sub-agents, and commands live in `.claude/`. Teams using other harnesses translate the contents into their tool's conventions. AGENTS.md is the only portable file; the rest is harness-specific by design.
- **Folder structure for TRACE itself.** TRACE adopts the minimum dogfooded structure proposed here, plus a single-tree status-driven lifecycle (`docs/working-notes/` → `docs/reference/` → `docs/playbook/`), flat-numbered playbook files, and `onboarding/` at the repo root for v1 deliverable skills. See [ADR-0001](../adr/0001-folder-structure-self-feeding-loop.md).

---

*Last updated: 2026-05-10. This file should be revised as the project's opinions form.*
