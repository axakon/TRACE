# docs/

Everything written down about this project, organized by **what kind of knowledge each file holds**.

## Three categories

A reader (human or agent) needs to know what kind of doc they're looking at before they can use it. `docs/` separates three:

- **Descriptive** — what the codebase *is* right now. Lives in `system/`.
- **Prescriptive** — what the system *must do*. Lives in `architecture/`.
- **Historical** — how decisions were made and why. Lives in `working-notes/`, `reference/`, `adr/`.

Each category has its own update semantics. Mixing them in one folder confuses readers because some docs track live truth, some are binding rules, and some are frozen at the moment they were written.

## Layout

```
docs/
├── system/         ← DESCRIPTIVE  — what the codebase IS (updated as code changes)
├── architecture/   ← PRESCRIPTIVE — what the system MUST do (updated as rules change)
├── adr/            ← HISTORICAL   — discrete decisions (append-only)
├── reference/      ← HISTORICAL   — stabilized rationale (append-only)
└── working-notes/  ← HISTORICAL   — raw research substrate (in motion until promoted)
```

| Folder | Category | Holds | Update semantics |
|---|---|---|---|
| [`system/`](system/) | Descriptive | Living docs about the codebase — auth, data model, conventions. Binding context for agents working in those areas. | Updated as code changes. |
| [`architecture/`](architecture/) | Prescriptive | Operational rules in MUST voice + the structural `overview.md`. Integration specs, contracts, sequences. | Updated as rules change. |
| [`adr/`](adr/) | Historical | Discrete decisions with consequences (Nygard-lite). | Immutable once shipped; supersede, never edit. |
| [`reference/`](reference/) | Historical | Long-form rationale promoted from stabilized working notes. | Append-only; revised deliberately. |
| [`working-notes/`](working-notes/) | Historical | Raw research, half-formed opinions, things still moving. | In motion until promoted. |

## How content flows

**Historical docs** travel through a funnel:

1. **Working note.** Someone has a take. Goes into `working-notes/` with a `Status:` header. Opinions may shift.
2. **ADR (sometimes).** If the take resolves a structural choice with downstream consequences, an ADR records the decision in the same change.
3. **Reference doc.** When the opinion stops moving, substance promotes into `reference/`. The original note stays behind, frozen.

**Descriptive docs** in `system/` don't have a funnel. They're written or updated whenever the codebase's current state changes in a way an agent would need to know.

**Prescriptive docs** in `architecture/` are distilled from multiple upstream sources — ADRs, external API contracts, compliance requirements, post-incident learnings, reference docs — into terse imperative rules. Each rule cites its source.

A typical chain across categories:

```
working-notes/ ──→ reference/ ──→ adr/    (the historical record of how a decision was made)

ADR + external contract + compliance ──→ architecture/   (the rule, distilled and in force)

                                          ↓

                                        system/   (the implementation that satisfies the rule)
```

## What does NOT go in docs/

- Code, scripts, build artifacts → those live in the project's source tree, not here.
- Operational runbooks better served by an actual tool (a status page, a dashboard) → link from here, don't duplicate.
- Generated content (API specs, type definitions) → check it in next to the code that produces it.

## Each sub-folder has its own README

Open any sub-folder for its rules — what goes there, what doesn't, the lifecycle of a file inside it. Read the relevant folder's README before adding content to it.
