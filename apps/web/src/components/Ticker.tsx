"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Ticker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const track = trackRef.current;
    if (!track) return;

    // marquee speeds up with scroll velocity
    const mq = gsap.to(track, {
      xPercent: -50,
      duration: 38,
      ease: "none",
      repeat: -1,
    });

    let tween: gsap.core.Timeline | null = null;
    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = clamp(Math.abs(self.getVelocity()) / 350, 0, 8);
        if (tween) tween.kill();
        tween = gsap
          .timeline()
          .to(mq, { timeScale: 1 + v, duration: 0.15 })
          .to(mq, { timeScale: 1, duration: 0.9 });
      },
    });

    return () => {
      mq.kill();
      if (tween) tween.kill();
      st.kill();
    };
  }, []);

  return (
    <div className="ticker" aria-label="What Lunhaw helps you do">
      <div className="track" id="track" ref={trackRef}>
        <ul>
          <li>Find your green space</li>
          <li>Discover a place to pause</li>
          <li>Find your way there</li>
        </ul>
        <ul aria-hidden="true">
          <li>Find your green space</li>
          <li>Discover a place to pause</li>
          <li>Find your way there</li>
        </ul>
      </div>
    </div>
  );
}
