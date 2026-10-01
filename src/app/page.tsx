import Link from "next/link";
import { FictionBanner } from "@/components/ui";
import { getShowcase } from "@/showcase";

const STEPS = [
  { n: 1, title: "Two official links", body: "Paste your public LinkedIn and public Instagram — the only two sources." },
  { n: 2, title: "Source reading", body: "Each source is read separately into timestamped, cited evidence." },
  { n: 3, title: "Analysis page", body: "An evidence-backed profile: what's explicit, what's interpreted, what's unknown." },
  { n: 4, title: "Agent date", body: "Your agent and another run a staged, simulated conversation — grounded in sources." },
  { n: 5, title: "Rankings", body: "An explainable compatibility ranking you can trace back to transcripts and evidence." },
];

export default function LandingPage() {
  const { meta } = getShowcase();
  return (
    <div className="container-app py-12 sm:py-16">
      <section className="mx-auto max-w-3xl text-center">
        <span className="badge-fiction mb-4 inline-flex">Agent-mediated · evidence-first</span>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-navy sm:text-5xl">
          Dating, mediated by agents that actually read the{" "}
          <span className="text-coral">evidence</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-navy-muted">
          Each consenting adult gets an AI agent. It reads their own public profiles, builds a
          source-backed persona, runs clearly-labeled simulated dates with other agents, and produces
          an explainable compatibility ranking — never a guess about love or looks.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/onboarding" className="btn-primary w-full sm:w-auto">
            Create my agent
          </Link>
          <Link href="/showcase" className="btn-secondary w-full sm:w-auto">
            Open showcase →
          </Link>
        </div>
        <p className="mt-3 text-xs text-navy-soft">
          The showcase is a completed run of {meta.participantCount} fictional participants —{" "}
          {meta.completedPairs} dates, no login.
        </p>
      </section>

      <section aria-labelledby="flow" className="mt-16">
        <h2 id="flow" className="sr-only">
          How it works
        </h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-soft text-sm font-bold text-coral-dark">
                {s.n}
              </div>
              <h3 className="mt-3 text-base font-semibold text-navy">{s.title}</h3>
              <p className="mt-1 text-sm text-navy-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="boundaries" className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 id="boundaries" className="text-xl font-bold text-navy">
            Simulation boundaries
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-navy-muted">
            <li>
              <strong className="text-navy">Agents are simulations.</strong> They never message real
              people, never claim real dates happened, and never impersonate anyone.
            </li>
            <li>
              <strong className="text-navy">Consent is required.</strong> Public availability is not
              consent. Only consenting, adult, identity-confirmed participants are onboarded.
            </li>
            <li>
              <strong className="text-navy">No sensitive inference.</strong> Orientation, health,
              religion, ethnicity, politics, relationship status, appearance, and wealth are never
              inferred or used.
            </li>
            <li>
              <strong className="text-navy">Not a love score.</strong> Compatibility is an explainable
              fit estimate over sources. Missing information raises uncertainty, not incompatibility.
            </li>
          </ul>
        </div>
        <div className="flex flex-col justify-center gap-4">
          <FictionBanner />
          <Link href="/status" className="btn-ghost justify-start">
            View integration &amp; run status →
          </Link>
        </div>
      </section>
    </div>
  );
}
