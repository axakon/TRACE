# Working Note: What Goes in AGENTS.md (v0)

> ⚠️ **Working note — not authoritative.** Binding rules live in `architecture/` and `adr/`. Nothing here is a rule until it's promoted — however settled it reads.

> **Status:** Research note, not the deliverable.
> Synthesized from HumanLayer, AI Hero, Augment, Factory, Datadog, OpenAI Harness Engineering, Mitchell Hashimoto, Anthropic, and the Datadog/Datadog-frontend monorepo writeup.
> Captured for discussion. Expected to evolve.

## Purpose

A specification of what AGENTS.md *is* and what should — and shouldn't — be in it. Companion to `proposed-doc-structure.md`. This note is about the root file specifically; per-service nested AGENTS.md files follow the same shape with narrower scope.

## What AGENTS.md is for

AGENTS.md is the **rules file an AI agent loads into context at the start of every session**. It sits between the system prompt (vendor-controlled) and the task prompt (user-controlled). It's loaded whether or not the task needs it.

Two consequences follow from "loaded every session":

1. **Every line costs context budget on every task.** Augment's testing (citing ETH Zurich) showed that bloated AGENTS.md files reduce task success rates by 2%+ and inflate cost ~20%. The same instruction file boosted scores 25% on bug fixes but dropped completeness 30% on a complex feature in the same module — different blocks have opposite effects on different tasks.
2. **It must be useful for the average task, not the rare one.** Specialized knowledge belongs in skills (loaded on demand) or in `docs/architecture/` (loaded when relevant). AGENTS.md is for what every session needs.

## Size target

**Under ~100 lines.** Hard ceiling around 150.

Reference points:
- HumanLayer's own AGENTS.md: ~60 lines
- Factory's recommended template: ≤150 lines
- AI Hero: "ruthless about what goes here"
- The Medium "AI Engineering Guide" piece: <300 lines, but that's a soft upper bound, not a target

If yours is growing past 100 lines, the move is almost always *extract to a linked file*, not *trim*.

## What goes in (the standard sections)

These are the sections that recur across every credible template. Order matters less than completeness — agents read top-to-bottom but tools that parse the file (Cursor, Copilot, Claude Code) usually treat headers as anchors.

### 1. One-line project description

A single sentence describing what the project is. Acts like a role-based prompt — anchors every decision the agent makes downstream.

```markdown
# Acme Orders Platform

A modular monolith for B2B order management, written in TypeScript on Node.js 20.
```

Not "this is a project" — that's filler. The description should be specific enough that the agent can tell if a suggestion fits.

### 2. Tech stack (only the non-defaults)

Languages, frameworks, package managers — but **only where the agent would guess wrong**. If the project is a standard Node + TypeScript app using npm, the agent will figure that out. If it uses pnpm with workspaces, or Yarn Berry with PnP, or Bun, *say so* — the agent will guess npm and produce wrong commands.

```markdown
## Stack

- Node.js 20, TypeScript 5.4 (strict mode)
- pnpm workspaces (NOT npm — agent will guess wrong)
- Vitest for tests, not Jest
- Prisma for ORM
- Postgres 16
```

Don't list every dependency. The agent reads `package.json` for that. List what `package.json` *doesn't* tell it — preferences, exclusions, "we use X not Y".

### 3. Build / test / run commands

Exact strings. The agent uses these verbatim.

```markdown
## Commands

- Install: `pnpm install`
- Build: `pnpm build`
- Test (unit): `pnpm test`
- Test (integration): `pnpm test:integration` — requires Docker running
- Lint: `pnpm lint`
- Run dev server: `pnpm dev`
- Run migrations: `pnpm db:migrate`
```

If a command has a non-obvious precondition ("requires Docker", "requires a fresh DB"), say it on the same line. If a command is ambiguous (test could mean unit or e2e), name both variants.

This section is the single highest-ROI part of AGENTS.md. The agent will run these constantly.

### 4. Hard guardrails

The "never do this" list. Usually scar tissue from real incidents.

```markdown
## Guardrails

- NEVER commit `.env` or any file under `secrets/`
- NEVER modify migration files in `prisma/migrations/` after they've been applied — write a new migration instead
- NEVER run `pnpm db:reset` against anything other than localhost
- NEVER bypass the `OrderRepository` to query the orders table directly — use the repository
- Use `Result<T>` for fallible operations, not exceptions (see ADR-0011)
```

Strong tones (NEVER, MUST, ALWAYS) genuinely help. Multiple style guides recommend it; HumanLayer specifically calls it out. Agents weight emphatic rules more heavily.

Keep this short. If you have more than ~10 guardrails, the lower ones lose force.

### 5. Pointers to deeper layers

The most important section, and the one most often missing. AGENTS.md becomes useful at scale by *pointing to* deeper documentation, not by containing it.

```markdown
## When to read what

- Architecture overview, domain vocabulary, the *why* of the design:
  → `@docs/architecture/overview.md`
- Module / bounded-context map (what each service owns):
  → `@docs/architecture/bounded-contexts.md`
- Cross-cutting concerns (auth, errors, logging, transactions):
  → `@docs/architecture/cross-cutting.md`
- Architecture decisions and their rationale:
  → `@docs/adr/README.md` (index), then specific ADRs
- Operational procedures (deploy, incident response):
  → `@docs/runbooks/`
- Task-specific playbooks (migrations, event handlers, etc.):
  → `.claude/skills/` (loaded automatically when matched)
```

The `@path/to/file.md` syntax works in Claude Code (it triggers an import) and is read as a plain reference by other tools. Either way, the agent knows where to look.

This section is what makes the rest of the doc tree usable. Without it, the agent doesn't know `docs/architecture/overview.md` exists.

## What does NOT go in

Each of these is a recurring temptation. Each one belongs somewhere else.

### Architectural rationale

"We use event sourcing because we need an audit trail." Belongs in an ADR. Pointing the agent at `@docs/adr/` lets it read the rationale *only when planning architecturally-sensitive work* — not on every "fix this typo" session.

### Domain explanations

"An Order is created when a Customer commits a Cart." Belongs in `docs/architecture/overview.md` (or a glossary section there). The agent loads it when context warrants it.

### File and folder structure

"Auth lives in `src/auth/handlers.ts`." File paths drift. Within six months that file might be `src/auth/v2/handler.ts` and the AGENTS.md is now lying confidently to the agent. AI Hero's rule: **document capabilities, not structure**. Let the agent grep and discover paths just-in-time. Domain concepts and rationale stay true; paths don't.

### Conventions the linter or formatter already enforces

"Use 2-space indentation." If Prettier enforces it, don't mention it. The agent runs Prettier, gets corrected, learns. Stating it in AGENTS.md is dead context.

### Library lists

"We use Zod for validation, Pino for logging, Vitest for testing..." `package.json` says all of this. The agent reads `package.json`. Don't duplicate.

### Anything an agent can derive from `package.json` / `*.csproj` / `pom.xml`

This is the umbrella rule. If the answer is in a manifest file the agent can read in two seconds, don't put it in AGENTS.md.

### Architectural overviews

This is the most contested rule and the one most often violated. The temptation is "let me just paste a paragraph here so the agent has context." The Augment finding is that paragraph drops accuracy on simple tasks while it helps complex ones — and you don't know which kind of task is coming. The discipline is to put the overview in `docs/architecture/overview.md` and let the agent retrieve it when planning a non-trivial change.

### Personal preferences

"I like my error messages to start with capital letters." Goes in `AGENTS.local.md` (gitignored), not AGENTS.md. Personal scope, not project scope.

### Long lists of examples

A handful of strong examples is fine. Twenty examples of correct error handling is a `docs/conventions.md` file. Link to it.

## A complete example

This is what a healthy ~80-line AGENTS.md looks like for a hypothetical service. Treat as a reference, not a template to copy verbatim.

```markdown
# Acme Orders Platform

A modular monolith for B2B order management. Customers place orders via REST;
fulfillment partners receive events via Kafka.

## Stack

- Node.js 20, TypeScript 5.4 (strict mode)
- pnpm workspaces — NOT npm
- Vitest, not Jest
- Prisma + Postgres 16
- Kafka (Confluent Cloud) for outbound events

## Commands

- Install: `pnpm install`
- Build: `pnpm build`
- Test: `pnpm test`
- Test (integration, requires Docker): `pnpm test:integration`
- Lint + format check: `pnpm lint`
- Dev server: `pnpm dev`
- New migration: `pnpm db:migrate:new <name>`
- Apply migrations: `pnpm db:migrate`

## Guardrails

- NEVER commit `.env` or anything under `secrets/`
- NEVER edit applied migrations in `prisma/migrations/` — write a new one
- NEVER run `pnpm db:reset` outside localhost
- NEVER bypass `OrderRepository` to query orders directly
- Use `Result<T>` for fallible operations, not exceptions (ADR-0011)
- All public methods on services must have unit tests

## When to read what

- System overview, domain vocabulary, *why* the design is the way it is:
  → `@docs/architecture/overview.md`
- Module / bounded-context map:
  → `@docs/architecture/bounded-contexts.md`
- Cross-cutting concerns (auth, errors, logging):
  → `@docs/architecture/cross-cutting.md`
- Architectural decisions and rationale:
  → `@docs/adr/README.md`
- Operational runbooks:
  → `@docs/runbooks/`
- Task playbooks (migrations, new event handlers, releases):
  → `.claude/skills/` (auto-loaded when matched)

## When making architectural changes

Before writing code that touches persistence, messaging, auth, or service
boundaries: read the relevant ADRs and `docs/architecture/overview.md`.
If your change makes a new architectural decision, write a new ADR as part
of the PR.
```

That's 80 lines of useful context. Everything that *isn't* there is reachable in one hop via the pointers section.

## Nesting

Per `proposed-doc-structure.md`: nested AGENTS.md files at the service level repeat the structure with narrower scope. A service-level AGENTS.md inherits the root rules and adds service-specific ones — typically just stack overrides, service-local commands, service-local guardrails, and pointers to its own `docs/`. Often even shorter than the root file (~30 lines is normal).

The agent reads root first, then nested, treating later instructions as more specific overrides.

## Working principles for writing AGENTS.md

1. **Every line earns its place on every session.** If a line doesn't help the average task, it costs more than it adds. Cut it.
2. **Pointers beat content.** AGENTS.md is a table of contents for the doc tree, not the doc tree.
3. **Document what the agent will get wrong.** If the default behavior is correct, don't reinforce it. If the default is wrong, say so emphatically.
4. **Auto-generated content is a starting point, not a deliverable.** Tools like Claude's `/init` produce reasonable starter files but include filler ("This project uses JavaScript" — yes, the agent can read `package.json`). Treat the output as a draft to *delete from*.
5. **AGENTS.md is a living document.** When the agent gets something wrong twice in the same way, that's a signal. Add a line. When the agent stops getting it wrong, consider whether the line is still needed.
6. **Review it like code.** AGENTS.md changes should go through PR review, the same as architectural changes. Add the file to your CODEOWNERS for the right team.

## Bootstrapping

For a brownfield repo with no AGENTS.md today:

1. Run the agent's `/init` equivalent (Claude Code: `/init`) to get a draft.
2. **Delete most of it.** Keep stack non-defaults, commands, and the project description. Throw out the rest.
3. Add 3–7 hard guardrails based on incidents you've actually had. (No incidents? You're either lucky or new — leave the section empty for now.)
4. Add the pointers section, even if some pointed-to files don't exist yet. Create the files as stubs. Future-you and the agent will fill them in.
5. Commit. Iterate as the agent makes mistakes.

A first-week AGENTS.md being 30 lines is fine. A first-year AGENTS.md being 150 lines is fine. A two-year AGENTS.md being 400 lines is a smell — content has accumulated that should have been extracted.

## Open questions to revisit

- **AGENTS.local.md conventions.** Personal overrides, gitignored. Useful pattern but underspecified. Worth a dedicated note when the playbook covers it.
- **Distributing rules across a fleet of repos.** If we have a platform team that wants every repo to inherit the same hard guardrails, what's the mechanism? Symlinks? A shared base file pulled in via `@`? Vendor-specific (e.g., Anthropic's enterprise CLAUDE.md)? Defer until we hit it.
- **Versioning AGENTS.md across model upgrades.** Lance Martin notes harnesses get rebuilt every few months; what does that mean for AGENTS.md? Probably nothing for the structural sections, but worth flagging.

---

*Last updated: 2026-05-10. Companion to `proposed-doc-structure.md`. Both files should be revised as the project's opinions form.*
