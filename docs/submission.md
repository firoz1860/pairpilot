# Submission summary

## Overall explanation (under 200 characters)

> PairPilot gives each consenting adult an AI agent that reads their public profiles, runs labeled
> simulated agent dates, and outputs explainable, evidence-backed compatibility rankings.

(184 characters.)

## Scraping / extraction technical description (under 500 characters)

> Two official public sources per person (LinkedIn + Instagram). Extraction runs via a pluggable
> provider interface: a labeled fixture mode (bundled fictional data, no network) or an authorized
> compliant provider/API — never direct scraping of private accounts and never CAPTCHA bypass. Outbound
> requests are SSRF-guarded: https-only, host allowlist, private/metadata-range blocking, redirect
> revalidation, timeouts, bounded retries, caching. Source text is treated as untrusted data.

(482 characters.)

## Deliverables status

| # | Deliverable | Status |
|---|---|---|
| 1 | Complete source code | ✅ in repo |
| 2 | README with setup commands | ✅ |
| 3 | Database migrations | ✅ `prisma/migrations/` committed and **applied to a live Postgres** |
| 4 | `.env.example` | ✅ |
| 5 | Docker Compose | ✅ (+ multi-stage Dockerfile) |
| 6 | Extraction-provider setup | ✅ README + architecture |
| 7 | Architecture + scoring docs | ✅ |
| 8 | Test + verification report | ✅ `docs/verification-report.md` |
| 9 | Completed fictional showcase | ✅ in-app `/showcase` **and** a completed run persisted in the DB (300 dates, 600 rankings) |
| 10 | Deployment instructions | ✅ README + below |
| 11 | Public GitHub repository | ✅ **https://github.com/firoz1860/pairpilot** (CI green) |
| 12 | Live deployment (public URL) | ⛔ blocked — no authenticated app-hosting account (see below) |
| 13 | Showcase URL | ⛔ pending deployment (route `/showcase` once hosted) |
| 14 | ≤3-min video script + checklist | ✅ `docs/video-script.md` (recording blocked — no screen recorder) |
| 15 | Overall explanation <200 chars | ✅ above |
| 16 | Scraping description <500 chars | ✅ above |

## What is implemented AND verified against a real database

A dedicated Supabase Postgres (project `pairpilot`, ref `fseqplcoudsaolrbdkma`, region ap-south-1) was
provisioned, migrated, and seeded. The full workflow was verified end-to-end (`npm run verify:workflow`)
and at scale (`npm run complete:run`):

- Onboarding persists participant + consent + two sources.
- Extraction (fixture) → evidence persisted → schema-validated analysis with every claim citing evidence.
- Agent-studio claim approval/rejection **persists** and is **authorization-checked** (a participant
  cannot edit another's claim → 403).
- Date generation persists messages; **re-running a completed date adds no duplicates** (idempotent resume).
- Rankings persist (directional, 24 per participant).
- Consent withdrawal deletes the participant and all derived records (no orphans).
- A full run completed: **300 dates, 3,000 messages, 600 directional ranking entries, status=completed.**
- The **live date room** streams agent messages over SSE with pause/resume/cancel and reconnect
  (`Last-Event-ID`) — runs with no database against the deterministic showcase.

CI now runs this end-to-end verification against a real Postgres service on every push.

## Real-participant requirement

**Not met, by design.** No verified consenting adults or official source links were available, so the
showcase uses 25 clearly-labeled fictional participants. The real-participant requirement (25 consenting
adults, official links, completed dates with publication permission, deployment, video) remains unmet.
No identities, links, consent records, scraped content, or extractions were fabricated.

## Blocked actions and the exact access needed

| Blocked | Minimum access needed |
|---|---|
| Live deployment + public URL | An authenticated app-hosting account. The Vercel CLI token here is **invalid (logged out)**; no Render/Fly/Railway access. Run `vercel login` then `vercel deploy`. The showcase deploys with no DB; the full app also needs the `DATABASE_URL` below. |
| Real agent dialogue/analysis | `ANTHROPIC_API_KEY` with `LLM_PROVIDER=anthropic`. Fixture mode used and labeled. |
| Live source extraction | An authorized extraction provider (`SOURCE_PROVIDER_BASE_URL` + `SOURCE_PROVIDER_API_KEY`) and real participant consent. |
| Recorded video / YouTube | A screen recorder (none / no ffmpeg) and an authorized YouTube integration (none). Script ready in `docs/video-script.md`. |
| 25 real consenting participants | Verified consent + official links from real adults. |

> The Postgres database itself is **not** blocked — it is provisioned and verified. Its connection
> secret is held locally and was never committed. To run the app against it, set `DATABASE_URL` to that
> project's pooler connection string.

## Deploying (once a hosting login is available)

```bash
vercel login && vercel link
vercel deploy --prod                 # showcase works with no env; set the vars below for the full app
# Env: DATABASE_URL, AUTH_SESSION_SECRET, (optional) ANTHROPIC_API_KEY + LLM_PROVIDER=anthropic
# The pg-boss worker runs as a separate always-on service (see docker-compose.yml / render).
```
