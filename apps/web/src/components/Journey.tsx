import React from "react";

export function Journey() {
  return (
    <section className="journey" id="journey" aria-label="From home to a public space">
      <div className="stage">
        <div className="stage-copy">
          <div className="inner">
            <span className="eyebrow">One journey</span>
            <h2 className="h2">Discover it. Understand it. Get there.</h2>
            <div className="panels" id="panels">
              <article className="panel on">
                <span className="n">1</span>
                <div>
                  <h3>Discover</h3>
                  <p>Find parks and libraries near you.</p>
                </div>
              </article>
              <article className="panel">
                <span className="n">2</span>
                <div>
                  <h3>Understand</h3>
                  <p>See what a place offers and how green it is.</p>
                </div>
              </article>
              <article className="panel">
                <span className="n">3</span>
                <div>
                  <h3>Get there</h3>
                  <p>Compare walking and public transport options.</p>
                </div>
              </article>
            </div>
            <div className="dots" aria-hidden="true">
              <i className="dot on"></i>
              <i className="dot"></i>
              <i className="dot"></i>
            </div>
          </div>
        </div>
        <div className="stage-art">
          <canvas
            id="journey-canvas"
            role="img"
            aria-label="3D scene: a grasshopper walks from an apartment past a bus stop and a park to a public library as the scene builds around it"
          ></canvas>
        </div>
      </div>
    </section>
  );
}
