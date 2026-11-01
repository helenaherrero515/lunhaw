"use client";

import React, { useEffect, useRef } from "react";
import { lunhawContent } from "@/content/lunhaw-content";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function WhyLunhaw() {
  const { why } = lunhawContent;
  const sectionRef = useRef<HTMLElement>(null);
  const statRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    statRefs.current.forEach((el, index) => {
      if (!el) return;
      const target = why.stats[index]?.target ?? 0;
      const counter = { val: 0 };

      gsap.to(counter, {
        val: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          el.innerText = Math.round(counter.val).toString();
        },
      });
    });
  }, [why.stats]);

  return (
    <section ref={sectionRef} className="why bg-bg py-20 md:py-24" id="about">
      <div className="wrap grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          <span className="eyebrow">{why.eyebrow}</span>
          <h2 className="h2 text-fg">{why.title}</h2>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          <p className="text-lg md:text-xl text-muted leading-relaxed">
            {why.paragraph}
          </p>
          <p className="text-xl md:text-2xl font-bold text-primary">
            {why.big}
          </p>

          {/* Stat Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-line">
            {why.stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-3xl md:text-4xl font-bold font-display text-primary flex items-baseline">
                  <span
                    ref={(el) => {
                      statRefs.current[i] = el;
                    }}
                    data-count={stat.target}
                  >
                    0
                  </span>
                  {stat.suffix && <span>{stat.suffix}</span>}
                </span>
                <span className="text-xs md:text-sm text-muted leading-snug">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
