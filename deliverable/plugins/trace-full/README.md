# trace-full

All of TRACE in one install.

This package has no skills of its own. It depends on trace, trace-plan, and trace-git, so Claude Code installs all three. Each skill keeps its own plugin name, such as /trace-plan:spec.

Install from the TRACE marketplace:

```text
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

Claude Code installs the plugins this one depends on.

The suite includes docs setup, `AGENTS.md` setup, starter docs, ADRs, distillation, convention checks, context size reports, specs, epics, commit messages, and PR descriptions.

All TRACE packages share one version. The packages in the repository are ready to use, so you don't need to build anything.
