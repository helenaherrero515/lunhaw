"use client";

import React, { useEffect, useRef } from "react";
import {
  X,
  Leaf,
  Layers,
  HelpCircle,
  ExternalLink,
  Info,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { VerificationBadge, type VerificationStatus } from "@lunhaw/ui";
import type { VerificationMeta } from "@/types/places";
import { computeGreenIndex } from "@/lib/methods/green-index";

export interface GlassBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName?: string;
  score?: number | null;
  canopyCoverPct?: number; // C (0-100)
  ndviDensityScaled?: number; // V (0-100)
  permeableSurfacePct?: number; // P (0-100)
  confidenceLevel?: "HIGH" | "MEDIUM" | "LOW";
  verification?: VerificationMeta;
  calculatedAt?: string;
  sourceNote?: string;
}

export function GlassBoxModal({
  isOpen,
  onClose,
  placeName,
  score,
  canopyCoverPct = 40.0,
  ndviDensityScaled = 50.0,
  permeableSurfacePct = 30.0,
  confidenceLevel = "MEDIUM",
  verification,
  calculatedAt,
  sourceNote,
}: GlassBoxModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Compute exact Glass-Box values via EQ-001 formula engine
  const calculation = computeGreenIndex(
    canopyCoverPct,
    ndviDensityScaled,
    permeableSurfacePct,
    confidenceLevel
  );

  const displayScore = score !== undefined && score !== null ? score : calculation.totalScore;

  // Handle ESC key press and trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Color Ramp mapping based on score
  const isHigh = displayScore >= 70;
  const isModerate = displayScore >= 40 && displayScore < 70;

  const scoreBadgeBg = isHigh
    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
    : isModerate
    ? "bg-lime-100 text-lime-900 border-lime-300"
    : "bg-amber-100 text-amber-900 border-amber-300";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="glassbox-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-stone-200 bg-[#F7F7F0] shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="glassbox-modal-title"
                className="text-base font-bold text-stone-900 sm:text-lg"
              >
                Glass-Box Green Index Breakdown
              </h2>
              <p className="text-xs text-stone-500">
                Formula Transparency & Environmental Data Traceability (EQ-001)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {placeName && (
            <div className="rounded-xl bg-white p-3.5 border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Target Facility
                </span>
                <p className="text-sm font-bold text-stone-800">{placeName}</p>
              </div>
              <VerificationBadge
                status={verification?.status || "ESTIMATE"}
                sourceName={verification?.official_source_name || "Copernicus Sentinel-2 & OSM"}
                derivationNote={verification?.derivation_note || "Calculated via EQ-001 Glass-Box model"}
              />
            </div>
          )}

          {/* Score Hero Summary */}
          <div className="rounded-2xl border border-emerald-800/10 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Computed Composite Score
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-stone-900 tracking-tight">
                    {displayScore.toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-stone-500">/ 100</span>
                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${scoreBadgeBg}`}
                  >
                    {isHigh ? "High Canopy & Greenery" : isModerate ? "Moderate Shade" : "Exposed / Sparse Greenery"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-stone-50 p-3 border border-stone-200/80 text-xs text-stone-600 font-mono">
                <span className="font-bold text-emerald-900">Score =</span> (0.50 × C) + (0.30 × V) + (0.20 × P)
              </div>
            </div>
          </div>

          {/* Sub-Metric Component Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Component Sub-Scores (Measured vs. Estimated)
            </h3>

            {/* 1. Canopy Coverage (C) - 50% */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-sm">
                      1. Tree Canopy Coverage ($C$)
                    </span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                      50% Weight
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                      Measured Data
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Proportion of civic boundary covered by aerial tree crown canopy.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-stone-900">
                    {canopyCoverPct.toFixed(1)}%
                  </span>
                  <div className="text-[11px] font-mono text-emerald-700">
                    +{calculation.breakdown.canopyComponent.toFixed(2)} pts
                  </div>
                </div>
              </div>

              {/* Progress meter */}
              <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, canopyCoverPct))}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                <span>Dataset: ESA Copernicus Sentinel-2 (DS-002)</span>
                <span>Multiplier: × 0.50</span>
              </div>
            </div>

            {/* 2. NDVI Vegetation Density (V) - 30% */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-sm">
                      2. NDVI Vegetation Density ($V$)
                    </span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                      30% Weight
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                      Measured Data
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Chlorophyll vitality derived from multispectral Red and Near-Infrared bands.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-stone-900">
                    {ndviDensityScaled.toFixed(1)} / 100
                  </span>
                  <div className="text-[11px] font-mono text-emerald-700">
                    +{calculation.breakdown.ndviComponent.toFixed(2)} pts
                  </div>
                </div>
              </div>

              {/* Progress meter */}
              <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-lime-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, ndviDensityScaled))}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                <span>Dataset: Sentinel-2 Multispectral Index (DS-002)</span>
                <span>Multiplier: × 0.30</span>
              </div>
            </div>

            {/* 3. Permeable Ground Surface (P) - 20% */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-sm">
                      3. Permeable Ground Ratio ($P$)
                    </span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                      20% Weight
                    </span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                      Algorithmic Estimate
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Ratio of unpaved soil, turf, or permeable pavers mitigating urban heat.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-stone-900">
                    {permeableSurfacePct.toFixed(1)}%
                  </span>
                  <div className="text-[11px] font-mono text-emerald-700">
                    +{calculation.breakdown.permeableComponent.toFixed(2)} pts
                  </div>
                </div>
              </div>

              {/* Progress meter */}
              <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, permeableSurfacePct))}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                <span>Dataset: OpenStreetMap Landuse Classification (DS-001)</span>
                <span>Multiplier: × 0.20</span>
              </div>
            </div>
          </div>

          {/* Glass-Box Ledger Traceability Card */}
          <div className="rounded-xl border border-stone-200/90 bg-stone-100/70 p-4 text-xs text-stone-600 space-y-2">
            <div className="flex items-center justify-between font-bold text-stone-800">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Invariant INV-001 Glass-Box Ledger
              </span>
              <span className="font-mono text-emerald-800">Confidence: {confidenceLevel}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-200/60">
              <div>
                <span className="font-semibold text-stone-700">Governing Equation:</span> EQ-001 (methods.md)
              </div>
              <div>
                <span className="font-semibold text-stone-700">Scientific Reference:</span> WHO Urban Green Space Guidelines
              </div>
              <div>
                <span className="font-semibold text-stone-700">Citations:</span> DS-001 (OSM), DS-002 (ESA Copernicus)
              </div>
              <div>
                <span className="font-semibold text-stone-700">Audit Status:</span> Public Domain / Open Access Verified
              </div>
            </div>
            {sourceNote && (
              <p className="pt-1 text-[11px] italic text-stone-500 border-t border-stone-200/40">
                Note: {sourceNote}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end border-t border-stone-200 bg-white px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
