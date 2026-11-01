"use client";

import React from "react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="cta" id="start">
      <div className="wrap">
        <div className="col">
          <h2>Discover your space. Explore your city. Go greener.</h2>
          <div className="cta-row">
            <Link className="btn onband" href="#top" data-scroll>
              Explore green spaces near you
            </Link>
            <Link className="btn onband ghost" href="#top" data-scroll>
              Enter your area manually
            </Link>
          </div>
        </div>
        <div
          className="mascot"
          id="cta-mascot"
          role="img"
          aria-label="Lunhaw grasshopper mascot"
        />
      </div>
    </section>
  );
}
