# PairPilot architecture

## Overview

PairPilot is a Next.js (App Router) application with a Postgres/Prisma datastore and a durable,
Postgres-backed job queue (pg-boss). It is organized in clean layers so that HTTP routes stay thin
and the correctness-critical logic lives in pure, unit-tested modules.

```
Browser ─► Next.js routes (thin) ─► services (business logic) ─► domain (pure)
                                      │                        └► integrations (source + LLM adapters)
                                      └► data access (Prisma)  └► workers (pg-boss handlers)
```

## Layers

- **domain/** — pure functions, no I/O, exhaustively unit-tested: pairing math, ranking rubric,
  URL validation, SSRF guards, source-text sanitizing + injection detection, sensitive-inference
  rejection, the date-session state machine, Zod schemas for every generated artifact, and the
  deterministic fixture dialogue generator.
- **lib/** — env parsing (Zod), structured logging (no sensitive data), Prisma client singleton,
  seeded RNG, auth/session (JWT via `jose` + bcrypt password hashing).
- **integrations/** — the pluggable providers:
  - *source*: `fixture` (bundled fictional docs) and `live` (authorized provider / official API,
    SSRF-guarded). A normalized `SourceDocument` is returned regardless of provider.
  - *llm*: `fixture` (deterministic simulation) and `anthropic` (real model, schema-validated output).
- **services/** — orchestration: onboarding/consent, extraction, analysis generation (+ sensitive
  filter + schema validation), agent creation from approved claims, the date runner, the evaluator,
  ranking, and withdrawal/deletion.
- **workers/** — pg-boss queues with concurrency limits, idempotency, bounded retries, and a cost
  budget. Interrupted runs resume without duplicating completed dates.
- **showcase/** — a deterministic *compiler* that builds the complete fictional run (participants,
  analyses, 300 dates, 600 directional evaluations, rankings) as structured data, so the showcase
  renders with no database.

## Analysis pipeline

1. Validate eligibility + links (`domain/url`, consent record).
2. Extract both sources (`integrations/source`), per-source progress + partial handling.
3. Confirm identity (participant confirmation or clear cross-link evidence — similar names are not enough).
4. Normalize + store evidence (`EvidenceItem`), original evidence kept separate from interpretations.
5. Generate a schema-validated analysis (`integrations/llm` → `domain/analysis-schema`).
6. Reject unsupported or sensitive inferred claims (`domain/sensitive`).
7. Present the profile for participant review (approve/reject claims).
8. Create the agent from **approved** evidence only.
9. Run simulated dates (`services/date-runner` + `domain/date-state`).
10. Evaluate + publish rankings (`services/evaluator` + `domain/ranking`).

## Agent dating harness

Each agent receives only: its participant's approved, source-backed profile; evidence references;
the current scenario; the conversation history; and explicit simulation instructions. Source text is
fenced as untrusted data (`domain/sanitize.fenceUntrusted`) and never joins the system prompt.

A date has four stages — introduction, shared-interest exploration, a practical scenario, reflection —
across ~8–12 turns. A **separate evaluator** with a fixed, versioned rubric scores each direction and
must cite transcript turns and evidence. Agent reflections are simulated outputs, not statements by
the real participant.

For N participants we run all C(N,2) unordered pairs (N=25 → 300), producing two directional
assessments per pair (600), and rank each fully-eligible participant against the other N−1 (24).

## Source extraction

Adapters return a normalized document: canonical URL, platform, public name/bio, public textual
sections, public post captions + timestamps (where authorized), extraction timestamp, provider status,
limitations, and **stable evidence identifiers**.

Safeguards (`domain/ssrf`, `domain/url`, `integrations/source`): URL normalization, host allowlist,
private/loopback/link-local/CGNAT/metadata-range blocking, redirect validation, rate limiting,
timeouts, bounded retries, caching, duplicate detection, partial-extraction handling, retention controls.
PairPilot never accesses private accounts, bypasses access controls, or defeats CAPTCHAs, and never
claims complete coverage when only a subset is available.

## Security & reliability

Authentication for participant management (JWT session cookie, bcrypt hashing). Authorization checks on
profile edits and consent withdrawal (ownership). Public showcase access only for approved publication.
Input validation (Zod) at every boundary. Request rate limiting. Server-side secret handling. Safe
rendering of source text (escaped, never dangerouslySetInnerHTML). Structured logs without sensitive data.
Durable, idempotent jobs. Withdrawal deletes participant-derived records, including affected rankings.

## Data model

Participant, EligibilityConsent, SourceProfile, ExtractionJob, EvidenceItem, AnalysisVersion,
ApprovedClaim, Agent, ShowcaseRun, DateSession, DateMessage, Evaluation, RankingEntry, DeletionRequest.
Unique constraints and transactions prevent duplicate pairs, duplicate messages, and inconsistent run
completion. See `prisma/schema.prisma`.

## Deployment

- **Showcase only** (DB-free): deploy the Next.js app anywhere (e.g. Vercel). The compiled showcase is
  served statically — no database, no API key.
- **Full app**: Next.js app + a Postgres database + a running worker process. Compose file provided for
  local/staging. For production, run migrations via CI (`prisma migrate deploy`) and the worker as a
  separate service.
