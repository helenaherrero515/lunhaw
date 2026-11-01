"use client";

import React, { useState } from "react";
import Link from "next/link";

export function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setMsg("Please enter a valid email.");
      return;
    }
    setMsg("Thanks! We will let you know when we launch.");
    setEmail("");
  };

  return (
    <footer>
      <div className="wrap">
        <div className="ft-grid">
          <div className="ft-brand">
            <div className="brand">
              <span
                className="mascot"
                role="img"
                aria-label="Lunhaw grasshopper mascot"
              />
              <span className="wordmark">LUNHAW</span>
            </div>
            <p className="tagline">Public spaces &amp; green mobility.</p>
            <div className="social">
              <a href="#" aria-label="Instagram">
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
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.600-1.500h1.500V4.400c-.3 0-1.200-.1-2.200-.1-2.300 0-3.900 1.400-3.900 4v2.200H8v3h2.500V21z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5 9h3.400v10H5zM6.700 4.300a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10.500 9h3.200v1.400c.5-.9 1.600-1.700 3.200-1.700 3.200 0 3.800 2.100 3.800 4.800V19h-3.400v-4.900c0-1.200 0-2.600-1.600-2.600s-1.800 1.200-1.800 2.500V19h-3.400z" />
                </svg>
              </a>
              <a href="#" aria-label="Email">
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
            <Link href="#top" data-scroll>
              Lunhaw
            </Link>
            <Link href="#about" data-scroll>
              About Us
            </Link>
            <a href="#">Blog</a>
            <a href="#">Contact Us</a>
          </div>
          <div className="ft-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
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
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" aria-label="Subscribe">
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
