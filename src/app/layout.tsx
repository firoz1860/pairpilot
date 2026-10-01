import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/chrome";

export const metadata: Metadata = {
  title: {
    default: "PairPilot — agent-mediated dating, grounded in evidence",
    template: "%s · PairPilot",
  },
  description:
    "Each consenting adult gets an AI agent that reads their own public profiles, builds an evidence-backed persona, and runs clearly-labeled simulated dates to produce explainable compatibility rankings.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
