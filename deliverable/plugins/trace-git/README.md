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

**It can finish the job.** Ask for the text and you get the text. Ask the agent to open or update the PR and it carries that out with `gh` on GitHub or `glab` on GitLab.

Both CLIs are optional — without one, the PR-number and apply-to-PR paths just become unavailable and base-branch inference falls back to git alone.

---

## Writing rules

Two files, layered. `shared/authoring-rules.md` sets which words are allowed and how a sentence is built — it is a synced copy of the file in [`trace/shared/`](../trace/shared/authoring-rules.md), so edit it there and run `node scripts/sync-shared.js` from the repo root. `shared/change-summary-style.md` adds only what is specific to a change summary and never restates a rule from the base file.

Two rules do most of the work. The **backtick test**: if a phrase can take backticks it is a real name and survives, and if it cannot, it is text and gets said in plain words. The **delete test**: remove a bullet and ask what the reviewer then gets wrong, and if the answer is nothing, the bullet was narrating the diff.

Each skill also ships an example — [`example-pr-description.md`](skills/pr-description/example-pr-description.md) and [`example-commit-message.md`](skills/commit-message/example-commit-message.md). They show how long the text should be, which no rule can say on its own. The PR one is 322 words on one screen, and it lists the four Approach bullets a first draft had to lose to get there.
