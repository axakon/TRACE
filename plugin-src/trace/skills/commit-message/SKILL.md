---
name: commit-message
description: Draft a single commit's message — imperative-mood title plus a short why body, optional decision bullets, plain text (no markdown). Use when the developer explicitly asks for a commit message, asks to fix a message before amending, or asks the agent to perform the commit on their behalf.
when_to_use: Triggers only on an explicit ask. Two cases — (1) the developer asks for a commit message itself ("write a commit message", "draft the commit message", "help me write the commit", "give me a message for this commit", "fix the message before I amend"); (2) the developer asks the agent to perform the commit ("commit this", "commit the staged changes", "go ahead and commit") — the skill drafts the message the agent then uses. Also covers a request for the message of a specific past commit. Do **not** trigger merely because the developer is wrapping up, is done with a piece of work, has staged changes, or says "ship it" — those signals belong to `{{skill:trace:distil}}`, not here. Not for PR descriptions or squash-merge messages — `{{skill:trace:pr-description}}` handles those.
argument-hint: [commit-ish]
allowed-tools: Bash(git diff*) Bash(git status*) Bash(git log*) Bash(git show*) Bash(git rev-parse*) Glob Read Write
---

{{host-instructions}}


Draft one commit's message: an imperative title, a short why, and decision bullets only when they earn a place. The shape has no prefixes and no enum of change types.

Before drafting, read [authoring-rules.md](../../shared/authoring-rules.md), [change-summary-style.md](../../shared/change-summary-style.md), and [example-commit-message.md](./example-commit-message.md). The example sets the target length at three sizes.

Commit messages are plain text. `git log` shows markdown as literal characters, so use no headers or bold. Emit exactly this, dropping the bullets if there are none:

```
{Imperative-mood title, ≤72 chars, no prefix}

{Body: 1–3 sentences. The why — the problem this commit solves, the intent.
Wrap lines at ~72 characters so the message reads cleanly in a terminal.}

- {The decision, in plain words} — {one sentence of detail, about 15 words}
- {The decision, in plain words} — {one sentence of detail, about 15 words}
```

## Phase 1: Determine the scope

- **With a commit-ish** (`{{skill:trace:commit-message}} HEAD~2`): read `git show <ref>` and `git log -1 --format=%B <ref>`.
- **Bare, with staged changes:** summarise the staged diff.
- **Bare, with nothing staged:** summarise `HEAD`.

Tell the developer which scope you picked in one line. Skip lockfiles, generated output, and formatting-only churn. If the diff is empty, say so and stop.

## Phase 2: Title and body

The body is the why that the title cannot carry, in one to three sentences. If the conversation did not establish the intent, draft it from the diff and confirm it with one short question. Describe only this commit, not the branch or the next step. For a trivial change such as a typo or a lockfile bump, emit the title alone.

## Phase 3: Decision bullets

Most commits have none. Keep only bullets that pass the delete test in [change-summary-style.md](../../shared/change-summary-style.md), written as `- Lead-in — detail` with no bold.

## Phase 4: Output

Check the draft against the rules files and fix it before showing it. Output the message in a fenced block. If the developer asked only for the text, stop there. If they asked you to commit, commit with this message. For a PR or squash-merge message, use `{{skill:trace:pr-description}}`.
