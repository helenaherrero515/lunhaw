import React from "react";
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
import { LandingVisuals } from "@/components/LandingVisuals";

// Landing page — implements the "Lunhaw" landing design (Lunhaw-landingpage.html).
export default function HomePage() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <Ticker />
        <WhyLunhaw />
        <Journey />
        <Features />
        <GreenIndex />
        <FaqSection />
        <Libraries />
        <CtaSection />
      </main>
      <AuthDialog />
      <Footer />
      <LandingVisuals />
    </>
  );
}
