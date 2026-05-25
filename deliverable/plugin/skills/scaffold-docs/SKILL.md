---
name: scaffold-docs
description: Suggest and scaffold starter docs for a project's durable-context folder, tailored to what the repo actually contains. Recommended once on a project that has code but little or no documentation, after /playbook:init and /playbook:claude-md-setup.
disable-model-invocation: true
allowed-tools: Glob Read Write AskUserQuestion
---

You are bootstrapping a project's durable-context folder: suggest starter docs for the topics this repo actually evidences, then scaffold the ones the developer picks. Light touch — record the surface-level facts the repo confirms and leave prompts for the rest. Do not deep-dive; the developer fills in the specifics.

Before doing anything, read:
- [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — where to write, and the marker
- [authoring-rules.md](../../shared/authoring-rules.md) — record only what the repo confirms; prompts are questions, not claims

## Phase 1: Resolve the docs folder and see what exists

Resolve the scope's durable-context folder per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md). List the `.md` files already there — never suggest a topic an existing file already covers.

## Phase 2: Detect signals (shallow scan)

Glob for cheap signals and map them to candidate topics. Presence is enough at this stage — don't read deeply yet.

| Signal in the repo | Candidate topic |
|---|---|
| Migrations directory | `migrations.md` — how migrations are created and run |
| ORM / DB driver dependency, or a schema/models directory | `database.md` — engine, schema shape, access patterns |
| Auth / session / token library, or login/permission code | `security.md` — trust boundaries, authn/authz, secrets |
| Backend HTTP framework or route definitions | `api-conventions.md` — endpoint, error, and validation conventions |
| Frontend framework with an HTTP client | `api-integration.md` — how the frontend talks to its backend |
| Queue / message-bus / background-job dependency | `events.md` — async flows and their contracts |

Always consider `security.md` even with no auth library — every project has a trust boundary somewhere. Suggest only topics the repo evidences, and keep the list short. If the repo evidences little, suggest little.

## Phase 3: Propose and let the developer pick

Present the tailored shortlist. For each: the signal that prompted it, the proposed filename, and one line on what it would cover. Then call `AskUserQuestion` (multi-select) to choose which to scaffold, plus an option to add a topic of their own. Filenames are suggestions — the developer can rename.

## Phase 4: Scaffold each chosen topic

For each chosen topic, take a quick look to gather only what the repo confirms (the DB engine from dependencies, the migrations path, the auth library, etc.), then write `<docs-folder>/<topic>.md`:

- A short heading, then a sentence or two of the confirmed facts.
- A `## Still to document` list of 2–4 prompts, phrased as questions, for what you couldn't infer.

Apply [authoring-rules.md](../../shared/authoring-rules.md): state confirmed facts as facts; put everything uncertain under the prompts. No speculation.

If the docs folder isn't playbook-marked yet, write its marker `CLAUDE.md` first, from [context-folder-template.md](../distil/context-folder-template.md) (start at `# Durable project context`; Write creates parent dirs). If the folder already holds hand-written docs, say so before writing.

Show the developer the scaffolded files.

## Phase 5: Hand off

Tell the developer to fill the `## Still to document` prompts — with you now, or on their own. `/playbook:distil` keeps these files current as the project changes; the scaffolds just give it, and a new developer, a head start.

## Notes

- Suggestions are signal-driven and restrained — not a generic "every project needs these" checklist.
- This is a one-time bootstrap. Ongoing capture is `/playbook:distil`'s job.
- Use the project's own vocabulary for filenames where it has one; the table's names are defaults.
