# Change-summary style

Rules for summaries of a finished change: PR descriptions, squash-merge messages, and commit messages. They add to [authoring-rules.md](./authoring-rules.md), which governs the words and sentences. Each skill owns its own template.

## The reader

The reader sees the diff and this summary, nothing else, and will not open the code to decode a phrase. Never reference something the reader cannot see, such as a plan, spec, ticket, or chat history. If a detail from one of those matters, write it into the summary.

## Title

One imperative-mood line of at most 72 characters, with no Conventional-Commits prefix or bracketed scope. Write `Rate-limit the public search endpoint`, not `feat: add rate limiting` or `[api] fix race`.

## What earns a bullet

Do not narrate the diff. Delete each bullet and ask what the reader now gets wrong. If the answer is "nothing, they would see it one file later", leave it out. What survives is usually a decision whose consequence the diff does not show, a rejected alternative, a deliberate omission, or a constraint from outside the diff.

Do not repeat what a comment, docstring, or test name in the diff already explains. Paraphrasing it is the most common way the code's vocabulary gets into a summary.

More than four bullets in a section usually means you are narrating. Cut whole bullets, never shorten the ones that stay.

## How to write a bullet

- Use bullets for three or more distinct points, and two or three sentences of text for one continuous thought.
- Lead with the decision in plain words, not a comparison and not the code's names. Write `The unique index now covers the role column too:`, not `Role joins the active-delegation unique index:`. Keep the lead-in to about ten words, and move the rest into the detail.
- Aim for about 15 words after the lead-in. If the point needs two sentences to stay true, write two.

## Before you emit

Read each sentence once more for its actor. The miss that survives drafting is a gerund subject, such as "Running the check catches it". Write "The check catches it".
