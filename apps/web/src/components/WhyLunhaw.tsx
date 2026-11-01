"use client";

import React from "react";

export function WhyLunhaw() {
  return (
    <section className="why" id="about">
      <div className="story">
        <div className="deco" aria-hidden="true">
          <svg style={{ left: "6%", top: "16%", width: "64px" }} viewBox="0 0 48 64">
            <rect x="21" y="40" width="6" height="22" rx="3" fill="#7B5E45" />
            <circle cx="24" cy="24" r="20" fill="#2E7D4F" />
            <circle cx="31" cy="16" r="11" fill="#4FA56A" />
          </svg>
          <svg style={{ right: "8%", top: "12%", width: "46px" }} viewBox="0 0 40 40">
            <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#98D746" />
            <path d="M8 32L26 14" stroke="#245C43" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg style={{ left: "12%", bottom: "24%", width: "58px" }} viewBox="0 0 48 40">
            <rect x="4" y="6" width="40" height="30" rx="5" fill="#B7F9ED" />
            <path d="M24 8v28" stroke="#245C43" strokeWidth="2" />
            <path
              d="M10 14h10M10 20h10M28 14h10M28 20h10"
              stroke="#245C43"
              strokeWidth="2"
              strokeLinecap="round"
              opacity=".6"
            />
          </svg>
          <svg style={{ right: "6%", bottom: "22%", width: "78px" }} viewBox="0 0 48 64">
            <rect x="21" y="40" width="6" height="22" rx="3" fill="#7B5E45" />
            <circle cx="24" cy="24" r="20" fill="#2E7D4F" />
            <circle cx="31" cy="16" r="11" fill="#4FA56A" />
          </svg>
          <svg style={{ left: "30%", top: "8%", width: "34px" }} viewBox="0 0 40 40">
            <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#6B9B72" />
          </svg>
          <svg style={{ right: "24%", bottom: "12%", width: "40px" }} viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="14" fill="#98D746" />
            <circle cx="20" cy="20" r="6" fill="#B7F9ED" />
          </svg>
        </div>
        <div className="story-in">
          <h2 className="statement">
            <span className="w">The</span>{" "}
            <span className="w">city</span>{" "}
            <span className="w">is</span>{" "}
            <span className="w">more</span>{" "}
            <span className="w">than</span>{" "}
            <span className="w">a</span>{" "}
            <span className="w">place</span>{" "}
            <span className="w">to</span>{" "}
            <span className="w">pass</span>{" "}
            <span className="w">through.</span>
          </h2>
        </div>
        <div className="ground" aria-hidden="true"></div>
        <span
          className="mascot why-hopper"
          role="img"
          aria-label="Lunhaw grasshopper mascot"
        ></span>
      </div>
    </section>
  );
}
