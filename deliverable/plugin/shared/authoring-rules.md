# Authoring rules

These rules apply to all written output produced under the playbook — CLAUDE.md files, context files, ADRs, and distillation entries.

## Tone and format

- Write in plain prose. Use tables where they reduce repetition. No other formatting flourishes.
- No ASCII art, decorative headers, horizontal rules, or boxes.
- No emojis.
- No marketing-style language ("powerful", "seamless", "robust", "elegant").
- No padding to look thorough. If a section has nothing worth saying, remove it.

## Content standards

- Only write what can be confirmed from the codebase, developer input, or project configuration. Do not speculate.
- State what something *is*, not what it *means*. Describe the current state, not the intent behind it — unless the developer explicitly provided the intent.
- Every line must answer: "why does the agent need this?" If you can't answer that, leave it out.
- Do not repeat information already present in standard project files (package.json, README, config files) unless the agent wouldn't know to look there or the information needs additional context.

## Language

- Use short, direct sentences.
- Prefer concrete terms over abstract ones ("PostgreSQL" not "the database layer").
- Name files, commands, and config keys exactly — no paraphrasing.
