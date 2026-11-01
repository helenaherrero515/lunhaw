"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { WhyLunhaw } from "@/components/WhyLunhaw";
import { Journey } from "@/components/Journey";
import { Features } from "@/components/Features";
import { GreenIndex } from "@/components/GreenIndex";
import { FaqSection } from "@/components/FaqSection";
import { Libraries } from "@/components/Libraries";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { AuthDialog } from "@/components/AuthDialog";

export default function HomePage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Reading progress bar
    const barAnim = gsap.to("#bar", {
      width: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
      },
    });

    // Reveal animations for cards and headers
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 92%",
      once: true,
      onEnter: (els) => {
        gsap.from(els, {
          y: 46,
          scale: 0.96,
          duration: 0.9,
          ease: "back.out(1.5)",
          stagger: 0.09,
          overwrite: true,
        });
      },
    });

    // Smooth anchor scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest<HTMLAnchorElement>("a[data-scroll]");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const targetEl = document.querySelector(href);
          if (targetEl) {
            lenis.scrollTo(targetEl as HTMLElement, { offset: -20 });
          } else if (href === "#top") {
            lenis.scrollTo(0);
          }
        }
      }
    };
    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      barAnim.kill();
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      {/* Reading Progress Indicator */}
      <div className="progress" aria-hidden="true">
        <div className="bar" id="bar"></div>
      </div>

      <div id="top">
        {/* 1. Header (Pill with brand, about, create account) */}
        <Header />

        <main>
          {/* 2. Hero with illustrated background scene, diorama stage, and grasshopper */}
          <Hero />

          {/* 3. Ticker Marquee with 3 phrases and velocity acceleration */}
          <Ticker />

          {/* 4. Why Lunhaw Pinned Scroll Story */}
          <WhyLunhaw />

          {/* 5. One Journey Pinned Stage */}
          <Journey />

          {/* 6. Features Grid with 3D Card Tilt */}
          <Features />

          {/* 7. Interactive Green Index 3D Street & Tree Slider */}
          <GreenIndex />

          {/* 8. FAQs Accordion */}
          <FaqSection />

          {/* 9. Interactive 3D Libraries with Book Drop */}
          <Libraries />

          {/* 10. Call to Action Band */}
          <CtaSection />
        </main>

        {/* 11. Footer */}
        <Footer />

        {/* 12. Authentication Modal (Mobile Bottom Sheet) */}
        <AuthDialog />
      </div>
    </>
  );
}
