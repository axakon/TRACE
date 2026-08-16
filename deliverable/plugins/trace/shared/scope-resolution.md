# Resolving the scope from a skill invocation

The setup skills (`init`, `agents-md-setup`, `scaffold-docs`) accept an optional path argument so a sub-scope in a monorepo can be set up from the super-repo root without `cd`-ing. This file is the single source of truth for how that argument resolves into a scope root. Keep the rule here; don't restate it in each skill.

## The rule

The scope is the value of `$ARGUMENTS` if given, otherwise the current working directory.

When an argument is given:

- Resolve the path relative to cwd.
- Require it to be an existing directory.
- Require it to resolve to a path under cwd — reject absolute paths and any `../`-prefixed path that escapes the tree.

Treat the resolved path as the scope root. All globs, reads, and writes in the rest of the skill operate inside it; the skill never walks upward.

## What this file does *not* resolve

This file resolves *which scope* the skill operates in. It does not pick the durable-context folder *within* that scope — that's [docs-folder-resolution.md](./docs-folder-resolution.md). Once the scope is known, that file's precedence picks the docs folder inside it.
