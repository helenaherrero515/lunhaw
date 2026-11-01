"use client";

import React from "react";
import { lunhawContent } from "@/content/lunhaw-content";

export function FaqSection() {
  const { faq } = lunhawContent;

  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <div className="head" data-reveal>
          <span className="eyebrow">{faq.eyebrow}</span>
          <h2 className="h2">{faq.title}</h2>
        </div>
        <div className="faq-list" data-reveal>
          {faq.items.map((item, i) => (
            <details key={i} name="faq" open={i === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
