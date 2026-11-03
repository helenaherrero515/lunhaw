import { describe, it, expect } from "vitest";
import {
  computeRouteShade,
  type RouteSegmentShadeInput,
  type RouteShadeResult,
} from "../lib/methods/shade-calculator";
import { validateDerivedCalculation } from "../lib/guardrails";

describe("E-M2-03: Route Shade Index Calculation (EQ-002)", () => {
  describe("Mathematical Formula & Length-Weighted Aggregation", () => {
    it("correctly weights segments by length: sum(L_i * S_i) / sum(L_i) * 100", () => {
      // 3 segments:
      // Segment 1: 100m, canopy 0.8 (80m shaded)
      // Segment 2: 200m, canopy 0.5 (100m shaded)
      // Segment 3: 100m, canopy 0.2 (20m shaded)
      // Total length = 400m; Total shaded = 80 + 100 + 20 = 200m
      // Shade = (200 / 400) * 100 = 50.00%
      const segments: RouteSegmentShadeInput[] = [
        { id: "seg-1", lengthMeters: 100, canopyRatio: 0.8 },
        { id: "seg-2", lengthMeters: 200, canopyRatio: 0.5 },
        { id: "seg-3", lengthMeters: 100, canopyRatio: 0.2 },
      ];

      const result: RouteShadeResult = computeRouteShade(segments);

      expect(result.shadeIndex).toBe(50.0);
      expect(result.totalLengthMeters).toBe(400);
      expect(result.totalShadedLengthMeters).toBe(200);
      expect(result.segmentCount).toBe(3);
      expect(result.contributions).toHaveLength(3);
      expect(result.contributions[0]?.shadedLengthMeters).toBe(80);
      expect(result.contributions[1]?.shadedLengthMeters).toBe(100);
      expect(result.contributions[2]?.shadedLengthMeters).toBe(20);

      // Glass-box metadata
      expect(result.equationId).toBe("EQ-002");
      expect(result.inputDatasetIds).toEqual(["DS-001", "DS-002"]);
      expect(result.verificationStatus).toBe("ESTIMATE");
      expect(result.derivationNote).toContain("EQ-002 glass-box derivation");
      expect(result.derivationNote).toContain("200.0m / 400.0m = 50.00%");
    });

    it("evaluates a single segment route directly", () => {
      const segments: RouteSegmentShadeInput[] = [
        { lengthMeters: 250, canopyRatio: 0.75 },
      ];

      const result = computeRouteShade(segments);
      expect(result.shadeIndex).toBe(75.0);
      expect(result.totalLengthMeters).toBe(250);
      expect(result.totalShadedLengthMeters).toBe(187.5);
    });

    it("evaluates known guardrail case from data-guardrails.test.ts (72.0% across 450m)", () => {
      // 450m total, shaded = 324m (450 * 0.72)
      const segments: RouteSegmentShadeInput[] = [
        { lengthMeters: 300, canopyRatio: 0.8 }, // 240m
        { lengthMeters: 150, canopyRatio: 0.56 }, // 84m -> total 324m
      ];

      const result = computeRouteShade(segments);
      expect(result.totalLengthMeters).toBe(450);
      expect(result.totalShadedLengthMeters).toBe(324);
      expect(result.shadeIndex).toBe(72.0);
    });

    it("demonstrates length-weighting prevents short unshaded alleys from dominating long tree-lined boulevards", () => {
      // Long tree-lined avenue: 1000m, 90% shade (900m shaded)
      // Short unshaded crosswalk: 20m, 0% shade (0m shaded)
      // Unweighted average would be (90 + 0) / 2 = 45% (misleading!)
      // Length-weighted formula: (900 / 1020) * 100 = 88.24%
      const segments: RouteSegmentShadeInput[] = [
        { lengthMeters: 1000, canopyRatio: 0.9 },
        { lengthMeters: 20, canopyRatio: 0.0 },
      ];

      const result = computeRouteShade(segments);
      expect(result.shadeIndex).toBeCloseTo(88.24, 2);
    });
  });

  describe("Boundary Conditions & Extreme Values", () => {
    it("handles 100% full canopy route (all segments canopyRatio = 1.0)", () => {
      const segments: RouteSegmentShadeInput[] = [
        { lengthMeters: 120, canopyRatio: 1.0 },
        { lengthMeters: 80, canopyRatio: 1.0 },
      ];

      const result = computeRouteShade(segments);
      expect(result.shadeIndex).toBe(100.0);
      expect(result.totalShadedLengthMeters).toBe(200.0);
    });

    it("handles 0% completely unshaded route (all segments canopyRatio = 0.0)", () => {
      const segments: RouteSegmentShadeInput[] = [
        { lengthMeters: 300, canopyRatio: 0.0 },
        { lengthMeters: 500, canopyRatio: 0.0 },
      ];

      const result = computeRouteShade(segments);
      expect(result.shadeIndex).toBe(0.0);
      expect(result.totalShadedLengthMeters).toBe(0.0);
    });

    it("handles fractional segment lengths and ratios with 2 decimal precision", () => {
      const segments: RouteSegmentShadeInput[] = [
        { lengthMeters: 123.45, canopyRatio: 0.333 },
        { lengthMeters: 67.89, canopyRatio: 0.667 },
      ];

      const result = computeRouteShade(segments);
      expect(typeof result.shadeIndex).toBe("number");
      expect(result.shadeIndex).toBeGreaterThan(0);
      expect(result.shadeIndex).toBeLessThan(100);
    });
  });

  describe("Validation & Error Handling", () => {
    it("throws Error on empty segments array", () => {
      expect(() => computeRouteShade([])).toThrow(
        /requires at least one route segment/
      );
    });

    it("throws RangeError on non-positive segment length (<= 0)", () => {
      expect(() =>
        computeRouteShade([{ lengthMeters: 0, canopyRatio: 0.5 }])
      ).toThrow(RangeError);

      expect(() =>
        computeRouteShade([{ lengthMeters: -50, canopyRatio: 0.5 }])
      ).toThrow(RangeError);
    });

    it("throws RangeError on canopyRatio out of bounds (< 0 or > 1)", () => {
      expect(() =>
        computeRouteShade([{ lengthMeters: 100, canopyRatio: -0.05 }])
      ).toThrow(RangeError);

      expect(() =>
        computeRouteShade([{ lengthMeters: 100, canopyRatio: 1.05 }])
      ).toThrow(RangeError);
    });

    it("throws RangeError on NaN length or ratio", () => {
      expect(() =>
        computeRouteShade([{ lengthMeters: NaN, canopyRatio: 0.5 }])
      ).toThrow(RangeError);

      expect(() =>
        computeRouteShade([{ lengthMeters: 100, canopyRatio: NaN }])
      ).toThrow(RangeError);
    });
  });

  describe("INV-001 Invariant & Guardrail Verification", () => {
    it("converts to valid DerivedCalculation passing guardrail schema", () => {
      const segments: RouteSegmentShadeInput[] = [
        { lengthMeters: 100, canopyRatio: 0.5 },
      ];

      const result = computeRouteShade(segments);
      const derived = result.toDerivedCalculation();

      const validation = validateDerivedCalculation(derived);
      expect(validation.success).toBe(true);
      expect(derived.equation_id).toBe("EQ-002");
      expect(derived.input_dataset_ids).toContain("DS-001");
      expect(derived.input_dataset_ids).toContain("DS-002");
      expect(derived.derivation_note).toContain("EQ-002");
    });
  });
});
