---
name: scaffold-docs
description: Suggest and scaffold starter docs for a project's durable-context folder, tailored to what the repo evidences. One-time bootstrap on a project that has code but little documentation, after /playbook:init and /playbook:agents-md-setup.
disable-model-invocation: true
argument-hint: [path]
allowed-tools: Glob Read Write AskUserQuestion
---

You are bootstrapping a project's durable-context folder: suggest starter docs for the topics this repo evidences, then scaffold the ones the developer picks. Light touch — record what the repo confirms and leave prompts for the rest.

Files land in `<docs-folder>/system/` (descriptive — what the codebase IS) and, for the one paired topic, also `<docs-folder>/architecture/` (prescriptive — what the system MUST do). The three-category model itself is described in the READMEs `/playbook:init` copies into place; scaffold assumes those READMEs are there.

Before doing anything, read:
- [docs-folder-resolution.md](../../shared/docs-folder-resolution.md) — where to write
- [authoring-rules.md](../../shared/authoring-rules.md) — record only what the repo confirms; prompts are questions, not claims

## Phase 1: Resolve, verify init has run, survey

The scope is `$ARGUMENTS` if given, otherwise the current working directory. With an argument, resolve it relative to cwd, require it to be an existing directory under cwd (reject absolute paths or `../` paths that escape the tree), and treat that resolved path as the scope root — all globs, reads, and writes in the phases below operate inside it, including Phase 2's signal scan.

Resolve the scope's durable-context folder per [docs-folder-resolution.md](../../shared/docs-folder-resolution.md). The folder must contain `system/README.md` and `architecture/README.md` (placed by `/playbook:init`). If either is missing, tell the developer to run `/playbook:init` first (pass the same path argument when the scope isn't cwd) and stop — scaffold relies on the canonical structure being in place.

List the `.md` files already in `<docs-folder>/system/` and `<docs-folder>/architecture/`. Also note anything at the `<docs-folder>/` root (a legacy location from earlier plugin versions). Never suggest a topic an existing file already covers.

## Phase 2: Detect signals (shallow scan)

Glob for cheap signals and map them to candidate topics. Presence is enough at this stage — don't read deeply yet.

| Signal in the repo | Candidate topic | Lands in |
|---|---|---|
| Auth / session / token library, or login/permission code | `security.md` — trust boundaries, authn/authz, secrets | `system/` + paired `architecture/` |
| DB driver / ORM dependency, or a schema/models directory | `data-layer.md` — engine, schema shape, access patterns | `system/` |
| Migrations directory | `migrations.md` — how migrations are created and run | `system/` |
| Backend HTTP framework or route definitions | `api.md` — endpoints, error handling, validation | `system/` |
| Frontend framework with an HTTP client | `api-integration.md` — how the frontend talks to its backend | `system/` |
| Queue / message-bus / background-job dependency | `events.md` — async flows and contracts | `system/` |

Always consider `security.md` even without an auth library — every project has a trust boundary somewhere. Suggest only topics the repo evidences plus security; keep the list short.

## Phase 3: Propose and let the developer pick

Present the tailored shortlist. For each: the signal that prompted it, the proposed filename(s) and folder(s), and one line on what it would cover. Then call `AskUserQuestion` (multi-select) to choose which to scaffold, plus an option to add a topic of their own. Filenames are suggestions — use the project's own vocabulary if it differs (e.g. `kafka.md` over `events.md` if the codebase calls it that).

## Phase 4: Scaffold each chosen topic

For each chosen topic, take a quick look to confirm what the repo evidences (DB engine, migrations path, auth library, etc.), then write:

**`<docs-folder>/system/<topic>.md`** (descriptive — every chosen topic gets this):
- A short heading, then 1–3 sentences of confirmed facts about how the code does this today.
- A `## Still to document` list of 2–4 prompts, phrased as questions, for what you couldn't infer.

**`<docs-folder>/architecture/<topic>.md`** (only for `security`, since it pairs by default):
- A short heading.
- A one-line note: "Operational rules in MUST voice; cite the source (ADR, contract, incident) for each."
- A `## Still to document` list of 2–4 MUST-rule prompts: "What MUST be true about token expiry?", "What MUST be validated at the trust boundary?". Do not invent rules — the developer fills these.

Apply [authoring-rules.md](../../shared/authoring-rules.md): state confirmed facts as facts; put everything uncertain under prompts. No speculation.

Show the developer the scaffolded files.

## Phase 5: Hand off

Tell the developer:

- Fill the `## Still to document` prompts — with you now, or on their own.
- `/playbook:distil` keeps `system/` and `architecture/` files current as work happens.
- For any other topic where MUST-voice rules become clear later, add a sibling `architecture/<topic>.md`; the `security` pair shows the shape.

## Notes

- Suggestions are signal-driven and restrained — not a generic "every project needs these" checklist. Security is the one exception, always considered.
- Paired filenames: `system/<topic>.md` and `architecture/<topic>.md` describe the same area from descriptive and prescriptive sides. Scaffold seeds the pairing only for `security`; other pairings emerge later.
- This is a one-time bootstrap. Ongoing capture is `/playbook:distil`'s job.
