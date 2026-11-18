# 0016. Mark a partial change to a shipped ADR with an Amended by line

*2026-11-18*

## Context

A shipped ADR allowed one edit: a `> Superseded by NNNN.` line under its title. That line tells a reader the whole decision no longer holds. In TRACE's own log, three of the four later ADRs that changed an earlier one changed only part of it:

- ADR 0009 changed the "single plugin" in ADR 0002 and kept the rest. ADR 0002 has no line that points to ADR 0009.
- ADR 0013 undid the plugin split from ADR 0009 but kept the TRACE name. ADR 0009 says "Superseded by 0013", so the name decision looks replaced too.
- ADR 0011 replaced the plan storage from ADR 0004 but kept the approved plan as the contract. ADR 0004 says "Superseded by 0011".

Nat Pryce's adr-tools links two ADRs with "Amends" in the new one and "Amended by" in the old one. Alternatives considered:

- Text in the new ADR only, as before. The old ADR keeps no pointer, or a pointer that says too much.
- Free link words as in adr-tools, such as "Clarifies". Each new word is one more edit that `doctor.js` must allow on a shipped ADR.
- A `## Status` section as in adr-tools. TRACE dropped the Status field, and every existing ADR would then differ from new ones.
- The words "Superseded in part by". The developer chose "Amended by", the words adr-tools uses.

## Decision

We will allow a second line under the title of a shipped ADR: `> Amended by NNNN.`. A new ADR amends an earlier one when part of the earlier decision changes and the rest still stands. It supersedes it when the earlier decision no longer holds. The new ADR names the earlier one in its Context ("Amends 0003.") and says what still stands.

## Consequences

A reader of an amended ADR sees that a later ADR changed part of it and knows to read both. The `adr` skill now asks which line applies, and `adr-criteria.md` defines the difference in one place. The skill descriptions that load in every session did not change. `doctor.js` ignores both lines when it checks a shipped ADR for edits, and finds both when it lists the references to an ADR number. The existing lines on ADRs 0002, 0004, and 0009 stay as they are, so those three ADRs still say too little or too much.
