# Releasing TRACE

TRACE releases Claude Code and Codex packages together. `plugin-src/catalog.json` owns the version. Generated packages and catalogs are committed in the same change as their source.

## Prepare and verify

1. Inspect the working tree. Identify unrelated files before staging anything.
2. Set the shared version in `plugin-src/catalog.json`. Update the top changelog entry and release date.
3. If viewer inputs changed, run `npm ci` and `npm run build` in `plugin-src/trace/viewer/`.
4. Run `node scripts/generate-plugins.js`.
5. Run `node scripts/verify-plugins.js`. Repair failures in source and regenerate. Report unrelated doctor warnings.
6. Try the skills this release changed in a live client. [Plugin verification](plugin-verification.md) lists what to observe.
7. Run `node scripts/verify-plugins.js --release`. It also checks the changelog date and that the version exceeds the latest tag.

Use `/release` in Claude or `$release` in Codex to load this procedure. The release skill is generated from `plugin-src/maintainer/release/SKILL.md` for both harnesses.

## Commit and publish

Perform these actions only when the developer requests a release. Implementation or plan approval alone does not authorize publication.

1. Stage the release files and generated distributions together. Exclude unrelated work. Draft the commit message using TRACE's commit-message skill.
2. Commit on `main`. If the release commit already exists, keep it.
3. Push the commit to `main`. Wait for the `TRACE packages` workflow to pass for that commit. Do not tag a commit with failed or missing checks.
4. Create the annotated repo tag `v<version>` with release notes assembled from changelog entries since the previous release.
5. Create the component tag `trace--v<version>`. Claude Code resolves version ranges from tags in this form.
6. Push both tags explicitly. Confirm their remote targets match the release commit. `--follow-tags` alone does not push the lightweight component tag.
7. Create the GitHub release with `gh release create` and a notes file when `gh` is authenticated. Otherwise report that publication step as incomplete.

Use a notes file with real newlines for tag annotations and GitHub release text. Keep the changelog's wording. Report the version, commit, tag targets, CI result, and publication result.

## Consumer updates

Claude users update the plugin through `claude plugin update trace@trace` and reload. Codex users refresh the TRACE marketplace and install the updated plugin through the Plugins view or CLI, then start a new session. Changed hook definitions can require renewed trust.

Consumers receive built packages from the repo. They do not run the generator or install viewer build dependencies.
