# Video plan — maximum 3 minutes

The recording must show working behavior (live app), not slides. Do not describe simulated dates as
real human dates. State clearly that the showcase is fictional.

## Script

**0:00–0:20 — Product + participant count**
> "PairPilot gives each consenting adult an AI agent that reads their own public profiles and runs
> clearly-labeled simulated dates. This showcase is a completed run of **25 fictional participants** —
> no real people." Open `/showcase`; point to the 25 participants / 300 completed pairs stats and the
> fictional banner.

**0:20–0:50 — Two links + source evidence**
> Open a participant profile (`/showcase/participants/fic-01`). Show the two sources (LinkedIn +
> Instagram) with coverage, and scroll the evidence-cited findings — each with an excerpt, timestamp,
> and explicit-vs-interpretation badge. (For the live-extraction path, show `/onboarding` pasting two
> URLs and the per-source progress.)

**0:50–1:15 — Analysis page**
> On the same profile, highlight hobbies, interests, professional background, conversation topics, and
> the **Unknowns** section — "relationship needs: not established from sources."

**1:15–2:05 — A running agent conversation**
> Open a date (`/showcase/dates/date-fic-01-fic-02`), press **Replay from start**, and let the
> transcript stream turn by turn. Point out the four stages, turn numbers, and per-message evidence
> refs. Open a second date to show breadth.

**2:05–2:40 — Completed pairs + rankings**
> Back to `/showcase` (300 completed pairs). Open a participant's rankings
> (`/showcase/participants/fic-01/rankings`): 24 ranked candidates, dimension breakdown, explanation,
> and uncertainty. Click **Open transcript** to jump from a ranking to its supporting date.

**2:40–3:00 — Site, repo, technical overview**
> Show the live site URL (once deployed), the public repo
> (https://github.com/firoz1860/pairpilot), and `/status` (providers, SSRF allowlist, run stats). Close
> on: "Compatibility is an explainable fit estimate — not a prediction of love."

## Recording checklist

- [ ] `npm run dev` (or the deployed URL) is up and responsive.
- [ ] Screen capture at 1080p; cursor visible; no personal tabs/notifications on screen.
- [ ] Say "fictional" and "simulation" out loud at least once in the first 20 seconds.
- [ ] Do not show any real person's data.
- [ ] Keep total length ≤ 3:00.
- [ ] Export and (if an authorized YouTube integration exists) upload; otherwise keep the file and share
      the link manually.

> Note: this environment has no screen recorder / ffmpeg / browser-automation available, so the video
> is recorded manually from this script. No fabricated video URL is provided.
