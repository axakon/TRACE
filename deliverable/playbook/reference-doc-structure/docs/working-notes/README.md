# working-notes/

Your thinking while it's still in motion. Rough notes, half-formed opinions, ideas you're not sure about yet — they live here, not in `reference/` or `adr/`. When an idea finally settles, you move the substance into one of those.

**Nothing in this folder is authoritative.** A note is a thinking tool, not a rule — even one that looks fully resolved. Binding rules live in `architecture/` and `adr/`; until a note's substance is promoted there, it carries no authority.

## What a note looks like

Every note opens with a non-authority banner, right under the title:

> ⚠️ **Working note — not authoritative.** Binding rules live in `architecture/` and `adr/`. Nothing here is a rule until it's promoted — however settled it reads.

Then:

- A `Status:` header: `Research note`, `Stabilizing`, or `Promoted`.
- A `Resolved` section that grows as questions get answered — "resolved" means worked through *within this note*, not promoted into a rule.
- An `Open questions` section, even if it's empty.
- One markdown file per topic, kebab-case filename, no date prefix (git history is the date).
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
