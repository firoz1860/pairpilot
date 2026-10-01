# Development plan & status

Legend: ✅ implemented & verified here · 🟡 implemented, needs external access to exercise · ⬜ not built

## Phase 0 — Foundation ✅
Next.js 15 + TS (strict) + Tailwind scaffold, ESLint/Prettier, Vitest; pure domain modules.

## Phase 1 — Data & config ✅
Prisma schema (14 models, cascades, unique constraints), `lib/env` (Zod), `lib/logger`, `lib/prisma`.

## Phase 2 — Integrations ✅ / 🟡
- Source: interface + fixture adapter ✅; live adapter with SSRF-guarded fetch ✅ (🟡 needs an authorized provider to fetch real data).
- LLM: interface + fixture adapter ✅; Anthropic adapter ✅ (🟡 needs `ANTHROPIC_API_KEY`).

## Phase 3 — Services & workers ✅ (code) / 🟡 (runtime)
Onboarding ✅ (verified via API build); analysis, dates (idempotent run + rankings), withdrawal,
and the pg-boss worker are implemented and typecheck — 🟡 require `DATABASE_URL` to exercise.

## Phase 4 — Showcase (DB-free) ✅
Deterministic compiler (25 participants → 300 dates → 600 evaluations → 24 rankings each), rendered by
the showcase pages. Verified by 94 passing tests, build, and a runtime smoke test.

## Phase 5 — Interactive UI & API
- Landing ✅, Showcase ✅, Directory ✅, Profile analysis ✅, Rankings ✅, Date replay ✅ (serves the
  live date room in replay mode: stream/pause/resume/cancel/replay), Status ✅, Agent studio ✅
  (read-only review demo over showcase data), Onboarding ✅ (UI + `/api/onboarding`, honest 503 w/o DB).
- Auth (bcrypt + JWT session) ✅; rate limiting ✅.
- ⬜ **Not built:** the DB-backed *live* date room (running a brand-new date and streaming it over SSE
  while the worker writes to Postgres) and persisted agent-studio approve/reject. The domain, services,
  worker, and schema to support them exist; only the interactive SSE pages/routes are not wired.

## Phase 6 — Ops & delivery
- Dockerfile (multi-stage, non-root) ✅; docker-compose (db+migrate+app+worker) ✅ (🟡 Docker not run here).
- GitHub Actions CI (lint, typecheck, test, showcase build, prod build) ✅ — **green on main**.
- Public GitHub repo ✅ — https://github.com/firoz1860/pairpilot (pushed).
- ⬜ E2E (Playwright) — not added (Playwright MCP/browser unavailable here).
- 🟡 Live deployment — showcase deploys with no DB; **Vercel is logged out**, so it is blocked on
  `vercel login` (see `docs/submission.md`).

## Known external blockers (this environment)
- No `ANTHROPIC_API_KEY` → real agent dialogue/analysis; fixture mode used and labeled.
- No Postgres / `DATABASE_URL` → DB-backed flows not exercised here.
- No Docker → compose authored, not run.
- No screen recorder / ffmpeg / browser automation → video recorded manually from the script.
- No verified consenting real participants → fictional showcase only; real-participant requirement unmet.

## Autonomous decisions log
- Fictional showcase of 25 clearly-labeled participants (no real consent available).
- pg-boss (Postgres-backed) over Redis/BullMQ — durable queue, fewer dependencies.
- Fixture-first providers; real providers activate on creds and never silently substitute fiction.
- DB-free showcase compiler so the headline demo is real, reproducible, and deployable without a DB.
