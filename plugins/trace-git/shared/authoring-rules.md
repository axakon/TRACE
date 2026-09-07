# Authoring rules

These rules govern the words and the sentences in every text TRACE writes for a reader: files on disk, commit messages, and PR descriptions. They do not govern how the agent talks in the session. They do not decide what goes in a file — each skill's template and criteria do that.

Write for a reader who scans and who may read English as a second language. The reader has not seen this problem, this ticket, or this system before, and will read the text once, at speed. That reader must still be sure what it says.

## What you read is not a writing sample

Repo docs, READMEs, ADRs, tickets, and code comments are source material. They are not a model for how to write. Their long sentences, dashes, and semicolons do not carry over into your draft. These rules hold no matter how many words you just read in the other voice.

Trust the code, not the commentary. Identifiers, schemas, and enum values tell you what a thing is called. Comments, READMEs, ADRs, and tickets do not approve a word. Say the plain thing.

## What you may claim

- Write only what the codebase, the developer, or the project configuration confirms. Do not speculate.
- State what something *is*, not what it *means*. Describe the current state, not the intent behind it — unless the developer gave you the intent.

## The four tests

Run all four over the draft before you emit it. Each is a question with a yes or no answer about a specific phrase, so a failure is something you can point at.

**1. The name test.** Ask whether you could `grep` for the word. If you could, it is a name. Copy it from the code exactly, put it in backticks, and explain it in plain words the first time. If you could not, it is text, so describe the thing in ordinary words instead. A phrase that is neither is invented. The reader can neither look it up nor guess it: "frozen-corpus test", "the accept guard", "active-delegation unique index". Naming one thing in backticks does not approve its words for the rest of the sentence. Write "`RetryStrategy` decides when to try again", not "the retry strategy is robust".

**2. The cover-up test.** Cover every backticked name and read the sentence again. If it no longer says anything, the names were doing the work. "`delegations_one_active_per_link_uq` covers `role`" becomes "___ covers ___" and fails. "The unique index now counts the role too, in `delegations_one_active_per_link_uq`" still reads, and passes.

**3. The actor test.** Point at who does what. If you cannot point, the sentence is hiding it. It hides in three ways: the passive voice ("the sentinel is written"), an action turned into a noun ("licensed the borrowing"), and a gerund subject ("running the script installs it"). Name the actor and use the verb. Use the passive voice only when the actor is unknown, or when the actor does not matter. Write full sentences with their articles — "The test failed because the path is wrong", not "Test failed, path wrong". A list item may stay a fragment.

**4. The count test.** 25 words to a sentence, and six sentences to a paragraph. Count them. Split any sentence you have to read twice. Do not bury a list inside a sentence — past three items, make it a list.

When two tests pull against each other, the lower-numbered one wins. None of them may cost you a fact — see the last section.

## Which words you may use

Use the shortest, most common word that is still true. Say it out loud — would a person use this word with a colleague?

- Use the plain word, not the abstract or inflated one: make sure (not ensure), use (not utilize), text (not prose), button (not affordance).
- Delete contextual, robust, seamless, holistic, and elegant rather than replacing them. For layer, mechanism, strategy, controller and precedent, name the actual thing. "The database layer" is PostgreSQL. "The accept guard" is the check that rejected the row. You may still write any of these inside a name you put in backticks.
- Never invent a hyphenated term, and never repeat one you read in the repo: "delegation-shaped", "relationship-gated", "frozen-corpus". If a hyphenated phrase is not a real name, write it out as a sentence. Keep noun clusters to two words — a hyphen does not buy a third.
- Use one term per concept, every time. Do not vary the word for style. If you call it a handler, call it a handler in every sentence that follows.
- Do not use a phrasal verb where one plain verb means the same thing. Write "start", not "spin up". Keep the everyday ones with no single-word match, such as "log in" and "set up".
- Do not use idioms, metaphors, or semicolons. Write two sentences instead of a semicolon.
- Use any word the developer writes in the conversation. If the developer rejects a word, treat it the same way for the rest of the conversation.

## When you tell the reader to do something

This covers plan steps, ticket steps, and verification steps.

- Write one instruction per sentence, and start each one with its verb. Write "Open the file", not "You should open the file."
- Put the condition first. Write "If the build fails, read the log."
- Write "must" for an obligation and "can" for permission. Do not write "should", "shall", or "may".
- Warn before the step, never after. Put the risk in the sentence that comes before the command.

## Format

- Plain sentences. Tables where they reduce repetition. No other formatting.
- No ASCII art, decorative headers, horizontal rules, boxes, or emojis.
- No padding to look thorough. Every line must answer "why does the reader need this?". Cut the line if you cannot answer it. Cut the section if nothing in it can.

## What these rules must not cost

- Never drop a fact, a number, or a limit to meet a length cap — keep the long sentence. A condition counts too: an exception, a version requirement, or a second cause of the same symptom. Cut one only when the text stays true without it.
- Never trade a true word for a short one. If the short word means something else, keep the long word.
- When you rewrite the developer's text, change the smallest part that fixes the problem. Leave a sentence alone if it already passes the four tests.

**Exception:** `architecture/` files use RFC 2119 voice — MUST, MUST NOT, SHOULD. These rules do not override that, including the rule against "should".

These rules fix the form of a text. They cannot make a wrong text right.
