# AI Workflow Approaches — Research Notes

## The core tension

Most AI playbooks fail by trying to govern everything upfront. The overhead becomes larger than the gain. The approaches below share a common thread: **start with conventions, not bureaucracy**. Let the structure emerge from real work.

---

## McKinsey / QuantumBlack — Spec-Driven Development (SDD)

*Source: [QuantumBlack Medium, Feb 2026](https://medium.com/quantumblack/agentic-workflows-for-software-development-dc8e64f4a79d)*

Two-layer model: deterministic orchestration on top, bounded agent execution underneath. The key insight is that agents shouldn't decide *what comes next* — a rule-based workflow engine handles sequencing, and agents just execute within a defined phase.

Artifacts live in a simple folder structure co-located with code (`.sdlc/context/`, `.sdlc/specs/REQ-XXX/`). Persistent project context (architecture decisions, conventions) lives separately from per-feature specs. Humans only enter when the agent opens a PR with the complete feature — not mid-workflow.

What keeps it lean: every artifact has a Definition of Done and runs through deterministic checks + a "critic agent" before the workflow advances. This replaces most of the human review overhead without requiring a mountain of process documentation.

The counterintuitive framing: this is essentially waterfall, but because agents can run the full cycle in hours instead of months, the economics work. Teams run multiple complete cycles per day.

---

## CLAUDE.md / Agent Skills — Anthropic's Convention-Based Model

*Sources: [Anthropic Claude Code docs](https://code.claude.com/docs/en/best-practices), [Anthropic Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)*

The simplest viable approach: one `CLAUDE.md` file at the repo root (or project root) that gives the agent persistent context — conventions, architecture decisions, what not to do. Anthropic's own engineers recommend keeping it to 100–200 lines max. Anything longer gets split into per-folder overrides.

Agent Skills extend this: reusable `SKILL.md` files that encode domain expertise (e.g. "how we write a spec", "how we structure a client report"). Skills are loaded on demand — the agent only consumes context relevant to the current task. This is the key to keeping individual interactions lean even as the total library of knowledge grows.

The workflow pattern that works: **Plan → small diff → tests → review**. Never skip the plan step under pressure. Treat AI output as unverified until tests confirm it.

Practical lift: zero new tooling required. A single markdown file and a folder of skills is the entire governance layer.

---

## Stanford Digital Economy Lab — Lessons from 51 Deployments

*Source: [Enterprise AI Playbook, April 2026](https://digitaleconomy.stanford.edu/app/uploads/2026/03/EnterpriseAIPlaybook_PereiraGraylinBrynjolfsson.pdf)*

Empirical study of what actually separates the 5% of AI pilots that generate measurable ROI from the 95% that don't (per MIT's 2025 NANDA study). Key findings relevant to consultancy work:

- Failure is almost never about the model — it's about workflow integration and misaligned incentives
- Two thirds of successful companies had significant failed attempts first; iteration, not planning, is the path
- The "valley of death" between deployment and ROI is real and requires sustained sponsorship, not just budget approval
- Human oversight: more is not better. The teams that thrived found the right calibration — not zero oversight, not constant approval gates
- Agentic AI is already generating real value, but mostly in bounded, well-defined workflows rather than open-ended tasks

For consultancy specifically: the organizational change is harder than the technical work. Decisions that live in Slack threads or people's heads can't be scaled by AI. Structured outputs require structured inputs.

---

## Lean AI Company Playbook — What Tiny Teams Are Actually Doing

*Source: [Henry Shi, Substack, May 2025](https://henrythe9th.substack.com/p/official-lean-ai-company-playbook)*

Research into 50+ startups generating significant revenue with skeleton crews. Less formal than McKinsey, more useful as a signal of what's practical at human scale.

The operational pattern: don't try to automate everything — pick the highest-volume, lowest-judgment tasks first. Support ticket triage, transaction categorization, content generation. Let the AI handle the routine 80%, escalate the tricky 20%. Keep humans on the interesting decisions.

Their tech stack reality: most companies aren't building custom agents. They're composing tools (Cursor for coding, Claude for categorization/summarization, Fathom for meetings) with light glue. The "workflow" is mostly prompts and integrations, not elaborate spec systems.

The relevant takeaway for a playbook: teach people to identify the right class of task for AI, not a universal process. High-volume + structured output + low-stakes = automate confidently. Novel + judgment-heavy + high-stakes = AI as assistant, human decides.

---

## Spec-Driven Development in Practice — Practitioner Perspective

*Source: [alexop.dev, Feb 2026](https://alexop.dev/posts/spec-driven-development-claude-code-in-action/)*

A practitioner account of using subagents with isolated context windows per task — effectively the same two-layer model as McKinsey but from a solo developer's perspective. The key practical insight: isolating each task into its own context window produces better results than one long conversation. "A 2–3 day migration took one afternoon and produced better code."

The minimal version of SDD: write a spec file (`spec.md`) for a piece of work, hand it to an agent with instructions to commit after each task. The spec is the entire governance layer. No elaborate folder hierarchies required unless the project demands it.

---

## Emerging consensus across all approaches

1. **One source of truth beats elaborate process** — a single well-maintained context file (CLAUDE.md, project-overview.md, or equivalent) outperforms a complex documentation hierarchy
2. **Conventions over rules** — tell the agent how things are done here, not a list of dos and don'ts
3. **Gate on artifacts, not conversations** — validate outputs (files, diffs, specs) not the dialogue that produced them
4. **Humans at handoffs, not throughout** — the right intervention point is the PR or deliverable, not every step
5. **Start narrow** — the teams that succeed pick one workflow, make it work, then expand

---

## Our playbook — sketch

### Step 1: Set up CLAUDE.md

The root `CLAUDE.md` is the foundation. It's not a spec document or a governance layer — it's what a senior developer would want to know in the first ten minutes of opening a repo. Five questions, answered concisely:

1. **What is this?** — one short paragraph on what the repo does
2. **What's the stack?** — key pieces only (framework, styling, data layer, package manager). Not the icon library.
3. **Where do I find stuff?** — a short directory index. Enough for the agent to know where to start looking, not a full file tree.
4. **Commands** — how to run, test, build, lint. The agent will try to use what it knows from training (e.g. `npm` instead of `pnpm`) unless you tell it otherwise.
5. **Gotchas** — the invisible stuff. Quirks that only come from human experience in the project. These have the highest value-per-word of anything in the file.

The filter for every line: *why does the agent need this?* If you can't answer that, leave it out.

#### Output rules

The skill should also include a slim set of rules describing what a good CLAUDE.md looks like, used by the agent to review its own draft before presenting it for sign-off. Things like: no ASCII art, no emojis, no decorative headers or boxes, no marketing-style language, no padding sections to look thorough. Plain prose and tables only. Every line should answer the "why does the agent need this?" filter. If a section doesn't, the agent removes it before showing the file to the developer.

These rules are intentionally minimal and stable — they belong with the skill itself, not the per-project CLAUDE.md they produce.

#### Automated setup

Rather than writing CLAUDE.md by hand, the setup should be automated: a slash command or short script that spins up an agent and instructs it to work through the five questions with the developer one at a time. The agent reads what it can from the repo first (package.json, folder structure, existing README), then asks only about what it couldn't infer — still one thing at a time, waiting for a real answer before moving on.

The process should feel unhurried and fully in the developer's hands. No presenting a wall of findings and asking for a bulk approval. Each section is confirmed before the next begins. Once all five are covered, the agent does a final summary of what it understood and asks for sign-off before writing anything to disk.

### Step 2: Specs and the change loop

The workflow built on top of CLAUDE.md has two paths, picked by the developer based on the size of the work. The goal isn't to force everything through structure — it's to keep the permanent context files current regardless of how the work was done.

**Spec path — for substantial work.** Multiple files touched, a new pattern introduced, or acceptance criteria the developer can't hold in their head. The developer writes a *change-spec* using a template, produced by a skill that uses plan mode and interviews the developer to fill it in. This change-spec is the input that drives the agent. When the work is done, the result is verified against the spec. Gate on artifacts, not conversations.

**Direct path — for small, contained work.** Bug fixes, config tweaks, one-line changes. The developer just does the thing, with or without agent help. No change-spec, no template, no overhead.

Both paths converge on the same final step: distillation.

**Permanent specs** live in a small `context/` folder alongside CLAUDE.md. They capture the institutional knowledge that should outlive any single change — architecture decisions, conventions, durable design choices. These are what a developer reads to understand the project six months from now. They stay small and stable because they grow by distillation rather than accumulation.

After any work — spec path or direct path — the developer asks one question: *does this change anything a future developer would want to know?* Most of the time, no. A typo fix, a dependency bump, a cosmetic tweak — none of these touch the permanent context. But occasionally, something does. Increasing the JWT TTL is a direct-path change that should land in the context. A new convention introduced through a spec-path feature should too. Either way, the agent proposes the diff to the relevant context file, the developer approves, and the change is captured.

When the spec path was used, the change-spec is then removed. The distillation has done its job — the durable knowledge lives in the permanent specs, and the scaffolding can go.

#### Creating a change-spec

The spec-path skill leans on Claude Code's built-in plan mode rather than reinventing question-asking. The skill's job is to wrap plan mode with two pieces of automation:

1. A `SubagentStart` hook (matcher `Plan`) that fires when plan mode begins. The hook injects `additionalContext` instructing the agent to interview the developer verbosely — keep asking clarifying questions, do not produce a plan until the work is genuinely understood. This sits on top of plan mode's native question-asking rather than replacing it.

2. A `PostToolUse` hook (matcher `ExitPlanMode`) that fires when the developer approves the plan. The hook injects `additionalContext` instructing the agent to transform the approved plan into a change-spec at `.claude/changes/` before any implementation begins.

Both hooks live in the skill's frontmatter, scoped to its lifetime — they don't pollute the project's general hook configuration. The plan file persists in its default location managed by Claude Code. The change-spec is created in `.claude/changes/`. Both artifacts remain available; neither is in the way of the other.

The change-spec itself is intent-focused and short. It contains the following sections, drawing definitions from the patterns most consistently used across spec-driven development tooling (GitHub Spec Kit, Kiro):

- **Intent.** What's being changed and why. The "what" and "why" in plain language, no implementation detail.
- **Key changes.** Short-form list of the substantive changes proposed by the plan. A summary of what the work introduces, not a step-by-step task breakdown.
- **User-facing behaviour.** The behaviour the user (or calling system) will observe once the change ships. For internal changes with no user surface, this section may be empty.
- **Acceptance criteria.** Explicit, testable conditions that must be true for the change to be considered complete. Each criterion should be specific enough that "did this pass?" has a clear yes or no answer.
- **Verification approach.** How acceptance will be checked — automated tests, manual verification steps, or both. Names the mechanism, not the test code itself.
- **Dependencies.** Other parts of the system this change relies on or interacts with — internal modules, external services, libraries, or other in-flight work.
- **Area tags.** Free-form indicators of which parts of the system the work touches (`auth`, `ui`, `data-layer`, etc.). Used by the distillation step to route updates to the right permanent specs.

The skill's transformation step turns plan mode's output into this shape. Plan mode already produces most of what's needed — acceptance criteria, dependencies, and behaviour are all part of a well-formed plan. The skill restructures rather than reinvents.

The structure on disk is minimal:

```
CLAUDE.md                # the index, at the repo root
.claude/
  context/               # permanent specs - small, distilled, stable
  changes/               # change-specs - ephemeral, removable
```

Each folder under `.claude/` carries its own slim CLAUDE.md describing what belongs there. The agent picks these up automatically when working inside the folder, so context and changes each enforce their own rules without needing to bloat the root file. These per-folder files stay short — a few lines each, scoped to what makes the folder distinct.

#### Triggering distillation

The mechanism for the "does this need a context update?" prompt matters. Without one, direct-path changes will quietly skip distillation and the context files will go stale.

The primary trigger is a Claude Code `Stop` hook, fired when the agent finishes a turn. The hook runs a deterministic pre-filter first — did this turn modify source files, config, or dependencies? If not (questions, exploration, read-only work), the hook exits silently. If yes, a subagent evaluates the diff against the current context files and decides whether anything warrants distillation. If it does, the developer is prompted; if not, the turn ends without interruption.

The pre-filter is what makes this affordable. Most turns produce no diff worth evaluating, and skipping the agent call on those turns keeps token cost proportional to actual work rather than total interaction.

Alongside the hook, a `/distil` slash command provides a manual trigger. Two cases where this matters: the developer wants to distil mid-session without waiting for the next Stop, or the work was done outside Claude entirely (manual edit, work in another tool) and the hook never fired. The slash command runs the same evaluation flow as the hook, just on demand.

The spec workflow handles its own distillation through the change-spec template's final section, so spec-path work doesn't depend on the hook at all. The hook and slash command exist primarily to cover direct-path work and any manual changes that bypass the spec flow.

#### Routing distilled content to the right file

Once distillation has identified content worth capturing, the question is *where it goes*. The `.claude/context/` folder is modular — files are scoped one area each — so every addition has to land somewhere specific. The skill's instructions for this step:

1. **Read what already exists.** Before proposing an addition, the agent reads the files in `.claude/context/` to see what's already covered.
2. **Decide on a target.** If existing files cover the affected area, the agent proposes updating one of them. If no existing file covers it, the agent decides whether the content fits as a new file or as a section in a file with adjacent scope. The skill carries a short list of example file names (`security.md`, `data-model.md`, `kafka-events.md`, and similar) to convey the right level of granularity — files scoped to a meaningful concept, not so narrow they fragment the context (no `that-blue-button.md`), not so broad they become a dump. The agent should propose names that fit the project's own concepts, not the example list.
3. **Surface the choice to the developer.** The developer is asked every time, with three options:
   - Confirm the agent's proposed location (existing file or new file with proposed name)
   - Override with a specific file name they want
   - Let the agent decide on its own — in which case the agent proceeds with its proposal, but the developer still reviews the resulting content before it lands
4. **Apply the authoring rules** when writing the addition.

The "ask every time" behaviour is deliberate. Even when the routing is obvious, the prompt keeps the developer aware of what's being written and where, which is the whole point of distillation as a gated step rather than an automatic one.

### Step 3: Packaging

The whole playbook is delivered as a Claude Code plugin. This is the right packaging mechanism for what we're building: it bundles skills, agents, hooks, and default settings into a single versioned, distributable unit, with namespaced skills that can't conflict with anything else in a project. Improvements to the playbook ship as a version bump rather than a file copy across every repo.

The plugin contains five skills, a hook configuration, and a small set of shared supporting files used across the skills.

**CLAUDE.md skills.** A small skill graph rather than one large skill:

- A **router skill** that checks whether `CLAUDE.md` exists at the repo root using dynamic context injection (`!`test -f CLAUDE.md``) and dispatches to one of two specialists.
- A **create specialist** that runs the interview from scratch to produce the file.
- A **review specialist** that walks through the existing file, asks the developer about each section, and proposes updates.

Both specialists reference shared supporting files: a **`claude-md-rules.md`** that defines what a good CLAUDE.md looks like (no ASCII art, no decorative headers, every line earns its place, plain prose and tables only), and the cross-cutting **`authoring-rules.md`** described below. The shared files are referenced via `${CLAUDE_PLUGIN_ROOT}` from each skill that uses them, keeping a single source of truth.

**Spec workflow skill.** Wraps plan mode for the spec path. Marked `disable-model-invocation: true` so it only runs when the developer explicitly invokes it. Its frontmatter defines the two hooks scoped to the skill's lifetime — `SubagentStart` matching `Plan` to inject the verbose-interview instruction, and `PostToolUse` matching `ExitPlanMode` to trigger the change-spec transformation. References `authoring-rules.md` when transforming the plan into a change-spec.

**Distil skill.** The manual trigger and the evaluation logic. Invocable directly (so `disable-model-invocation: true`). Reads the recent diff, compares against the context files, proposes any updates the developer should consider. Carries the file-routing instructions inline, including a short list of example file names (`security.md`, `data-model.md`, `kafka-events.md`, etc.) to convey the right level of granularity — files scoped to a meaningful concept, not too narrow (no `that-blue-button.md`), not so broad they become a dump. References `authoring-rules.md`.

**Plugin-level Stop hook.** Lives in the plugin's `hooks/hooks.json` and fires on every turn end. Runs a deterministic pre-filter first (a shell script in `scripts/`, not an agent) — did this turn modify source files, config, or dependencies? If not, exits silently. If yes, invokes the distil skill to do the actual evaluation. The pre-filter keeps token cost proportional to real work rather than total interaction.

**Authoring rules.** A cross-cutting supporting file used by every skill that produces written output. Captures principles that apply to anything written under the playbook — keep it human-readable, keep it concise, only write what can be confirmed (state what the change *did*, not interpret what it *means* unless the developer's prompt or spec stated it). Lives in the shared supporting-files folder and is referenced by the CLAUDE.md skills, the spec workflow skill, and the distil skill.

**Context7 MCP server.** Bundled as an opinionated default. Context7 is a third-party MCP server (hosted by Upstash) that fetches current documentation for libraries and frameworks on demand, helping the agent ground its work in present-day APIs rather than training-data knowledge. It's relevant during CLAUDE.md setup (verifying stack details), spec planning (proposing implementation against current docs), and direct path work involving library APIs. Configured in `.mcp.json` at the plugin root, with the server disabled by default — projects that want it turn it on, projects with policies against external services leave it off. The skills don't depend on it; they work without it and benefit from it when it's enabled.

To make sure any agent working in the project actually uses context7 when relevant, the plugin includes a `SessionStart` hook that injects a slim instruction at the beginning of every session. The instruction itself lives in **`shared/context7-instructions.md`** — a short file that's easy to find and edit. Keeping it as a separate file means the rule can be tuned without touching hook configuration, and the hook just reads and injects whatever the file currently contains. The instruction is phrased conditionally ("if a context7 MCP tool is available, fetch current documentation before writing code that uses a library or framework's API") so it remains harmless when the MCP server is disabled.

The plugin layout, following the Claude Code conventions:

```
playbook-plugin/
  .claude-plugin/
    plugin.json                # manifest (name, version, description)
  skills/
    claude-md-setup/           # router
      SKILL.md
    claude-md-create/          # create from scratch
      SKILL.md
    claude-md-review/          # review existing
      SKILL.md
    spec-workflow/             # spec-path skill with hooks in frontmatter
      SKILL.md
    distil/                    # manual trigger + evaluation
      SKILL.md
  shared/
    claude-md-rules.md         # what a good CLAUDE.md looks like
    authoring-rules.md         # cross-cutting authoring principles
    context7-instructions.md   # slim instruction injected by SessionStart hook
  hooks/
    hooks.json                 # plugin-level Stop and SessionStart hooks
  scripts/
    distillation-prefilter.sh  # cheap pre-filter invoked by the Stop hook
  .mcp.json                    # bundled MCP servers (context7, disabled by default)
  README.md                    # what the plugin does and how to use it
```

A few details worth being explicit about for implementation:

- **Skill invocation is namespaced.** Plugin skills are invoked as `/<plugin-name>:<skill-name>`, so the distil command becomes something like `/playbook:distil`, not `/distil`. The exact prefix follows from the plugin's `name` field in the manifest.
- **The `shared/` folder is not a standard plugin component directory.** The Claude Code plugin reference only formally specifies the standard component dirs (`skills/`, `agents/`, `hooks/`, etc.). A top-level `shared/` folder is fine — plugin paths just can't traverse outside the plugin root, and `shared/` is inside it — but the skills need to reference its files explicitly via `${CLAUDE_PLUGIN_ROOT}/shared/...`. They aren't auto-discovered.
- **Per-folder CLAUDE.md files** (in the user's `.claude/context/` and `.claude/changes/`) are not part of the plugin. They're project content the skills create when they run, not configuration the plugin ships. The docs explicitly note that a `CLAUDE.md` at a plugin's own root is not loaded as project context — plugins contribute context through skills, not memory files.
- **Versioning.** The plugin's `plugin.json` should set an explicit `version` field if updates should be deliberate (semver bumps). Leaving it unset means every commit to the plugin's git source is treated as a new version, which is fine for internal iteration but not for stable releases.
- **README and description.** The plugin's `description` field in `plugin.json` and the `README.md` at the plugin root are what users see in the `/plugin` Discover tab. Both should be drafted as part of implementation — short, focused on what the plugin does and when to use it, not the research that produced it.
- **`when_to_use` frontmatter for auto-invocable skills.** Skills support a `when_to_use` field that's appended to `description` in the skill listing and helps Claude decide when to invoke them automatically. The CLAUDE.md skills (especially the router) benefit from this so Claude can suggest them when a developer opens a project without a CLAUDE.md or asks orientation questions about the repo. The spec workflow and distil skills are explicitly user-invoked (`disable-model-invocation: true`) and don't need `when_to_use`.
- **`argument-hint` for skills that take arguments.** Worth setting on any skill that accepts arguments, since the hint shows during slash-command autocomplete. Whether the distil skill takes arguments (e.g., a specific area or file to focus on) is an implementation decision; if it does, the hint should be set.
- **Distribution.** For internal use, fetching the plugin directly from a GitHub repository is the simplest path: consultants run `/plugin marketplace add <org>/<repo>` once and `/plugin install <plugin-name>@<marketplace-name>` per project. If a marketplace is needed for organisational discovery (multiple internal plugins), that's a separate `marketplace.json` file in the same or a sibling repo. No need to start there — direct GitHub install is fine for the first version.

### Example walkthrough

A concrete walkthrough of how the playbook plays out in practice, on a hypothetical Node.js API project.

**Day one: setup.**

The developer joins the project, runs `/playbook:claude-md-setup`. The router skill checks for an existing `CLAUDE.md` at the repo root. None exists. It dispatches to `claude-md-create`.

The create specialist reads `package.json`, the folder structure, and the README. It works through the five questions one at a time:

- *What is this?* The agent proposes a one-paragraph description based on the README. The developer tweaks one sentence and confirms.
- *What's the stack?* The agent has inferred Node.js, Express, PostgreSQL, Jest from `package.json`. It asks about the package manager (pnpm, confirmed), and whether there's anything stack-relevant the inferred list missed (developer mentions Redis for sessions).
- *Where do I find stuff?* The agent proposes a directory index based on the folder structure. The developer adds two entries it missed (`config/migrations/`, `scripts/seed/`).
- *Commands.* The agent reads `package.json` scripts. Asks the developer if any aren't obvious from the names. None.
- *Gotchas.* The agent has nothing to propose here — gotchas come from human experience. The developer mentions one: "the JWT TTL is set to 24 hours specifically because mobile clients can't refresh in the background."

The agent reviews the draft against `claude-md-rules.md` and `authoring-rules.md`, asks for sign-off, writes `CLAUDE.md` to the repo root.

The `.claude/context/` and `.claude/changes/` folders don't exist yet. They're created lazily when content is added.

**Spec path: adding rate limiting.**

A week later, the developer needs to add rate limiting to the API. This touches multiple files (middleware, config, tests) and introduces a new dependency. They invoke `/playbook:spec-workflow`.

The skill enters plan mode. The `SubagentStart`-on-`Plan` hook injects the verbose-interview instruction. The agent asks: per-route or global? Per-IP or per-user? What's the response when limited? Should rate limit headers be exposed? What's the storage backend? The developer answers each in turn. The agent proposes a plan: token-bucket algorithm, Redis-backed (already in stack), per-user when authenticated and per-IP when not, configurable thresholds via environment variables, standard `X-RateLimit-*` headers.

The developer approves the plan. The `PostToolUse`-on-`ExitPlanMode` hook fires, instructing the agent to write a change-spec. The agent produces `.claude/changes/2026-05-rate-limiting.md` with the seven sections — intent, key changes, user-facing behaviour, acceptance criteria, verification approach, dependencies, area tags (`api`, `security`, `infrastructure`).

The agent then implements against the spec. Tests pass. The change is verified against the acceptance criteria.

Now distillation. The change introduced a new convention (rate limiting strategy) that future endpoints will need to follow. The developer triggers `/playbook:distil`. The agent reads the change-spec and the existing files in `.claude/context/` (which is currently empty — this is the first distillation on the project). It proposes creating a new file: `api-conventions.md`, containing the rate limiting policy in two sentences ("Authenticated routes: per-user, 100 req/min. Public routes: per-IP, 20 req/min. Configured in `config/rate-limits.js`.").

The developer is asked where this should land. They confirm the proposed file name. The content is written, applying the authoring rules (concise, only what can be confirmed from the change). The change-spec is removed.

**Direct path: bumping the JWT TTL.**

Two weeks later, the developer wants to extend the JWT TTL from 24 hours to 7 days because of a new long-lived session feature. This is a one-line config change. No spec needed — they just edit the file directly with agent help.

When the agent's turn ends, the Stop hook fires. The pre-filter script sees a config file change, doesn't exit silently. The distil skill is invoked. It reads the diff, sees a TTL value changed, and checks the existing context files. `CLAUDE.md` mentions the old 24-hour value as a gotcha. The skill proposes updating that line and asks the developer where the change should go.

The developer confirms updating CLAUDE.md (the old value is now wrong) and decides the new context — that long-lived sessions are explicitly supported — also warrants an entry. The agent proposes a new section in the existing `api-conventions.md`. The developer accepts. Both files updated.

**Two months in.**

The `.claude/context/` folder has four files: `api-conventions.md`, `security.md`, `data-model.md`, `deployment.md`. Each is short — twenty to fifty lines. No file is a dump; each is scoped to one area. The CLAUDE.md is still under 100 lines, with the gotchas section having grown by three entries over the two months. The `.claude/changes/` folder is empty: every change-spec was retired after distillation, the durable knowledge captured in the context files.

A new developer joining the project reads CLAUDE.md and the four context files in fifteen minutes and has working knowledge of the project's conventions, architecture, and quirks. The agent loading the same files has the same context, plus the per-folder CLAUDE.md files in `.claude/context/` and `.claude/changes/` reminding it what belongs in each location.

### Known holes to resolve at implementation

Items that are deliberately unspecified in this document and need concrete decisions before or during implementation:

- **Change-spec template.** The seven sections are defined, but the actual template file (with section headers, placeholder text, and frontmatter format) needs drafting. The spec workflow skill writes from this template.
- **Distillation evaluation criteria.** What makes content worth distilling? The skill needs a concrete heuristic — likely along the lines of "did the change introduce a new convention, security boundary, durable design choice, or non-obvious gotcha?" — but the precise criteria need writing down so the skill can apply them consistently.
- **Pre-filter script logic.** The shell script that decides whether the Stop hook should invoke the distil skill needs a real implementation. The principle is "modified source files, config, or dependencies"; the script needs concrete checks against the Stop hook's input (likely parsing `transcript_path` for tool calls to `Write`/`Edit` against path globs).
- **Router skill dispatch mechanism.** Skills can't programmatically invoke other skills. The router skill needs to either tell the agent which specialist to invoke (relying on agent compliance) or contain branching content the agent reads conditionally based on the file existence check. The second is probably cleaner but the actual mechanism needs to be confirmed during implementation.
- **`additionalContext` text for hooks.** The `SubagentStart`-on-`Plan` and `PostToolUse`-on-`ExitPlanMode` hooks inject instructions into the agent's context. The actual text isn't drafted anywhere in this document.
- **Conflict handling.** If two changes propose competing updates to the same context file, or the developer rejects an addition the agent insists on, what happens? Current playbook is silent. Probably acceptable to leave this to ad-hoc resolution at first, but worth being aware of.
- **Per-folder CLAUDE.md content.** The CLAUDE.md files in `.claude/context/` and `.claude/changes/` need their actual content drafted — short, but not yet written.
