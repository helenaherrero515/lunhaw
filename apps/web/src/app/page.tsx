"use client";

import React, { useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { WhyLunhaw } from "@/components/WhyLunhaw";
import { Journey } from "@/components/Journey";
import { Features } from "@/components/Features";
import { GreenIndex } from "@/components/GreenIndex";
import { FaqSection } from "@/components/FaqSection";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { AuthDialog } from "@/components/AuthDialog";
import { SavedItemsDrawer } from "@/components/saved/SavedItemsDrawer";
import { initLunhawVisuals } from "@/lib/lunhaw-landing";


export default function HomePage() {
  useEffect(() => {
    // Initialize the exact Three.js 3D diorama engines and GSAP scroll animations
    initLunhawVisuals();
  }, []);

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div className="progress" aria-hidden="true">
        <div className="bar" id="bar"></div>
      </div>

      <div id="top">
        {/* Floating Pill Nav Header */}
        <Header />

        <main>
          {/* 3D Metro Manila Map & Hopping Grasshopper */}
          <Hero />

          {/* Marquee Ticker with Velocity Acceleration */}
          <Ticker />

          {/* Pinned Scroll Story: Word Pop & Hopping Mascot */}
          <WhyLunhaw />

          {/* Pinned Isometric Journey Stage */}
          <Journey />

          {/* Features Grid with 3D Card Tilt */}
          <Features />

          {/* Interactive 3D Street & Dynamic Tree Slider */}
          <GreenIndex />

          {/* FAQ Accordion */}
          <FaqSection />

          {/* Curtain Reveal Container for CTA & Footer */}
          <div className="rv">
            {/* Final Call to Action */}
            <CtaSection />

            {/* Footer */}
            <Footer />
          </div>
        </main>
        <AuthDialog />

        {/* Saved Places & Trips Slide-over Drawer (C-M3-02 / F-005) */}
        <SavedItemsDrawer />
      </div>
    </>
  );
}
