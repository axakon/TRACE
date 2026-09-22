# trace-full

All of TRACE in one install.

This package holds every TRACE skill, the core hooks, and the viewer, so it needs no other TRACE package. All skills use the trace-full name, such as $trace-full:spec. If you install add-ons one by one instead, each one needs trace installed as well.

Add the TRACE marketplace, then install the package:

```sh
codex plugin marketplace add axakon/TRACE
codex plugin add trace-full@trace
```

Start a new session after you install. In the desktop app, install from the TRACE marketplace in the Plugins view. Then review and trust the plugin's hooks in the app's hook settings. Install either trace-full or the individual packages, not both. With both installed, every skill appears twice.

The suite includes docs setup, `AGENTS.md` setup, starter docs, ADRs, distillation, convention checks, context size reports, specs, epics, commit messages, and PR descriptions.

All TRACE packages share one version. The packages in the repository are ready to use, so you don't need to build anything.
