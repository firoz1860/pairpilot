# PairPilot

**Agent-mediated dating, grounded in evidence.** Each consenting adult gets an AI agent that reads
*their own* public LinkedIn and Instagram, builds an evidence-backed profile, runs **clearly-labeled
simulated dates** with other agents, and produces an **explainable compatibility ranking**.

> PairPilot is a simulation. Agents are labeled simulations: they do not message real people, do not
> claim real dates happened, and do not impersonate participants. The bundled showcase uses **25
> clearly-labeled fictional participants** — no real person is profiled without verified consent.

**▶ Live:** https://pairpilot-firozs-projects-70dbf044.vercel.app · **Showcase:** https://pairpilot-firozs-projects-70dbf044.vercel.app/showcase

Main flow: **two official profile links → source reading → analysis page → agent date → compatibility rankings.**

---

## Quick start (local, DB-free showcase)

The completed showcase renders with **no database and no API key** — it is precompiled by the real engine.

```bash
npm install
npm run showcase:build      # regenerate the completed fictional run (committed by default)
npm run dev                 # open http://localhost:3000/showcase
```

## Full app (interactive: onboarding, live dates) — requires PostgreSQL

```bash
cp .env.example .env        # then fill DATABASE_URL (local Postgres or a free Supabase DB)
npm run db:generate
npm run db:migrate          # create schema
npm run db:seed             # seed the 25 fictional participants + a completed run
npm run worker &            # background job worker (extraction/analysis/dates/rankings)
npm run dev                 # http://localhost:3000
```

### With Docker Compose (app + Postgres)

```bash
cp .env.example .env
docker compose up --build   # app on :3000, postgres on :5432, worker included
```

## Environment

See [`.env.example`](./.env.example) for every variable with descriptions. Secrets are server-side only.

- `LLM_PROVIDER=fixture` (default) runs deterministic, labeled simulation dialogue — **no key needed**.
  Set `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` to use a real model. If the key is missing, agent
  runs **fail loudly** rather than silently substituting fiction.
- `SOURCE_PROVIDER=fixture` (default) serves bundled fictional source documents. `live` requires an
  authorized extraction provider; without one, live extraction returns an honest provider-unavailable error.

## Extraction-provider setup

PairPilot never scrapes private accounts, bypasses access controls, or defeats CAPTCHAs. Live extraction
is designed to run through an **authorized, compliant provider** (`SOURCE_PROVIDER_BASE_URL` +
`SOURCE_PROVIDER_API_KEY`) or official APIs. All outbound requests are SSRF-guarded (host allowlist,
private/metadata-range blocking, redirect validation, timeouts, bounded retries). See
[`docs/architecture.md`](./docs/architecture.md#source-extraction).

## Documentation

- [Architecture](./docs/architecture.md)
- [Scoring & ranking rubric](./docs/scoring.md)
- [Development plan & status](./docs/development-plan.md)
- [Verification report](./docs/verification-report.md)
- [Submission summary & deliverable status](./docs/submission.md)
- [Video script & recording checklist](./docs/video-script.md)

## Testing

```bash
npm test            # unit + integration (Vitest)
npm run typecheck
npm run lint
npm run build
```

## License

MIT — see [LICENSE](./LICENSE).
