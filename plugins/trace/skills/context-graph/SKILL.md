---
name: "context-graph"
description: "Measure context weight per directory: tree, Mermaid report, SVG treegraph. AGENTS.md chains, @ imports, gotchas, on-demand docs."
---

Use the available file and shell tools. Resolve <absolute-skill-directory> from the installed SKILL.md path before running a script, and quote the resolved absolute path. Use an available question control for closed choices, or ask in chat if it is unavailable. Wait for the developer’s answer. Load a referenced skill from the installed skills catalog; do not assume a Skill tool exists. Respect the active collaboration mode and permissions.

Resolve the scope per [scope-resolution.md](../../shared/scope-resolution.md): `the arguments in the invoking message` if given, otherwise cwd. Then run the three commands:

```
node "<absolute-skill-directory>/../../scripts/context-graph.js" <scope-root> --format tree
node "<absolute-skill-directory>/../../scripts/context-graph.js" <scope-root> --format markdown --save
node "<absolute-skill-directory>/../../scripts/context-graph.js" <scope-root> --format treegraph --save
```

Print the tree verbatim in a code block and name the two paths the last commands printed. They are timestamped files under `<scope-root>/.claude/.trace/`, so earlier reports stay. The treegraph is an SVG treemap: box area is launch weight, and it opens in a browser. Do not summarize, interpret, or edit anything unless the developer asks.
