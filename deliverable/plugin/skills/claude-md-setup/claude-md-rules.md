# CLAUDE.md quality rules

Use these rules to evaluate a CLAUDE.md file before presenting it to the developer. If the draft violates any rule, fix it before showing it.

## Structure

A CLAUDE.md has exactly five sections, in this order:

1. **What is this** — one short paragraph. What the repo does, who it's for. No history, no roadmap.
2. **Stack** — the key pieces only: framework, language/runtime, styling approach, data layer, package manager. Not the icon library. Not dev tooling unless it affects how the agent should work (e.g. a monorepo tool).
3. **Directory index** — a short table or list mapping top-level directories (and select subdirectories) to what they contain. Enough for the agent to know where to start looking. Not a full file tree.
4. **Commands** — how to run, test, build, lint, and any other commands the agent is likely to need. Only include commands that aren't obvious from the project type. A standard `npm start` in a Node project doesn't need listing; a `pnpm --filter @app/api test:integration` does.
5. **Gotchas** — non-obvious things that only come from human experience in the project. Configuration quirks, implicit dependencies between modules, values that look arbitrary but aren't, things that break silently. This section has the highest value-per-word of anything in the file.

## Length

- Target: 50–150 lines total.
- No section should exceed 40 lines. If it does, it's probably including detail that belongs in a context file instead.

## What to exclude

- Empty sections. If there are no gotchas yet, omit the section entirely rather than writing "None yet."
- Information the agent can infer from standard project files without help.
- Duplicated README content. The agent can read the README; CLAUDE.md adds what the README doesn't cover.
- Aspirational content ("we plan to migrate to..."). Only describe current state.
- Version numbers for dependencies. These change constantly; the agent reads package.json / lock files.
