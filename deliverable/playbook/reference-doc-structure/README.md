# Reference: doc structure

The canonical folder structure that **phase 1 (Assess)** produces in an adopting project. Browse it as a worked example, or copy the whole `docs/` subtree into a new repository to bootstrap.

Every file in this reference is generic — no TRACE-specific content. The READMEs describe the *convention* an adopter is following, not the project that authored them.

## What the structure looks like

```
<your-repo>/
├── AGENTS.md                  ← project conventions (you author this; not in this reference)
└── docs/
    ├── README.md              ← three-category overview: descriptive / prescriptive / historical
    ├── system/                ← DESCRIPTIVE   — living docs about the codebase
    │   └── README.md          ← what system files look like; populated by the plugin or by hand
    ├── architecture/          ← PRESCRIPTIVE  — rules the system MUST satisfy
    │   ├── README.md          ← spec-file conventions (MUST voice, sources, paired with system/)
    │   └── overview.md        ← you author this; the structural map of your project
    ├── adr/                   ← HISTORICAL    — discrete decisions
    │   ├── README.md          ← ADR conventions
    │   └── 0000-record-architecture-decisions.md  ← you create this; the foundational ADR
    ├── reference/             ← HISTORICAL    — stabilized rationale
    │   └── README.md          ← reference-doc conventions
    └── working-notes/         ← HISTORICAL    — raw research substrate
        └── README.md          ← working-note conventions
```

The split inside `docs/` is by **what kind of knowledge each file holds**:

- **Descriptive** (`system/`) — what the codebase *is*. Updated as code changes.
- **Prescriptive** (`architecture/`) — what the system *must do*. Updated as rules change.
- **Historical** (`adr/`, `reference/`, `working-notes/`) — how decisions got made. Append-only or immutable.

See [ADR 0001](../../../docs/adr/0001-three-categories-of-project-docs.md) for the full rationale.

## How phase 1 uses this reference

The phase-1 playbook step (`../01-assess.md`, once authored) walks the adopter through:

1. Creating the `docs/` tree above in their repository.
2. Copying each `README.md` in this reference verbatim into the corresponding folder.
3. Authoring three starter files of their own — `docs/architecture/overview.md`, `docs/adr/0000-record-architecture-decisions.md`, and the root `AGENTS.md` — using prompts in the playbook.

The READMEs are intended to be copied without edits. They are written as conventions, so they remain accurate regardless of project, language, or domain.

## Why each folder exists

| Folder | Category | One-line purpose | Update semantics |
|---|---|---|---|
| [`docs/`](docs/) | — | The three-category index. | — |
| [`docs/system/`](docs/system/) | Descriptive | Living docs about the codebase. Binding context for agents working in an area. | Updated as code changes. |
| [`docs/architecture/`](docs/architecture/) | Prescriptive | Operational rules in MUST voice + the structural overview. | Updated as rules change. |
| [`docs/adr/`](docs/adr/) | Historical | Immutable decisions with consequences. | Append-only; supersede once shipped. |
| [`docs/reference/`](docs/reference/) | Historical | Long-form rationale promoted from stabilized working notes. | Append-only; revised deliberately. |
| [`docs/working-notes/`](docs/working-notes/) | Historical | Raw research substrate; not authoritative until promoted. | In motion until promoted. |

The full convention each folder enforces — what goes there, what doesn't, lifecycle — lives in its own README. Open the folder to read it.

## What this reference does NOT include

- **The root `AGENTS.md`.** Project-specific by nature; phase 1 has the adopter author it from a template.
- **`docs/architecture/overview.md`.** Project-specific; authored, not copied.
- **`docs/architecture/<area>.md` spec files.** Authored as integration specs and operational rules emerge during the project's life. The phase-1 playbook step doesn't try to predict them.
- **`docs/adr/0000-*.md`.** The foundational ADR is short, but its content reflects the adopter's project name and date — authored, not copied.

These are addressed in the phase-1 playbook step itself, not here.
