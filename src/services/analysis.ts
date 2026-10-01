import { prisma } from "@/lib/prisma";
import { getSourceProvider } from "@/integrations/source";
import { getLlmProvider } from "@/integrations/llm";
import { logger } from "@/lib/logger";
import type { SourceDocument } from "@/integrations/source/types";

/**
 * Extraction + analysis for one participant. Reads each source via the
 * configured provider, persists evidence, and produces a schema-validated
 * analysis. A failed extraction is recorded honestly (status=failed) and never
 * replaced with fabricated content.
 */
export async function runExtractionAndAnalysis(participantId: string): Promise<void> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { sources: true },
  });
  if (!participant) throw new Error(`participant ${participantId} not found`);

  const provider = getSourceProvider();
  const docs: SourceDocument[] = [];

  for (const source of participant.sources) {
    await prisma.sourceProfile.update({ where: { id: source.id }, data: { status: "extracting" } });
    try {
      const doc = await provider.fetchProfile(source.canonicalUrl, source.platform);
      for (const s of doc.sections) {
        await prisma.evidenceItem.upsert({
          where: { sourceProfileId_stableId: { sourceProfileId: source.id, stableId: s.evidenceStableId } },
          create: {
            sourceProfileId: source.id,
            stableId: s.evidenceStableId,
            platform: source.platform,
            kind: s.kind,
            excerpt: s.text,
            sourceUrl: doc.canonicalUrl,
            extractedAt: new Date(doc.extractedAt),
          },
          update: { excerpt: s.text, extractedAt: new Date(doc.extractedAt) },
        });
      }
      for (const post of doc.postCaptions) {
        await prisma.evidenceItem.upsert({
          where: { sourceProfileId_stableId: { sourceProfileId: source.id, stableId: post.evidenceStableId } },
          create: {
            sourceProfileId: source.id,
            stableId: post.evidenceStableId,
            platform: source.platform,
            kind: "post_caption",
            excerpt: post.text,
            sourceUrl: doc.canonicalUrl,
            extractedAt: new Date(post.timestamp ?? doc.extractedAt),
          },
          update: { excerpt: post.text },
        });
      }
      await prisma.sourceProfile.update({
        where: { id: source.id },
        data: {
          status: doc.providerStatus === "ok" ? "complete" : "partial",
          lastExtractedAt: new Date(),
          coverageNote: doc.limitations.join("; ") || null,
        },
      });
      docs.push(doc);
    } catch (err) {
      logger.warn("extraction failed", { participantId, platform: source.platform });
      await prisma.sourceProfile.update({
        where: { id: source.id },
        data: { status: "failed", coverageNote: (err as Error).message },
      });
    }
  }

  if (docs.length === 0) {
    logger.warn("no sources extracted; leaving participant in onboarding", { participantId });
    return;
  }

  const llm = getLlmProvider();
  const last = await prisma.analysisVersion.findFirst({
    where: { participantId },
    orderBy: { version: "desc" },
  });
  const version = (last?.version ?? 0) + 1;
  const analysis = await llm.generateAnalysis({
    participantId,
    displayName: participant.displayName,
    analysisVersion: version,
    sources: docs,
  });

  await prisma.analysisVersion.create({
    data: {
      participantId,
      version,
      modelVersion: analysis.modelVersion,
      rubricVersion: analysis.rubricVersion,
      unknowns: analysis.unknowns,
      claims: {
        create: analysis.claims.map((c) => ({
          category: c.category,
          text: c.text,
          evidenceStableIds: c.evidenceIds,
          disposition: c.disposition,
          confidence: c.confidence,
          limitations: c.limitations ?? null,
          approvalStatus: "pending" as const,
        })),
      },
    },
  });
  await prisma.participant.update({ where: { id: participantId }, data: { status: "active" } });
}
