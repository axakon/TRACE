# working-notes/

## Purpose

Raw research substrate. Half-formed opinions, in-progress thinking, exploratory drafts. This is where ideas live while they are still moving — before anyone is committed to them.

## What goes here

- One markdown file per topic, kebab-case filename.
- A `Status:` header at the top: `Research note`, `Stabilizing`, or `Promoted`.
- A `Resolved` section that grows as questions are answered.
- An `Open questions` section, even if empty.
- Direct prose. Bullet points. Half-finished arguments. Whatever helps the author think.

## What does NOT go here

- Stabilized rationale you intend to cite from elsewhere → that belongs in [`../reference/`](../reference/).
- Discrete decisions with consequences ("we chose A over B because…") → that's an ADR in [`../adr/`](../adr/).
- Anything that's already been promoted and copied elsewhere — the note stays here, but no new content goes into a promoted note.

## Lifecycle

A note moves through three statuses, encoded in its `Status:` header:

1. **Research note.** Active thinking. Opinions may flip. No downstream artifacts should depend on this content yet.
2. **Stabilizing.** Most questions resolved. Author believes the take is correct but hasn't promoted it yet.
3. **Promoted.** Substance has been lifted into `reference/` (or an ADR). The note becomes historical substrate — frozen, not deleted. Future readers can see how the thinking evolved.

Promotion is a deliberate act. Do not promote a note to `reference/` without explicit go-ahead.

## Naming

`<topic>.md` in kebab-case. No date prefixes — the file's git history is the date. Files are not renumbered or reorganized; topic-clustering happens at the reference/ layer, not here.
