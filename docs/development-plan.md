# Development plan & status

Legend: ✅ implemented & verified here · 🟡 implemented, needs external access to exercise · ⬜ not built

## Phase 0 — Foundation ✅
Next.js 15 + TS (strict) + Tailwind scaffold, ESLint/Prettier, Vitest; pure domain modules.

## Phase 1 — Data & config ✅
Prisma schema (14 models, cascades, unique constraints), `lib/env` (Zod), `lib/logger`, `lib/prisma`.

## Phase 2 — Integrations ✅ / 🟡
- Source: interface + fixture adapter ✅; live adapter with SSRF-guarded fetch ✅ (🟡 needs an authorized provider to fetch real data).
- LLM: interface + fixture adapter ✅; Anthropic adapter ✅ (🟡 needs `ANTHROPIC_API_KEY`).

## Phase 3 — Services & workers ✅ (verified against live Postgres)
Onboarding, analysis, dates (idempotent run + rankings), claim decisions (authz), and withdrawal are
implemented and **verified end-to-end against a live Supabase Postgres** (`npm run verify:workflow`,
now also in CI). A full run completed at scale (300 dates, 600 rankings). The pg-boss worker is
implemented; the completion was also driven directly via `npm run complete:run`.

## Phase 4 — Showcase (DB-free) ✅
Deterministic compiler (25 participants → 300 dates → 600 evaluations → 24 rankings each), rendered by
the showcase pages. Verified by 94 passing tests, build, and a runtime smoke test.

## Phase 5 — Interactive UI & API
- Landing ✅, Showcase ✅, Directory ✅, Profile analysis ✅, Rankings ✅, Date replay ✅ (serves the
  live date room in replay mode: stream/pause/resume/cancel/replay), Status ✅, Agent studio ✅
  (read-only review demo over showcase data), Onboarding ✅ (UI + `/api/onboarding`, honest 503 w/o DB).
- Auth (bcrypt + JWT session) ✅; rate limiting ✅.
- ✅ **Live date room** (`/showcase/dates/[id]/live`): agent messages stream over SSE
  (`/api/live-date`) with pause/resume/cancel and reconnect (`Last-Event-ID`) — works with no database.
- ✅ **Persisted agent-studio approval**: `PATCH /api/claims/[claimId]` + `/api/me`, session-auth and
  ownership-checked; verified against the live DB.

## Phase 6 — Ops & delivery
- Dockerfile (multi-stage, non-root) ✅; docker-compose (db+migrate+app+worker) ✅ (🟡 Docker not run here).
- GitHub Actions CI (lint, typecheck, test, showcase build, prod build) ✅ — **green on main**.
- Public GitHub repo ✅ — https://github.com/firoz1860/pairpilot (pushed).
- ⬜ E2E (Playwright) — not added (Playwright MCP/browser unavailable here).
- ✅ Live deployment — **https://pairpilot-firozs-projects-70dbf044.vercel.app** (Vercel, public, DB-backed
  via Supabase; deployment protection disabled; onboarding writes verified in prod). Worker runs off-platform.

## Known external blockers (this environment)
- No authenticated app hosting (Vercel token invalid; no Render/Fly/Railway) → no public URL produced.
- No `ANTHROPIC_API_KEY` → real agent dialogue/analysis; fixture mode used and labeled.
- No Docker → compose authored, not run.
- (Resolved) Postgres: a Supabase DB was provisioned, migrated, seeded, and E2E-verified.
- No screen recorder / ffmpeg / browser automation → video recorded manually from the script.
- No verified consenting real participants → fictional showcase only; real-participant requirement unmet.

## Autonomous decisions log
- Fictional showcase of 25 clearly-labeled participants (no real consent available).
- pg-boss (Postgres-backed) over Redis/BullMQ — durable queue, fewer dependencies.
- Fixture-first providers; real providers activate on creds and never silently substitute fiction.
- DB-free showcase compiler so the headline demo is real, reproducible, and deployable without a DB.
