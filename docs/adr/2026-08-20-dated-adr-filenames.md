# Dated ADR filenames

*2026-08-20*

## Context

TRACE numbered ADRs sequentially, and `/trace:adr` minted the next free number by reading the folder. Two branches that each add an ADR both mint the same number, and because the slugs differ git merges both files without a conflict. The result is two records sharing an identifier, caught only when `doctor.js` reports `adr-collision` afterwards.

The same bug is open against both widely used ADR toolchains, `npryce/adr-tools` issue 102 and `adr/madr` issue 28, and neither has a fix. The only remedy proposed upstream is a lock file holding the last number, which both reporters reject because people forget to update it. Cloud Posse wrote ISO-8601 dates up as the alternative and then rejected it, because a team loses the ability to say "ADR 0007". Random word pairs were also considered here and dropped, because a name that describes nothing is harder to place than a date.

## Decision

We will name new ADRs `<YYYY-MM-DD>-<short-kebab-title>.md`, using the date the record is written. The heading states the title alone, and the date line under it is the only place the date repeats. Files already named `<NNNN>-<slug>.md` keep that name forever, and no project migrates. `doctor.js` accepts both forms, and applies the collision and gap checks to the numbered ones only.

## Consequences

Two branches can no longer produce the same ADR identifier unless they also choose the same title. Git reports that case as a conflict at merge time. A reference also gains meaning, because `Superseded by 2026-03-11-use-redis-for-sessions` says what it replaces and `Superseded by 0003` does not. Adopters never migrate, so one folder can hold both forms. The costs: nobody can cite an ADR as a short number any more, and `doctor.js` carries two filename patterns instead of one. Two ADRs written on the same day carry no order between them, which the sequence used to give.
