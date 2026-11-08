"use client";

import React from "react";
import Link from "next/link";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

/** Closing call to action: goes into the app when signed in, otherwise starts sign-up. */
export function CtaSection() {
  const { currentUser, openAuth } = useLunhawStore();

  return (
    <section className="cta" id="start">
      <div className="wrap">
        <div className="col">
          <h2>Discover your space. Explore your city. Go greener.</h2>
          <div className="cta-row">
            {currentUser ? (
              <>
                <Link className="btn onband" href="/home">
                  Explore green spaces near you
                </Link>
                <Link className="btn onband ghost" href="/home?area=1">
                  Enter your area manually
                </Link>
              </>
            ) : (
              <>
                <button className="btn onband" type="button" data-auth="signup" onClick={() => openAuth("signup")}>
                  Explore green spaces near you
                </button>
                <button className="btn onband ghost" type="button" data-auth="signup" onClick={() => openAuth("signup")}>
                  Enter your area manually
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mascot" id="cta-mascot" role="img" aria-label="Lunhaw grasshopper mascot"></div>
      </div>
    </section>
  );
}
