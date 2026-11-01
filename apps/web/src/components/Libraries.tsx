"use client";

import React from "react";

export function Libraries() {
  return (
    <section className="scene-sec rev" id="libraries">
      <div className="wrap">
        <div className="art" data-reveal>
          <canvas
            id="lib-canvas"
            role="img"
            aria-label="Interactive 3D library with books dropping onto stacks and a few floating around it. Drag sideways to rotate."
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
          <span className="eyebrow">Libraries</span>
          <h2 className="h2">As easy to find as a park.</h2>
          <p className="lead">Free places to study, in one directory.</p>
          <div className="seg">
            <button type="button" id="replay">
              Drop the books again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
