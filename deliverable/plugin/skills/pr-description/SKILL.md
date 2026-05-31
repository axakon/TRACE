---
name: pr-description
description: Draft a PR description or squash-merge commit message in the playbook's What / Approach / Updated context format. A predictable shape for reviewers, no Conventional-Commits taxonomy. Use when the developer explicitly asks for a PR description, asks for the squash-merge message, or asks the agent to open a PR on their behalf.
when_to_use: Triggers only on an explicit ask. Two cases — (1) the developer asks for the PR text itself ("write the PR description", "draft the PR body", "give me the squash message", "update the PR description"); (2) the developer asks the agent to open or update the PR ("open a PR for this", "push and open a PR", "edit the open PR's body") — the skill drafts the body the agent then uses. Do **not** trigger merely because the developer is wrapping up, says "ship it", or pushes a branch — those signals belong to `/playbook:distil` or to no skill at all. For a single commit's message, use `/playbook:commit-message` instead.
argument-hint: [base-branch | PR#]
allowed-tools: Bash(git diff*) Bash(git status*) Bash(git log*) Bash(git branch*) Bash(git remote*) Bash(gh *) Glob Read Write
---

You are drafting a PR description (or squash-merge commit message) in the playbook's standard format. The format is a shape, not a taxonomy — there are no required prefixes and no enum of types. The goal is a predictable structure a reviewer can scan: *why* this change, *what approach* was taken, *what permanent context* moved as a result.

Writing style rules — title discipline, "write for a reader who lacks context", self-contained, skip-what-the-diff-makes-obvious, bold-lead-in bullets — live in [shared/change-summary-style.md](../../shared/change-summary-style.md). Read that file once at the start of the skill; this SKILL.md only covers what is PR-specific.

The output template — emit exactly this, dropping any optional section that is empty:

```
{Imperative-mood title, ≤72 chars, no prefix}

## What is this
{1–3 sentences. The why — the problem this change solves, the intent.}

## Approach
{Bullets when there are 3+ distinct points; short prose (2–3 sentences) when it is one continuous thought.}
- **{Decision / trade-off}:** {≤15 words}
- **{Decision / trade-off}:** {≤15 words}

## Risks / follow-ups
- **{Risk or deferred work}:** {what the reviewer or operator needs to know}

## Updated context
- ADR: {NNNN-short-title} — {one-line summary}
- Docs: {file or area} — {one-line summary}

## How to verify
- {Action only a reviewer can meaningfully take — staging behaviour, a UI flow, an output CI cannot assert. Not "run the tests".}
```

## Phase 1: Determine the change range

Find the range of commits this draft summarises.

- **Invoked with a PR number** (`/playbook:pr-description 123`): use `gh pr view 123 --json baseRefName,headRefName,number,title,body` to get base/head, then `git fetch origin <base>` if needed and diff against `origin/<base>`.
- **Invoked with a base branch** (`/playbook:pr-description main`): diff `<base>...HEAD`.
- **Invoked bare:** infer the base. Try in order: `gh pr view --json baseRefName` for the current branch's PR; otherwise the repo's default branch from `git remote show origin | grep "HEAD branch"`; otherwise `main` then `master`. Show the developer which base you picked and proceed unless they redirect.

Run `git diff --stat <base>...HEAD` and `git log <base>..HEAD --oneline` to get the shape of the change. Read the full diff selectively for files that matter (new files, security-sensitive paths, structural changes). Skip lockfiles, generated output, and formatting-only churn.

## Phase 2: Draft the title and "What is this"

The "What is this" body is the *why*: the problem this change solves and the intent behind it. One to three sentences. If the conversation already established the intent, draft from that; otherwise propose a draft from the diff and confirm with the developer in one short question.

## Phase 3: Draft the "Approach" and "Risks / follow-ups"

**Approach.** List only what isn't obvious from the diff: non-obvious decisions, rejected alternatives, deliberate omissions.

**Risks / follow-ups.** Pull out anything the reviewer or an operator needs to act on or watch for: a manual rollout step, a deferred cleanup, a known limitation, a feature flag. One bullet each, **bold lead-in**. Skip the section entirely if nothing qualifies — do not pad it.

## Phase 4: Detect "Updated context"

Auto-populate this section from the diff. Skip the whole section if both lists are empty.

- **ADRs.** Resolve the docs folder per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md). List any file under `<docs-folder>/adr/` that appears as added in `git diff --name-status <base>...HEAD`. Read each to extract the title and a one-line summary.
- **Docs.** List any other file under `<docs-folder>/` (excluding `adr/`) or any root-level `AGENTS.md`/`CLAUDE.md` that was added or modified. One line per file describing what changed (not what the file is).

If the change made a substantial decision but no ADR exists in the diff, mention this in your final summary so the developer can run `/playbook:adr` separately — do not invent an ADR entry.

## Phase 5: Decide on "How to verify"

Decide whether to include the section from the change itself: skip for trivial or pure-refactor changes; include for behavioural changes, bug fixes, or anything user-facing.

If included, draft 1–3 short steps **a reviewer can meaningfully take** — staging behaviour to exercise, a UI flow to walk, an output to eyeball. Each step concrete (URL, command, expected observation).

Exclude anything the developer or CI already covered: do not write "`go test ./...` passes", "lint is clean", "the build succeeds", or any restatement of CI. The reviewer is not re-running the dev's pre-flight. If the only verification is "CI passes", skip the section.

## Phase 6: Output the description

Output the full drafted body as plain text in a fenced block, then act on the original request:

- **Asked only for the description or squash-merge message** — stop here. The developer takes it from there.
- **Asked you to open or update the PR** — carry it out in your normal flow using this body:
  - **New PR** — push the branch if needed, then `gh pr create` with the title and body.
  - **Existing PR** (`gh pr view --json number` succeeds on the branch) — `gh pr edit <number> --body-file <tmp>`. Don't open a duplicate.

Do not ask whether to copy the body, where to place it, or how to apply it.

If the target is a UI with a separate title field (GitHub, GitLab), the title goes in the title field and the rest in the body. For a squash-merge commit message, the whole block goes in.

## Notes

- The format is a shape, not a taxonomy. No prefixes, no required type.
- Match the request: draft-only when the developer asked for the text; open or update the PR when they asked you to. Don't push or open a PR on your own initiative when only the text was requested.
- The skill works without `gh` installed — the PR-number and apply-to-PR paths simply become unavailable, and base-branch inference falls back to git alone.
- If the diff is empty (nothing to summarise), say so and stop.
- For a single commit (not a whole PR or squash-merge), use `/playbook:commit-message` instead — same writing discipline, leaner template.
