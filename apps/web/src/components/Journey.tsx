"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { lunhawContent } from "@/content/lunhaw-content";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const DynamicJourneyScene = dynamic(
  () => import("@/scenes/JourneyScene").then((m) => m.JourneyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-mint/30 rounded-3xl">
        <span className="mascot-img w-16 h-16 bob" role="img" aria-label="Loading journey" />
      </div>
    ),
  }
);

export function Journey() {
  const { journey } = lunhawContent;
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const el = sectionRef.current;
    if (!el) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "+=1800",
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        setProgress(p);
        if (p < 0.33) setActiveStep(0);
        else if (p < 0.66) setActiveStep(1);
        else setActiveStep(2);
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="journey bg-mint/30 py-16 md:py-24 border-y border-line overflow-hidden min-h-screen flex items-center"
      id="journey"
      aria-label="From home to a public space"
    >
      <div className="wrap w-full flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-xl">
          <span className="eyebrow">{journey.eyebrow}</span>
          <h2 className="h2 text-fg">{journey.title}</h2>
          <p className="lead">{journey.lead}</p>
        </div>

        {/* Content & 3D Split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 items-center">
          {/* 3 Step Cards */}
          <div className="flex flex-col gap-4">
            {journey.steps.map((step, i) => {
              const isActive = activeStep === i;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(i)}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-surface shadow-xl border-primary scale-[1.02]"
                      : "bg-surface/60 border-line/70 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary font-display">
                      STEP {step.num}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-mint text-primary">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-fg mb-1">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 3D Scene Viewer */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-surface rounded-[32px] p-4 shadow-xl border border-line flex items-center justify-center">
            <DynamicJourneyScene progress={progress} />
            <div className="absolute top-4 right-4 bg-bg/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-primary border border-line">
              Active: {journey.steps[activeStep]?.title}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
