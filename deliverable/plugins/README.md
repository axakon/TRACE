# TRACE plugins

TRACE ships the same skills for Claude Code and for Codex (desktop and CLI). Both builds come from one source and share a version, a changelog, and a release. They are tested on macOS.

The `trace` plugin holds every skill: init, agents-md-setup, scaffold-docs, adr, distil, doctor, context-graph, spec, epic, commit-message, and pr-description.

## Claude Code

```text
/plugin marketplace add axakon/TRACE
/plugin install trace@trace
/reload-plugins
```

## Codex desktop and CLI

```sh
codex plugin marketplace add axakon/TRACE
codex plugin add trace@trace
```

In the desktop app, open the Plugins view, choose the TRACE marketplace, and install the plugin. Start a new session after you install. Then review and trust the plugin's hooks in the app's hook settings.

Settings and existing epics keep their current locations and formats. If you installed `trace-plan`, `trace-git`, or `trace-full` before version 2.0.0, see [Moving to the single plugin](../README.md#moving-to-the-single-plugin).

## Maintenance

Edit the files in `plugin-src/`, then run `node scripts/generate-plugins.js`. Commit the source and both generated builds in the same change. CI checks that they match, but it does not update the PR for you.

For more, see the [contributor instructions](AGENTS.md), the [package architecture](../../docs/architecture/plugin-distribution.md), and the [release procedure](../../docs/system/releasing.md).
