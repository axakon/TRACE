---
name: "context-graph"
description: "Measure context weight per directory: AGENTS.md chains, @ imports, gotchas, on-demand docs."
disable-model-invocation: true
argument-hint: "[path]"
allowed-tools: "Bash(node *)"
---

Use Claude Code’s Read, Glob, Write, and Edit tools for file operations. Use AskUserQuestion for closed choices and normal chat for open questions. Invoke referenced skills with the Skill tool. Resolve script paths from this installed skill; respect the session’s permissions.

Resolve the scope per [scope-resolution.md](../../shared/scope-resolution.md): `$ARGUMENTS` if given, otherwise cwd. Then run:

```
node "${CLAUDE_SKILL_DIR}/../../scripts/context-graph.js" <scope-root> --format tree
```

Print the tree verbatim in a code block. Do not summarize, interpret, or edit anything unless the developer asks.
