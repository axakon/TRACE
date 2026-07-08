# Epic template

Written to `~/.claude/epics/<epic-slug>/epic.md`. Drop this preamble when writing; start at the `# {Title}` heading.

Diagram guidance — epics diagram the **system**, not the code:

- A user-journey `sequenceDiagram` for the primary story, with the role as an `actor` — include one for every epic.
- A structure/context diagram (`flowchart`) when the epic reshapes components or adds new ones.
- A ticket-dependency `flowchart` whenever any ticket's `depends_on` is non-empty.
- Skip any diagram that would restate a bullet list.

---

# {Title}

*{YYYY-MM-DD}*

## Context

Why this epic exists — the problem, who it serves, and the intended outcome. A few sentences; the shared context every ticket leans on.

## Core user stories

- As a {role}, I want {capability}, so that {consequence}.

## Architecture

{User-journey sequenceDiagram for the primary story.}

{Structure/context diagram when the shape of the system changes.}

### Ticket dependencies

{flowchart: 001 --> 002 style, only when dependencies exist.}

## Board

| # | Ticket | Status |
|---|--------|--------|
| 001 | {title} | todo |
