# Example: well-formed AGENTS.md

This is a fictional example showing the target quality and structure. Use it as a reference, not a template to copy.

The skill writes two files at the repo root: `AGENTS.md` (canonical, shown below) and a one-line `CLAUDE.md` forwarder:

```
See @AGENTS.md for more information.
```

The forwarder ensures Claude Code's native CLAUDE.md discovery picks up the project context. Other agents read `AGENTS.md` directly.

---

# AGENTS.md

## What is this

Internal API for the Meridian customer portal. Handles authentication, account management, and billing integration. Consumed by the React frontend and the mobile app.

## Stack

| Piece | Choice |
|-------|--------|
| Runtime | Node.js 20 |
| Framework | Express |
| Data | PostgreSQL 15, Redis (sessions and rate-limit counters) |
| ORM | Prisma |
| Testing | Jest + Supertest for integration tests |
| Package manager | pnpm |

## Directory index

| Path | What's there |
|------|-------------|
| `src/routes/` | Express route handlers, grouped by domain (auth, billing, accounts) |
| `src/middleware/` | Auth, rate limiting, error handling, request logging |
| `src/services/` | Business logic. Routes delegate here; services never import from routes |
| `src/jobs/` | Background workers (BullMQ). Invoice generation, email dispatch |
| `prisma/` | Schema and migrations |
| `config/` | Environment-specific config. Loaded via `config/index.ts`, not dotenv directly |
| `scripts/` | One-off and seed scripts. `scripts/seed-dev.ts` sets up local dev data |
| `docs/` | Durable project context. Sub-folder layout below shows where each kind of doc goes. |

```
docs/
├── system/         ← what the code does today (updated as code changes)
├── architecture/   ← what the system must do (updated when rules change)
├── adr/            ← architecture decisions (immutable once shipped)
├── reference/      ← long-form rationale (append-only)
└── working-notes/  ← research; NOT authoritative — rules live in architecture/ + adr/
```

## Commands

| What | Command |
|------|---------|
| Dev server | `pnpm dev` (runs on port 3001, expects Postgres and Redis running) |
| Tests | `pnpm test` (unit) / `pnpm test:integration` (needs test DB, see below) |
| Integration test DB | `pnpm db:test:reset` — drops and recreates the test database from migrations |
| Migrations | `pnpm prisma migrate dev` |
| Lint | `pnpm lint` (ESLint + Prettier check) |

## Gotchas

- The JWT TTL is 24 hours, not the default 1 hour. Mobile clients can't refresh tokens in the background, so the long TTL is intentional. Don't shorten it without checking with the mobile team.
- Integration tests use a separate database (`meridian_test`). Running `pnpm test:integration` without `pnpm db:test:reset` first will fail on a fresh checkout.
- The `config/` loader merges files in order: `default.ts` → `{NODE_ENV}.ts` → environment variables. A value in `production.ts` overrides `default.ts`, but an env var overrides both. This matters when debugging config issues.
- Rate limit thresholds are in `config/rate-limits.ts`, not environment variables. They were moved there after a prod incident where a misconfigured env var disabled rate limiting entirely.
- The billing service integration uses webhook signatures for verification. The webhook secret rotates quarterly; the current one is in 1Password under "Stripe webhook signing secret." Tests use a hardcoded test secret in `config/test.ts`.
