# Authoring rules

These rules govern the words and the sentences in every text TRACE writes for a reader. That covers the files it writes to disk, plus commit messages and PR descriptions. They do not govern how the agent talks in the session. They do not decide what goes in a file either — each skill's own template and criteria do that.

Write for a reader who scans and who may read English as a second language. The reader has not seen this problem, this ticket, or this system before, and will read the text once, at speed. That reader must still be sure what it says.

## What to write

- Write only what the codebase, the developer, or the project configuration confirms. Do not speculate.
- State what something *is*, not what it *means*. Describe the current state, not the intent behind it — unless the developer gave you the intent.

## The four tests

Run all four over the draft before you emit it. Each is a question with a yes or no answer about a specific phrase, so a failure is something you can point at.

**1. The name test.** There are two ways to refer to a thing and no third. Copy its real name from the code and put it in backticks. A real name is an identifier, a file name, a flag, a command, a status value, or an error code. Otherwise describe the thing in ordinary words. A phrase that is neither is invented, and the reader can neither look it up nor guess it: "frozen-corpus test", "the accept guard", "active-delegation unique index". A word is not a name because the repo is full of it. Comments, tickets, and earlier ADRs were mostly written by agents, so copying them feeds your own jargon back to you. Naming one thing in backticks does not approve its words for the rest of the sentence — write "`RetryStrategy` decides when to try again", not "the retry strategy is robust".

**2. The cover-up test.** Cover every backticked name and read the sentence again. If it no longer says anything, the names were doing the work. "`delegations_one_active_per_link_uq` covers `role`" becomes "___ covers ___" and fails. "The unique index now counts the role too, in `delegations_one_active_per_link_uq`" still reads, and passes.

**3. The actor test.** Every sentence says who does what. If you cannot point to the who, the sentence is hiding it. It hides in three ways: the passive voice ("the sentinel is written"), an action turned into a noun ("licensed the borrowing", "the calibration"), and a gerund subject ("running the script installs it"). Name the actor and use the verb. A hidden action often ends in -ing, -tion, -ment, or -ance, but many such nouns are innocent — "the conversation" is fine and "the borrowing" is not. The question decides, not the ending. Write full sentences with their articles — "The test failed because the path is wrong", not "Test failed, path wrong". A list item may stay a fragment.

**4. The count test.** 25 words to a sentence. Count them. Split any sentence you have to read twice. Do not bury a list inside a sentence — past three items, make it a list.

When two tests pull against each other, the lower-numbered one wins. None of them may cost you a fact — see the last section.

## Which words you may use

The four tests do not decide word choice, and no list can. "Licensed" was on no list and still ruined a sentence. Use the shortest, most common word that is still true. Check it against one question — would a person say this word out loud to a colleague?

- Prefer the plain word: make sure (not ensure), give (not provide), do (not perform), use (not utilize), help (not facilitate), allow (not license), text (not prose), screen (not surface), button (not affordance).
- Delete robust, seamless, holistic, and elegant rather than replacing them. For layer, mechanism, strategy, controller and precedent, name the actual thing — "the database layer" is PostgreSQL, "the accept guard" is the check that rejected the row.
- Never invent a hyphenated term, and never repeat one you read in the repo: "delegation-shaped", "relationship-gated", "frozen-corpus". Keep noun clusters to two words — a hyphen does not buy a third.
- Use one term per concept, every time. Do not vary the word for style.
- Do not use a phrasal verb where one plain verb means the same thing. Write "start", not "spin up". Keep the everyday ones with no single-word match, such as "log in" and "set up".
- Do not use idioms, metaphors, or semicolons. Write two sentences instead of a semicolon.
- Use any word the developer writes in the conversation. If the developer rejects a word, treat it the same way for the rest of the conversation.

## Format

- Plain sentences. Tables where they reduce repetition. No other formatting.
- No ASCII art, decorative headers, horizontal rules, boxes, or emojis.
- No padding to look thorough. Every line must answer "why does the reader need this?". Cut the line if you cannot answer it. Cut the section if nothing in it can.

## What these rules must not cost

- Never drop a fact, a number, a condition, or a limit to meet a length cap. Keep the long sentence.
- Never trade a true word for a short one. If the short word means something else, keep the long word.
- When you rewrite the developer's text, change the smallest part that fixes the problem. Leave a sentence alone if it already passes the four tests.

**Exception:** `architecture/` files use RFC 2119 voice — MUST, MUST NOT, SHOULD. These rules do not override that.

These rules fix the form of a text. They cannot make a wrong text right.
