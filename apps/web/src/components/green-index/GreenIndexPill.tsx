"use client";

import React, { useState } from "react";
import { Leaf } from "lucide-react";
import type { VerificationMeta } from "@/types/places";
import { GlassBoxModal } from "./GlassBoxModal";

export interface GreenIndexPillProps {
  score?: number | null;
  size?: "sm" | "md" | "lg";
  canopyCoverPct?: number;
  ndviDensityScaled?: number;
  permeableSurfacePct?: number;
  placeName?: string;
  verification?: VerificationMeta;
  showModalOnClick?: boolean;
  onOpenModal?: () => void;
  className?: string;
}

export function GreenIndexPill({
  score,
  size = "md",
  canopyCoverPct,
  ndviDensityScaled,
  permeableSurfacePct,
  placeName,
  verification,
  showModalOnClick = true,
  onOpenModal,
  className = "",
}: GreenIndexPillProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasValidScore = score !== undefined && score !== null && !isNaN(score) && score >= 0;
  const numScore = hasValidScore ? Math.min(100, Math.max(0, score)) : null;

  // Color Ramp according to Design System:
  // High (70-100): Forest Green
  // Moderate (40-69): Lime
  // Low (0-39): Amber
  // Unverified / Missing: Slate
  let colorClasses = "bg-stone-100 text-stone-600 border-stone-300";
  let labelText = "Not Available";

  if (numScore !== null) {
    if (numScore >= 70) {
      colorClasses = "bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200/80";
      labelText = "High Canopy & Greenery";
    } else if (numScore >= 40) {
      colorClasses = "bg-lime-100 text-lime-950 border-lime-300 hover:bg-lime-200/80";
      labelText = "Moderate Shade";
    } else {
      colorClasses = "bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200/80";
      labelText = "Low Shade / Exposed";
    }
  }

  // Size configurations
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs sm:text-sm gap-1.5",
    lg: "px-3.5 py-1.5 text-sm sm:text-base gap-2 font-bold",
  }[size];

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenModal) {
      onOpenModal();
    } else if (showModalOnClick && hasValidScore) {
      setIsModalOpen(true);
    }
  };

  const displayText = numScore !== null ? `${numScore.toFixed(0)} Green` : "Green N/A";
  const ariaLabel = numScore !== null
    ? `Green Index: ${numScore.toFixed(1)} out of 100 (${labelText}). Click to view glass-box formula breakdown.`
    : "Green Index score not available";

  const isClickable = showModalOnClick || !!onOpenModal;

  const content = (
    <span
      className={`inline-flex items-center rounded-full font-semibold border transition-colors shadow-xs ${colorClasses} ${sizeClasses} ${
        isClickable ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-1" : ""
      } ${className}`}
      title={ariaLabel}
    >
      <Leaf className={`${iconSizes} text-emerald-800 shrink-0`} aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );

  return (
    <>
      {isClickable ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label={ariaLabel}
          className="inline-flex rounded-full text-left focus:outline-none"
        >
          {content}
        </button>
      ) : (
        content
      )}

      {showModalOnClick && numScore !== null && (
        <GlassBoxModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          score={numScore}
          canopyCoverPct={canopyCoverPct ?? (numScore >= 70 ? 75.0 : numScore >= 40 ? 45.0 : 20.0)}
          ndviDensityScaled={ndviDensityScaled ?? (numScore >= 70 ? 80.0 : numScore >= 40 ? 50.0 : 25.0)}
          permeableSurfacePct={permeableSurfacePct ?? (numScore >= 70 ? 60.0 : numScore >= 40 ? 35.0 : 15.0)}
          placeName={placeName}
          verification={verification}
        />
      )}
    </>
  );
}
