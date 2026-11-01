"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { lunhawContent } from "@/content/lunhaw-content";
import { Leaf, ArrowRight, Compass } from "lucide-react";

// Dynamic lazy load of 3D Scene to maximize Lighthouse performance
const DynamicHeroScene = dynamic(
  () => import("@/scenes/HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-mint/20 rounded-[32px]">
        <div className="mascot-img w-20 h-20 bob" role="img" aria-label="Loading 3D map" />
      </div>
    ),
  }
);

export function Hero() {
  const { hero, brand } = lunhawContent;
  const [currentHopStop, setCurrentHopStop] = useState("Rizal Park");

  return (
    <section className="hero overflow-hidden pt-6 pb-14 md:pt-12 md:pb-20">
      <div className="wrap grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 md:gap-14 items-center">
        {/* Left Copy Column */}
        <div className="flex flex-col gap-6 md:gap-7 z-10">
          <span className="pill-badge bob">
            <Leaf className="w-4 h-4 text-primary" />
            {hero.pill}
          </span>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] leading-[1.08] text-fg tracking-tight">
            <span>{hero.titleLines[0]}</span> <br />
            <span>{hero.titleLines[1]}</span> <br />
            <span className="hl">{hero.titleLines[2]}</span>
          </h1>

          <p className="lead text-muted">{hero.lead}</p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="#start" className="btn-lunhaw">
              {hero.ctaExplore}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
            <Link href="#journey" className="btn-lunhaw ghost">
              {hero.ctaCompare}
            </Link>
          </div>
        </div>

        {/* Right Stage Mockup Column with 3D Scene */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-square max-h-[580px] rounded-[36px] bg-gradient-to-br from-[#C6F1D9] to-[#F3FBDD] p-3 sm:p-5 shadow-xl border border-line flex items-center justify-center">
          {/* 3D Canvas */}
          <DynamicHeroScene onStopChange={setCurrentHopStop} />

          {/* Floating UI Chips */}
          <div className="chip3d a left-3 sm:left-6 top-6 bob">
            <Compass className="w-4 h-4 text-primary" />
            <span>{hero.chips.study}</span>
          </div>

          <div className="chip3d right-3 sm:right-6 bottom-6 bob d2" aria-live="polite">
            <span className="w-2.5 h-2.5 rounded-full bg-lime animate-pulse" />
            <span className="font-semibold text-xs sm:text-sm text-primary">
              Hopping: {currentHopStop}
            </span>
          </div>

          {/* Fallback mascot badge in corner */}
          <div className="hidden sm:block absolute bottom-6 left-6 z-0 pointer-events-none opacity-40">
            <span className="mascot-img w-8 h-8 inline-block" role="img" aria-label={brand.mascotAlt} />
          </div>
        </div>
      </div>
    </section>
  );
}
