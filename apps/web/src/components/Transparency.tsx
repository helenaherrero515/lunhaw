"use client";

import React from "react";
import { lunhawContent } from "@/content/lunhaw-content";
import { CheckCircle2, AlertCircle, HelpCircle, AlertTriangle } from "lucide-react";

export function Transparency() {
  const { transparency } = lunhawContent;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case "ESTIMATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
            <AlertCircle className="w-3.5 h-3.5" />
            Estimate
          </span>
        );
      case "NOT_AVAILABLE":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
            <HelpCircle className="w-3.5 h-3.5" />
            Not available yet
          </span>
        );
    }
  };

  return (
    <section className="trans bg-surface py-20 md:py-28" id="transparency">
      <div className="wrap flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-2xl">
          <span className="eyebrow">{transparency.eyebrow}</span>
          <h2 className="h2 text-fg">{transparency.title}</h2>
          <p className="lead">{transparency.lead}</p>
        </div>

        {/* 3 Integrity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {transparency.cards.map((card) => (
            <div
              key={card.id}
              className="card-lunhaw tilt flex flex-col justify-between gap-6 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(card.status)}
                </div>
                <h3 className="text-xl font-bold text-fg">{card.label}</h3>
                <p className="text-muted text-[15px] leading-relaxed">{card.desc}</p>
              </div>
              <div className="text-xs text-muted/80 pt-3 border-t border-line/60 font-medium">
                {card.badge}
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory Advisory Disclaimer Banner (INV-002) */}
        <div className="rounded-2xl bg-amber-bg border border-amber-line/40 p-4 sm:p-5 flex items-start gap-4 text-amber-fg">
          <AlertTriangle className="w-5 h-5 flex-none mt-0.5 text-amber-line" />
          <div className="text-sm md:text-[15px] leading-relaxed">
            <strong className="font-semibold">Facility Schedule Advisory:</strong>{" "}
            {transparency.disclaimer}
          </div>
        </div>
      </div>
    </section>
  );
}
