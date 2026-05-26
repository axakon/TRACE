---
name: pr-description
description: Draft a PR description or squash-merge commit message in the playbook's What / Approach / Updated context format. A predictable shape for reviewers, no Conventional-Commits taxonomy.
when_to_use: When the developer is preparing a PR description, drafting the final commit message for a squash-merge, or otherwise summarising a finished change for a reviewer. Not for one-line trivial commits, and not for the title alone.
argument-hint: [base-branch | PR#]
allowed-tools: Bash(git diff*) Bash(git status*) Bash(git log*) Bash(git branch*) Bash(git remote*) Bash(gh *) Glob Read Write AskUserQuestion
---

You are drafting a PR description (or squash-merge commit message) in the playbook's standard format. The format is a shape, not a taxonomy — there are no required prefixes and no enum of types. The goal is a predictable structure a reviewer can scan: *why* this change, *what approach* was taken, *what permanent context* moved as a result.

The output template — emit exactly this, dropping any optional section that is empty:

```
{Imperative-mood title, ≤72 chars, no prefix}

## What is this
{1–3 sentences. The why — the problem this change solves, the intent.}

## Approach
{2–5 sentences. The how — the chosen approach and notable trade-offs.
Do not restate the diff line-by-line.}

---

## Updated context
- ADR: {NNNN-short-title} — {one-line summary}
- Docs: {file or area} — {one-line summary}

## How to verify
- {step or check the reviewer can run}
```

## Phase 1: Determine the change range

Find the range of commits this draft summarises.

- **Invoked with a PR number** (`/playbook:pr-description 123`): use `gh pr view 123 --json baseRefName,headRefName,number,title,body` to get base/head, then `git fetch origin <base>` if needed and diff against `origin/<base>`.
- **Invoked with a base branch** (`/playbook:pr-description main`): diff `<base>...HEAD`.
- **Invoked bare:** infer the base. Try in order: `gh pr view --json baseRefName` for the current branch's PR; otherwise the repo's default branch from `git remote show origin | grep "HEAD branch"`; otherwise `main` then `master`. Show the developer which base you picked and proceed unless they redirect.

Run `git diff --stat <base>...HEAD` and `git log <base>..HEAD --oneline` to get the shape of the change. Read the full diff selectively for files that matter (new files, security-sensitive paths, structural changes). Skip lockfiles, generated output, and formatting-only churn.

## Phase 2: Draft the title and "What is this"

The title is one imperative-mood line, ≤72 characters, no Conventional-Commits prefix. Examples: `Rate-limit the public search endpoint`, `Fix race in session refresh`. Not `feat: add rate limiting`.

The "What is this" body is the *why*: the problem this change solves and the intent behind it. One to three sentences. If the conversation already established the intent, draft from that; otherwise propose a draft from the diff and confirm with the developer in one short question.

## Phase 3: Draft the "Approach"

Summarise the technical approach in two to five sentences: the chosen path, the notable trade-off, and the area touched. The reader has the diff — do not narrate it. Mention only details that aren't obvious from reading the code: a non-obvious decision, a deferred follow-up, a deliberate omission.

## Phase 4: Detect "Updated context"

Auto-populate this section from the diff. Skip the whole section if both lists are empty.

- **ADRs.** Resolve the docs folder per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md). List any file under `<docs-folder>/adr/` that appears as added in `git diff --name-status <base>...HEAD`. Read each to extract the title and a one-line summary.
- **Docs.** List any other file under `<docs-folder>/` (excluding `adr/`) or any root-level `AGENTS.md`/`CLAUDE.md` that was added or modified. One line per file describing what changed (not what the file is).

If the change made a substantial decision but no ADR exists in the diff, mention this in your final summary so the developer can run `/playbook:adr` separately — do not invent an ADR entry.

## Phase 5: Decide on "How to verify"

Ask the developer once with `AskUserQuestion`: **Include verification steps** / **Skip**. Default to skip for trivial or pure-refactor changes; default to include for behavioural changes, bug fixes, or anything user-facing. If included, draft 2–5 short steps a reviewer can run (commands, URLs, expected outputs). Keep them concrete.

## Phase 6: Show, confirm, and place

Print the full drafted body to chat in a fenced block so the developer can copy it. Then ask once with `AskUserQuestion` how to place it:

- **Copy from chat** (default) — no further action.
- **Write to a file** — ask for the path, then Write it.
- **Apply to the open PR** — only if `gh pr view --json number` succeeds on the current branch. Run `gh pr edit <number> --body-file <tmp>` after writing the body to a temp file. Do not create a new PR.

If the developer's target is a UI with a separate title field (GitHub, GitLab), tell them to put the title in the title field and the rest in the body. If the target is a squash-merge commit message, the whole block goes in.

## Notes

- The format is a shape, not a taxonomy. No prefixes, no required type. The Tim Pope discipline (imperative mood, ≤72-char subject) is the only carry-over from commit-message conventions.
- Never push, never open a PR, never amend a commit. The skill drafts; the developer ships.
- The skill works without `gh` installed — the PR-number and apply-to-PR paths simply become unavailable, and base-branch inference falls back to git alone.
- If the diff is empty (nothing to summarise), say so and stop.
