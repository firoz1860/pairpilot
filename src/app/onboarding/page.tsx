import type { Metadata } from "next";
import Link from "next/link";
import { databaseReady } from "@/lib/env";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Create your agent" };

export default function OnboardingPage() {
  const dbReady = databaseReady();
  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-navy">Create your agent</h1>
        <p className="mt-2 text-navy-muted">
          Give your two official public links. We read them separately into cited evidence, build a
          source-backed profile you review, then create a clearly-labeled agent for the simulation.
        </p>

        {!dbReady ? (
          <div
            role="note"
            className="mt-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-navy"
          >
            <strong>Integration status:</strong> no database is configured in this environment, so new
            onboarding can&apos;t be saved yet. The form below validates your input and will return an
            actionable message. The completed{" "}
            <Link href="/showcase" className="font-medium text-coral-dark underline">
              fictional showcase
            </Link>{" "}
            works with no database. See{" "}
            <Link href="/status" className="font-medium text-coral-dark underline">
              /status
            </Link>
            .
          </div>
        ) : null}

        <div className="mt-6">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
