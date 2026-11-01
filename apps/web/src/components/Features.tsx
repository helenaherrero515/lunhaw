"use client";

import React, { useRef } from "react";
import { lunhawContent } from "@/content/lunhaw-content";
import { Compass, Footprints, Trees, BookOpen, Bookmark } from "lucide-react";

const featureIcons: Record<string, React.ReactNode> = {
  explore: <Compass className="w-6 h-6 text-primary" />,
  commute: <Footprints className="w-6 h-6 text-primary" />,
  "green-index": <Trees className="w-6 h-6 text-primary" />,
  libraries: <BookOpen className="w-6 h-6 text-primary" />,
  saved: <Bookmark className="w-6 h-6 text-primary" />,
};

export function Features() {
  const { features } = lunhawContent;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rx = -(y / (rect.height / 2)) * 6;
    const ry = (x / (rect.width / 2)) * 6;

    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  };

  return (
    <section className="features bg-surface py-20 md:py-28 border-y border-line" id="features">
      <div className="wrap flex flex-col gap-12">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-2xl">
          <span className="eyebrow">{features.eyebrow}</span>
          <h2 className="h2 text-fg">{features.title}</h2>
          <p className="lead">{features.lead}</p>
        </div>

        {/* Feature Cards Grid (3 cards top, 2 cards bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.items.map((feat) => (
            <div
              key={feat.id}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="card-lunhaw tilt flex flex-col justify-between gap-6 hover:border-primary/40 transition-transform duration-200 cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-mint/50 flex items-center justify-center">
                  {featureIcons[feat.id] ?? <Compass className="w-6 h-6 text-primary" />}
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-bg text-muted border border-line">
                  {feat.tag}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-fg">{feat.title}</h3>
                <p className="text-muted text-[15px] leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
