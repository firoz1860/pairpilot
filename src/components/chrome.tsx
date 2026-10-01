import Link from "next/link";

const NAV = [
  { href: "/showcase", label: "Showcase" },
  { href: "/showcase/participants", label: "Directory" },
  { href: "/status", label: "Status" },
  { href: "/login", label: "Log in" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-navy">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-sm text-white"
          >
            ✦
          </span>
          <span className="text-lg tracking-tight">PairPilot</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-navy-muted hover:bg-ivory-deep hover:text-navy sm:px-3"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/onboarding" className="btn-primary ml-1 hidden sm:inline-flex">
            Create my agent
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-ivory-deep/40">
      <div className="container-app flex flex-col gap-2 py-8 text-sm text-navy-muted">
        <p className="font-semibold text-navy">PairPilot — a dating simulation</p>
        <p className="max-w-2xl">
          Agents are clearly-labeled simulations. They do not message real people, do not claim real
          dates happened, and do not impersonate anyone. Compatibility is an explainable fit estimate,
          not a prediction of a relationship.
        </p>
        <p className="text-xs text-navy-soft">
          Only consenting adults are onboarded. Public availability is not consent.
        </p>
      </div>
    </footer>
  );
}
