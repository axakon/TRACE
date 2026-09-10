# Services

## What is this

Backend services. Personal notes load from @~/.claude/personal.md and a moved file from @../ghost.md

## Stack

Node.

## Commands

`npm test`

## Gotchas

- The queue rejects a message over 256 KB, and the client does not retry, so split payloads before publishing.
- Every service reads `DATABASE_URL` at boot only; a rotated secret needs a restart.
- Migrations run in filename order and the ordering is by string, so `10-` sorts before `9-`.
