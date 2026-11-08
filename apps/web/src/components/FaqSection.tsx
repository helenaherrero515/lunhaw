import React from "react";

const FAQS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "What is Lunhaw?",
    a: "A guide to parks, gardens, libraries and reading centers in Metro Manila, and how to get there.",
  },
  { q: "How do I get to a place?", a: "Compare walking and public transport options, step by step." },
  {
    q: "What is the Green Index?",
    a: "A score for the green space and shade around a place, with a note on how it was worked out.",
  },
  {
    q: "Can I trust the details?",
    a: "Every detail is labelled Verified, Estimate or Not available yet. We never invent routes, fares or opening hours.",
  },
  { q: "How do I save places?", a: "Create an account and add places to your Saved list." },
];

export function FaqSection() {
  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <div className="head" data-reveal>
          <span className="eyebrow">FAQs</span>
          <h2 className="h2">Good to know.</h2>
        </div>
        <div className="faq-list" data-reveal>
          {/* shared `name` makes this an exclusive accordion: opening one closes the others */}
          {FAQS.map(({ q, a }, i) => (
            <details key={q} name="faq" open={i === 0}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
