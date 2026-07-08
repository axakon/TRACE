---
name: spec-workflow
description: Drive substantial work through plan mode — interview to a plan with explicit acceptance criteria, then implement and verify against it
when_to_use: When the developer is starting substantial work — adding a feature, building or implementing something new, refactoring across multiple files, or anything with acceptance criteria they can't hold in their head. Trigger on phrases like "let's add", "I want to build", "we need to implement", "help me refactor", or any request describing scope that sounds like more than a single-file change. Not for one-line fixes, typos, config tweaks, or contained edits — those go through the direct path. Phase 1 establishes the scope (asking the developer if the invocation didn't include one) and confirms it warrants the spec path, so it is safe to trigger on borderline or bare invocations; the developer can redirect to the direct path.
allowed-tools: Glob Read Edit Write Skill
---

You are running the spec path of the playbook: substantial work that earns a written plan before any code. The plan you produce in plan mode is the spec — the contract the implementation follows and is verified against.

## Phase 1: Establish and confirm scope

First, locate the work.

- If the developer's invoking message already describes the change ("let's add X", "help me refactor Y"), use that as the scope.
- If the message is bare (e.g. just `/playbook:spec-workflow` with no surrounding description), ask one open question: "What do you want to build?" Do not propose options or infer candidates from the repo. Wait for the developer's answer.

Once you have a described scope, briefly confirm it warrants the spec path. If it's small (one file, one line, a typo, a config tweak), suggest they skip the skill and do the work directly — the direct path is correct for contained changes.

If the work is genuinely substantial, proceed.

## Phase 2: Enter plan mode and interview verbosely

Enter plan mode using the EnterPlanMode tool.

Inside plan mode, interview the developer thoroughly. Plan mode's default behaviour is to ask clarifying questions — go further than the default. Keep asking until you genuinely understand:

- What outcome the developer wants (not just what code to write)
- Which existing patterns or modules this should integrate with
- What's deliberately out of scope
- What "done" looks like — concrete, testable conditions
- How acceptance will be verified — automated tests, manual steps, or both
- Other parts of the system this change touches or depends on

The plan **is the contract** the work is verified against, so it must state the **acceptance criteria** and **verification approach** explicitly — written into the plan, not just discussed.

Run the interview like this:
- **Answer from the codebase first** — only ask what the repo can't settle.
- **One question at a time, each with your recommended answer** — let the developer confirm or redirect rather than start cold. Still wait for a real answer; don't take a quick yes as settled.
- **Resolve the plan as a decision tree** — settle the choices that constrain others first.
- **Probe once more** when an answer is thin. Don't produce a plan until the whole checklist above is answered.

When you have enough, produce the plan inside plan mode and present it for approval (via ExitPlanMode). Do not edit any files before the plan is approved.

**Open with core user stories.** Right after the plan's context, add a `## Core user stories` section: one bullet per outcome, phrased `As a <role>, I want <capability>, so that <consequence>`. For internal work the role is still real — a developer, an on-call engineer, a CI pipeline. Tie each acceptance criterion back to a story; a criterion no story needs is scope creep, a story no criterion verifies is unfinished planning. Skip the section only when the change has no behavioural outcome at all (pure rename, dependency bump).

**Diagram the structure, prose the intent.** Where the shape of the change carries the meaning, put a mermaid diagram in the plan instead of describing the shape in sentences:

- The journey behind a user story — how the role interacts with the system → `sequenceDiagram` with the role as an `actor`
- Control flow with branches, retries, or failure paths → `flowchart`
- Calls crossing services, processes, or actors → `sequenceDiagram`
- A lifecycle or status field gaining/changing states → `stateDiagram-v2`
- Data-model or schema changes touching several entities → `erDiagram`

Prefer the user-journey sequence diagram when a story spans more than one interaction — it shows what the role experiences, not just what the code does. Skip the diagram when the change is linear or single-file — a diagram restating a bullet list is noise.

## Phase 3: Implement against the plan

Once the developer approves the plan, implement the work. The approved plan is the contract — refer back to its acceptance criteria as you go. If implementation reveals something the plan didn't anticipate (a constraint, a missing dependency, a wrong assumption), pause and discuss with the developer; re-agree the plan before continuing.

Do not silently expand scope. If the work needs to grow beyond the plan, that's a decision for the developer, not for the agent mid-implementation.

## Phase 4: Verify against acceptance criteria

When implementation feels complete, walk the plan's acceptance criteria one by one. Mark each **met**, **unverified**, or **not met**. "Met" requires evidence — never claim it without one. Evidence depends on the criterion's type:

- **Behavioural** ("endpoint returns 429 after N requests"): *observed output*. Paste the command and its actual output, or the result of the manual step you ran. A test file's path is not evidence — the test must have run and passed. Ran nothing? It's **unverified**, not met.
- **Structural** ("`RateLimiter` registered on every route in `routes/api.ts`", "old `JWT_TTL` key removed"): a file/line citation is enough — quote the lines inline.

Then:

- **Not met** → not done; keep going.
- **Unverified** (no test runner, needs the developer's environment) → say so and ask how to resolve: they run it, accept the gap, or pause until a test exists. Don't silently flip it to "met".
- **Criteria themselves wrong** (missed edge case, unverifiable phrasing) → re-agree the criteria with the developer, then continue.

## Phase 5: Offer to record an ADR (only if a decision qualifies)

Check the decisions made during planning against [adr-criteria.md](../../shared/adr-criteria.md) — apply its hard gate. If none clear it, skip this phase silently; most substantial work still produces no ADR.

If one qualifies, offer it with `AskUserQuestion`: **Record an ADR** / **Skip**. On **Record an ADR**, invoke `/playbook:adr` via the Skill tool — it owns the template, numbering, and write, and has the planning decision in context. Don't write the ADR yourself. On **Skip**, continue.

## Phase 6: Hand off to distillation

Once the work is verified, tell the developer:

> The work is verified against the acceptance criteria. Run `/playbook:distil` when you're ready to capture any durable knowledge from this change into the project's permanent context.

Do not run distillation yourself.

## Notes

- Plan mode is the interview engine. Don't replicate its behaviour outside it — use it.
- The plan is the spec, and it lives in the conversation. If work spans sessions and the plan has scrolled out of context, re-establish it before continuing.
- If the developer interrupts mid-flow (asks to skip ahead, change scope, abandon), follow their lead. The skill is a default pathway, not a forced one.
