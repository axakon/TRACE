# 0014. An ADR ships when it reaches the default branch

*2026-09-25*

## Context

The ADR README said an ADR ships when it is "committed, pushed, or already acted on by other work". `doctor.js` checked this by comparing each ADR with the first commit that added the file. In one adopter repo, the check flagged six ADRs, and none had a changed decision. The edits were:

- review fixes inside the ADR's own pull request
- a renumber from 0012 to 0013 to avoid a collision with another branch
- stray lines removed before the merge
- a Prettier run that changed `*2026-06-04*` to `_2026-06-04_`

A pull request exists so that reviewers can change what it holds, so freezing the ADR at its first commit works against review. Alternatives considered: the first push (git keeps no record of pushes, and hosts often delete a branch after its merge), an exact text comparison (every formatter run then counts as an edit), and a required branch setting (git already names the remote's default branch in `origin/HEAD`).

## Decision

We will treat an ADR as a draft until it reaches the default branch, usually `main` or `master`. It ships with the first commit on that branch that contains it. For a merged pull request, that is the merge or squash commit. Reviews and citations from other branches do not ship it. `doctor.js` compares each shipped ADR with that first version and ignores changes to whitespace, emphasis markers, and bullet markers. It takes the default branch from `origin/HEAD`, then `main` or `master`, and checks the current branch when none of those exist.

## Consequences

Review fixes and renumbers inside a pull request no longer need a superseding ADR. A formatter can run over the docs folder without warnings. Each warning names the commit it compared against in `shipped_in`, so a reviewer can diff the change directly.

The check cannot see where a pull request ended when it merges by fast-forward or rebase. Its commits land on the default branch one by one, so the check counts edits in the later commits as edits after shipping. Another branch can cite a draft ADR whose wording then changes before the merge.
