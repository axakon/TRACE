---
name: commit-message
description: Draft a single commit's message — imperative-mood title plus a short why body, optional decision bullets, plain text (no markdown). Use when the developer explicitly asks for a commit message, asks to fix a message before amending, or asks the agent to perform the commit on their behalf.
when_to_use: Triggers only on an explicit ask. Two cases — (1) the developer asks for a commit message itself ("write a commit message", "draft the commit message", "help me write the commit", "give me a message for this commit", "fix the message before I amend"); (2) the developer asks the agent to perform the commit ("commit this", "commit the staged changes", "go ahead and commit") — the skill drafts the message the agent then uses. Also covers a request for the message of a specific past commit. Do **not** trigger merely because the developer is wrapping up, is done with a piece of work, has staged changes, or says "ship it" — those signals belong to `/trace:distil`, not here. Not for PR descriptions or squash-merge messages — `/trace-git:pr-description` handles those.
argument-hint: [commit-ish]
allowed-tools: Bash(git diff*) Bash(git status*) Bash(git log*) Bash(git show*) Bash(git rev-parse*) Glob Read Write
---

You are drafting a single commit's message in TRACE's standard shape. The format is a shape, not a taxonomy — no prefixes, no enum of types. The goal is a predictable structure a future reader can scan in `git log`: *why this change* and *the non-obvious decisions behind it*.

Writing rules live in two shared files. Read both at the start of the skill, and re-read them in Phase 4 before you emit:

- [shared/authoring-rules.md](../../shared/authoring-rules.md) — which words you may use, and how to write a sentence. The backtick test is the one that matters most here.
- [shared/change-summary-style.md](../../shared/change-summary-style.md) — title discipline, self-contained, skip-what-the-diff-makes-obvious, lead-in bullets.

[example-commit-message.md](./example-commit-message.md) shows the target length at three sizes — title only, title plus why, and one that earns bullets. Read it in Phase 2, before you draft.

This SKILL.md only covers what is commit-specific.

**Commit messages are plain text, not markdown.** Do not use `##` headers, `**bold**`, or other markdown syntax in the body — `git log` and `git show` render them as literal characters, not formatting. Structure is conveyed by paragraph order and bullet syntax, the same way Tim Pope's classic convention does it.

The output template — emit exactly this, dropping the optional bullets section if empty:

```
{Imperative-mood title, ≤72 chars, no prefix}

{Body: 1–3 sentences. The why — the problem this commit solves, the intent.
Wrap lines at ~72 characters so the message reads cleanly in a terminal.}

- {The decision, in plain words} — {one sentence of detail, about 15 words}
- {The decision, in plain words} — {one sentence of detail, about 15 words}
```

A commit message describes *one logical change*. Stay scoped to what is in this commit's diff — not the whole branch, not the wider goal, not the next step. If the change is trivial (typo, one-line fix, lockfile bump), the title alone is enough; emit just the title with no body.

## Phase 1: Determine the change scope

Find the diff this message summarises.

- **Invoked with a commit-ish argument** (`/trace-git:commit-message HEAD~2`, `/trace-git:commit-message abc1234`): use `git show <ref>` and `git log -1 --format=%B <ref>` to read the diff and any existing message.
- **Invoked bare, with staged changes present** (`git diff --cached --stat` is non-empty): summarise the staged diff. The developer is about to commit.
- **Invoked bare, with nothing staged**: summarise `HEAD` (the most recent commit). The developer is likely preparing to amend or just wants to review the message.

Show the developer which scope you picked in one short line and proceed unless they redirect.

Read the diff selectively for files that matter (new files, security-sensitive paths, structural changes). Skip lockfiles, generated output, and formatting-only churn.

## Phase 2: Draft the title and body

The body is the *why*: the problem this commit solves and the intent behind it. The title already says *what* changed — the body adds context the title cannot carry. One to three sentences, wrapped at ~72 characters. If the conversation already established the intent, draft from that; otherwise propose a draft from the diff and confirm with the developer in one short question.

Keep the body scoped to this commit. Do not describe related work in other commits, the wider branch, or future steps — those belong in the PR description.

For a trivial change where the title is self-explanatory (a typo fix, a one-line dependency bump), emit just the title and stop.

## Phase 3: Draft decision bullets — only if non-obvious

Most commits have none — see the first two messages in [example-commit-message.md](./example-commit-message.md). Apply the bullet test from [change-summary-style.md](../../shared/change-summary-style.md): delete each bullet and ask what a future reader would then get wrong. Anything already explained by a comment in the diff fails the test. Write the lead-in as the decision in plain words, not as the schema names, columns, or test fixtures the code uses for it. Render each as a plain bullet with an em-dash separator:

```
- Per-IP bucket, not per-API-key — the abusive traffic was unauthenticated.
```

No `**bold**` — commit messages are plain text. If nothing qualifies, skip the bullets entirely — do not pad. Most commits will have none.

## Phase 4: Re-check, then output

Re-read [authoring-rules.md](../../shared/authoring-rules.md) and [change-summary-style.md](../../shared/change-summary-style.md) now, then run both tests over the draft. The backtick test on every phrase that names something in the codebase: if the phrase cannot itself take backticks, rewrite it in plain words. The bullet test on every bullet: delete it and ask what a future reader gets wrong, and if the answer is nothing, leave it deleted. Fix the draft before showing it.

Then output the message as plain text in a fenced block, and act on the original request:

- **Asked only for the message text** — stop here. The developer takes it from there.
- **Asked you to perform the commit** — use this message as the commit message and carry out the commit in your normal flow.

Do not ask whether to copy the message, where to place it, or how to apply it. Match the request: draft-only when the developer asked for text, commit when they asked you to commit.

## Notes

- The format is a shape, not a taxonomy. No prefixes, no required type.
- Single commit only. For a whole PR or squash-merge message, use `/trace-git:pr-description`.
- If the diff is empty (nothing staged, or the target commit is empty), say so and stop.
