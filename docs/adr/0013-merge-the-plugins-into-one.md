# 0013. Merge the four TRACE plugins back into one

*2026-09-22*

## Context

ADR 0009 split the tooling into four plugins: `trace`, `trace-plan`, `trace-git`, and the `trace-full` bundle. The goal was to let adopters skip skills they would not use. The split had two reasons. First, every installed skill loads its name and description into each session, and all skills together cost 1032 words. The git skills were 382 of those words. Second, a docs-only install should not carry the plan viewer server and its browser bundle.

After three releases, the split costs more than it saves:

- **Updates fail quietly.** `claude plugin update trace-full@trace` updates only the bundle. The three plugins that hold the skills stay on the old version. Adopters without marketplace auto-update got a new bundle with old skills, and the README needed a section and a troubleshooting entry to explain it.
- **One edit touches many files.** `authoring-rules.md` was copied into every plugin that used it. A single rules change touched 8 copies of that file across both harnesses.
- **Releases need a tag per plugin.** A missing `<plugin>--v<version>` tag breaks dependency resolution for anyone who pins a range.
- **Hooks need a written rule.** No hook could be registered by two plugins, and nothing checked this automatically.
- **Codex has no plugin dependencies.** The Codex `trace-full` was a full copy of every skill under its own `$trace-full:` names. Codex users of the bundle saw different command names from Claude users.

The savings are now small. The generator no longer puts `when_to_use` in the Claude frontmatter, so the name and description of all 11 skills total 365 words. The four skills from `trace-plan` and `trace-git` are 150 of those words. The viewer server starts only when a planning skill calls it, so for other users it is files on disk.

Alternatives considered:

1. **Keep four plugins and improve the docs.** This fixes none of the repository costs, and the update problem stays for every adopter without auto-update.
2. **Merge only `trace-git` into the core.** The duplicated shared file, the dependency, and the per-plugin tags stay, for two plugins instead of four.

## Decision

We will ship TRACE as one plugin, `trace`, for both Claude Code and Codex. It holds every skill, script, shared file, hook, and the plan viewer. `trace-plan`, `trace-git`, and `trace-full` are removed from both marketplaces. All skills use the `trace` name, for example `/trace:spec` and `/trace:commit-message`.

The source moves into `plugin-src/trace/`. The generator no longer copies shared files between plugins, and the validator no longer needs per-plugin rules for skill counts, hooks, or the viewer.

## Consequences

Adopters install and update one plugin. `claude plugin update trace@trace` updates every skill. Each change to a shared file touches one source file and its two generated copies. A release needs one component tag, `trace--v<version>`, instead of four.

Adopters can no longer skip skills they do not use. Every session loads all 365 words of skill names and descriptions, and every install carries the viewer.

This is a breaking change, so the next release is 2.0.0. Four commands change name: `/trace-plan:spec`, `/trace-plan:epic`, `/trace-git:commit-message`, and `/trace-git:pr-description` become `/trace:` commands. Claude adopters already have `trace` installed, because the other plugins depended on it. They must uninstall the old plugins and update `trace`, and a committed `settings.json` that names the old plugins must be edited. Codex adopters who installed `trace-full` must install `trace` instead. `deliverable/README.md` has the steps.

ADR 0009 is superseded in part. The TRACE name and the rule that runtime files never leave the installed plugin folder still stand. The split into four plugins does not. ADR 0002's single plugin is the shape again.
