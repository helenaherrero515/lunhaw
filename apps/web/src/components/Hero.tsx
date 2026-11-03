"use client";

import React from "react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero">
      <div className="scene" aria-hidden="true">
        <svg viewBox="0 0 1440 230" preserveAspectRatio="xMidYMax slice">
          <defs>
            <g id="tr">
              <rect x="-4" y="-24" width="8" height="30" fill="#7B5E45" />
              <circle cy="-42" r="24" fill="#2E7D4F" />
              <circle cx="9" cy="-52" r="15" fill="#4FA56A" />
            </g>
          </defs>
          <path
            d="M0 130Q160 40 330 120T640 110T980 100T1440 120V230H0Z"
            fill="#A8E6CB"
          />
          <path
            d="M0 150Q220 80 420 150T860 140T1440 150V230H0Z"
            fill="#8FD9A6"
          />
          <rect y="172" width="1440" height="58" fill="#79C24A" />
          <path
            d="M0 192Q500 172 900 196T1440 186V212H0Z"
            fill="#EAD9A9"
          />
          <rect y="208" width="1440" height="22" fill="#5E7F8A" />
          <rect y="205" width="1440" height="5" fill="#D5DACB" />
          <g transform="translate(90 82)">
            <path d="M-10 44L95 4L200 44Z" fill="#B7F9ED" />
            <rect y="44" width="190" height="80" fill="#fff" />
            <rect x="14" y="52" width="10" height="72" fill="#E3EAE0" />
            <rect x="54" y="52" width="10" height="72" fill="#E3EAE0" />
            <rect x="126" y="52" width="10" height="72" fill="#E3EAE0" />
            <rect x="166" y="52" width="10" height="72" fill="#E3EAE0" />
            <rect x="80" y="78" width="30" height="46" rx="4" fill="#245C43" />
            <rect x="62" y="58" width="66" height="12" rx="3" fill="#98D746" />
          </g>
          <g transform="translate(1190 60)">
            <rect width="110" height="146" fill="#fff" />
            <rect y="-8" width="110" height="10" fill="#6B9B72" />
            <g fill="#9FD8CF">
              <rect x="14" y="14" width="20" height="20" />
              <rect x="46" y="14" width="20" height="20" />
              <rect x="78" y="14" width="20" height="20" />
              <rect x="14" y="52" width="20" height="20" />
              <rect x="46" y="52" width="20" height="20" />
              <rect x="78" y="52" width="20" height="20" />
              <rect x="14" y="90" width="20" height="20" />
              <rect x="78" y="90" width="20" height="20" />
            </g>
          </g>
          <use href="#tr" transform="translate(340 192) scale(1.1)" />
          <use href="#tr" transform="translate(430 196)" />
          <use href="#tr" transform="translate(850 194) scale(1.2)" />
          <use href="#tr" transform="translate(1090 196)" />
          <use href="#tr" transform="translate(1360 194) scale(1.1)" />
          <rect x="1330" y="130" width="5" height="70" fill="#26332D" />
          <circle cx="1332" cy="128" r="8" fill="#FFF4B8" />
        </svg>
      </div>

      <div className="wrap">
        <div className="hero-copy">
          <h1 className="display" id="hero-title">
            <span className="ln">
              <span>Discover your space.</span>
            </span>
            <span className="ln">
              <span>Explore your city.</span>
            </span>
            <span className="ln">
              <span className="hl">Go greener.</span>
            </span>
          </h1>
          <p className="lead" id="hero-lead">
            Find parks and libraries near you, and how to get there.
          </p>
          <div className="cta-row" id="hero-cta">
            <Link className="btn" href="#explore" data-scroll>
              Explore green spaces near you
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link className="btn ghost" href="/explore">
              Compare ways to get there
            </Link>
          </div>
        </div>

        <div className="hero-stage">
          <canvas
            id="hero-canvas"
            role="img"
            aria-label="3D map of Metro Manila with a grasshopper hopping between parks and libraries"
          ></canvas>
          <div className="fb">
            <span
              className="mascot"
              role="img"
              aria-label="Lunhaw grasshopper mascot"
            />
          </div>
          <div className="chip3d a bob d2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
            Find a quiet place to study.
          </div>
          <div className="chip3d c bob d2" aria-live="off">
            <span id="hop-name">Hopping across Metro Manila</span>
          </div>
        </div>
      </div>
    </section>
  );
}
