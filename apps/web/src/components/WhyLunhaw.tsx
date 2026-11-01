"use client";

import React, { useEffect, useRef } from "react";
import { lunhawContent } from "@/content/lunhaw-content";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function WhyLunhaw() {
  const { why, brand } = lunhawContent;
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const payoffRef = useRef<HTMLParagraphElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const hopperRef = useRef<HTMLSpanElement>(null);
  const decoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const sec = sectionRef.current;
    const h = headlineRef.current;
    const sub = subRef.current;
    const big = payoffRef.current;
    const hl = hlRef.current;
    const hop = hopperRef.current;
    const decos = decoContainerRef.current?.querySelectorAll("svg");

    if (!sec || !h || !sub || !big || !hl || !hop) return;

    // Split text into word spans
    const text = why.statement;
    h.setAttribute("aria-label", text);
    const wordsArray = text.split(/\s+/);
    h.innerHTML = wordsArray
      .map((w) => `<span class="w" aria-hidden="true">${w}</span>`)
      .join(" ");

    const words = h.querySelectorAll(".w");
    gsap.set(words, { opacity: 0.14 });
    gsap.set(hl, { "--sw": 0 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sec,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    tl.to(words, { opacity: 1, duration: 0.5, stagger: 0.35 }, 0.2)
      .from(sub, { y: 40, opacity: 0, duration: 1, ease: "power2.out" }, 3.9)
      .from(big, { y: 50, scale: 0.75, opacity: 0, duration: 1.1, ease: "back.out(1.8)" }, 5.1)
      .to(hl, { "--sw": 1, duration: 1 }, 6)
      .fromTo(
        hop,
        { x: -100 },
        {
          x: () => window.innerWidth / 2 - hop.offsetWidth / 2,
          duration: 7.2,
        },
        0
      )
      .to(
        hop,
        {
          keyframes: {
            y: [0, -70, 0, -70, 0, -70, 0, -70, 0, -70, 0],
            easeEach: "sine.inOut",
          },
          duration: 7.2,
          ease: "none",
        },
        0
      );

    if (decos && decos.length > 0) {
      const speeds = [-0.8, 0.5, -0.4, 0.9, -0.6, 0.3];
      decos.forEach((el, i) => {
        const s = speeds[i % speeds.length]!;
        tl.fromTo(
          el,
          { y: 160 * s, rotate: -12 * s },
          { y: -200 * s, rotate: 14 * s, duration: 7.2 },
          0
        );
      });
    }

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === sec) st.kill();
      });
    };
  }, [why.statement]);

  return (
    <section ref={sectionRef} className="why" id="about">
      <div className="story">
        {/* Floating Parallax Decorative SVGs */}
        <div ref={decoContainerRef} className="deco" aria-hidden="true">
          <svg
            style={{ left: "6%", top: "16%", width: "64px" }}
            viewBox="0 0 48 64"
          >
            <rect x="21" y="40" width="6" height="22" rx="3" fill="#7B5E45" />
            <circle cx="24" cy="24" r="20" fill="#2E7D4F" />
            <circle cx="31" cy="16" r="11" fill="#4FA56A" />
          </svg>
          <svg
            style={{ right: "8%", top: "12%", width: "46px" }}
            viewBox="0 0 40 40"
          >
            <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#98D746" />
            <path
              d="M8 32L26 14"
              stroke="#245C43"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <svg
            style={{ left: "12%", bottom: "24%", width: "58px" }}
            viewBox="0 0 48 40"
          >
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
          <svg
            style={{ right: "6%", bottom: "22%", width: "78px" }}
            viewBox="0 0 48 64"
          >
            <rect x="21" y="40" width="6" height="22" rx="3" fill="#7B5E45" />
            <circle cx="24" cy="24" r="20" fill="#2E7D4F" />
            <circle cx="31" cy="16" r="11" fill="#4FA56A" />
          </svg>
          <svg
            style={{ left: "30%", top: "8%", width: "34px" }}
            viewBox="0 0 40 40"
          >
            <path d="M6 34C6 16 18 6 34 6c0 18-10 28-28 28z" fill="#6B9B72" />
          </svg>
          <svg
            style={{ right: "24%", bottom: "12%", width: "40px" }}
            viewBox="0 0 40 40"
          >
            <circle cx="20" cy="20" r="14" fill="#98D746" />
            <circle cx="20" cy="20" r="6" fill="#B7F9ED" />
          </svg>
        </div>

        {/* Narrative In Pinned Container */}
        <div className="story-in">
          <span className="eyebrow">{why.eyebrow}</span>
          <h2 ref={headlineRef} className="statement">
            {why.statement}
          </h2>
          <p ref={subRef} className="sub">
            {why.sub}
          </p>
          <p ref={payoffRef} className="payoff">
            <span ref={hlRef} className="hl2">
              {why.payoff}
            </span>
          </p>
        </div>

        {/* Dotted Ground Line & Hopping Grasshopper */}
        <div className="ground" aria-hidden="true" />
        <span
          ref={hopperRef}
          className="mascot-img why-hopper"
          role="img"
          aria-label={brand.mascotAlt}
        />
      </div>
    </section>
  );
}
