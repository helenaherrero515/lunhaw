"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) return;

    const cards = sectionRef.current.querySelectorAll<HTMLElement>(".tilt");
    const cleanupFns: Array<() => void> = [];

    cards.forEach((el) => {
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.4, ease: "power3" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.4, ease: "power3" });
      gsap.set(el, { transformPerspective: 800 });

      const onPointerMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 9);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 9);
      };

      const onPointerLeave = () => {
        rx(0);
        ry(0);
      };

      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerleave", onPointerLeave);

      cleanupFns.push(() => {
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerleave", onPointerLeave);
      });
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <section className="features" id="features" ref={sectionRef}>
      <div className="wrap">
        <div className="head" data-reveal>
          <h2 className="h2">Find a place. Reach it.</h2>
        </div>
        <div className="row">
          <article className="card wide c-forest tilt" data-reveal>
            <div className="ic">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 21v-6" />
                <path d="M12 3c3.5 2.5 5.5 5 5.5 8a5.5 5.5 0 0 1-11 0c0-3 2-5.5 5.5-8z" />
              </svg>
            </div>
            <h3>Explore</h3>
            <p className="tag">Find your green space.</p>
            <p>Parks, gardens and public facilities, on a map.</p>
          </article>
          <article className="card c-mint tilt" data-reveal>
            <div className="ic">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="6" cy="18" r="2.2" />
                <circle cx="18" cy="6" r="2.2" />
                <path d="M8 18h6.5a3.5 3.5 0 0 0 0-7H9.5a3.5 3.5 0 0 1 0-7H16" />
              </svg>
            </div>
            <h3>Commute</h3>
            <p className="tag">Find your way there.</p>
            <p>Walking and public transport routes, step by step.</p>
          </article>
        </div>
        <div className="row">
          <article className="card c-plain tilt" data-reveal>
            <div className="ic" style={{ background: "var(--lime)", color: "#26332D" }}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 20h16" />
                <path d="M7 20v-6M12 20V8M17 20v-9" />
              </svg>
            </div>
            <h3>Green Index</h3>
            <p className="tag">See your city in a greener light.</p>
            <p>Green space and shade, scored and explained.</p>
          </article>
          <article className="card c-lime tilt" data-reveal>
            <div className="ic">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
                <path d="M4 19.5A2 2 0 0 0 6 21.5h13" />
              </svg>
            </div>
            <h3>Libraries</h3>
            <p className="tag">Discover a place to pause.</p>
            <p>Libraries and reading centers, with study facilities.</p>
          </article>
          <article className="card c-plain tilt" data-reveal>
            <div className="ic">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 3h12v18l-6-4.5L6 21z" />
              </svg>
            </div>
            <h3>Saved</h3>
            <p className="tag">Explore your neighborhood.</p>
            <p>Keep the places you want to visit in one list.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
