"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";

export function CtaSection() {
  const mascotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mascotRef.current) return;
    const anim = gsap.to(mascotRef.current, {
      y: -14,
      rotation: 3,
      duration: 2.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    return () => {
      anim.kill();
    };
  }, []);

  return (
    <section className="cta" id="start">
      <div className="wrap">
        <div className="col">
          <h2>Discover your space. Explore your city. Go greener.</h2>
          <div className="cta-row">
            <Link className="btn onband" href="#top" data-scroll>
              Explore green spaces near you
            </Link>
            <Link className="btn onband ghost" href="#top" data-scroll>
              Enter your area manually
            </Link>
          </div>
        </div>
        <div
          className="mascot"
          id="cta-mascot"
          ref={mascotRef}
          role="img"
          aria-label="Lunhaw grasshopper mascot"
        />
      </div>
    </section>
  );
}
