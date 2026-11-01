"use client";

import React from "react";
import dynamic from "next/dynamic";
import { lunhawContent } from "@/content/lunhaw-content";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";
import { Trees, Sun, Thermometer } from "lucide-react";

const DynamicGreenIndexScene = dynamic(
  () => import("@/scenes/GreenIndexScene").then((m) => m.GreenIndexScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-mint/20 rounded-[32px]">
        <span className="mascot-img w-16 h-16 bob" role="img" aria-label="Loading street" />
      </div>
    ),
  }
);

export function GreenIndex() {
  const { greenIndex } = lunhawContent;
  const { greenTreeCount, setGreenTreeCount } = useLunhawStore();

  // Glass-box calculation approximations based on treeCount (0 to 12)
  const canopyPct = Math.round((greenTreeCount / 12) * 85);
  const score = Math.round(15 + (greenTreeCount / 12) * 78);
  const tempReduction = (greenTreeCount * 0.45).toFixed(1);

  return (
    <section className="scene-sec bg-bg py-20 md:py-28" id="green">
      <div className="wrap grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        {/* Left: 3D Street Viewer */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-surface rounded-[32px] p-4 shadow-xl border border-line flex items-center justify-center">
          <DynamicGreenIndexScene treeCount={greenTreeCount} />

          {/* Floating Metric Badges */}
          <div className="absolute top-4 left-4 bg-bg/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-line flex items-center gap-2 shadow-sm">
            <Trees className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted">Canopy Cover</span>
              <span className="text-sm font-bold text-fg">{canopyPct}%</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-bg/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-line flex items-center gap-2 shadow-sm">
            <Thermometer className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted">Microclimate</span>
              <span className="text-sm font-bold text-primary">-{tempReduction}°C Cooler</span>
            </div>
          </div>

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted/80 bg-surface/80 px-3 py-1 rounded-full border border-line">
            {greenIndex.hint}
          </span>
        </div>

        {/* Right: Interactive Controls & Copy */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">{greenIndex.eyebrow}</span>
            <h2 className="h2 text-fg">{greenIndex.title}</h2>
            <p className="lead">{greenIndex.lead}</p>
          </div>

          {/* Interactive Tree Slider */}
          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface border border-line shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-fg flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-line" />
                {greenIndex.sliderLabel}
              </span>
              <span className="font-bold text-primary text-base">
                {greenTreeCount} / 12 trees
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={greenTreeCount}
              onChange={(e) => setGreenTreeCount(parseInt(e.target.value, 10))}
              className="w-full accent-primary h-2 bg-line rounded-lg cursor-pointer"
              aria-label={greenIndex.sliderLabel}
            />

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2 pt-3">
              {greenIndex.presets.map((p) => {
                const isActive = greenTreeCount === p.count;
                return (
                  <button
                    key={p.count}
                    type="button"
                    onClick={() => setGreenTreeCount(p.count)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      isActive
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-bg text-muted hover:text-fg border-line"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Green Index Score Pill */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-mint/40 border border-primary/20">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-primary">
                Calculated Green Score
              </span>
              <span className="text-xs text-muted">
                Formula citations: EQ-001 &amp; EQ-002
              </span>
            </div>
            <div className="text-3xl font-bold font-display text-primary">
              {score} / 100
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
