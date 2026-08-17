# Example: well-formed PR description

A fictional example (the same Meridian API project as `trace`'s `agents-md-setup` and `adr` examples) showing the target length and depth. Use it as a reference, not a template to copy — the template is in [SKILL.md](./SKILL.md).

Notice how long it is, and how much it leaves out. The whole description is 322 words over 33 lines, so it fits on one screen. Approach carries three bullets, not seven — three decisions survived the delete test and four did not, and the table further down shows which. Risks names two real items instead of padding to three. A reviewer who reads only the title and the first sentence already knows what the change does. If a draft runs past roughly one screen, cut whole bullets and whole sections, never the sentences inside the ones that stay.

Every sentence in the example is 25 words or fewer, and no phrase outside backticks is an invented compound. That is the standard the example exists to set, so it holds itself to it.

---

```
Rate-limit the public search endpoint

## What is this

Search is the only public route with no rate limit. Anonymous clients were
calling it in a loop, and PostgreSQL took the load. During the worst bursts,
users with a session waited several seconds for a search that normally takes
200ms. This puts the existing limiter on that route, with one bucket per IP
address.

## Approach

- **Buckets are keyed by IP address, not by account:** the requests arrive with no session, so there is no account to key on.
- **Requests with a session stay unlimited:** the load came from anonymous clients, and one limit is easier to reason about than two.
- **The counter lives in the Redis instance that already holds sessions:** a dedicated instance would need its own failover plan. The count is a number we can afford to lose.

## Risks / follow-ups

- **The limit is deliberately loose.** 300 requests a minute is far above what a person browsing generates, and about a tenth of what the scrapers were sending. Tightening it needs a week of data first.
- **Clients behind one shared address share a bucket.** A large office on a single public address could reach the limit through ordinary use. Nobody has reported it, and the loose limit makes it unlikely for now.

## Updated context

- ADR: `0005-ip-limits-on-public-routes` — records why the limit is keyed by address, and why traffic with a session is exempt.
- Docs: `docs/system/rate-limiting.md` — adds search to the table of limited routes, and notes what happens when many clients share one address.

## How to verify

- From staging, call `GET /api/search?q=test` in a loop. The 301st call within a
  minute must return 429 with a `Retry-After` header.
- Sign in, then run the same loop. Every call must succeed.
- Watch the search latency panel on the staging dashboard while the loop runs.
  It must stay flat.
```

---

## What got cut, and why

The first draft had seven Approach bullets. Four failed the delete test — remove the bullet, and the reviewer gets nothing wrong. Each one failed for a different reason, and all four look reasonable until you run the test.

| Bullet in the first draft | Why it went |
|---|---|
| **The limit is 300 requests a minute:** tuned from a week of access logs. | The number is in the config file the reviewer is already reading. The Risks section carries the part that matters — that the number is loose on purpose. |
| **A refused request returns 429 with `Retry-After`:** clients that respect it back off on their own. | The status code and the header are both in the diff. |
| **The route now sits behind the same middleware chain as the rest of the API.** | Matching an existing pattern is not a decision. The diff shows the chain. |
| **The counter may drift when Redis fails over:** a missed increment is cheaper than blocking a real user. | The comment above the counter says exactly this. The reviewer reads it there, in context, with the code next to it. |

The last one is the trap to watch. Paraphrasing a comment feels like diligence, and it does two kinds of damage — it spends a bullet on something the reviewer already reads, and it pulls the code's vocabulary into a summary written for someone who has not read the code.

---

## A small change

Most changes need far less than the example above. A one-file fix with no decisions behind it drops Approach, Risks, and Updated context, and nothing is missing:

```
Fix the search cursor skipping the last page

## What is this

The cursor compared `created_at` with `>` instead of `>=`. A page boundary that
fell between two rows sharing a timestamp dropped the second row. Any search
with more than one page could lose rows without reporting it.

## How to verify

- Search for a term with more than 50 matches on staging, then page to the end.
  The total must match the count in the header.
```

---

## A weak Approach section, for contrast

This is the failure to watch for. The same change, written out of the code's vocabulary instead of the reviewer's:

> - **Search joins the anonymous-quota middleware chain:** the per-key bucket resolves ahead of the session-shaped guard.
> - **The quota store rides the session Redis:** counter-drift is acceptable under the failover-tolerant read path.

Five invented compounds — "anonymous-quota", "per-key", "session-shaped", "counter-drift", "failover-tolerant" — and two abstract nouns, "the quota store" and "the read path", standing where a fact belongs. Not one of those phrases can take backticks, so not one of them is a name. A reviewer cannot act on either line.

The same two decisions, plainly:

> - **Buckets are keyed by IP address, not by account:** the requests arrive with no session, so there is no account to key on.
> - **The counter lives in the Redis instance that already holds sessions:** a dedicated instance would need its own failover plan for a number we can afford to lose.

Same facts, same trade-offs. No invented terms, and every phrase that names a thing names one the reviewer can find in the code.
