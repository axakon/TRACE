# TRACE plugins

TRACE ships the same skills for Claude Code and for Codex (desktop and CLI). Both builds come from one source and share a version, a changelog, and a release. They are tested on macOS.

| Plugin | Skills |
|---|---|
| trace | init, agents-md-setup, scaffold-docs, adr, distil, doctor, context-graph |
| trace-plan | spec, epic |
| trace-git | commit-message, pr-description |
| trace-full | all of the above |

## Claude Code

```text
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

`trace-full` installs the other three plugins. Installing `trace-plan` or `trace-git` on its own also installs `trace`. Plugin names and marketplace paths are the same as in earlier versions.

## Codex desktop and CLI

```sh
codex plugin marketplace add axakon/TRACE
codex plugin add trace-full@trace
```

In the desktop app, open the Plugins view, choose the TRACE marketplace, and install a package. Start a new session after you install. Then review and trust the plugin's hooks in the app's hook settings.

In Codex, `trace-full` is a single package that holds every skill under the `trace-full` name, such as `$trace-full:spec`. For a smaller install, install `trace` and then the add-ons you want. The add-ons keep their own names, such as `$trace-plan:spec`, and need `trace` installed separately.

Install either `trace-full` or the individual packages, not both. With both installed, every skill appears twice. Settings and existing epics keep their current locations and formats.

## Maintenance

Edit the files in `plugin-src/`, then run `node scripts/generate-plugins.js`. Commit the source and both generated builds in the same change. CI checks that they match, but it does not update the PR for you.

For more, see the [contributor instructions](AGENTS.md), the [package architecture](../../docs/architecture/plugin-distribution.md), and the [release procedure](../../docs/system/releasing.md).
