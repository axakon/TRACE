# Example: well-formed commit messages

Three fictional messages (the same Meridian API project as `trace`'s `agents-md-setup` and `adr` examples) showing the target length at three sizes. Use them as a reference, not templates to copy.

Notice the calibration. Most commits look like the first one — a title and nothing else. The second adds a body because the title cannot carry the *why*. Only the third earns bullets, and it earns two, not five. Plain text throughout, wrapped at 72 characters, no markdown.

---

## A trivial change: title only

```
Fix the typo in the invoice email subject
```

Nothing a body could add. A reader who wants more opens the diff and finds one line.

---

## A normal change: title and a why

```
Retry invoice emails through the job queue

A failed send used to disappear. The route caught the SMTP error, logged
it, and returned 200, so nobody found out until a customer asked where
their invoice was. Sending now goes through BullMQ, which retries and
dead-letters on its own.
```

The title says what changed. The body says what was wrong before, which the diff cannot show.

---

## A change with a decision behind it: title, why, and bullets

```
Rate-limit the public search endpoint

Search was the only public route with no limit. Anonymous clients called
it in a loop and PostgreSQL took the load, so a search that normally
takes 200ms ran for several seconds during the worst bursts.

- Buckets are keyed by IP address, not by account — the requests arrive
  with no session, so there is no account to key on.
- Requests with a session stay unlimited — the load came from anonymous
  clients, and one limit is easier to reason about than two.
```

Two bullets, both of which survive the delete test. Remove the first and a reader may read the address key as an oversight rather than a constraint. Remove the second and the exemption looks forgotten.

Four more bullets were in the first draft and all four went. The request limit, the 429 status, and the `Retry-After` header are all visible in the diff. The fourth repeated a comment sitting directly above the counter, which is the most common way jargon reaches a commit message — paraphrasing a comment pulls the code's vocabulary into text written for someone reading `git log` a year later.

---

## A weak version, for contrast

The same commit, written out of the code's vocabulary:

```
Wire search into the anonymous-quota path

The per-key bucket now resolves ahead of the session-shaped guard, and
counter-drift stays acceptable under the failover-tolerant read path.
```

Five invented compounds — "anonymous-quota", "per-key", "session-shaped", "counter-drift", "failover-tolerant" — plus "the read path" standing where a fact belongs. Not one of those phrases can take backticks, so not one of them is a name. In a year, in `git log`, nobody will be able to reconstruct what this commit did or why.
