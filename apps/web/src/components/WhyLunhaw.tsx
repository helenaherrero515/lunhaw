"use client";

import React from "react";

export function WhyLunhaw() {
  return (
    <section className="why" id="about">
      <div className="why-bg" aria-hidden="true">
        <i className="orb o1"></i>
        <i className="orb o2"></i>
        <svg
          className="lf l1"
          style={{ left: "6%", top: "14%", width: "54px" }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6 6 4 12 8 18c4 3 10 0 12-6C20 8 16 4 12 2z" />
          <path
            d="M12 5c-1 5-2 9-4 13"
            fill="none"
            stroke="rgba(255,255,255,.55)"
            strokeWidth=".7"
          />
        </svg>
        <svg
          className="lf l2"
          style={{ left: "44%", top: "6%", width: "34px" }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6 6 4 12 8 18c4 3 10 0 12-6C20 8 16 4 12 2z" />
          <path
            d="M12 5c-1 5-2 9-4 13"
            fill="none"
            stroke="rgba(255,255,255,.55)"
            strokeWidth=".7"
          />
        </svg>
        <svg
          className="lf l3"
          style={{ right: "8%", top: "58%", width: "72px" }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6 6 4 12 8 18c4 3 10 0 12-6C20 8 16 4 12 2z" />
          <path
            d="M12 5c-1 5-2 9-4 13"
            fill="none"
            stroke="rgba(255,255,255,.55)"
            strokeWidth=".7"
          />
        </svg>
        <svg
          className="lf l4"
          style={{ left: "30%", bottom: "8%", width: "46px" }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6 6 4 12 8 18c4 3 10 0 12-6C20 8 16 4 12 2z" />
          <path
            d="M12 5c-1 5-2 9-4 13"
            fill="none"
            stroke="rgba(255,255,255,.55)"
            strokeWidth=".7"
          />
        </svg>
        <svg
          className="lf l5"
          style={{ right: "34%", bottom: "14%", width: "28px" }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6 6 4 12 8 18c4 3 10 0 12-6C20 8 16 4 12 2z" />
          <path
            d="M12 5c-1 5-2 9-4 13"
            fill="none"
            stroke="rgba(255,255,255,.55)"
            strokeWidth=".7"
          />
        </svg>
      </div>
      <div className="wrap">
        <div className="copy" data-reveal>
          <span className="eyebrow">Why Lunhaw</span>
          <h2 className="h2">The city is more than a place to pass through.</h2>
        </div>
        <div className="copy" data-reveal>
          <p>Parks, quiet corners and libraries are all around us, but hard to find.</p>
          <p className="big">
            <span className="sweep">Lunhaw brings them closer.</span>
          </p>
          <div className="why-pills">
            <span>Parks</span>
            <span>Quiet corners</span>
            <span>Libraries</span>
          </div>
        </div>
      </div>
    </section>
  );
}
