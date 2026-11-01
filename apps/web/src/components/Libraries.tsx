"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { LibrarySceneHandle } from "@/scenes/LibraryScene";

const DynamicLibraryScene = dynamic(
  () => import("@/scenes/LibraryScene").then((m) => m.LibraryScene),
  {
    ssr: false,
    loading: () => (
      <div className="fb">
        <span
          className="mascot"
          role="img"
          aria-label="Lunhaw grasshopper mascot"
        />
      </div>
    ),
  }
);

export function Libraries() {
  const sceneRef = useRef<LibrarySceneHandle>(null);

  const handleReplay = () => {
    if (sceneRef.current) {
      sceneRef.current.dropBooks();
    }
  };

  return (
    <section className="scene-sec rev" id="libraries">
      <div className="wrap">
        <div className="art" data-reveal>
          <DynamicLibraryScene ref={sceneRef} />
          <div className="fb">
            <span
              className="mascot"
              role="img"
              aria-label="Lunhaw grasshopper mascot"
            />
          </div>
          <span className="hint">Drag to rotate</span>
        </div>
        <div className="copy" data-reveal>
          <span className="eyebrow">Libraries</span>
          <h2 className="h2">As easy to find as a park.</h2>
          <p className="lead">Free places to study, in one directory.</p>
          <div className="seg">
            <button type="button" id="replay" onClick={handleReplay}>
              Drop the books again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
