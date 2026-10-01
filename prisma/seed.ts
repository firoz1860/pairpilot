import { prisma } from "@/lib/prisma";
import { compileShowcase } from "@/showcase/compiler";
import { uniquePairs } from "@/domain/pairing";

/**
 * Seed the database with the 25 clearly-fictional showcase participants (profiles,
 * consent, sources, evidence, approved analyses, agents) plus a run with pending
 * date sessions. Run `npm run worker` afterwards to complete the dates + rankings.
 * The passwords are placeholders — these demo accounts are not meant for login.
 */
const PLACEHOLDER_HASH = "$2a$10$abcdefghijklmnopqrstuvDEMOonlyNotARealLoginxxxxxxx";

async function main(): Promise<void> {
  const showcase = compileShowcase();

  for (const p of showcase.participants) {
    await prisma.participant.upsert({
      where: { email: `${p.id}@demo.pairpilot.local` },
      update: {},
      create: {
        id: p.id,
        displayName: p.displayName,
        email: `${p.id}@demo.pairpilot.local`,
        passwordHash: PLACEHOLDER_HASH,
        isFictional: true,
        status: "active",
        headline: p.headline,
        city: p.city,
        consent: {
          create: {
            adultConfirmed: true,
            consentDatingSim: true,
            consentPublicShowcase: true,
            identityConfirmed: true,
            consentAt: new Date(),
          },
        },
        sources: {
          create: p.sources.map((s) => ({
            platform: s.platform,
            canonicalUrl: s.canonicalUrl,
            handle: s.handle,
            status: s.status === "partial" ? ("partial" as const) : ("complete" as const),
            coverageNote: s.note ?? null,
            lastExtractedAt: new Date(s.extractedAt),
          })),
        },
        agent: {
          create: {
            personaSummary: `Agent for ${p.displayName} (fictional simulation).`,
            conversationRules: [
              "Discuss only source-backed interests.",
              "Acknowledge unknowns; never invent memories or preferences.",
              "This is a simulation; never impersonate the real person.",
            ],
            readyAt: new Date(),
          },
        },
      },
    });

    const sources = await prisma.sourceProfile.findMany({ where: { participantId: p.id } });
    const byPlatform = new Map(sources.map((s) => [s.platform, s]));
    for (const e of p.evidence) {
      const src = byPlatform.get(e.platform);
      if (!src) continue;
      await prisma.evidenceItem.upsert({
        where: { sourceProfileId_stableId: { sourceProfileId: src.id, stableId: e.stableId } },
        update: {},
        create: {
          sourceProfileId: src.id,
          stableId: e.stableId,
          platform: e.platform,
          kind: e.kind,
          excerpt: e.excerpt,
          sourceUrl: e.sourceUrl,
          extractedAt: new Date(e.extractedAt),
        },
      });
    }

    await prisma.analysisVersion.upsert({
      where: { participantId_version: { participantId: p.id, version: p.analysis.version } },
      update: {},
      create: {
        participantId: p.id,
        version: p.analysis.version,
        modelVersion: p.analysis.modelVersion,
        rubricVersion: p.analysis.rubricVersion,
        unknowns: p.unknowns,
        claims: {
          create: p.claims.map((c) => ({
            category: c.category,
            text: c.text,
            evidenceStableIds: c.evidenceStableIds,
            disposition: c.disposition,
            confidence: c.confidence,
            limitations: c.limitations ?? null,
            approvalStatus: "approved" as const,
          })),
        },
      },
    });
  }

  const ids = showcase.participants.map((p) => p.id);
  const pairs = uniquePairs(ids);
  const run = await prisma.showcaseRun.create({
    data: {
      label: showcase.meta.label,
      kind: "fictional",
      participantCount: ids.length,
      totalPairs: pairs.length,
      status: "pending",
      rubricVersion: showcase.meta.rubricVersion,
      modelVersion: showcase.meta.modelVersion,
      isPublic: true,
    },
  });
  await prisma.dateSession.createMany({
    data: pairs.map((pair) => ({
      runId: run.id,
      participantAId: pair.a,
      participantBId: pair.b,
      pairKey: pair.key,
      scenario: "plan a low-key weekend activity together",
      totalTurns: 10,
      status: "pending" as const,
    })),
  });

  console.log(
    `Seeded ${ids.length} fictional participants and ${pairs.length} pending date sessions (run ${run.id}). ` +
      `Run the worker to complete dates + rankings.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
