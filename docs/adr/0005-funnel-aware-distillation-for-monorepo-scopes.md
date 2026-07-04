# 0005. Funnel-aware distillation across monorepo scopes

*2026-07-04 — recorded retroactively; decided in plugin v0.12.0 (2026-05-28).*

## Context

A project may be a super-repo whose sub-repos each carry their own `AGENTS.md` and durable-context folder. Distillation that only looks at one level gets the routing wrong in both directions: sub-repo knowledge lands at the super-repo root where someone working inside the sub-repo never sees it, or domain-wide knowledge is written locally and duplicated per scope. It can also miss corrections — a change in a sub-repo can invalidate a claim made by a *parent* scope's context. The alternatives were single-scope distillation (simple, wrong in monorepos), always asking the developer where each candidate goes (accurate, heavy), or scope-aware routing with named signals and a developer override.

## Decision

We will make `distil` funnel-aware. Each candidate routes by default to the **nearest-ancestor scope** of the changed paths (closest ancestor directory with an `AGENTS.md`). Distil also reads every further-ancestor scope up to the project root — their `AGENTS.md` files and docs-folder filenames — for dedup and for the correction check. Three named signals flip the proposed target upward: the parent already covers the area, the diff touches shared code, or the candidate references sibling scopes. When no signal fires but the candidate feels domain-wide, distil asks rather than guessing. The developer's per-candidate approval remains the final say.

## Consequences

Knowledge lands at the level where its readers work, domain-wide context stops being duplicated per sub-scope, and corrections are caught at any level of the funnel rather than only locally. The same setup skills work per-scope (`init`, `agents-md-setup`, `scaffold-docs` all accept a `[path]` argument), so a monorepo is configured scope by scope from the root.

The cost is more reads per distil run — every ancestor `AGENTS.md` plus docs-folder filename listings — kept proportional by globbing names and opening in full only files whose area overlaps a candidate. Scope detection depends on the `AGENTS.md`-is-canonical convention: a directory with only a `CLAUDE.md` is not a scope, so partially migrated repos route to the nearest genuine scope above.
