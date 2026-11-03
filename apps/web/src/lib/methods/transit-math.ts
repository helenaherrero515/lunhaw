/**
 * Transit Mathematics: Walking Durations (EQ-003) & PUV Fare Matrices (EQ-004)
 *
 * Implements:
 * 1. EQ-003 Walking Duration:
 *    T_walk = (D_walk / V_walk) * 3600
 *    where:
 *      - D_walk = Network pedestrian distance in km (or meters / 1000)
 *      - V_walk = 4.2 km/h (average tropical urban walking speed accounting for sidewalk friction and heat)
 *      - Conversion: 4.2 km/h = 4200 m / 3600 s = ~1.16667 m/s.
 *      - Reference: DOTr Pedestrian Velocity Benchmark (DS-001)
 *
 * 2. EQ-004 PUV Fare Derivation:
 *    Fare = BaseFare + max(0, ceil(D - D_base) * Rate_per_km)
 *    where:
 *      - Traditional Jeepney: Base 13.00 PHP (first 4 km), 1.80 PHP/km thereafter
 *      - Modern Jeepney: Base 15.00 PHP (first 4 km), 2.20 PHP/km thereafter
 *      - Public Utility Bus (Ordinary / Non-Aircon City): Base 15.00 PHP (first 5 km), 2.65 PHP/km thereafter
 *      - Public Utility Bus (Aircon City): Base 18.00 PHP (first 5 km), 3.10 PHP/km thereafter
 *      - Rail Transit (LRT-1, LRT-2, MRT-3): Base 15.00 PHP (first 2 stations/base band) + 1.21 PHP/km distance rate
 *    Reference: LTFRB Memorandum Circular Fare Matrix (DS-003)
 *
 * Invariant INV-001: Every fare & duration carries an explicit status (VERIFIED or ESTIMATE)
 * with equation_id, input_dataset_ids, and glass-box derivation note.
 */

import {
  type ConfidenceLevel,
  type DerivedCalculation,
  type VerificationStatus,
} from "../guardrails";

// EQ-003 Constants
/** Average tropical pedestrian speed in km/h accounting for sidewalk friction & heat (DOTr) */
export const WALKING_SPEED_KMH = 4.2;
/** Walking speed in meters per second */
export const WALKING_SPEED_MPS = (WALKING_SPEED_KMH * 1000) / 3600; // ~1.166667 m/s

export interface WalkingDurationResult {
  /** Walking duration in whole seconds */
  durationSeconds: number;
  /** Walking duration in fractional minutes */
  durationMinutes: number;
  /** Distance in kilometers */
  distanceKm: number;
  /** Distance in meters */
  distanceMeters: number;
  /** Walking speed assumed in km/h */
  speedKmh: number;
  equationId: "EQ-003";
  inputDatasetIds: ["DS-001"];
  confidenceLevel: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  derivationNote: string;
  calculatedAt: string;
  toDerivedCalculation: () => DerivedCalculation;
}

/**
 * Computes walking duration using EQ-003.
 *
 * @param distanceKm Pedestrian network distance in kilometers (or pass distanceMeters / 1000)
 * @param confidence Confidence level (default: 'HIGH' for known network distance)
 * @returns WalkingDurationResult
 */
export function computeWalkingDuration(
  distanceKm: number,
  confidence: ConfidenceLevel = "HIGH"
): WalkingDurationResult {
  if (typeof distanceKm !== "number" || Number.isNaN(distanceKm) || distanceKm < 0) {
    throw new RangeError(`Walking distance must be a non-negative number, got ${distanceKm}`);
  }

  // T_walk = (D_walk / V_walk) * 3600
  const rawSeconds = (distanceKm / WALKING_SPEED_KMH) * 3600;
  const durationSeconds = Math.round(rawSeconds);
  const durationMinutes = Number((rawSeconds / 60).toFixed(1));
  const distanceMeters = Number((distanceKm * 1000).toFixed(1));

  const derivationNote =
    `EQ-003 walking duration: (${distanceKm.toFixed(3)} km / ${WALKING_SPEED_KMH} km/h) * 3600 = ` +
    `${durationSeconds} seconds (~${durationMinutes} mins) at tropical walking speed benchmark.`;

  const calculatedAt = new Date().toISOString();

  return {
    durationSeconds,
    durationMinutes,
    distanceKm: Number(distanceKm.toFixed(3)),
    distanceMeters,
    speedKmh: WALKING_SPEED_KMH,
    equationId: "EQ-003",
    inputDatasetIds: ["DS-001"],
    confidenceLevel: confidence,
    verificationStatus: "HIGH" === confidence ? "VERIFIED" : "ESTIMATE",
    derivationNote,
    calculatedAt,
    toDerivedCalculation: (): DerivedCalculation => ({
      metric_name: "Walking Duration Seconds",
      value: durationSeconds,
      equation_id: "EQ-003",
      input_dataset_ids: ["DS-001"],
      confidence_level: confidence,
      derivation_note: derivationNote,
      calculated_at: calculatedAt,
    }),
  };
}

// EQ-004 PUV Fare Types & Tariffs
export type TransitMode =
  | "traditional_jeepney"
  | "modern_jeepney"
  | "bus_ordinary"
  | "bus_aircon"
  | "lrt1"
  | "lrt2"
  | "mrt3"
  | "puv_general";

export interface FareTariff {
  modeName: string;
  baseFarePhp: number;
  baseDistanceKm: number;
  ratePerExcessKm: number;
  officialGazetteRef: string;
}

export const LTFRB_FARE_TARIFFS: Record<TransitMode, FareTariff> = {
  traditional_jeepney: {
    modeName: "Traditional PUJ (Jeepney)",
    baseFarePhp: 13.0,
    baseDistanceKm: 4.0,
    ratePerExcessKm: 1.8,
    officialGazetteRef: "LTFRB MC 2023-010 / Fare Matrix",
  },
  modern_jeepney: {
    modeName: "Modern PUJ (Mini-bus / MPUJ)",
    baseFarePhp: 15.0,
    baseDistanceKm: 4.0,
    ratePerExcessKm: 2.2,
    officialGazetteRef: "LTFRB MC 2023-010 / Modern PUJ Fare Matrix",
  },
  bus_ordinary: {
    modeName: "Public Utility Bus (Ordinary / Regular City)",
    baseFarePhp: 15.0,
    baseDistanceKm: 5.0,
    ratePerExcessKm: 2.65,
    officialGazetteRef: "LTFRB Memorandum Circular City Bus Tariff",
  },
  bus_aircon: {
    modeName: "Public Utility Bus (Aircon City)",
    baseFarePhp: 18.0,
    baseDistanceKm: 5.0,
    ratePerExcessKm: 3.1,
    officialGazetteRef: "LTFRB Memorandum Circular Aircon Bus Tariff",
  },
  lrt1: {
    modeName: "Light Rail Transit Line 1 (LRT-1)",
    baseFarePhp: 15.0,
    baseDistanceKm: 2.0,
    ratePerExcessKm: 1.21,
    officialGazetteRef: "LRMC / DOTr Approved Fare Adjustment Matrix",
  },
  lrt2: {
    modeName: "Light Rail Transit Line 2 (LRT-2)",
    baseFarePhp: 15.0,
    baseDistanceKm: 2.0,
    ratePerExcessKm: 1.21,
    officialGazetteRef: "LRTA / DOTr Approved Fare Adjustment Matrix",
  },
  mrt3: {
    modeName: "Metro Rail Transit Line 3 (MRT-3)",
    baseFarePhp: 13.0,
    baseDistanceKm: 2.0,
    ratePerExcessKm: 1.0,
    officialGazetteRef: "DOTr MRT-3 Approved Distance Fare Matrix",
  },
  puv_general: {
    modeName: "Standard Public Utility Vehicle",
    baseFarePhp: 13.0,
    baseDistanceKm: 4.0,
    ratePerExcessKm: 1.8,
    officialGazetteRef: "LTFRB Baseline Fare Matrix",
  },
};

export interface FareCalculationResult {
  /** Computed fare in Philippine Pesos (PHP) */
  farePhp: number;
  /** Transit mode evaluated */
  mode: TransitMode;
  /** Tariff structure applied */
  tariff: FareTariff;
  /** Distance in kilometers */
  distanceKm: number;
  /** Excess km charged beyond base distance (ceil) */
  excessKmCharged: number;
  equationId: "EQ-004";
  inputDatasetIds: ["DS-003"];
  confidenceLevel: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  derivationNote: string;
  calculatedAt: string;
  toDerivedCalculation: () => DerivedCalculation;
}

/**
 * Computes public transit fare using EQ-004:
 * Fare = BaseFare + max(0, ceil(D - D_base) * Rate_per_km)
 *
 * @param mode Transit mode (e.g. 'traditional_jeepney', 'modern_jeepney', 'bus_aircon', 'mrt3')
 * @param distanceKm Traveled route distance in kilometers
 * @param isOfficialRoute Whether route distance is verified official route geometry (defaults to true -> HIGH confidence)
 * @returns FareCalculationResult
 */
export function computeTransitFare(
  mode: TransitMode,
  distanceKm: number,
  isOfficialRoute = true
): FareCalculationResult {
  if (typeof distanceKm !== "number" || Number.isNaN(distanceKm) || distanceKm < 0) {
    throw new RangeError(`Transit distance must be a non-negative number, got ${distanceKm}`);
  }

  const tariff = LTFRB_FARE_TARIFFS[mode] ?? LTFRB_FARE_TARIFFS.traditional_jeepney;

  const excessDistance = Math.max(0, distanceKm - tariff.baseDistanceKm);
  // LTFRB rules charge per whole excess kilometer (ceiling)
  const excessKmCharged = Math.ceil(excessDistance);
  const excessCost = excessKmCharged * tariff.ratePerExcessKm;
  const rawFare = tariff.baseFarePhp + excessCost;
  const farePhp = Number(rawFare.toFixed(2));

  const confidence: ConfidenceLevel = isOfficialRoute ? "HIGH" : "MEDIUM";
  const verificationStatus: VerificationStatus = isOfficialRoute ? "VERIFIED" : "ESTIMATE";

  const derivationNote =
    `EQ-004 fare derivation (${tariff.modeName}): Base ₱${tariff.baseFarePhp.toFixed(2)} ` +
    `(first ${tariff.baseDistanceKm} km) + max(0, ceil(${distanceKm.toFixed(2)} - ${tariff.baseDistanceKm}) = ` +
    `${excessKmCharged} excess km * ₱${tariff.ratePerExcessKm.toFixed(2)}/km) = ₱${farePhp.toFixed(2)}. ` +
    `Ref: ${tariff.officialGazetteRef}.`;

  const calculatedAt = new Date().toISOString();

  return {
    farePhp,
    mode,
    tariff,
    distanceKm: Number(distanceKm.toFixed(2)),
    excessKmCharged,
    equationId: "EQ-004",
    inputDatasetIds: ["DS-003"],
    confidenceLevel: confidence,
    verificationStatus,
    derivationNote,
    calculatedAt,
    toDerivedCalculation: (): DerivedCalculation => ({
      metric_name: `${tariff.modeName} Fare PHP`,
      value: farePhp,
      equation_id: "EQ-004",
      input_dataset_ids: ["DS-003"],
      confidence_level: confidence,
      derivation_note: derivationNote,
      calculated_at: calculatedAt,
    }),
  };
}
