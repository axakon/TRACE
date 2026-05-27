# Change-summary style

Shared writing rules for summaries of a finished change — PR descriptions, squash-merge messages, and individual commit messages. Each skill carries its own structure (which sections, which phases); this file is only the *how to write* the prose inside them.

## Title

- One imperative-mood line, ≤72 characters.
- No Conventional-Commits prefix. No enum of types. No bracketed scopes.
- Examples: `Rate-limit the public search endpoint`, `Fix race in session refresh`. Not `feat: add rate limiting`, not `[api] fix race`.

## Write for a reader who lacks the context

The reader sees the diff and this summary, nothing else. Assume they have never seen this problem, ticket, or system before.

- Plain language over jargon. Spell out a domain term the first time it appears, or replace it with a plain phrase if one fits.
- Short sentences, concrete nouns, one idea per sentence. If you have to re-read a sentence to parse it, rewrite it.
- Comprehension on first pass — not concision at the cost of clarity, and never cleverness.

## Self-contained

Never reference an artifact the reader cannot see — no plan, spec, ticket body, ADR draft, or chat history. If a detail from one of those matters, inline it here.

## Skip what the diff makes obvious

Do not narrate the diff. List only what isn't visible from reading the code: non-obvious decisions, rejected alternatives, deliberate omissions, hidden constraints.

## Bullets with lead-in phrases (when used)

When a section uses bullets:

- Bullets when there are 3+ distinct points; short prose (2–3 sentences) when it is one continuous thought.
- Lead each bullet with a short phrase naming the decision, then ≤15 words of detail. The rendering — markdown `**bold**:` for PR bodies, plain `Lead-in — detail` for commit bodies — is set by the skill using this style.
- Lead with the decision as it appears in the code, not a comparison framing. Write `Token updates use PUT: …` not `PUT over DELETE+POST: …`. Rationale and rejected alternatives are supporting detail, not the headline.
