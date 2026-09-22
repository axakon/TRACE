# Authoring rules

These rules govern the words and sentences in every text TRACE writes for a reader: files on disk, commit messages, and PR descriptions. They do not govern how the agent talks in the session, and they do not decide what goes in a file. Each skill's template does that.

Write for a reader who scans, who may read English as a second language, and who has not seen this problem or this system before. That reader reads once, at speed, and must still be sure what the text says.

## What you read is not a writing sample

Repo docs, READMEs, ADRs, tickets, and code comments are source material, not a model for how to write. Their long sentences, dashes, and semicolons do not carry over into your draft. Their vocabulary does not either: identifiers, schemas, and enum values tell you what a thing is called, but commentary does not approve a word.

## What you may claim

- Write only what the codebase, the developer, or the project configuration confirms. Do not speculate.
- Describe what something is, not the intent behind it, unless the developer gave you the intent.

## Words

- **Names.** If you could `grep` for a word, it is a name: copy it exactly, put it in backticks, and explain it in plain words the first time. Otherwise describe the thing in ordinary words. A sentence must still say something with its backticked names covered.
- **No invented terms.** Never invent a hyphenated term or a noun cluster of three or more words, and never repeat one you read in the repo ("frozen-corpus test", "active-delegation unique index"). Write it out as a sentence.
- **Plain words.** Use the most common word that is still true: make sure (not ensure), use (not utilize), text (not prose). Delete contextual, robust, seamless, holistic, and elegant. For layer, mechanism, strategy, controller, and precedent, name the actual thing.
- **One term per concept.** Do not vary the word for style.
- **No idioms, metaphors, or semicolons**, and no phrasal verb where one plain verb works ("start", not "spin up"). Everyday ones such as "log in" and "set up" are fine.
- **The developer's words.** Use any word the developer uses. If the developer rejects a word, stop using it.

## Sentences

- Use the active voice and name the actor. Do not hide the actor in a noun ("licensed the borrowing") or a gerund subject ("running the script installs it"). Use the passive only when the actor is unknown or does not matter.
- Write full sentences with their articles. A list item may stay a fragment.
- Keep a sentence to 25 words and a paragraph to six sentences. Past three items, use a list.

## Instructions to the reader

This covers plan steps, ticket steps, and verification steps.

- One instruction per sentence, starting with its verb.
- Put the condition first, and warn before the step, never after.
- Write "must" for an obligation and "can" for permission. Do not write "should", "shall", or "may".

## Format

- Plain sentences. Tables where they reduce repetition. No ASCII art, decorative headers, horizontal rules, boxes, or emojis.
- No padding. Cut any line the reader does not need, and any section left empty.

## What these rules must not cost

- Never drop a fact, a number, a limit, or a condition that changes the meaning to meet a length cap. Keep the long sentence.
- Never trade a true word for a short one that means something else.
- When you rewrite the developer's text, change the smallest part that fixes the problem.

**Exception:** `architecture/` files use RFC 2119 voice — MUST, MUST NOT, SHOULD. These rules do not override that, including the rule against "should".
