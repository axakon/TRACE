# Authoring rules

These rules govern the words and the sentences in every text TRACE writes for a reader — AGENTS.md files, context files, ADRs, distillation entries, plans, epics, tickets, commit messages, and PR descriptions. They do not govern how the agent talks in the session, and they do not decide what goes in a file — each skill's own template and criteria do that.

Write for a reader who scans and who may read English as a second language. The reader has not seen this problem, this ticket, or this system before. Each jargon word costs the reader something and gains nothing. Put three in one paragraph and the reader stops following you.

The five that matter most, in order. When two rules pull against each other, the higher one wins.

1. Write only what you can confirm.
2. Use the common word.
3. Put a real name in backticks, and say everything else plainly.
4. Keep a sentence to 25 words.
5. Never drop a fact to meet a cap.

The sections below explain each one and cover the rest.

## What to write

- Write only what the codebase, the developer, or the project configuration confirms. Do not speculate.
- State what something *is*, not what it *means*. Describe the current state, not the intent behind it — unless the developer gave you the intent.

## Which words you may use

- Name a code thing by its real name, and put the name in backticks: an identifier, a file name, a flag, a command, a status value, an error code. Copy it exactly, and explain it in plain words the first time you use it. Use the same test on every word you take from the repo. If the word can take backticks, it is a name, and you may use it. If it cannot, it is text, and these rules apply no matter how often the repo writes it.
- Trust the code, not the commentary. Identifiers, schemas, and enum values tell you what a thing is called. Comments, READMEs, ADRs, and tickets do not approve a word. Agents wrote most of that text, so borrowing recycles your own jargon into each new file.
- Quote a name without adopting the word. Write "`RetryStrategy` decides when to try again", not "the retry strategy is robust".
- Use any word the developer writes in the conversation. If the developer rejects a word, treat it the same way for the rest of the conversation.
- Never invent a hyphenated term, and never repeat one you read in the repo: "delegation-shaped", "relationship-gated", "frozen-corpus". If a hyphenated phrase is not a real name, write it out as a sentence. Keep noun clusters to two words — a hyphen does not buy a third.
- Turn a verb wearing a coat back into a verb. A noun that follows "the" and ends in -ing, -tion, -ment, or -ance is usually an action with its actor hidden. Name the actor and use the verb. "One rule licensed the borrowing" becomes "one rule told the agent to take words from the repo". "The calibration" becomes "how long the text should be". This is the pattern the other rules here miss most often, because each word in the phrase is common on its own.

Use the plain word, not the abstract or inflated one. Write make sure (not ensure), give (not provide), do (not perform), use (not utilize), help (not facilitate), allow (not license), text (not prose), screen (not surface), button (not affordance). Delete robust, seamless, holistic, and elegant rather than replacing them. For layer, mechanism, strategy, controller and precedent, name the actual thing instead — "the database layer" is PostgreSQL, "the accept guard" is the check that rejected the row.

## Every sentence

- Use the active voice and name the actor. Write "The hook writes the sentinel", not "The sentinel is written".
- Name the action with a plain verb. Write "The script installs the plugin", not "Running the script installs the plugin".
- Do not use a phrasal verb when one plain verb means the same thing. Write "start", not "spin up". Keep the everyday ones that have no single-word match, such as "log in" and "set up".
- Use one term per concept, every time. Do not vary the word for style.
- Keep articles and relative pronouns. Write "The test failed because the path is wrong", not "Test failed, path wrong". A list item may stay a fragment.
- Do not use idioms or metaphors that the reader must decode. Do not use a semicolon — write two sentences.
- Keep a sentence to 25 words. If a sentence needs a second read to parse, split it into two sentences.

## Format

- Plain sentences. Tables where they reduce repetition. No other formatting.
- No ASCII art, decorative headers, horizontal rules, boxes, or emojis.
- No padding to look thorough. Every line must answer "why does the reader need this?" — if you can't answer that, cut the line, and if a whole section has nothing worth saying, remove it.

## What these rules must not cost

- Never drop a fact, a number, a condition, or a limit to meet a length cap. Keep the long sentence.
- Never trade a true word for a short one. If the short word means something else, keep the long word.
- When you rewrite the developer's text, change the smallest part that fixes the problem. Leave a sentence alone if it already follows these rules.

**Exception:** `architecture/` files use RFC 2119 voice — MUST, MUST NOT, SHOULD. These rules do not override that.

These rules fix the form of a text. They cannot make a wrong text right.
