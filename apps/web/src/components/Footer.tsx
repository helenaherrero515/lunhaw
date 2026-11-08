"use client";

import React, { useState } from "react";
import { subscribeToNewsletter } from "@/lib/api/client";
import { CONTACT_EMAIL } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const v = email.trim();
    if (!EMAIL_RE.test(v)) {
      setMsg("Please enter a valid email.");
      return;
    }
    setPending(true);
    setMsg("");
    try {
      await subscribeToNewsletter(v);
      setMsg("Thanks! We’ll keep you posted.");
      setEmail("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Couldn’t sign you up. Please try again later.");
    } finally {
      setPending(false);
    }
  };

  return (
    <footer>
      <div className="wrap">
        <div className="ft-grid">
          <div className="ft-brand">
            <div className="brand">
              <span className="mascot" role="img" aria-label="Lunhaw grasshopper mascot" />
              <span className="wordmark">LUNHAW</span>
            </div>
            <p className="tagline">Public spaces &amp; green mobility.</p>
            <div className="social">
              <a href={`mailto:${CONTACT_EMAIL}`} aria-label="Email Lunhaw">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M4 7.500l8 6 8-6" />
                </svg>
              </a>
            </div>
          </div>
          <div className="ft-col">
            <h4>Pages</h4>
            <a href="#top" data-scroll>
              Lunhaw
            </a>
            <a href="#about" data-scroll>
              About Us
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>Contact Us</a>
          </div>
          <div className="ft-col">
            <h4>Legal</h4>
            <a href="/privacy">Privacy Notice</a>
            <a href="/terms">Terms of Use</a>
          </div>
          <div className="ft-news">
            <div className="ft-col">
              <h4>Stay in the loop</h4>
            </div>
            <form className="signup" id="signup" noValidate onSubmit={handleSubmit}>
              <input
                type="email"
                id="signup-email"
                placeholder="Your email"
                aria-label="Your email"
                aria-describedby="signup-fine"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" aria-label="Subscribe" disabled={pending} aria-busy={pending}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
            <p className="signup-fine" id="signup-fine">
              By subscribing you agree to receive occasional emails about Lunhaw. Unsubscribe anytime by emailing us. See
              the <a href="/privacy">Privacy Notice</a>.
            </p>
            <p className="signup-msg" id="signup-msg" aria-live="polite">
              {msg}
            </p>
          </div>
        </div>
        <div className="ft-bottom">
          <span>© 2026 Lunhaw. Developed by HLN.</span>
          <span>Public spaces, made easier to find.</span>
        </div>
      </div>
    </footer>
  );
}
