---
name: "spec"
description: "Plan substantial work through an interview, review explicit acceptance criteria, then implement and verify the approved change"
---

Use the available file and shell tools. Resolve <absolute-skill-directory> from the installed SKILL.md path before running a script, and quote the resolved absolute path. Use an available question control for closed choices, or ask in chat if it is unavailable. Wait for the developer’s answer. Load a referenced skill from the installed skills catalog; do not assume a Skill tool exists. Respect the active collaboration mode and permissions.


You are running the spec path of TRACE: substantial work that earns a written plan before implementation. The approved plan is the contract for implementation and verification. If the developer asks only for a plan, finish after presenting it; do not infer permission to implement.

## Phase 1: Establish and confirm scope

First, locate the work.

- If the developer's invoking message already describes the change ("let's add X", "help me refactor Y"), use that as the scope.
- If the message is bare (e.g. just `$trace-full:spec` with no surrounding description), ask one open question: "What do you want to build?" Do not propose options or infer candidates from the repo. Wait for the developer's answer.

Once you have a described scope, briefly confirm it warrants the spec path. If it's small (one file, one line, a typo, a config tweak), suggest they skip the skill and do the work directly — the direct path is correct for contained changes.

If the work is genuinely substantial, proceed.

## Phase 2: Interview and present the plan

Use the active Codex collaboration mode. If Plan mode is active, work within it. Otherwise conduct the interview in chat. Do not call EnterPlanMode or attempt to change the collaboration mode. Wait for explicit approval before implementation.

Interview the developer until you understand:

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

When you have enough, read [authoring-rules.md](../../shared/authoring-rules.md), then draft the complete plan. Re-check it before presenting. Before approval, write only the plan preview; do not edit implementation files.

Save the complete plan to a uniquely named Markdown file under ~/.claude/plans/ when permitted; this is TRACE’s existing viewer storage, not a Codex native plan file. Run the viewer command below before presenting the plan. Present it through the active Codex planning interface when available, or in chat, and ask for explicit approval. Do not call ExitPlanMode. Approval does not itself change the active collaboration mode; implement only when that mode permits it.

Run `node "<absolute-skill-directory>/../../scripts/viewer-open.js" plan "<absolute-plan-file>"`. Include the returned URL with the plan. If saving or opening is unavailable, present the complete plan in chat and explain the limitation. Respect a disabled viewer. Never claim a preview opened when the command failed.

On requested revisions, update the same plan file and present the revision for approval. Implement the approved content only. If the developer rejects or aborts the plan, stop without implementation.

**Open with core user stories.** Right after the plan's context, add a `## Core user stories` section: one bullet per outcome, phrased `As a <role>, I want <capability>, so that <consequence>` — e.g. "As an on-call engineer, I want the failed job's payload in the alert, so that I can retry it without opening the database." For internal work the role is still real — a developer, an on-call engineer, a CI pipeline. Tie each acceptance criterion back to a story; a criterion no story needs is scope creep, a story no criterion verifies is unfinished planning. Skip the section only when the change has no behavioural outcome at all (pure rename, dependency bump).

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

Scan the decisions made during planning for one that looks architecturally significant — it affects the system's structure, a non-functional characteristic, a foundational dependency, a public interface, or a construction technique reused across the codebase, and there was a real choice between alternatives. If none does, skip this phase silently; most substantial work still produces no ADR.

If one might qualify, offer it using the question control: **Record an ADR** / **Skip**. On **Record an ADR**, load and follow the installed $trace-full:adr skill — it owns the full gate, the template, numbering, and the write, and has the planning decision in context. It may still decline the decision as too small; that's the correct outcome. Don't write the ADR yourself. On **Skip**, continue.

## Phase 6: Hand off to distillation

Once the work is verified, tell the developer:

> The work is verified against the acceptance criteria. Run `$trace-full:distil` when you're ready to capture any durable knowledge from this change into the project's permanent context.

Do not run distillation yourself.

## Notes

- Use the host’s planning controls where available. The interview, review, and approval requirements apply in either mode.
- The plan preview renders the same contract presented in the conversation. If the approval or approved content is no longer available, re-establish it before continuing.
- If the developer interrupts mid-flow (asks to skip ahead, change scope, abandon), follow their lead. The skill is a default pathway, not a forced one.

When to use: When the developer is starting substantial work — adding a feature, building or implementing something new, refactoring across multiple files, or anything with acceptance criteria they can't hold in their head. Trigger on phrases like "let's add", "I want to build", "we need to implement", "help me refactor", or any request describing scope that sounds like more than a single-file change. Not for one-line fixes, typos, config tweaks, or contained edits — those go through the direct path. Phase 1 establishes the scope (asking the developer if the invocation didn't include one) and confirms it warrants the spec path, so it is safe to trigger on borderline or bare invocations; the developer can redirect to the direct path.
