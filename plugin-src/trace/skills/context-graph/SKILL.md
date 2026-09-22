---
name: context-graph
description: Measure context weight per directory: AGENTS.md chains, @ imports, gotchas, on-demand docs.
disable-model-invocation: true
argument-hint: [path]
allowed-tools: Bash(node *)
---

{{host-instructions}}

Resolve the scope per [scope-resolution.md](../../shared/scope-resolution.md): `{{arguments}}` if given, otherwise cwd. Then run:

```
node "{{scripts}}/context-graph.js" <scope-root> --format tree
```

Print the tree verbatim in a code block. Do not summarize, interpret, or edit anything unless the developer asks.
