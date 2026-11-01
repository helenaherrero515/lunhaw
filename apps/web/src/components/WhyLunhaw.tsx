"use client";

import React from "react";

export function WhyLunhaw() {
  return (
    <section className="why" id="about">
      <div className="story">
        <div className="story-in">
          <span className="eyebrow">Why Lunhaw</span>
          <h2 className="statement">The city is more than a place to pass through.</h2>
          <p className="sub">
            Parks, quiet corners and libraries are all around us, but hard to find.
          </p>
          <p className="payoff">
            Lunhaw brings them <span className="hl2">closer.</span>
          </p>
          <div className="ground" aria-hidden="true">
            <span
              className="why-hopper"
              role="img"
              aria-label="Grasshopper hopping across Metro Manila"
            />
          </div>
          <div className="deco" aria-hidden="true">
            <svg className="d1" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="#B7F9ED" opacity=".55" />
            </svg>
            <svg className="d2" viewBox="0 0 80 80">
              <path d="M40 8L72 72H8Z" fill="#98D746" opacity=".45" />
            </svg>
            <svg className="d3" viewBox="0 0 40 40">
              <rect width="36" height="36" rx="10" fill="#6B9B72" opacity=".4" />
            </svg>
            <svg className="d4" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" fill="#E4F7CE" opacity=".7" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
