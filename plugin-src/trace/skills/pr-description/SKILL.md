---
name: pr-description
description: Draft a PR description or squash-merge commit message in TRACE's What / Approach / Updated context format. A predictable shape for reviewers, no Conventional-Commits taxonomy. Use when the developer explicitly asks for a PR description, asks for the squash-merge message, or asks the agent to open a PR on their behalf.
when_to_use: Triggers only on an explicit ask. Two cases — (1) the developer asks for the PR text itself ("write the PR description", "draft the PR body", "give me the squash message", "update the PR description"); (2) the developer asks the agent to open or update the PR ("open a PR for this", "push and open a PR", "edit the open PR's body") — the skill drafts the body the agent then uses. Do **not** trigger merely because the developer is wrapping up, says "ship it", or pushes a branch — those signals belong to `{{skill:trace:distil}}` or to no skill at all. For a single commit's message, use `{{skill:trace:commit-message}}` instead.
argument-hint: [base-branch | PR#]
allowed-tools: Bash(git diff*) Bash(git status*) Bash(git log*) Bash(git branch*) Bash(git remote*) Bash(gh *) Bash(glab *) Glob Read Write
---

{{host-instructions}}


Draft a PR description or squash-merge message in TRACE's shape: *why* the change exists, *what approach* it takes, and *what permanent context* moved. The shape has no prefixes and no enum of change types.

Before drafting, read [authoring-rules.md](../../shared/authoring-rules.md), [change-summary-style.md](../../shared/change-summary-style.md), and [example-pr-description.md](./example-pr-description.md). The example sets the target length.

Emit exactly this template, dropping any optional section that is empty:

```
{Imperative-mood title, ≤72 chars, no prefix}

## What is this
{1–3 sentences. The why — the problem this change solves, the intent.}

## Approach
{Bullets when there are 3+ distinct points; short prose (2–3 sentences) when it is one continuous thought.}
- **{The decision, in plain words}:** {one sentence of detail, about 15 words}
- **{The decision, in plain words}:** {one sentence of detail, about 15 words}

## Risks / follow-ups
- **{Risk or deferred work}:** {what the reviewer or operator needs to know}

## Updated context
- ADR: {NNNN-short-title} — {one-line summary}
- Docs: {file or area} — {one-line summary}

## How to verify
- {Action only a reviewer can meaningfully take — staging behaviour, a UI flow, an output CI cannot assert. Not "run the tests".}
```

## Phase 1: Determine the change range

- **With a PR number** (`{{skill:trace:pr-description}} 123`): run `gh pr view 123 --json baseRefName,headRefName,number,title,body`, fetch the base if needed, and diff against `origin/<base>`.
- **With a base branch** (`{{skill:trace:pr-description}} main`): diff `<base>...HEAD`.
- **Bare:** use the current branch's PR base from `gh pr view --json baseRefName`, then the remote's default branch, then `main` or `master`. Tell the developer which base you picked.

Start from `git diff --stat <base>...HEAD` and `git log <base>..HEAD --oneline`. Read the files that matter, and skip lockfiles, generated output, and formatting-only churn. If the diff is empty, say so and stop.

## Phase 2: Title and "What is this"

The body is the why: the problem and the intent, in one to three sentences. If the conversation did not establish the intent, draft it from the diff and confirm it with one short question.

## Phase 3: Approach and Risks

**Approach** holds the decisions that survive the delete test in [change-summary-style.md](../../shared/change-summary-style.md).

**Risks / follow-ups** holds what a reviewer or operator must act on or watch: a manual rollout step, deferred cleanup, a known limitation, or a feature flag. Skip it if nothing qualifies.

## Phase 4: Updated context

Fill this from `git diff --name-status <base>...HEAD`, and skip it if both lists are empty.

- **ADRs:** each *added* file matching `**/adr/NNNN-*.md`. Read it for the title and a one-line summary.
- **Docs:** each added or modified markdown file that is durable project context: a root `AGENTS.md` or `CLAUDE.md`, or a file in the folder the ADRs live in. Say what changed, not what the file is. Skip package READMEs, changelogs, and generated docs.

If the change made a substantial decision with no ADR in the diff, say so in your final message so the developer can run `{{skill:trace:adr}}`. Do not invent an ADR entry.

## Phase 5: How to verify

Include it for behaviour changes, bug fixes, and anything user-facing. Skip it for trivial changes and pure refactors. Write one to three concrete steps a reviewer can take, each with a URL or command and the expected result. Leave out anything CI or the developer already covered, such as tests, lint, or the build. If CI is the only check, skip the section.

## Phase 6: Output

Check the draft against the rules files and fix it before showing it. Output the body in a fenced block, then act on the request:

- **Asked only for the text:** stop there.
- **Asked to open or update the PR:**
  - **New PR:** push the branch if needed, then `gh pr create` with the title and body.
  - **Existing PR** (`gh pr view --json number` succeeds): `gh pr edit <number> --body-file <tmp>`. Do not open a duplicate.
  - **GitLab remote:** use `glab mr create`, `glab mr view`, and `glab mr update <number> --description "$(cat <tmp>)"`.

The title goes in the title field of GitHub or GitLab, and the rest in the body. A squash-merge message takes the whole block. Do not push or open a PR when the developer asked only for the text.

Without `gh` or `glab`, the PR-number and apply paths are unavailable, and base inference falls back to git. For a single commit, use `{{skill:trace:commit-message}}`.
