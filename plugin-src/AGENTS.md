# TRACE plugin source

This directory owns the authored content for Claude Code and Codex. Generated packages live in `deliverable/plugins/` (Claude) and `plugins/` (Codex).

Read `../deliverable/plugins/AGENTS.md` for contributor rules. Edit source here, then run `node scripts/generate-plugins.js` from the repository root. Never hand-edit generated files.

`catalog.json` owns the version and plugin metadata. `adapters/` owns harness instructions. `trace/` holds every skill, script, shared file, and the viewer source. The generator assembles the Claude and Codex copies.
