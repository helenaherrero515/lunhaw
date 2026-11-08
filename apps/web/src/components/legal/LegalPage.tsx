import React from "react";
import Link from "next/link";

export const LEGAL_LAST_UPDATED = "8 November 2026";

/** Shared shell for the Privacy Notice and Terms of Use. */
export function LegalPage({
  title,
  intro,
  lastUpdated = LEGAL_LAST_UPDATED,
  children,
}: {
  title: string;
  intro: string;
  /** Each page can carry its own date when only that page changes. */
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal">
      <header className="legal-top">
        <div className="wrap">
          <Link className="brand" href="/" aria-label="Lunhaw home">
            <span className="mascot" role="img" aria-label="Lunhaw grasshopper mascot" />
            <span className="wordmark">LUNHAW</span>
          </Link>
          <Link className="legal-back" href="/">
            ← Back to Lunhaw
          </Link>
        </div>
      </header>
      <main className="wrap legal-body">
        <h1>{title}</h1>
        <p className="legal-meta">Last updated: {lastUpdated}</p>
        <p className="legal-intro">{intro}</p>
        {children}
        <nav className="legal-links" aria-label="Legal">
          <Link href="/privacy">Privacy Notice</Link>
          <Link href="/terms">Terms of Use</Link>
          <Link href="/">Home</Link>
        </nav>
      </main>
    </div>
  );
}
