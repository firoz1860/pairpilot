# PairPilot — project guide for Claude Code

PairPilot is an **agent-mediated dating simulation**. Each consenting adult gets an AI agent
that reads *their own* two official public sources (LinkedIn + Instagram), builds an
evidence-backed profile, runs **clearly-labeled simulated dates** against other agents, and
produces an **explainable compatibility ranking**.

This is a functional application, not a mockup — but it is a *simulation*. Agents never
message real people, never claim real dates happened, and never impersonate participants.

## Non-negotiable product rules (enforced in code)

1. Two sources only per participant: official public LinkedIn + official public Instagram.
2. Public availability is not consent. Only consenting, adult, confirmed participants are onboarded.
3. No real people are profiled without verified consent. The default showcase is **25 clearly-labeled
   fictional participants**. Real-participant mode stays unmet until real consent + sources exist.
4. Never fabricate identities, links, consent, scraped content, or extractions. Fixture mode is always
   labeled; a failed real extraction is NEVER silently replaced with fiction.
5. No sensitive inference: orientation, health, religion, ethnicity, politics, relationship status,
   appearance, or wealth. `src/domain/sensitive.ts` hard-filters these from model output.
6. Dating preferences / relationship needs show **"Not established from sources"** unless explicitly stated
   in an allowed source.
7. Every profile finding cites a source evidence item, an excerpt, a timestamp, explicit-vs-interpretation,
   and confidence/limitations.
8. Compatibility is an explainable fit estimate — never "probability of love". Evidence coverage is kept
   separate from compatibility; missing info raises uncertainty, never incompatibility.
9. All source text is untrusted data. It is sanitized and fenced; it never changes system prompts or invokes tools.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict), Tailwind CSS 3.
- PostgreSQL + Prisma. Durable jobs via pg-boss (Postgres-backed).
- Server-side LLM behind a provider interface (`anthropic` | `fixture`). Fixture = deterministic, no key.
- Source extraction behind a provider interface (`live` | `fixture`), SSRF-guarded.

## Architecture (clean layering)

```
src/
  domain/      pure, framework-free logic (pairing, ranking, url, ssrf, sanitize, sensitive,
               date-state, analysis-schema, fixture-dialogue) — fully unit-tested, no I/O
  lib/         env, logging, prisma client, seeded-random, auth/session
  integrations/ source adapters (linkedin/instagram), llm adapters (anthropic/fixture)
  services/    business logic orchestrating domain + integrations + data
  workers/     pg-boss queue + job handlers (extraction, analysis, date, evaluation, ranking)
  showcase/    deterministic compiler that builds the completed fictional run (no DB needed)
  app/         Next.js routes (thin) + pages + components
```

Keep HTTP routes thin. All generated content is validated against Zod schemas before storage/display.

## Commands

```
npm run dev         # local dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (domain + integration)
npm run db:migrate  # prisma migrate dev (needs DATABASE_URL)
npm run db:seed     # seed fictional showcase (needs DATABASE_URL)
npm run worker      # start the background job worker
npm run showcase:build  # compile the DB-free showcase fixture (see src/showcase)
```

## Verification gate before "done"

format → lint → typecheck → test → build → review diff → check no secrets. Fix failures, never weaken checks.
Never claim a feature works without running it.
