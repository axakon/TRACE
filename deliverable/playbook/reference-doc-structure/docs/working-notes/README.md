# working-notes/

Rough notes and in-progress thinking — ideas before they've settled. Half-formed opinions go here, not in `reference/` or `adr/`.

## What a note looks like

- One markdown file per topic, kebab-case filename, no date prefix (git history is the date).
- A `Status:` header at the top: `Research note`, `Stabilizing`, or `Promoted`.
- A `Resolved` section that grows as questions get answered.
- An `Open questions` section, even if it's empty.
- Whatever prose, bullets, or half-finished arguments help the author think.

## What does NOT go here

- Settled rationale you intend to cite from elsewhere → [`../reference/`](../reference/).
- A single decision with consequences ("we chose A over B") → an ADR in [`../adr/`](../adr/).
- New content added to a note that's already been promoted. The note stays here, frozen.

## Status values

- **Research note** — active thinking. Opinions may flip.
- **Stabilizing** — most questions resolved; author believes the take is right but hasn't promoted it yet.
- **Promoted** — substance has been lifted into `reference/` (or an ADR). The note is frozen as a record of how the thinking evolved.

Promotion is a deliberate act, never automatic. Don't promote without explicit go-ahead. The full funnel (working note → reference → playbook) is described in [`../README.md`](../README.md).
