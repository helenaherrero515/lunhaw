import React from "react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="cta" id="start">
      <div className="wrap">
        <div className="col">
          <h2>Discover your space. Explore your city. Go greener.</h2>
          <div className="cta-row">
            <Link className="btn onband" href="/home">
              Explore green spaces near you
            </Link>
            <a className="btn onband ghost" href="#top" data-scroll>
              Enter your area manually
            </a>
          </div>
        </div>
        <div className="mascot" id="cta-mascot" role="img" aria-label="Lunhaw grasshopper mascot"></div>
      </div>
    </section>
  );
}
