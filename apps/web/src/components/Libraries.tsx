"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { lunhawContent } from "@/content/lunhaw-content";
import { LibrarySceneHandle } from "@/scenes/LibraryScene";
import { RotateCcw } from "lucide-react";

const DynamicLibraryScene = dynamic(
  () => import("@/scenes/LibraryScene").then((m) => m.LibraryScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-mint/20 rounded-[32px]">
        <span className="mascot-img w-16 h-16 bob" role="img" aria-label="Loading library" />
      </div>
    ),
  }
);

export function Libraries() {
  const { libraries } = lunhawContent;
  const sceneRef = useRef<LibrarySceneHandle>(null);

  const handleReplay = () => {
    if (sceneRef.current) {
      sceneRef.current.dropBooks();
    }
  };

  return (
    <section className="scene-sec bg-bg py-20 md:py-28 border-t border-line" id="libraries">
      <div className="wrap grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
        {/* Left: 3D Interactive Library Scene */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-surface rounded-[32px] p-4 shadow-xl border border-line flex items-center justify-center order-2 lg:order-1">
          <DynamicLibraryScene ref={sceneRef} />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted/80 bg-surface/80 px-3 py-1 rounded-full border border-line">
            {libraries.hint}
          </span>
        </div>

        {/* Right: Content & Replay Button */}
        <div className="flex flex-col gap-6 order-1 lg:order-2">
          <span className="eyebrow">{libraries.eyebrow}</span>
          <h2 className="h2 text-fg">{libraries.title}</h2>
          <p className="lead">{libraries.lead}</p>

          <div className="pt-2">
            <button
              type="button"
              id="replay"
              onClick={handleReplay}
              className="btn-lunhaw ghost sm flex items-center gap-2 hover:bg-mint/30"
            >
              <RotateCcw className="w-4 h-4 text-primary" />
              {libraries.replayBtn}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
