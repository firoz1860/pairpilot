# Verification report

Generated during the autonomous build. "Verified here" means the command was actually run in the
build environment and its result observed.

## Automated checks (verified here)

| Check | Command | Result |
|---|---|---|
| Unit + integration tests | `npm test` (Vitest) | **94 passed / 94** |
| Typecheck | `npx tsc --noEmit` | **clean (exit 0)** |
| Production build | `npm run build` | **success — 8 routes compiled, linted, typechecked** |
| Showcase compile | `npm run showcase:build` | **25 participants, 300 dates, 25 rankings** |
| Runtime smoke test | `next start` + HTTP fetch | **/, /showcase, /showcase/participants, /showcase/participants/[id], …/rankings, /showcase/dates/[id], /status → all 200** |

### Test coverage highlights (what the suite actually asserts)

- **Pairing:** C(25,2) = exactly 300 unique pairs; 600 directional assessments; 24 per participant.
- **Ranking:** weights sum to 1; evidence coverage kept **separate** from compatibility (same dims +
  different coverage ⇒ same score, different uncertainty); deterministic, stable tie-breaks; 24 ranked.
- **URL validation:** rejects non-https, wrong host, company/post paths, credentials-in-URL, custom
  ports, too-short handles; normalizes LinkedIn/Instagram profiles.
- **SSRF:** blocks 127.0.0.1, 10/172.16/192.168, 169.254.169.254 (metadata), 0.0.0.0, CGNAT, ::1,
  fe80/fc00, IPv4-mapped; allows public IPs; allowlist + redirect revalidation enforced; `guardedFetch`
  refuses disallowed hosts before any request and rejects redirects to internal addresses.
- **Prompt injection:** injection phrasings detected; a poisoned source label is treated as inert data
  and does **not** change agent behavior (byte-for-byte identical structure).
- **Sensitive inference:** orientation/health/religion/ethnicity/politics/relationship-status/appearance/
  wealth claims are filtered out of model output; permitted interests pass.
- **Date state machine:** legal/illegal transitions; all four stages present with reflection last for
  every 8–12 turn total; idempotent message keys; append-on-resume guard (no duplication).
- **Schemas:** a claim with no evidence is rejected; out-of-range confidence rejected; evaluator output
  must cite ≥1 turn.
- **Showcase integration:** 300 unique completed pairs, 600 evaluations, 24 rankings each, deterministic
  (compile twice ⇒ identical), rankings reference existing dates/evidence, no sensitive claims, every
  participant's relationship needs left unestablished.
- **Providers/auth:** fixture LLM analysis is schema-valid and cites evidence; auth hashes+verifies
  passwords and round-trips / rejects session tokens.

## CI (GitHub Actions)

`.github/workflows/ci.yml` runs install → prisma generate → lint → typecheck → test → showcase build →
production build on every push/PR to `main`. Status is visible on the repository's Actions tab.

## Spec test checklist mapping

| Spec requirement | Where verified |
|---|---|
| Invalid/unsupported URLs rejected | `src/domain/url.test.ts` |
| Private/inaccessible profiles fail honestly | live adapter returns `SourceUnavailableError`; `src/integrations/source/live.test.ts` |
| Partial source extraction visible | partial-coverage participants in showcase; profile page shows "partial" |
| Identity mismatch blocks agent creation | onboarding requires `identityConfirmed`; documented |
| Unsupported/sensitive claims excluded | `src/domain/sensitive.test.ts`, showcase test |
| Source prompt injection ineffective | `src/domain/fixture-dialogue.test.ts` |
| 25-person run = 300 unique pairs | `src/domain/pairing.test.ts`, `src/showcase/compiler.test.ts` |
| Each eligible participant gets 24 rankings | `src/showcase/compiler.test.ts` |
| Rankings cite evidence + transcript turns | `src/showcase/compiler.test.ts` |
| Dates generate + persist messages | showcase compiler (in-memory) + DB `DateMessage` unique(dateSessionId,turnIndex) |
| Pause/resume/cancel/replay | `src/domain/date-state.test.ts` + date replay UI |
| Failed runs resume without duplication | `canAppendTurn` guard + unique message constraint |
| Main workflow on desktop + mobile | responsive Tailwind layouts (manual) |

## DB-backed end-to-end (verified against a live PostgreSQL)

A dedicated Supabase Postgres (project `pairpilot`, ref `fseqplcoudsaolrbdkma`) was provisioned and
`prisma migrate deploy` applied the committed initial migration. `npm run verify:workflow` passed:

- onboarding persists participant + consent + 2 sources;
- extraction (fixture) persists evidence; analysis persists with every claim citing evidence;
- agent-studio claim decision **persists** and is **authorization-checked** (foreign participant → 403);
- date messages persist; **re-running a completed date adds no duplicates** (idempotent resume);
- directional rankings persist for each pair;
- consent withdrawal removes the participant and all derived records (no orphaned evidence).

`npm run complete:run` then completed the seeded run at scale: **300 dates, 3,000 messages, 600
directional ranking entries, run status = completed**. This same end-to-end verification now runs in CI
against a Postgres service on every push.

## Not verified here (requires external access still missing)

- **Live public deployment**: no authenticated app-hosting account (Vercel token invalid; no
  Render/Fly/Railway). Build + runtime verified locally; no public URL produced (not fabricated).
- **Real LLM dialogue/analysis**: requires `ANTHROPIC_API_KEY`. Fixture mode used and labeled.
- **Live source extraction**: requires an authorized provider + real consent; otherwise fails honestly.
- **Docker Compose up**: Docker not installed here; compose authored, not run.
- **Video recording / YouTube upload**: no screen recorder / no authorized YouTube integration.
