# trace-full

Everything TRACE ships, behind one install.

This package installs trace, trace-plan, and trace-git through Claude’s plugin dependencies. Invoke skills under their original plugin namespaces.

Install from the TRACE marketplace:

```text
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

Claude installs declared dependencies automatically.

The suite contains durable-context setup, AGENTS.md authoring, scaffolding, ADRs, distillation, validation, context weight, specs, epics, commit messages, and PR descriptions.

All packages share one version. Consumers install the committed package and do not run a build.
