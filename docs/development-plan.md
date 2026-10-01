# Development plan & status

Legend: ✅ implemented & verified · 🟡 implemented, needs external access to exercise · ⬜ planned

## Phase 0 — Foundation ✅
- Next.js 15 + TS (strict) + Tailwind scaffold, ESLint/Prettier, Vitest.
- Pure domain modules with 74 passing unit tests; typecheck clean.

## Phase 1 — Data & config
- ⬜ Prisma schema (14 models) + initial migration.
- ⬜ `lib/env` (Zod-validated config), `lib/logger`, `lib/prisma`.

## Phase 2 — Integrations
- ⬜ Source provider interface + fixture adapter + live adapter (SSRF-guarded fetch).
- ⬜ LLM provider interface + fixture adapter + Anthropic adapter (schema-validated output).

## Phase 3 — Services & workers
- ⬜ Onboarding/consent, extraction orchestration, analysis (+ sensitive filter), agent creation.
- ⬜ Date runner, evaluator, ranking, withdrawal/deletion.
- ⬜ pg-boss queues: concurrency, idempotency, bounded retries, cost budget, resumable runs.

## Phase 4 — Showcase (DB-free)
- ⬜ Deterministic showcase compiler: 25 fictional participants → analyses → 300 dates → 600
  evaluations → rankings, emitted as committed data.
- ⬜ Showcase, profile-analysis, date-replay, rankings pages rendering from the compiled run.

## Phase 5 — Interactive UI & API (DB-backed)
- ⬜ Landing, onboarding, directory, agent studio, live date room (SSE), integration/run status.
- ⬜ Auth (session) + authorization + rate limiting on all mutating routes.

## Phase 6 — Ops & delivery
- ⬜ Dockerfile (multi-stage, non-root) + docker-compose (app + postgres + worker).
- ⬜ GitHub Actions CI (lint, typecheck, test, build).
- ⬜ E2E (Playwright) for the main flow.
- ⬜ Public GitHub repo + push.
- 🟡 Live deployment (Vercel) — showcase deployable with no DB; full app needs DB.

## Known external blockers (this environment)
- No `ANTHROPIC_API_KEY` → real agent dialogue unavailable; fixture mode used and labeled.
- No Postgres / `DATABASE_URL` → live migrations + DB-backed flows not exercised here.
- No Docker locally → compose authored but not run here.
- No ffmpeg / browser automation → video recorded manually from the provided script.
- No verified consenting real participants → fictional showcase only; real-participant requirement unmet.

## Autonomous decisions log
- **Fictional showcase**: 25 clearly-labeled fictional participants (real consent unavailable).
- **pg-boss** chosen over Redis/BullMQ: durable queue on the Postgres we already require; fewer deps.
- **Fixture-first providers**: app runs fully offline in fixture mode; real providers activate on creds
  and never silently substitute fiction for a failed real call.
- **DB-free showcase compiler**: makes the headline demo real, viewable, and deployable without a DB.
