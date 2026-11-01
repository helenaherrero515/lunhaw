"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        setProgress(p);
        if (p < 0.35) setActiveStep(0);
        else if (p < 0.7) setActiveStep(1);
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
      className="journey"
      id="journey"
      aria-label="From home to a public space"
    >
      <div className="stage">
        <div className="stage-copy">
          <div className="inner">
            <span className="eyebrow">One journey</span>
            <h2 className="h2">Discover it. Understand it. Get there.</h2>
            <div className="panels" id="panels">
              <article className={`panel ${activeStep === 0 ? "on" : ""}`}>
                <span className="n">1</span>
                <div>
                  <h3>Discover</h3>
                  <p>Find parks and libraries near you.</p>
                </div>
              </article>
              <article className={`panel ${activeStep === 1 ? "on" : ""}`}>
                <span className="n">2</span>
                <div>
                  <h3>Understand</h3>
                  <p>See what a place offers and how green it is.</p>
                </div>
              </article>
              <article className={`panel ${activeStep === 2 ? "on" : ""}`}>
                <span className="n">3</span>
                <div>
                  <h3>Get there</h3>
                  <p>Compare walking and public transport options.</p>
                </div>
              </article>
            </div>
            <div className="dots" aria-hidden="true">
              <i className={`dot ${activeStep === 0 ? "on" : ""}`} />
              <i className={`dot ${activeStep === 1 ? "on" : ""}`} />
              <i className={`dot ${activeStep === 2 ? "on" : ""}`} />
            </div>
          </div>
        </div>
        <div className="stage-art">
          <DynamicJourneyScene progress={progress} />
        </div>
      </div>
    </section>
  );
}
