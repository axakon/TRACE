# Ticket template

Written to `~/.claude/epics/<epic-slug>/tickets/<NNN>-<slug>.md`. `<NNN>` is a three-digit sequence number from `001`. Drop this preamble when writing; start at the frontmatter. `status` is exactly `todo` | `in-progress` | `done`; `depends_on` lists ticket numbers as strings.

---

```markdown
---
status: todo
depends_on: []
---

# {NNN}. {Title}

## Why

{One or two sentences tying this ticket to an epic story or outcome.}

## Scope

{The spec seed: self-contained prose a spec-workflow run can start from
without reading the epic. State the deliverable, not acceptance criteria
— those are the spec run's job.}

## Out of scope

{Boundaries, including work that belongs to sibling tickets.}
```
