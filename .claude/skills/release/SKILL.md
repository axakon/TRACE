---
name: release
description: Cut a TRACE release — preflight the tree (doctor, script syntax, shared-file sync, version/CHANGELOG agreement, doc-structure sync), commit the work, tag the repo and each plugin, push, and create the GitHub release when gh is available. For TRACE maintainers; adopters never see this skill.
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(gh *) Bash(node *) Bash(diff *) Bash(claude plugin *) Glob Read Edit AskUserQuestion
---

You are cutting a TRACE release. The versioned artifacts are the four plugins under `deliverable/plugins/`; the repo is the marketplace.

**All four plugins share one version.** `trace`, `trace-plan`, `trace-git`, and `trace-full` bump together every release, even when only one of them changed. Lockstep keeps the dependency constraints trivially satisfiable and makes one version number mean one thing. Do not version them independently.

A release is: one commit on `main`, five tags (`v<version>` for the repo plus `<plugin>--v<version>` for each plugin), pushed. Claude Code caches installs by version string — an unbumped version reaches no one, and a missing per-plugin tag breaks dependency resolution for anyone constraining a version.

**Bias to act.** Fix mechanical preflight failures yourself (a stale changelog date, an unbumped patch version, an out-of-sync shared file) and say so. Stop and ask only when the failure needs a real decision (doctor errors you can't attribute, a version that should maybe be MAJOR, unrelated-looking files in the tree).

## Phase 1: Preflight

Run all of these; collect failures before deciding anything. There is no CI — this phase is the only gate.

1. **Doctor is green:** `node deliverable/plugins/trace/scripts/doctor.js check .` — errors block the release; warnings are reported in the notes summary but don't block.
2. **Scripts parse:** `node --check` every `deliverable/plugins/*/scripts/*.js` and `scripts/*.js`.
3. **Manifests parse:** `node -e "JSON.parse(require('fs').readFileSync(f))"` over every `deliverable/plugins/*/.claude-plugin/plugin.json`, `deliverable/plugins/*/hooks/hooks.json`, and `.claude-plugin/marketplace.json`.
4. **Shared files in sync:** `node scripts/sync-shared.js --check` — a stale copy means an add-on is carrying an old version of a core rule. Run `node scripts/sync-shared.js` to repair.
5. **Version agreement:** all four `plugin.json` files carry the *same* `version`, that version is greater than the latest `v*` tag (`git tag --list 'v*' --sort=-v:refname`), and the top `CHANGELOG.md` entry carries it with today's date. Bump/fix mechanically when the direction is obvious (the changelog says what changed; MAJOR breaking / MINOR feature / PATCH fix); ask when it isn't.
6. **Dependency constraints still hold:** each add-on's `dependencies` range in `plugin.json` must admit the new core version. A MAJOR bump means widening or moving every `^X.Y.Z` constraint in the same commit.
7. **Doc-structure copies identical:** `diff -r deliverable/plugins/trace/shared/doc-structure deliverable/playbook/reference-doc-structure/docs --exclude=AGENTS.md --exclude=CLAUDE.md` must be empty.
8. **Viewer bundle fresh:** if anything under `deliverable/plugins/trace-plan/viewer/src/` changed since the last tag, `dist/viewer.bundle.js` must have changed too. A stale bundle ships silently.
9. **Tree state:** `git status --short` — everything shown will ship in this release commit. If files look unrelated to the release, list them and ask before staging.

## Phase 2: Commit

Stage everything (`git add -A`) and commit. Draft the message per `/trace-git:commit-message` conventions: imperative title ≤72 chars, plain-text body with the why, optional decision bullets. If work was already committed and only the tags are missing, skip to Phase 3.

## Phase 3: Tag

Assemble the release notes from every `CHANGELOG.md` entry newer than the previous tag's version (a release commit may carry more than one changelog entry). Keep the changelog's own wording — don't re-summarise it.

**Repo release tag**, carrying the notes:

```
git tag -a v<version> -F <notes-file>
```

First line of the notes file: `TRACE v<version>`; then the changelog entries verbatim.

**Per-plugin tags**, which is what Claude Code resolves dependency version constraints against:

```
git tag trace--v<version>
git tag trace-plan--v<version>
git tag trace-git--v<version>
git tag trace-full--v<version>
```

`claude plugin tag --push` run from a plugin directory does the same thing and validates the manifest first, but it needs a clean working tree under that directory — after the release commit that holds, so either path is fine. Plain `git tag` is the reliable default in a scripted run.

## Phase 4: Push and publish

1. `git push origin main --follow-tags`
2. If `gh` is installed and authenticated: `gh release create v<version> --title "TRACE v<version>" --notes-file <notes-file>`. Otherwise say so — the annotated tag already carries the notes, and a GitHub Release can be created from it later.

## Phase 5: Close the loop

Report: version, the five tags, commit, pushed-or-not, release-created-or-not.

Remind that consumers pick it up with `claude plugin update trace-full@trace` (or the individual plugin they installed), and that a restart applies it. `--plugin-dir` users are unaffected.

If the session touched code or config beyond docs, suggest `/trace:distil` before walking away.
