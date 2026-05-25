# docs/

Everything written down about this project — the research that produced its design, the decisions made along the way, the long-form rationale, and the system-level overview.

## Purpose

`docs/` holds the project's written knowledge organized by **how settled** each piece is. Raw thinking lives separately from stabilized rationale, which lives separately from discrete decisions. The structure makes it obvious where to read for "why," where to write for "I just had an idea," and where to look for "what did we decide and when."

## Layout

A one-way funnel from raw thinking to stabilized rationale:

```
working-notes/   →   reference/
   (still moving)    (stabilized)
```

`adr/` and `architecture/` sit alongside, capturing decisions and the system-level picture.

| Folder | Holds | When to read |
|---|---|---|
| [`architecture/`](architecture/) | The system-level picture: what this project is, how its pieces fit together. | Read first when new to the project. |
| [`adr/`](adr/) | Discrete decisions with consequences (Nygard-lite). Immutable. | Read to learn *why* something is the way it is. |
| [`reference/`](reference/) | Long-form rationale promoted from a working note once its opinions stop moving. | Read for in-depth "why" behind a position. |
| [`working-notes/`](working-notes/) | Raw research, half-formed opinions, things still moving. | Read for substrate, or to find unresolved questions. |

## How content flows

A claim about how the project should work typically travels:

1. **Working note.** Someone has a take. It goes into `working-notes/` with a `Status:` header and open questions. Opinions may shift; that's fine.
2. **ADR (sometimes).** If the take resolves a structural choice with downstream consequences, write an ADR in the same change. Not every working note produces one.
3. **Reference doc.** When the opinion stops moving, promote the substance into `reference/`. The original note stays behind, frozen.

Promotion is a deliberate act, not a cleanup pass.

## What does NOT go in docs/

- Code, scripts, build artifacts → those live in the project's source tree, not here.
- Operational runbooks better served by an actual tool (a status page, a dashboard) → link from here, don't duplicate.
- Generated content (API specs, type definitions) → check it in next to the code that produces it.

## Each sub-folder has its own README

Open any sub-folder for its rules — what goes there, what doesn't, the lifecycle of a file inside it. Read the relevant folder's README before adding content to it.
