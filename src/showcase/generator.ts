/**
 * Builds a ShowcaseParticipant from a fictional seed: canonical (demo) source
 * links, evidence items, and evidence-backed claims. Every claim cites a real
 * evidence stableId; relationship needs are deliberately left in `unknowns`
 * because lifestyle/professional sources cannot establish them. Sensitive
 * content is filtered out via the domain safety gate.
 */

import { normalizeProfileUrl } from "@/domain/url";
import { filterClaims } from "@/domain/sensitive";
import type { Claim } from "@/domain/analysis-schema";
import type { FictionalSeed } from "./fictional-participants";
import type { ShowcaseClaim, ShowcaseEvidence, ShowcaseParticipant, ShowcaseSource } from "./types";

export const EXTRACTED_AT = "2026-09-15T10:00:00.000Z";
export const GENERATED_AT = "2026-09-20T12:00:00.000Z";
export const MODEL_VERSION = "fixture-sim-1.0.0";
export const RUBRIC_VERSION = "1.0.0";

const PARTIAL_INDEXES = new Set([6, 13, 20]); // demonstrate partial Instagram coverage

function slug(seed: FictionalSeed): string {
  return `${seed.firstName}-${seed.lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function participantId(index: number): string {
  return `fic-${String(index + 1).padStart(2, "0")}`;
}

export function buildParticipant(seed: FictionalSeed, index: number): ShowcaseParticipant {
  const id = participantId(index);
  const name = `${seed.firstName} ${seed.lastName}`;
  const s = slug(seed);
  const liHandle = `pairpilot-demo-${s}`;
  const igHandle = `pairpilot.demo.${s.replace(/-/g, ".")}`;
  const linkedin = normalizeProfileUrl(`https://www.linkedin.com/in/${liHandle}`);
  const instagram = normalizeProfileUrl(`https://www.instagram.com/${igHandle}`);
  const isPartial = PARTIAL_INDEXES.has(index);
  const tags = seed.tags;

  const eid = {
    liHeadline: `${id}-li-headline`,
    liAbout: `${id}-li-about`,
    liExp: `${id}-li-exp`,
    igBio: `${id}-ig-bio`,
    igCap1: `${id}-ig-cap1`,
    igCap2: `${id}-ig-cap2`,
  };

  const evidence: ShowcaseEvidence[] = [
    {
      stableId: eid.liHeadline,
      platform: "linkedin",
      kind: "profile_headline",
      excerpt: `${seed.profession} based in ${seed.city}.`,
      sourceUrl: linkedin.canonicalUrl,
      extractedAt: EXTRACTED_AT,
    },
    {
      stableId: eid.liAbout,
      platform: "linkedin",
      kind: "profile_section",
      excerpt: `Outside work I'm into ${tags[0]}${tags[1] ? ` and ${tags[1]}` : ""}.`,
      sourceUrl: linkedin.canonicalUrl,
      extractedAt: EXTRACTED_AT,
    },
    {
      stableId: eid.liExp,
      platform: "linkedin",
      kind: "experience",
      excerpt: `Experience: works as a ${seed.profession}.`,
      sourceUrl: linkedin.canonicalUrl,
      extractedAt: EXTRACTED_AT,
    },
    {
      stableId: eid.igBio,
      platform: "instagram",
      kind: "profile_bio",
      excerpt: `${tags[1] ?? tags[0]} enthusiast. Also into ${tags[2] ?? tags[0]}.`,
      sourceUrl: instagram.canonicalUrl,
      extractedAt: EXTRACTED_AT,
    },
    {
      stableId: eid.igCap1,
      platform: "instagram",
      kind: "post_caption",
      excerpt: `Good day out — ${tags[0]} again.`,
      sourceUrl: instagram.canonicalUrl,
      extractedAt: EXTRACTED_AT,
    },
    // The second caption is only available when Instagram coverage is full.
    ...(isPartial
      ? []
      : [
          {
            stableId: eid.igCap2,
            platform: "instagram" as const,
            kind: "post_caption" as const,
            excerpt: `More ${tags[2] ?? tags[1] ?? tags[0]} this month.`,
            sourceUrl: instagram.canonicalUrl,
            extractedAt: EXTRACTED_AT,
          },
        ]),
  ];

  const tagEvidenceId = (i: number): string => {
    if (i === 0) return eid.liAbout;
    if (i === 1) return eid.igBio;
    return isPartial ? eid.igBio : eid.igCap2;
  };

  const interests = tags.map((label, i) => ({ label, evidenceId: tagEvidenceId(i) }));
  const conversationTopics = tags.slice(0, 2).map((label, i) => ({
    label,
    evidenceId: tagEvidenceId(i),
  }));

  const rawClaims: Claim[] = [
    {
      id: `${id}-c-intro`,
      category: "introduction",
      text: `${name} is a ${seed.profession} based in ${seed.city}.`,
      evidenceIds: [eid.liHeadline],
      disposition: "explicit",
      confidence: 0.95,
    },
    {
      id: `${id}-c-prof`,
      category: "professional_background",
      text: `Works as a ${seed.profession}.`,
      evidenceIds: [eid.liHeadline, eid.liExp],
      disposition: "explicit",
      confidence: 0.92,
    },
    ...tags.map((tag, i) => ({
      id: `${id}-c-int-${i}`,
      category: (i === 0 ? "hobby" : "interest") as Claim["category"],
      text: `Enjoys ${tag} (explicitly stated in sources).`,
      evidenceIds: [tagEvidenceId(i)],
      disposition: "explicit" as const,
      confidence: 0.85,
    })),
    {
      id: `${id}-c-life`,
      category: "lifestyle_activity",
      text: `Shares ${tags[0]} activity publicly on Instagram.`,
      evidenceIds: [eid.igCap1],
      disposition: "explicit",
      confidence: 0.7,
    },
    {
      id: `${id}-c-topic`,
      category: "conversation_topic",
      text: `Likely open to talking about ${tags[0]}${tags[1] ? ` and ${tags[1]}` : ""}.`,
      evidenceIds: [eid.liAbout],
      disposition: "tentative_interpretation",
      confidence: 0.6,
      limitations: "Interpreted from explicitly stated interests; not a stated preference.",
    },
  ];

  // Safety gate: drop anything that reads as a sensitive inference.
  const { accepted } = filterClaims(rawClaims);
  const claims: ShowcaseClaim[] = accepted.map((c) => ({
    id: c.id,
    category: c.category,
    text: c.text,
    evidenceStableIds: c.evidenceIds,
    disposition: c.disposition,
    confidence: c.confidence,
    ...(c.limitations ? { limitations: c.limitations } : {}),
  }));

  const sources: ShowcaseSource[] = [
    {
      platform: "linkedin",
      canonicalUrl: linkedin.canonicalUrl,
      handle: linkedin.handle,
      status: "complete",
      coverage: "full",
      extractedAt: EXTRACTED_AT,
    },
    {
      platform: "instagram",
      canonicalUrl: instagram.canonicalUrl,
      handle: instagram.handle,
      status: isPartial ? "partial" : "complete",
      coverage: isPartial ? "partial" : "full",
      extractedAt: EXTRACTED_AT,
      ...(isPartial
        ? { note: "Only a subset of public posts was available; coverage is partial." }
        : {}),
    },
  ];

  const unknowns = [
    "Relationship needs and dating preferences are not established from the available sources.",
    ...(isPartial ? ["Instagram coverage is partial — some public posts were not available."] : []),
  ];

  return {
    id,
    displayName: name,
    headline: `${seed.profession} · ${seed.city}`,
    city: seed.city,
    profession: seed.profession,
    isFictional: true,
    sources,
    evidence,
    claims,
    unknowns,
    interests,
    conversationTopics,
    relationshipNeedKnown: false,
    evidenceCoverageSelf: isPartial ? 0.65 : 1.0,
    analysis: {
      version: 1,
      modelVersion: MODEL_VERSION,
      rubricVersion: RUBRIC_VERSION,
      generatedAt: GENERATED_AT,
    },
  };
}
