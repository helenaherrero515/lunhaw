"use client";

import React from "react";
import Link from "next/link";
import { lunhawContent } from "@/content/lunhaw-content";

export function CtaSection() {
  const { cta, brand } = lunhawContent;

  return (
    <section className="cta bg-[#245C43] text-white py-20 md:py-24" id="start">
      <div className="wrap grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center">
        {/* Call to action copy */}
        <div className="flex flex-col gap-8 max-w-xl">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight text-white tracking-wide">
            {cta.title}
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#top"
              className="btn-lunhaw onband font-semibold text-[15px]"
            >
              {cta.ctaExplore}
            </Link>
            <Link
              href="#top"
              className="btn-lunhaw onband ghost font-semibold text-[15px]"
            >
              {cta.ctaManual}
            </Link>
          </div>
        </div>

        {/* Mascot badge */}
        <div className="flex justify-center md:justify-end">
          <div
            className="mascot-img w-36 h-36 md:w-44 md:h-44 shadow-2xl border-4 border-white/20 bob"
            role="img"
            aria-label={brand.mascotAlt}
          />
        </div>
      </div>
    </section>
  );
}
