# 0007. Ship the plan viewer as a committed pre-built bundle

*2026-07-08*

## Context

The plugin gained a browser-based plan viewer that renders markdown and mermaid diagrams — beyond what hand-written, dependency-free scripts can provide — while the plugin's standing rule is that consumers need only Node ≥ 18: no package manager, no build step. The renderer had to come from somewhere. Alternatives: load marked and mermaid from a CDN at page open (no repo weight, but the viewer breaks offline and ties a local dev tool to third-party availability); build on the consumer's machine at install or first run (violates the no-package-manager contract); hand-write a minimal renderer with Node built-ins (no mermaid, and diagram rendering was a primary motivation — the spec-workflow skill now asks plans to carry user-journey diagrams).

## Decision

We will bundle marked and mermaid with esbuild on the maintainer machine and commit the built artifact (`viewer/dist/viewer.bundle.js`, ~3.3 MB). `viewer/` carries its own `package.json` with pinned devDependencies; consumers never run the build.

## Consequences

The viewer works offline and consumers keep the zero-toolchain install. The repo — otherwise plain markdown — now carries a 3.3 MB generated file and a maintainer-side npm toolchain, and the bundle can silently drift from `viewer/src/`: any change there must ship a rebuilt bundle in the same commit (recorded in the plugin CLAUDE.md release loop). Renderer upgrades become deliberate maintainer actions — bump pinned versions, rebuild, commit — rather than automatic. If bundle size becomes a problem, lazy-loading mermaid inside the bundle is the identified escape hatch.
