---
name: release
description: Cut a TRACE release — preflight the tree (doctor, script syntax, version/CHANGELOG agreement, doc-structure sync), commit the work, tag v<version> with release notes from the changelog, push, and create the GitHub release when gh is available. For TRACE maintainers; adopters never see this skill.
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(gh *) Bash(node *) Bash(diff *) Glob Read Edit AskUserQuestion
---

You are cutting a TRACE release. The versioned artifact is the plugin (`deliverable/plugin/.claude-plugin/plugin.json`); the repo is the marketplace, so a release is: one commit on `main`, one annotated tag `v<version>` carrying the release notes, pushed. Claude Code caches installs by version string — an unbumped version reaches no one.

**Bias to act.** Fix mechanical preflight failures yourself (a stale changelog date, an unbumped patch version) and say so. Stop and ask only when the failure needs a real decision (doctor errors you can't attribute, a version that should maybe be MAJOR, unrelated-looking files in the tree).

## Phase 1: Preflight

Run all of these; collect failures before deciding anything. There is no CI — this phase is the only gate.

1. **Doctor is green:** `node deliverable/plugin/scripts/doctor.js check .` — errors block the release; warnings are reported in the notes summary but don't block.
2. **Scripts parse:** `node --check` every `deliverable/plugin/scripts/*.js`.
3. **Version agreement:** the `version` in `plugin.json` must be greater than the latest `v*` tag (`git tag --list 'v*' --sort=-v:refname`), and the top `CHANGELOG.md` entry must carry that same version with today's date. Bump/fix mechanically when the direction is obvious (the changelog says what changed; MAJOR breaking / MINOR feature / PATCH fix); ask when it isn't.
4. **Doc-structure copies identical:** `diff -r deliverable/plugin/shared/doc-structure deliverable/playbook/reference-doc-structure/docs --exclude=AGENTS.md --exclude=CLAUDE.md` must be empty.
5. **Tree state:** `git status --short` — everything shown will ship in this release commit. If files look unrelated to the release, list them and ask before staging.

## Phase 2: Commit

Stage everything (`git add -A`) and commit. Draft the message per `/playbook:commit-message` conventions: imperative title ≤72 chars, plain-text body with the why, optional decision bullets. If work was already committed and only the tag is missing, skip to Phase 3.

## Phase 3: Tag with release notes

Assemble the release notes from every `CHANGELOG.md` entry newer than the previous tag's version (a release commit may carry more than one changelog entry). Keep the changelog's own wording — don't re-summarise it.

```
git tag -a v<version> -F <notes-file>
```

First line of the notes file: `playbook v<version>`; then the changelog entries verbatim.

## Phase 4: Push and publish

1. `git push origin main --follow-tags`
2. If `gh` is installed and authenticated: `gh release create v<version> --title "playbook v<version>" --notes-file <notes-file>`. Otherwise say so — the annotated tag already carries the notes, and a GitHub Release can be created from it later.

## Phase 5: Close the loop

Report: version, tag, commit, pushed-or-not, release-created-or-not. Remind that installed consumers pick it up with `claude plugin update playbook@ai-playbook` (a restart applies it), and that `--plugin-dir` users are unaffected. If the session touched code or config beyond docs, suggest `/playbook:distil` before walking away.
