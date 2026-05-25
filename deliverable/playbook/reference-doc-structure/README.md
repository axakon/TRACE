# Reference: doc structure

The canonical folder structure that **phase 1 (Assess)** produces in an adopting project. Browse it as a worked example, or copy the whole `docs/` subtree into a new repository to bootstrap.

Every file in this reference is generic — no TRACE-specific content. The READMEs describe the *convention* an adopter is following, not the project that authored them.

## What the structure looks like

```
<your-repo>/
├── AGENTS.md                  ← project conventions (you author this; not in this reference)
└── docs/
    ├── README.md              ← funnel overview: working-notes → reference; adr + architecture alongside
    ├── architecture/
    │   ├── README.md          ← what architecture docs look like
    │   └── overview.md        ← you author this; the system-level picture of your project
    ├── adr/
    │   ├── README.md          ← ADR conventions
    │   └── 0000-record-architecture-decisions.md  ← you create this; the foundational ADR
    ├── reference/
    │   └── README.md          ← stabilized rationale folder; populates over time
    └── working-notes/
        └── README.md          ← raw research substrate; populates as you think
```

## How phase 1 uses this reference

The phase-1 playbook step (`../01-assess.md`, once authored) walks the adopter through:

1. Creating the `docs/` tree above in their repository.
2. Copying each `README.md` in this reference verbatim into the corresponding folder.
3. Authoring two starter files of their own — `docs/architecture/overview.md` and `docs/adr/0000-record-architecture-decisions.md` — using prompts in the playbook.

The READMEs are intended to be copied without edits. They are written as conventions, so they remain accurate regardless of project, language, or domain.

## Why each folder exists

| Folder | One-line purpose |
|---|---|
| [`docs/`](docs/) | The funnel: where written knowledge graduates from raw to stabilized. |
| [`docs/architecture/`](docs/architecture/) | The system-level picture. Read first when new to the project. |
| [`docs/adr/`](docs/adr/) | Immutable decisions with consequences (Nygard-lite). |
| [`docs/reference/`](docs/reference/) | Long-form rationale promoted from stabilized working notes. |
| [`docs/working-notes/`](docs/working-notes/) | Raw research substrate. Where ideas live while still moving. |

The full convention each folder enforces — what goes there, what doesn't, lifecycle — lives in its own README. Open the folder to read it.

## What this reference does NOT include

- **The root `AGENTS.md`.** Project-specific by nature; phase 1 has the adopter author it from a template.
- **`docs/architecture/overview.md`.** Project-specific; authored, not copied.
- **`docs/adr/0000-*.md`.** The foundational ADR is short, but its content reflects the adopter's project name and date — authored, not copied.

These are addressed in the phase-1 playbook step itself, not here.
