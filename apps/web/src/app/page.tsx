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
import { Transparency } from "@/components/Transparency";
import { Libraries } from "@/components/Libraries";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { AuthDialog } from "@/components/AuthDialog";

export default function HomePage() {
  useEffect(() => {
    // Smooth scroll setup: Lenis synced to GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-bg selection:bg-lime selection:text-fg" id="top">
      {/* 1. Sticky Header with Pill Brand & Nav */}
      <Header />

      <main>
        {/* 2. Hero with 3D Metro Manila Map & Hopping Grasshopper */}
        <Hero />

        {/* 3. Ticker Marquee with 3 phrases */}
        <Ticker />

        {/* 4. About ("Why Lunhaw") & Stat Counters */}
        <WhyLunhaw />

        {/* 5. Pinned 3-Step Journey (Discover, Understand, Get there) */}
        <Journey />

        {/* 6. Features Grid (Explore, Commute, Green Index, Libraries, Saved) */}
        <Features />

        {/* 7. Interactive Green Index 3D Street & Tree Slider */}
        <GreenIndex />

        {/* 8. Transparency & Data Integrity (Verified / Estimate / Not available yet) */}
        <Transparency />

        {/* 9. Interactive 3D Libraries with Book Drop */}
        <Libraries />

        {/* 10. Final Call to Action Band */}
        <CtaSection />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* 12. Supabase Auth Dialog (Sign Up / Log In) */}
      <AuthDialog />
    </div>
  );
}
