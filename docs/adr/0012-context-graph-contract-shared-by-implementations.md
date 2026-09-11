# 0012. Measure context weight with a scanner whose contract is a spec and a fixture

*2026-09-10*

## Context

TRACE puts instruction files at many levels of a monorepo, and nothing showed what that costs. In one adopter repo, an agent started in a service directory loads three `AGENTS.md` files and one bare `@` import, about 24,000 tokens, before reading code, and in some files the gotcha section is 70 percent of the text. The question "how heavy is the context here, and where does the weight come from" had no answer short of counting by hand.

Two delivery shapes were wanted: a skill inside the core plugin, and later a standalone CLI in Go for use outside a session. The plugin rules allow only Node built-ins and nothing to install, so the plugin cannot call a Go binary, and a Go binary cannot run the Node script without Node. Sharing code between the two was therefore not an option. Alternatives considered: a shell script (not cross-platform, no place to ship it); an MCP server that indexes documents (adds tool descriptions to every session, the cost the graph exists to expose, and `grep` already answers the queries); the Go CLI first (the plugin could not use it).

## Decision

We will ship `context-graph.js` in the core plugin, wrapped by `/trace:context-graph`, as the reference implementation. We will fix its behaviour in a contract with two parts: `docs/architecture/context-graph.md` states the scan, import, pointer, and weight rules and the JSON shape, and `scripts/tests/fixtures/context-graph/` with its expected JSON is the acceptance test every implementation must pass. Rendering (terminal tree, Mermaid markdown) is outside the contract. A CLI in another language lives in its own repository, vendors the fixture, and states which contract version it implements.

We will also move the scope, docs-folder, and markdown helpers that `doctor.js` and `context-graph.js` share into `trace-lib.js` in the same scripts folder, so the two scripts read a scope the same way.

## Consequences

The plugin gains a measurement it can run in half a second on a large monorepo, and the numbers it reports are the ones Claude Code's own rules produce: bare `@` imports count, backticked ones do not. A second implementation has its tests written before it starts. The fixture is now a contract, so a behaviour change requires a contract change first, and the golden file must not be regenerated to make a test pass.

The Go CLI, if built, duplicates the scanning logic by design. Drift between the two shows up only in the fixture, so the fixture must grow with every rule the contract adds. Three simplifications are recorded in the contract: hops count from every own file, `.claude/rules/` is not counted, and per-node counting may double count a file Claude Code loads once.
