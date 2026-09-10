---
name: context-graph
description: Measure context weight per directory: tree, Mermaid report, SVG treegraph. AGENTS.md chains, @ imports, gotchas, on-demand docs.
disable-model-invocation: true
argument-hint: [path]
allowed-tools: Bash(node *)
---

{{host-instructions}}

Resolve the scope per [scope-resolution.md](../../shared/scope-resolution.md): `{{arguments}}` if given, otherwise cwd. Then run the three commands:

```
node "{{scripts}}/context-graph.js" <scope-root> --format tree
node "{{scripts}}/context-graph.js" <scope-root> --format markdown --save
node "{{scripts}}/context-graph.js" <scope-root> --format treegraph --save
```

Print the tree verbatim in a code block and name the two paths the last commands printed. They are timestamped files under `<scope-root>/.claude/.trace/`, so earlier reports stay. The treegraph is an SVG treemap: box area is launch weight, and it opens in a browser. Do not summarize, interpret, or edit anything unless the developer asks.
