-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('onboarding', 'active', 'withdrawn');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('linkedin', 'instagram');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('pending', 'extracting', 'partial', 'complete', 'failed', 'unavailable');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('profile_headline', 'profile_bio', 'profile_section', 'post_caption', 'experience', 'education');

-- CreateEnum
CREATE TYPE "ClaimCategory" AS ENUM ('introduction', 'hobby', 'interest', 'professional_background', 'lifestyle_activity', 'conversation_topic', 'relationship_need');

-- CreateEnum
CREATE TYPE "ClaimDisposition" AS ENUM ('explicit', 'tentative_interpretation');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- CreateEnum
CREATE TYPE "RunKind" AS ENUM ('fictional', 'real');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('pending', 'running', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "DateStatus" AS ENUM ('pending', 'running', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "DateStage" AS ENUM ('introduction', 'shared_interests', 'practical_scenario', 'reflection');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('requested', 'processing', 'completed');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isFictional" BOOLEAN NOT NULL DEFAULT false,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'onboarding',
    "headline" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityConsent" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "adultConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "consentDatingSim" BOOLEAN NOT NULL DEFAULT false,
    "consentPublicShowcase" BOOLEAN NOT NULL DEFAULT false,
    "identityConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EligibilityConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceProfile" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "status" "SourceStatus" NOT NULL DEFAULT 'pending',
    "coverageNote" TEXT,
    "lastExtractedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL,
    "sourceProfileId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "sourceProfileId" TEXT NOT NULL,
    "stableId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "excerpt" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisVersion" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unknowns" TEXT[],

    CONSTRAINT "AnalysisVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovedClaim" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "category" "ClaimCategory" NOT NULL,
    "text" TEXT NOT NULL,
    "evidenceStableIds" TEXT[],
    "disposition" "ClaimDisposition" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "limitations" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "ApprovedClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "personaSummary" TEXT NOT NULL,
    "conversationRules" TEXT[],
    "readyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowcaseRun" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "RunKind" NOT NULL DEFAULT 'fictional',
    "participantCount" INTEGER NOT NULL,
    "totalPairs" INTEGER NOT NULL,
    "completedPairs" INTEGER NOT NULL DEFAULT 0,
    "status" "RunStatus" NOT NULL DEFAULT 'pending',
    "rubricVersion" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ShowcaseRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateSession" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "pairKey" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "status" "DateStatus" NOT NULL DEFAULT 'pending',
    "totalTurns" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DateSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateMessage" (
    "id" TEXT NOT NULL,
    "dateSessionId" TEXT NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "stage" "DateStage" NOT NULL,
    "speakerParticipantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citedEvidenceIds" TEXT[],
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "dateSessionId" TEXT NOT NULL,
    "fromParticipantId" TEXT NOT NULL,
    "toParticipantId" TEXT NOT NULL,
    "sharedExplicitInterests" DOUBLE PRECISION NOT NULL,
    "conversationQuality" DOUBLE PRECISION NOT NULL,
    "scenarioAgreement" DOUBLE PRECISION NOT NULL,
    "complementaryInterests" DOUBLE PRECISION NOT NULL,
    "evidenceCoverage" DOUBLE PRECISION NOT NULL,
    "compatibility" DOUBLE PRECISION NOT NULL,
    "uncertainty" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "citedTurnIndexes" INTEGER[],
    "citedEvidenceIds" TEXT[],
    "rubricVersion" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingEntry" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "forParticipantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "compatibility" DOUBLE PRECISION NOT NULL,
    "evidenceCoverage" DOUBLE PRECISION NOT NULL,
    "uncertainty" DOUBLE PRECISION NOT NULL,
    "evaluationId" TEXT NOT NULL,

    CONSTRAINT "RankingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'requested',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE INDEX "Participant_status_idx" ON "Participant"("status");

-- CreateIndex
CREATE INDEX "Participant_isFictional_idx" ON "Participant"("isFictional");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityConsent_participantId_key" ON "EligibilityConsent"("participantId");

-- CreateIndex
CREATE INDEX "SourceProfile_status_idx" ON "SourceProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SourceProfile_participantId_platform_key" ON "SourceProfile"("participantId", "platform");

-- CreateIndex
CREATE INDEX "ExtractionJob_status_idx" ON "ExtractionJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceItem_sourceProfileId_stableId_key" ON "EvidenceItem"("sourceProfileId", "stableId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisVersion_participantId_version_key" ON "AnalysisVersion"("participantId", "version");

-- CreateIndex
CREATE INDEX "ApprovedClaim_analysisId_idx" ON "ApprovedClaim"("analysisId");

-- CreateIndex
CREATE INDEX "ApprovedClaim_approvalStatus_idx" ON "ApprovedClaim"("approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_participantId_key" ON "Agent"("participantId");

-- CreateIndex
CREATE INDEX "DateSession_status_idx" ON "DateSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DateSession_runId_pairKey_key" ON "DateSession"("runId", "pairKey");

-- CreateIndex
CREATE UNIQUE INDEX "DateMessage_dateSessionId_turnIndex_key" ON "DateMessage"("dateSessionId", "turnIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_dateSessionId_fromParticipantId_key" ON "Evaluation"("dateSessionId", "fromParticipantId");

-- CreateIndex
CREATE INDEX "RankingEntry_runId_forParticipantId_idx" ON "RankingEntry"("runId", "forParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingEntry_runId_forParticipantId_candidateId_key" ON "RankingEntry"("runId", "forParticipantId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "DeletionRequest_participantId_key" ON "DeletionRequest"("participantId");

-- AddForeignKey
ALTER TABLE "EligibilityConsent" ADD CONSTRAINT "EligibilityConsent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceProfile" ADD CONSTRAINT "SourceProfile_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_sourceProfileId_fkey" FOREIGN KEY ("sourceProfileId") REFERENCES "SourceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_sourceProfileId_fkey" FOREIGN KEY ("sourceProfileId") REFERENCES "SourceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisVersion" ADD CONSTRAINT "AnalysisVersion_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovedClaim" ADD CONSTRAINT "ApprovedClaim_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "AnalysisVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateSession" ADD CONSTRAINT "DateSession_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ShowcaseRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateMessage" ADD CONSTRAINT "DateMessage_dateSessionId_fkey" FOREIGN KEY ("dateSessionId") REFERENCES "DateSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_dateSessionId_fkey" FOREIGN KEY ("dateSessionId") REFERENCES "DateSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ShowcaseRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

