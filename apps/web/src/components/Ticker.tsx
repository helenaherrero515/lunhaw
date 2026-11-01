"use client";

import React from "react";
import { lunhawContent } from "@/content/lunhaw-content";

export function Ticker() {
  const { ticker } = lunhawContent;

  return (
    <div
      className="bg-[#245C43] text-white py-4 overflow-hidden border-y border-[#245C43]/80 select-none"
      aria-label="What Lunhaw helps you do"
    >
      <div className="ticker-track flex items-center gap-8 font-medium text-base tracking-wide whitespace-nowrap">
        {/* Set 1 */}
        {ticker.map((phrase, i) => (
          <React.Fragment key={`set1-${i}`}>
            <span className="flex items-center gap-4">
              <span>{phrase}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
            </span>
          </React.Fragment>
        ))}
        {/* Set 2 */}
        {ticker.map((phrase, i) => (
          <React.Fragment key={`set2-${i}`}>
            <span className="flex items-center gap-4">
              <span>{phrase}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
            </span>
          </React.Fragment>
        ))}
        {/* Set 3 */}
        {ticker.map((phrase, i) => (
          <React.Fragment key={`set3-${i}`}>
            <span className="flex items-center gap-4">
              <span>{phrase}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
            </span>
          </React.Fragment>
        ))}
        {/* Set 4 */}
        {ticker.map((phrase, i) => (
          <React.Fragment key={`set4-${i}`}>
            <span className="flex items-center gap-4">
              <span>{phrase}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
