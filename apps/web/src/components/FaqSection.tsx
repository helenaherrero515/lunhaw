import React from "react";

export function FaqSection() {
  return (
    <section className="faq3" id="faqs">
      <div className="faq-pin">
        <div className="faq-art">
          <canvas
            id="faq-canvas"
            role="img"
            aria-label="3D question blocks orbiting as you scroll"
          ></canvas>
        </div>
        <div className="faq-list">
          <span className="eyebrow">FAQs</span>
          <h2 className="h2">Good to know.</h2>
          <details open>
            <summary>What is Lunhaw?</summary>
            <p>
              A guide to parks, gardens, libraries and reading centers in Metro
              Manila, and how to get there.
            </p>
          </details>
          <details>
            <summary>How do I get to a place?</summary>
            <p>Compare walking and public transport options, step by step.</p>
          </details>
          <details>
            <summary>What is the Green Index?</summary>
            <p>
              A score for the green space and shade around a place, with a note on
              how it was worked out.
            </p>
          </details>
          <details>
            <summary>Can I trust the details?</summary>
            <p>
              Every detail is labelled Verified, Estimate or Not available yet.
              We never invent routes, fares or opening hours.
            </p>
          </details>
          <details>
            <summary>How do I save places?</summary>
            <p>Create an account and add places to your Saved list.</p>
          </details>
        </div>
      </div>
    </section>
  );
}
