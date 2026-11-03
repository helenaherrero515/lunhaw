/**
 * Street Segment Canopy Shade Calculator (EQ-002)
 *
 * Implements the Glass-Box Route Shade formula:
 * Shade = [ sum(L_i * S_i) / sum(L_i) ] * 100
 *
 * where:
 *   - L_i = Length of route segment i in meters (L_i > 0)
 *   - S_i = Segment canopy/tree coverage ratio (0.0 <= S_i <= 1.0)
 *
 * Traces back to: docs/methods.md (EQ-002, DS-001, DS-002, INV-001)
 * Reference: Pedestrian Microclimate Shade Model
 */

import {
  type ConfidenceLevel,
  type DerivedCalculation,
  type VerificationStatus,
} from "../guardrails";

export interface RouteSegmentShadeInput {
  /** Segment identifier (optional) */
  id?: string;
  /** Segment length in meters (must be > 0) */
  lengthMeters: number;
  /** Segment canopy/tree coverage ratio (0.0 to 1.0) */
  canopyRatio: number;
}

export interface SegmentShadeContribution {
  segmentId?: string;
  lengthMeters: number;
  canopyRatio: number;
  shadedLengthMeters: number;
}

export interface RouteShadeResult {
  /** Overall shade index from 0.0 to 100.0 */
  shadeIndex: number;
  /** Total route length in meters */
  totalLengthMeters: number;
  /** Total equivalent shaded length in meters */
  totalShadedLengthMeters: number;
  /** Number of segments evaluated */
  segmentCount: number;
  /** Per-segment breakdown */
  contributions: SegmentShadeContribution[];
  equationId: "EQ-002";
  inputDatasetIds: ["DS-001", "DS-002"];
  confidenceLevel: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  derivationNote: string;
  calculatedAt: string;
  toDerivedCalculation: () => DerivedCalculation;
}

/**
 * Computes Route Shade Index across multiple street segments (EQ-002).
 *
 * @param segments Array of route segments with lengthMeters and canopyRatio
 * @param confidence Confidence level override (default: 'MEDIUM')
 * @returns RouteShadeResult
 */
export function computeRouteShade(
  segments: RouteSegmentShadeInput[],
  confidence: ConfidenceLevel = "MEDIUM"
): RouteShadeResult {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("Route shade calculation requires at least one route segment");
  }

  let totalLength = 0;
  let totalShaded = 0;
  const contributions: SegmentShadeContribution[] = [];

  for (const [i, seg] of segments.entries()) {
    if (typeof seg.lengthMeters !== "number" || Number.isNaN(seg.lengthMeters) || seg.lengthMeters <= 0) {
      throw new RangeError(
        `Segment at index ${i} has invalid lengthMeters: ${seg.lengthMeters}. Must be > 0.`
      );
    }
    if (
      typeof seg.canopyRatio !== "number" ||
      Number.isNaN(seg.canopyRatio) ||
      seg.canopyRatio < 0 ||
      seg.canopyRatio > 1
    ) {
      throw new RangeError(
        `Segment at index ${i} has invalid canopyRatio: ${seg.canopyRatio}. Must be between 0.0 and 1.0.`
      );
    }

    const shadedMeters = seg.lengthMeters * seg.canopyRatio;
    totalLength += seg.lengthMeters;
    totalShaded += shadedMeters;

    contributions.push({
      segmentId: seg.id,
      lengthMeters: seg.lengthMeters,
      canopyRatio: seg.canopyRatio,
      shadedLengthMeters: Number(shadedMeters.toFixed(2)),
    });
  }

  const shadeRatio = totalShaded / totalLength;
  const shadeIndex = Number((shadeRatio * 100).toFixed(2));
  const roundedTotalLength = Number(totalLength.toFixed(2));
  const roundedTotalShaded = Number(totalShaded.toFixed(2));

  const derivationNote =
    `EQ-002 glass-box derivation: sum(L_i * S_i) / sum(L_i) = ` +
    `${roundedTotalShaded.toFixed(1)}m / ${roundedTotalLength.toFixed(1)}m = ` +
    `${shadeIndex.toFixed(2)}% canopy shade index across ${segments.length} segment(s).`;

  const calculatedAt = new Date().toISOString();

  return {
    shadeIndex,
    totalLengthMeters: roundedTotalLength,
    totalShadedLengthMeters: roundedTotalShaded,
    segmentCount: segments.length,
    contributions,
    equationId: "EQ-002",
    inputDatasetIds: ["DS-001", "DS-002"],
    confidenceLevel: confidence,
    verificationStatus: "ESTIMATE",
    derivationNote,
    calculatedAt,
    toDerivedCalculation: (): DerivedCalculation => ({
      metric_name: "Route Shade Index",
      value: shadeIndex,
      equation_id: "EQ-002",
      input_dataset_ids: ["DS-001", "DS-002"],
      confidence_level: confidence,
      derivation_note: derivationNote,
      calculated_at: calculatedAt,
    }),
  };
}
