---
name: commit-message
description: Draft a single commit's message — imperative-mood title plus a short why body, optional decision bullets, plain text (no markdown). Use when the developer explicitly asks for a commit message, asks to fix a message before amending, or asks the agent to perform the commit on their behalf.
when_to_use: Triggers only on an explicit ask. Two cases — (1) the developer asks for a commit message itself ("write a commit message", "draft the commit message", "help me write the commit", "give me a message for this commit", "fix the message before I amend"); (2) the developer asks the agent to perform the commit ("commit this", "commit the staged changes", "go ahead and commit") — the skill drafts the message the agent then uses. Also covers a request for the message of a specific past commit. Do **not** trigger merely because the developer is wrapping up, is done with a piece of work, has staged changes, or says "ship it" — those signals belong to `/playbook:distil`, not here. Not for PR descriptions or squash-merge messages — `/playbook:pr-description` handles those.
argument-hint: [commit-ish]
allowed-tools: Bash(git diff*) Bash(git status*) Bash(git log*) Bash(git show*) Bash(git rev-parse*) Glob Read Write AskUserQuestion
---

You are drafting a single commit's message in the playbook's standard shape. The format is a shape, not a taxonomy — no prefixes, no enum of types. The goal is a predictable structure a future reader can scan in `git log`: *why this change* and *the non-obvious decisions behind it*.

Writing style rules — title discipline, "write for a reader who lacks context", self-contained, skip-what-the-diff-makes-obvious, lead-in bullets — live in [shared/change-summary-style.md](../../shared/change-summary-style.md). Read that file once at the start of the skill; this SKILL.md only covers what is commit-specific.

**Commit messages are plain text, not markdown.** Do not use `##` headers, `**bold**`, or other markdown syntax in the body — `git log` and `git show` render them as literal characters, not formatting. Structure is conveyed by paragraph order and bullet syntax, the same way Tim Pope's classic convention does it.

The output template — emit exactly this, dropping the optional bullets section if empty:

```
{Imperative-mood title, ≤72 chars, no prefix}

{Body: 1–3 sentences. The why — the problem this commit solves, the intent.
Wrap lines at ~72 characters so the message reads cleanly in a terminal.}

- {Lead-in phrase} — {≤15 words of detail on a non-obvious decision}
- {Lead-in phrase} — {≤15 words of detail on a non-obvious decision}
```

A commit message describes *one logical change*. Stay scoped to what is in this commit's diff — not the whole branch, not the wider goal, not the next step. If the change is trivial (typo, one-line fix, lockfile bump), the title alone is enough; emit just the title with no body.

## Phase 1: Determine the change scope

Find the diff this message summarises.

- **Invoked with a commit-ish argument** (`/playbook:commit-message HEAD~2`, `/playbook:commit-message abc1234`): use `git show <ref>` and `git log -1 --format=%B <ref>` to read the diff and any existing message.
- **Invoked bare, with staged changes present** (`git diff --cached --stat` is non-empty): summarise the staged diff. The developer is about to commit.
- **Invoked bare, with nothing staged**: summarise `HEAD` (the most recent commit). The developer is likely preparing to amend or just wants to review the message.

Show the developer which scope you picked in one short line and proceed unless they redirect.

Read the diff selectively for files that matter (new files, security-sensitive paths, structural changes). Skip lockfiles, generated output, and formatting-only churn.

## Phase 2: Draft the title and body

The body is the *why*: the problem this commit solves and the intent behind it. The title already says *what* changed — the body adds context the title cannot carry. One to three sentences, wrapped at ~72 characters. If the conversation already established the intent, draft from that; otherwise propose a draft from the diff and confirm with the developer in one short question.

Keep the body scoped to this commit. Do not describe related work in other commits, the wider branch, or future steps — those belong in the PR description.

For a trivial change where the title is self-explanatory (a typo fix, a one-line dependency bump), emit just the title and stop.

## Phase 3: Draft decision bullets — only if non-obvious

List only what isn't visible from reading the diff: a non-obvious decision, a rejected alternative, a deliberate omission, a hidden constraint. Render each as a plain bullet with a short lead-in phrase and an em-dash separator:

```
- Per-IP bucket, not per-API-key — the abusive traffic was unauthenticated.
```

No `**bold**` — commit messages are plain text. If nothing qualifies, skip the bullets entirely — do not pad. Most commits will have none.

## Phase 4: Show and place

Print the full drafted message to chat in a fenced block so the developer can copy it. Then ask once with `AskUserQuestion` how to place it:

- **Copy from chat** (default) — no further action.
- **Write to a file** — ask for the path, then Write it. A common target is `.git/COMMIT_EDITMSG` so `git commit` picks it up; warn the developer that this overwrites whatever is there.

Never run `git commit`, `git commit --amend`, `git add`, or any history-rewriting command. The skill drafts; the developer commits.

## Notes

- The format is a shape, not a taxonomy. No prefixes, no required type.
- Single commit only. For a whole PR or squash-merge message, use `/playbook:pr-description`.
- If the diff is empty (nothing staged, or the target commit is empty), say so and stop.
