# trace-full

Everything TRACE ships, behind one install.

This package contains all ten skills, the core hooks, and the viewer. It needs no other TRACE package. Invoke its skills under the trace-full namespace. Individual add-ons require a separate trace core install.

Add the TRACE marketplace, then install this package:

```sh
codex plugin marketplace add axakon/TRACE
codex plugin add trace-full@trace
```

Start a new session after installation. In Codex desktop, install from the TRACE marketplace in the Plugins view. Review and trust plugin hooks in the host hook controls. Choose either trace-full or individual packages; enabling both duplicates skill listings.

The suite contains durable-context setup, AGENTS.md authoring, scaffolding, ADRs, distillation, validation, specs, epics, commit messages, and PR descriptions.

All packages share one version. Consumers install the committed package and do not run a build.
