# TRACE plugins

TRACE ships the same workflows for Claude Code and Codex desktop/CLI on macOS. Both distributions share one source, version, changelog, and release.

| Plugin | Skills |
|---|---|
| trace | init, agents-md-setup, scaffold-docs, adr, distil, doctor, context-graph |
| trace-plan | spec, epic |
| trace-git | commit-message, pr-description |
| trace-full | The complete suite |

## Claude Code

```text
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

The full bundle installs all three component plugins. Add-ons install the core automatically. Existing package identities and marketplace paths are preserved.

## Codex desktop and CLI

```sh
codex plugin marketplace add axakon/TRACE
codex plugin add trace-full@trace
```

In the desktop app, choose TRACE in the Plugins marketplace view and install the desired package. Start a new session after installation. Review and trust the installed hooks in the host's hook controls.

The native full package contains every TRACE skill. Its skill namespace is `trace-full`, such as `$trace-full:spec`. For a smaller install, install `trace`, then the desired add-ons. Individual add-ons retain namespaces such as `$trace-plan:spec` and require core to be installed separately.

Choose the full package or individual packages. Installing both duplicates skills. Configuration and existing user-space epics keep their current paths and formats.

## Maintenance

Edit `plugin-src/` and run `node scripts/generate-plugins.js`. Commit source and both generated outputs in the same change. CI verifies them without updating the PR.

See [contributor instructions](AGENTS.md), [package architecture](../../docs/architecture/plugin-distribution.md), and [release procedure](../../docs/system/releasing.md).
