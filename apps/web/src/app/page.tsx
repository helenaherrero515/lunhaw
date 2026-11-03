"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
import { SavedItemsDrawer } from "@/components/saved/SavedItemsDrawer";
import { initLunhawVisuals } from "@/lib/lunhaw-landing";

const ExploreView = dynamic(
  () => import("@/components/explore/ExploreView").then((mod) => mod.ExploreView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] w-full items-center justify-center bg-[#F4F1EA] text-stone-500">
        <span className="font-semibold animate-pulse">Loading Metro Manila Interactive Map & Havens...</span>
      </div>
    ),
  }
);

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

          {/* Interactive Discovery & Commute Map Section */}
          <section id="explore" className="relative w-full border-b border-stone-200/80 bg-[#F4F1EA] py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                    Interactive Map & Commute Planner
                  </span>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                    Discover Study Havens & Shaded Routes
                  </h2>
                  <p className="mt-1 text-sm text-stone-600 max-w-2xl">
                    Explore verified municipal libraries, barangay reading centers, and tree-shaded pedestrian corridors across all 17 Metro Manila LGUs.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-800 shadow-sm hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-950 transition-all"
                  >
                    Full Screen Map ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Interactive Explore Component */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="overflow-hidden rounded-2xl border border-stone-200/90 shadow-2xl">
                <ExploreView className="h-[700px]" />
              </div>
            </div>
          </section>

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

          {/* Interactive 3D Library & Physics Book Drop */}
          <Libraries />

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
