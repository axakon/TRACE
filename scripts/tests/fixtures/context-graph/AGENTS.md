# Fixture root

## What is this

A fake monorepo used to hold the context-graph contract. Conventions load at launch:
@docs/system/conventions.md

The structure is described in `@docs/architecture/overview.md` and the first decision is [ADR 0001](docs/adr/0001-pick-a-thing.md). A stale link points at [a missing file](docs/missing.md).

<!-- maintainer note: this comment is stripped before injection and must not count -->

## Stack

Uses `@scope/pkg` from npm and mentions @handle in prose. Contact me@example.com.

```text
@docs/not-imported.md sits in a fence and is text
```

Inline code `@docs/nowhere.md` is a pointer, not an import, and this one is broken.

## Commands

None.

## Gotchas

- NEVER count a fenced example as an import.
- Always keep the marker file identical across scopes.
