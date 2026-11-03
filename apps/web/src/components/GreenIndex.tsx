"use client";

import React from "react";

export function GreenIndex() {
  return (
    <section className="scene-sec" id="green">
      <div className="wrap">
        <div className="art" data-reveal>
          <canvas
            id="green-canvas"
            role="img"
            aria-label="Interactive 3D street. Plant more trees with the slider and see shade patches grow. Drag sideways to rotate."
          ></canvas>
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
              defaultValue="4"
              aria-describedby="trees-out"
            />
            <output id="trees-out" htmlFor="trees" aria-live="polite">
              4 of 12 trees planted. Illustration only.
            </output>
            <div className="seg">
              <button type="button" data-trees="2">
                Bare street
              </button>
              <button type="button" data-trees="7">
                Some shade
              </button>
              <button type="button" data-trees="12">
                Tree-lined
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
