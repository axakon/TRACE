# Change-summary style

Shared writing rules for summaries of a finished change — PR descriptions, squash-merge messages, and individual commit messages. Each skill carries its own structure — which sections, which phases. This file is only the *how to write* the text inside them.

Read [authoring-rules.md](./authoring-rules.md) first. It governs the words and the sentences. This file adds only what is specific to a change summary.

## The reader

The reader sees the diff and this summary, nothing else. Assume they have never seen this problem, this ticket, or this system before, and that they will not open the code to decode a phrase. A summary the reviewer has to re-read has failed, however accurate it is.

## Title

- One imperative-mood line, ≤72 characters.
- No Conventional-Commits prefix. No enum of types. No bracketed scopes.
- Examples: `Rate-limit the public search endpoint`, `Fix race in session refresh`. Not `feat: add rate limiting`, not `[api] fix race`.

## Self-contained

Never reference an artifact the reader cannot see — no plan, spec, ticket body, ADR draft, or chat history. If a detail from one of those matters, inline it here.

## What earns a bullet

Do not narrate the diff. A bullet earns its place only when the reviewer would misjudge the change without it.

Run this test on every bullet before you keep it: **delete it, and ask what the reviewer now gets wrong.** If the answer is "nothing — they would learn the same thing one file later", the bullet is narration. Cut it. If the answer is that they would approve something they should have questioned, keep it.

What survives is usually one of four things: a decision whose consequence you cannot see by reading the change, a rejected alternative, a deliberate omission, or a constraint from outside the diff.

**If the code explains it at the site, do not explain it again.** A comment, a docstring, or a test name in the diff is text the reviewer already reads. Repeating it adds nothing, and paraphrasing it drags its vocabulary into the summary — this is the most common way jargon gets in.

More than four bullets in a section usually means you are narrating. Re-run the test on each one. **Cut by dropping whole bullets, never by shortening the ones that stay** — squeezing a bullet makes it dense, and dense is exactly what the reviewer cannot read.

## How to write a bullet

- Bullets when there are 3+ distinct points. Short prose (2–3 sentences) when it is one continuous thought.
- Lead each bullet with the decision itself, not a comparison framing. Write `Token updates use PUT:` not `PUT over DELETE+POST:`. Rationale and rejected alternatives are supporting detail, not the headline.
- **Write the lead-in in plain words, not in the code's words.** A column, a schema name, or a test fixture is not a decision. `The unique index now covers the role column too:` is a lead-in. `Role joins the active-delegation unique index:` is a stack of nouns the reader has to decode.
- Aim for about 15 words of detail after the lead-in. That is a target, not a budget. If the point needs two sentences to stay true and readable, write two sentences — a bullet nobody can parse saves nothing.
- Write the lead-in as markdown `**bold**:` in a PR body, and as plain `Lead-in — detail` in a commit body. The skill using this style says which.

## Before you emit

Re-read [authoring-rules.md](./authoring-rules.md) and run all three tests over the draft. Two of them are easy to remember and the third is the one that gets missed, so run it last and run it slowly.

- **Every phrase not already in backticks:** if it names something in the codebase but cannot itself take backticks, it is jargon. Rewrite it in plain words.
- **Every bullet:** delete it and ask what the reviewer gets wrong. If nothing, leave it deleted.
- **Every "the" followed by a word ending in -ing, -tion, -ment, or -ance:** that is an action with its actor hidden. Name the actor and use the verb. A draft can pass the first two tests and still be unreadable because of this one.
