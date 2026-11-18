# ADR template (slimmed Nygard)

Written into `<docs-folder>/adr/<NNNN>-<short-title>.md`. `<NNNN>` is a zero-padded four-digit sequence number; `<short-title>` is a kebab-case slug. Once shipped, an ADR is immutable — supersede or amend, never edit.

No `Status` field: this skill writes ADRs at end-of-work, so on landing they're accepted; an unshipped draft (not yet merged to the default branch) can still be edited freely until it merges. A later ADR that replaces this one adds `> Superseded by {MMMM}.` under the title, and one that changes part of it adds `> Amended by {MMMM}.` — the only permitted edits to a shipped ADR.

Drop this preamble when writing the file; start from the `# {NNNN}.` heading.

---

# {NNNN}. {Title — short noun phrase naming the decision}

*{YYYY-MM-DD}*

## Context

The forces at play — technical, product, or operational — and the tension between them, as value-neutral facts. Include the alternatives that created the choice. Two to five sentences.

## Decision

The response to those forces, in active voice: "We will …". One or two sentences; name the option chosen.

## Consequences

The resulting context once the decision is applied — what becomes easier and what becomes harder, including the trade-off accepted and any new constraint future work must respect.
