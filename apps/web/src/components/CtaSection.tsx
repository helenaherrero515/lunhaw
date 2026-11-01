"use client";

import React from "react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="cta" id="start">
      {/* Left Falling Leaves Flank (strictly contained to margin so leaves never overlap text) */}
      <div className="cta-leaves-flank cta-leaves-left" aria-hidden="true">
        <svg className="cta-leaf leaf-1" viewBox="0 0 40 40">
          <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#98D746" />
          <path d="M8 32L26 14" stroke="#1B4D36" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-2" viewBox="0 0 36 48">
          <path d="M18 4C9 14 6 26 18 44c12-18 9-30 0-40z" fill="#B7F9ED" />
          <path d="M18 8v32" stroke="#245C43" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-3" viewBox="0 0 40 40">
          <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#6B9B72" />
          <path d="M8 32L26 14" stroke="#0E1A15" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-4" viewBox="0 0 40 40">
          <path d="M34 6C34 24 22 34 6 34c0-18 10-28 28-28z" fill="#98D746" />
          <path d="M32 8L14 26" stroke="#1B4D36" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-5" viewBox="0 0 36 48">
          <path d="M18 4C9 14 6 26 18 44c12-18 9-30 0-40z" fill="#8FD9A6" />
          <path d="M18 8v32" stroke="#245C43" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-6" viewBox="0 0 40 40">
          <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#B7F9ED" />
          <path d="M8 32L26 14" stroke="#245C43" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Centered CTA Content */}
      <div className="wrap">
        <div className="col">
          <h2>Every Filipino deserves more green spaces and places to learn.</h2>
          <div className="cta-row">
            <Link className="btn onband" href="#top" data-scroll>
              Explore Lunhaw
            </Link>
          </div>
        </div>
      </div>

      {/* Right Falling Leaves Flank (strictly contained to margin so leaves never overlap text) */}
      <div className="cta-leaves-flank cta-leaves-right" aria-hidden="true">
        <svg className="cta-leaf leaf-7" viewBox="0 0 40 40">
          <path d="M34 6C34 24 22 34 6 34c0-18 10-28 28-28z" fill="#98D746" />
          <path d="M32 8L14 26" stroke="#1B4D36" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-8" viewBox="0 0 36 48">
          <path d="M18 4C9 14 6 26 18 44c12-18 9-30 0-40z" fill="#B7F9ED" />
          <path d="M18 8v32" stroke="#245C43" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-9" viewBox="0 0 40 40">
          <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#8FD9A6" />
          <path d="M8 32L26 14" stroke="#1B4D36" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-10" viewBox="0 0 40 40">
          <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#6B9B72" />
          <path d="M8 32L26 14" stroke="#0E1A15" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-11" viewBox="0 0 36 48">
          <path d="M18 4C9 14 6 26 18 44c12-18 9-30 0-40z" fill="#98D746" />
          <path d="M18 8v32" stroke="#1B4D36" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="cta-leaf leaf-12" viewBox="0 0 40 40">
          <path d="M34 6C34 24 22 34 6 34c0-18 10-28 28-28z" fill="#8FD9A6" />
          <path d="M32 8L14 26" stroke="#245C43" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
