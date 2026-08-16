# trace-git

The delivery add-on for [TRACE](../../../README.md). Commit messages and PR descriptions in a shape reviewers can scan.

No Conventional Commits taxonomy, no required prefixes, no enum of types — just a predictable structure. Two skills, no hooks, no scripts.

Depends on [`trace`](../trace/) — installing this brings the core with it.

---

## Install

```
/plugin marketplace add axakon/TRACE
/plugin install trace-git@trace
/reload-plugins
```

Commands are namespaced `/trace-git:`.

---

## Skills

| Command | What it does |
|---|---|
| `/trace-git:pr-description` | Drafts a PR description or squash-merge message: *What is this · Approach · Risks · Updated context · How to verify.* |
| `/trace-git:commit-message` | Drafts one commit's message — imperative title, short why, optional decision bullets. Leaner than the PR template. |

Both trigger **only when you ask**. Wrapping up, saying "ship it", or pushing a branch won't summon them — those belong to `/trace:distil`.

---

## What's useful about it

**"Updated context" writes itself.** Any ADR added in the diff and any durable-context file touched gets listed with a one-line summary, so reviewers see what permanent knowledge moved alongside the code.

**"How to verify" is for the reviewer, not CI.** It asks for steps only a human can meaningfully take — staging behaviour, a UI flow, an output to eyeball. Restating "the tests pass" is explicitly excluded.

**It can finish the job.** Ask for the text and you get the text. Ask the agent to open or update the PR and it carries that out with `gh`.

`gh` is optional — without it, the PR-number and apply-to-PR paths just become unavailable and base-branch inference falls back to git alone.
