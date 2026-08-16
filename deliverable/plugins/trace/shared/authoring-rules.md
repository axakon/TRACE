# Authoring rules

These rules apply to every file written under TRACE — AGENTS.md files, context files, ADRs, distillation entries, plans, epics, and tickets. They govern what lands on disk, not how the agent talks in the session.

## Tone and format

- Write in plain sentences. Use tables where they reduce repetition. No other formatting flourishes.
- No ASCII art, decorative headers, horizontal rules, or boxes.
- No emojis.
- No marketing-style language. See the patterns under Language.
- No padding to look thorough. If a section has nothing worth saying, remove it.

## Content standards

- Only write what can be confirmed from the codebase, developer input, or project configuration. Do not speculate.
- State what something *is*, not what it *means*. Describe the current state, not the intent behind it — unless the developer explicitly provided the intent.
- Every line must answer: "why does the agent need this?" If you can't answer that, leave it out.
- Do not repeat information already present in standard project files (package.json, README, config files) unless the agent wouldn't know to look there or the information needs additional context.

## Language

Write for a reader who scans, and who may read English as a second language.

- Short sentences, one idea each. Split any sentence you have to re-read to parse.
- Active voice, named actor. "The hook writes the sentinel", not "The sentinel is written".
- Every sentence needs a verb. A list item may stay a fragment; a sentence may not.
- One term per concept. Don't vary the word for style.
- Name files, commands, and config keys exactly — no paraphrasing.

### Four patterns to avoid

The words below are illustrations, not a checklist. Learn the pattern and apply it to words nobody listed.

**An abstract noun where a fact belongs.** "Closing the read gap", "sets the precedent", "the database layer". Name the thing instead: what is missing, what the next one copies, "PostgreSQL".

**An invented compound.** "delegation-shaped", "relationship-gated", "contractor-facing". Never invent a hyphenated term, and never repeat one you read in the repo. Say what decides it — "the delegation row decides who may read" — or who sees it — "the screen a contractor opens". Keep noun clusters to two words; a hyphen does not buy a third.

**An everyday word upgraded.** prose → text. surface → screen. affordance → button. leverage → use. facilitate → help. ensure → make sure. perform → do. Each swap costs the reader something and gains nothing. Delete "powerful", "robust", "seamless", "holistic", "elegant" outright.

**Vocabulary borrowed from repo text.** A word in a comment, ticket, doc, or earlier ADR is not approved vocabulary — agents wrote most of that text, so borrowing recycles the jargon into each new file. Copy real names exactly (identifiers, filenames, flags, status values). Say the plain thing for everything else, even when the repo says it another way.

**Exception:** `architecture/` files use RFC 2119 voice — MUST, MUST NOT, SHOULD. These rules do not override that.
