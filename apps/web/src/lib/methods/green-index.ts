/**
 * Green Index Calculator (EQ-001)
 *
 * Implements the Glass-Box Green Index formula:
 * Score = (0.50 * C) + (0.30 * V) + (0.20 * P)
 *
 * where:
 *   - C = Canopy coverage percentage within boundary (0–100)
 *   - V = NDVI Vegetation density scaled (0–100)
 *   - P = Permeable ground surface area ratio (0–100)
 *
 * Traces back to: docs/methods.md (EQ-001, DS-001, DS-002, INV-001)
 * Reference: WHO Urban Green Space Guidelines
 */

import {
  type ConfidenceLevel,
  type DerivedCalculation,
  type VerificationStatus,
} from "../guardrails";

export interface GreenIndexInputs {
  /** Canopy coverage percentage (0–100) */
  canopyCoverPct: number;
  /** NDVI vegetation density scaled (0–100) */
  ndviDensityScaled: number;
  /** Permeable ground surface area ratio percentage (0–100) */
  permeableSurfacePct: number;
}

export interface GreenIndexBreakdown {
  canopyComponent: number;
  ndviComponent: number;
  permeableComponent: number;
}

export interface GreenIndexResult {
  totalScore: number;
  breakdown: GreenIndexBreakdown;
  inputs: GreenIndexInputs;
  equationId: "EQ-001";
  inputDatasetIds: ["DS-001", "DS-002"];
  confidenceLevel: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  derivationNote: string;
  calculatedAt: string;
  toDerivedCalculation: () => DerivedCalculation;
}

/**
 * Validates and clamps an input score to [0, 100].
 */
function clampPct(val: number, name: string): number {
  if (typeof val !== "number" || Number.isNaN(val)) {
    throw new TypeError(`Green Index input ${name} must be a valid number, got ${val}`);
  }
  if (val < 0 || val > 100) {
    throw new RangeError(
      `Green Index input ${name} must be between 0 and 100 inclusive, got ${val}`
    );
  }
  return val;
}

/**
 * Computes Green Index Place Score (EQ-001).
 *
 * @param canopy Canopy coverage percentage (0.0 to 100.0)
 * @param ndvi NDVI vegetation density (0.0 to 100.0)
 * @param permeable Permeable surface area ratio (0.0 to 100.0)
 * @param confidence Optional override for confidence level (default: 'MEDIUM')
 * @returns GreenIndexResult with total score, component breakdown, and glass-box metadata
 */
export function computeGreenIndex(
  canopy: number,
  ndvi: number,
  permeable: number,
  confidence: ConfidenceLevel = "MEDIUM"
): GreenIndexResult {
  const c = clampPct(canopy, "canopyCoverPct");
  const v = clampPct(ndvi, "ndviDensityScaled");
  const p = clampPct(permeable, "permeableSurfacePct");

  const canopyComponent = Number((0.50 * c).toFixed(4));
  const ndviComponent = Number((0.30 * v).toFixed(4));
  const permeableComponent = Number((0.20 * p).toFixed(4));

  const rawScore = canopyComponent + ndviComponent + permeableComponent;
  // Two decimal points standard precision
  const totalScore = Number(rawScore.toFixed(2));

  const derivationNote =
    `EQ-001 glass-box derivation: (0.50 * ${c.toFixed(1)}% canopy) + ` +
    `(0.30 * ${v.toFixed(1)}% ndvi) + ` +
    `(0.20 * ${p.toFixed(1)}% permeable) = ${totalScore.toFixed(2)} / 100.00`;

  const calculatedAt = new Date().toISOString();

  return {
    totalScore,
    breakdown: {
      canopyComponent: Number(canopyComponent.toFixed(2)),
      ndviComponent: Number(ndviComponent.toFixed(2)),
      permeableComponent: Number(permeableComponent.toFixed(2)),
    },
    inputs: {
      canopyCoverPct: c,
      ndviDensityScaled: v,
      permeableSurfacePct: p,
    },
    equationId: "EQ-001",
    inputDatasetIds: ["DS-001", "DS-002"],
    confidenceLevel: confidence,
    verificationStatus: "ESTIMATE",
    derivationNote,
    calculatedAt,
    toDerivedCalculation: (): DerivedCalculation => ({
      metric_name: "Green Index Score",
      value: totalScore,
      equation_id: "EQ-001",
      input_dataset_ids: ["DS-001", "DS-002"],
      confidence_level: confidence,
      derivation_note: derivationNote,
      calculated_at: calculatedAt,
    }),
  };
}
