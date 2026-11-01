"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

const DynamicGreenIndexScene = dynamic(
  () => import("@/scenes/GreenIndexScene").then((m) => m.GreenIndexScene),
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

export function GreenIndex() {
  const { greenTreeCount, setGreenTreeCount } = useLunhawStore();

  return (
    <section className="scene-sec" id="green">
      <div className="wrap">
        <div className="art" data-reveal>
          <DynamicGreenIndexScene treeCount={greenTreeCount} />
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
          <span className="eyebrow">Green Index</span>
          <h2 className="h2">See what shade does to a street.</h2>
          <p className="lead">Shade changes how a walk feels.</p>
          <div className="ctl">
            <label htmlFor="trees">Street trees</label>
            <input
              id="trees"
              type="range"
              min="0"
              max="12"
              step="1"
              value={greenTreeCount}
              onChange={(e) => setGreenTreeCount(parseInt(e.target.value, 10))}
              aria-describedby="trees-out"
            />
            <output id="trees-out" htmlFor="trees" aria-live="polite">
              {greenTreeCount} of 12 trees planted. Illustration only.
            </output>
            <div className="seg">
              <button
                type="button"
                data-trees="2"
                onClick={() => setGreenTreeCount(2)}
              >
                Bare street
              </button>
              <button
                type="button"
                data-trees="7"
                onClick={() => setGreenTreeCount(7)}
              >
                Some shade
              </button>
              <button
                type="button"
                data-trees="12"
                onClick={() => setGreenTreeCount(12)}
              >
                Tree-lined
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
