"use client";

import React from "react";
import {
  Footprints,
  Train,
  Bus,
  ArrowRightLeft,
  Navigation,
  TreePine,
  Clock,
  MapPin,
} from "lucide-react";
import { VerificationBadge } from "@lunhaw/ui";
import type { RouteLeg, RouteLegMode } from "@/types/routing";

export interface RouteStepCardProps {
  leg: RouteLeg;
  isLast?: boolean;
  className?: string;
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

const MODE_CONFIG: Record<
  RouteLegMode,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  walk: {
    label: "Walk",
    icon: Footprints,
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-900",
    borderClass: "border-emerald-300",
  },
  jeepney: {
    label: "Jeepney",
    icon: Bus,
    bgClass: "bg-amber-50",
    textClass: "text-amber-900",
    borderClass: "border-amber-300",
  },
  bus: {
    label: "Bus",
    icon: Bus,
    bgClass: "bg-blue-50",
    textClass: "text-blue-900",
    borderClass: "border-blue-300",
  },
  rail: {
    label: "Rail Transit",
    icon: Train,
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-900",
    borderClass: "border-indigo-300",
  },
  transfer: {
    label: "Transfer",
    icon: ArrowRightLeft,
    bgClass: "bg-stone-50",
    textClass: "text-stone-800",
    borderClass: "border-stone-300",
  },
  board: {
    label: "Boarding",
    icon: Navigation,
    bgClass: "bg-stone-50",
    textClass: "text-stone-800",
    borderClass: "border-stone-300",
  },
  alight: {
    label: "Alighting",
    icon: MapPin,
    bgClass: "bg-stone-50",
    textClass: "text-stone-800",
    borderClass: "border-stone-300",
  },
};

export function RouteStepCard({ leg, isLast = false, className = "" }: RouteStepCardProps) {
  const modeConfig = MODE_CONFIG[leg.mode] || MODE_CONFIG.walk;
  const ModeIcon = modeConfig.icon;

  const isWalking = leg.mode === "walk" || leg.mode === "transfer";
  const shadePct = leg.shade_coverage_pct ?? 0;
  const isHighShade = shadePct >= 70;
  const isModerateShade = shadePct >= 40 && shadePct < 70;

  return (
    <div className={`relative flex gap-4 ${className}`}>
      {/* Timeline connector track */}
      <div className="flex flex-col items-center">
        {/* Step sequence badge */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold text-xs shadow-xs z-10 ${modeConfig.bgClass} ${modeConfig.textClass} ${modeConfig.borderClass}`}
        >
          {leg.sequence}
        </div>
        {!isLast && (
          <div className="w-0.5 grow bg-stone-200 my-1" aria-hidden="true" />
        )}
      </div>

      {/* Step details content */}
      <div className="flex-1 pb-6">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          {/* Header row: Mode label, transit line & fare */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${modeConfig.bgClass} ${modeConfig.textClass} ${modeConfig.borderClass}`}
              >
                <ModeIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{leg.transit_line || modeConfig.label}</span>
              </span>

              {isWalking && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    isHighShade
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : isModerateShade
                      ? "bg-lime-100 text-lime-900 border border-lime-300"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                  title="Tree canopy shade coverage calculated via EQ-002"
                >
                  <TreePine className="h-3 w-3 shrink-0" />
                  <span>{shadePct.toFixed(0)}% Shade</span>
                </span>
              )}
            </div>

            {/* Fare Tag & Tri-state Verification Badge (INV-001) */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-stone-800">
                {leg.fare.amount_php === 0 ? "Free Walk" : `₱${leg.fare.amount_php.toFixed(2)}`}
              </span>
              <VerificationBadge
                status={leg.fare.verification.status}
                sourceName={leg.fare.verification.official_source}
                derivationNote={leg.fare.verification.derivation_note}
                lastVerifiedAt={leg.fare.verification.last_verified_at}
              />
            </div>
          </div>

          {/* Main instruction */}
          <div className="mt-2.5">
            <p className="text-sm font-semibold text-stone-900 leading-snug">
              {leg.instruction}
            </p>

            {/* Boarding / Alighting nodes if transit */}
            {(leg.from_name || leg.to_name) && (
              <div className="mt-2 flex flex-col gap-1 text-xs text-stone-600 bg-stone-50 rounded-lg p-2 border border-stone-200/70">
                {leg.from_name && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-500 uppercase text-[10px]">From:</span>
                    <span className="font-medium text-stone-800">{leg.from_name}</span>
                  </div>
                )}
                {leg.to_name && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-500 uppercase text-[10px]">To:</span>
                    <span className="font-medium text-stone-800">{leg.to_name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer metrics: distance and duration */}
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-3">
              <span>{formatDistance(leg.distance_m)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(leg.duration_seconds)}
              </span>
            </div>

            {/* Verification of leg shade/geometry */}
            {leg.verification && (
              <span className="text-[11px] text-stone-400 italic">
                {leg.verification.derivation_note ? "EQ-002 Derived" : "Verified"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
