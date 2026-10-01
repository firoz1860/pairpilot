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
| 2 | README with setup commands | ✅ `README.md` |
| 3 | Database migrations | ◼ schema + `prisma migrate` documented; migration SQL generated on first `migrate dev` against a DB |
| 4 | `.env.example` | ✅ |
| 5 | Docker Compose | ✅ `docker-compose.yml` (+ Dockerfile) |
| 6 | Extraction-provider setup | ✅ README + architecture |
| 7 | Architecture + scoring docs | ✅ `docs/architecture.md`, `docs/scoring.md` |
| 8 | Test + verification report | ✅ `docs/verification-report.md` (94/94, build green) |
| 9 | Completed fictional showcase | ✅ real, deterministic, in-app (`/showcase`) |
| 10 | Deployment instructions | ✅ README + below |
| 11 | Public GitHub repository | ✅ **https://github.com/firoz1860/pairpilot** |
| 12 | Live deployment | ⛔ blocked — needs a hosting login (see below) |
| 13 | Showcase URL | ⛔ pending deployment (route is `/showcase` once hosted) |
| 14 | ≤3-min video script + checklist | ✅ `docs/video-script.md` (recording needs a screen recorder) |
| 15 | Overall explanation <200 chars | ✅ above |
| 16 | Scraping description <500 chars | ✅ above |

Legend: ✅ done · ◼ implemented, runs against a DB · ⛔ blocked by missing external access.

## Real-participant requirement

**Not met, by design.** No verified consenting adult participants or official source links were
available, so the showcase uses 25 clearly-labeled fictional participants. The real-participant
submission requirement (25 consenting adults, official links, completed dates, deployment, video)
remains unmet until those actually exist. No identities, links, consent records, scraped content, or
extractions were fabricated.

## Blocked actions and the exact access needed

| Blocked | Minimum access needed |
|---|---|
| Live deployment + public showcase URL | A hosting login. Vercel CLI is installed but **logged out** — run `vercel login`, then `vercel link` + `vercel deploy`. The showcase deploys with **no database** (fixture mode). |
| DB-backed interactive flows (onboarding write, live dates, durable jobs) | A PostgreSQL `DATABASE_URL` (e.g. a free Supabase DB), then `npm run db:migrate && npm run db:seed && npm run worker`. |
| Real agent dialogue/analysis | `ANTHROPIC_API_KEY` with `LLM_PROVIDER=anthropic`. |
| Live source extraction | An authorized extraction provider (`SOURCE_PROVIDER_BASE_URL` + `SOURCE_PROVIDER_API_KEY`) and real consent. |
| Recorded video / YouTube upload | A screen recorder (none / no ffmpeg here) and an authorized YouTube integration (none present). Script is ready in `docs/video-script.md`. |

## Deploying the showcase (no database required)

```bash
vercel login
vercel link
vercel deploy            # preview
vercel deploy --prod     # production
```

The showcase compiles deterministically at build/run time, so no env vars are required for it. Set
`DATABASE_URL`, `AUTH_SESSION_SECRET`, and optionally `ANTHROPIC_API_KEY` to enable the interactive,
DB-backed flows.
