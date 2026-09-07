# Releasing TRACE

TRACE releases Claude Code and Codex packages together. `plugin-src/catalog.json` owns the version. Generated packages and catalogs are committed in the same change as their source.

## Prepare and verify

1. Inspect the working tree. Identify unrelated files before staging anything.
2. Set the shared version in `plugin-src/catalog.json`. Update the top changelog entry and release date. Preserve compatible Claude dependency ranges.
3. If viewer inputs changed, run `npm ci` and `npm run build` in `plugin-src/trace-plan/viewer/`.
4. Run `node scripts/generate-plugins.js`.
5. Run `node scripts/verify-plugins.js`. Repair failures in source and regenerate. Report unrelated doctor warnings.
6. Run the live checks described in [plugin verification](plugin-verification.md). Record actual evidence for each client and the package hash.
7. Run `node scripts/verify-plugins.js --release`. Missing or stale live evidence blocks publication.

Use `/release` in Claude or `$release` in Codex to load this procedure. The release skill is generated from `plugin-src/maintainer/release/SKILL.md` for both harnesses.

## Commit and publish

Perform these actions only when the developer requests a release. Implementation or plan approval alone does not authorize publication.

1. Stage the release files and generated distributions together. Exclude unrelated work. Draft the commit message using TRACE's commit-message skill.
2. Commit on `main`. If the release commit already exists, keep it.
3. Push the commit to `main`. Wait for the `TRACE packages` workflow to pass for that commit. Do not tag a commit with failed or missing checks.
4. Create the annotated repo tag `v<version>` with release notes assembled from changelog entries since the previous release.
5. Create the four component tags: `trace--v<version>`, `trace-plan--v<version>`, `trace-git--v<version>`, and `trace-full--v<version>`.
6. Push all five tags explicitly. Confirm their remote targets match the release commit. `--follow-tags` alone does not push the lightweight component tags.
7. Create the GitHub release with `gh release create` and a notes file when `gh` is authenticated. Otherwise report that publication step as incomplete.

Use a notes file with real newlines for tag annotations and GitHub release text. Keep the changelog's wording. Report the version, commit, tag targets, CI result, and publication result.

## Consumer updates

Claude users update their installed plugin through `claude plugin update` and reload. Codex users refresh the TRACE marketplace and install the updated package through the Plugins view or CLI, then start a new session. Changed hook definitions can require renewed trust.

Consumers receive built packages from the repo. They do not run the generator or install viewer build dependencies.
