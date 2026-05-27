# reference/

## Purpose

Long-form rationale. The **why** behind a position the project takes. Each file here is promoted from a stabilized working note once its opinions have stopped moving.

## What goes here

- One markdown file per stabilized topic, kebab-case filename.
- A short intro explaining the question the doc answers.
- The full argument: tradeoffs considered, alternatives rejected, evidence cited.
- Links back to the originating working note(s) and any related ADRs.

## What does NOT go here

- Active research or half-formed opinions → [`../working-notes/`](../working-notes/).
- Records of a single decision and its consequences → an ADR in [`../adr/`](../adr/). Reference docs are essays; ADRs are short minutes.
- Imperative how-to ("do X, then Y") → a project guide or runbook, not here. Reference docs explain *why*; they don't tell the reader what to do.
- Code, scripts, or examples → those live elsewhere in the repo.

## Lifecycle

A reference doc is the **output** of a working note that stabilized. Promotion is deliberate:

1. A working note's `Status:` reaches `Stabilizing` and stays there across edits.
2. Author (with explicit go-ahead) lifts the substance into a new file here, restructuring it as a coherent argument rather than chronological thinking.
3. The original working note's `Status:` flips to `Promoted` and is frozen — kept as historical substrate.

Reference docs are revised when the underlying opinion changes — but a revision is itself a deliberate act, ideally backed by a new working note that explores the change first.

## Naming

`<topic>.md` in kebab-case. Match the topic of the originating working note where possible; the connection should be obvious from the filename.
