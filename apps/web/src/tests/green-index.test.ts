import { describe, it, expect } from "vitest";
import {
  computeGreenIndex,
  type GreenIndexResult,
} from "../lib/methods/green-index";
import { validateDerivedCalculation } from "../lib/guardrails";

describe("E-M2-02 / TC-004: Green Index Glass-Box Calculation (EQ-001)", () => {
  describe("Canonical Test Cases & Mathematical Precision", () => {
    it("satisfies TC-004 canonical inputs (Canopy=40%, NDVI=50%, Permeable=30%) yielding 41.00 ± 0.01", () => {
      // TC-004 from qa-test-plan.md:
      // Score = (0.50 * 40.0) + (0.30 * 50.0) + (0.20 * 30.0)
      //       = 20.00 + 15.00 + 6.00 = 41.00
      const result: GreenIndexResult = computeGreenIndex(40.0, 50.0, 30.0);

      expect(result.totalScore).toBeCloseTo(41.0, 2);
      expect(result.totalScore).toBe(41.0);
      expect(result.breakdown.canopyComponent).toBeCloseTo(20.0, 2);
      expect(result.breakdown.ndviComponent).toBeCloseTo(15.0, 2);
      expect(result.breakdown.permeableComponent).toBeCloseTo(6.0, 2);

      // Verify equation and dataset attribution
      expect(result.equationId).toBe("EQ-001");
      expect(result.inputDatasetIds).toEqual(["DS-001", "DS-002"]);
      expect(result.verificationStatus).toBe("ESTIMATE");
      expect(result.derivationNote).toContain("EQ-001 glass-box derivation");
      expect(result.derivationNote).toContain("40.0% canopy");
      expect(result.derivationNote).toContain("50.0% ndvi");
      expect(result.derivationNote).toContain("30.0% permeable");
    });

    it("evaluates known scenario: high canopy park (Canopy=85%, NDVI=80%, Permeable=80%) yielding 82.50", () => {
      // Score = (0.50 * 85) + (0.30 * 80) + (0.20 * 80) = 42.5 + 24.0 + 16.0 = 82.50
      const result = computeGreenIndex(85.0, 80.0, 80.0);
      expect(result.totalScore).toBeCloseTo(82.5, 2);
      expect(result.breakdown.canopyComponent).toBe(42.5);
      expect(result.breakdown.ndviComponent).toBe(24.0);
      expect(result.breakdown.permeableComponent).toBe(16.0);
    });

    it("evaluates known scenario: dense urban street with minimal vegetation (Canopy=5%, NDVI=10%, Permeable=5%) yielding 6.50", () => {
      // Score = (0.50 * 5) + (0.30 * 10) + (0.20 * 5) = 2.5 + 3.0 + 1.0 = 6.50
      const result = computeGreenIndex(5.0, 10.0, 5.0);
      expect(result.totalScore).toBeCloseTo(6.5, 2);
      expect(result.totalScore).toBe(6.5);
    });

    it("evaluates fractional inputs with ±0.01 precision guarantee", () => {
      // Canopy = 33.33%, NDVI = 66.67%, Permeable = 12.5%
      // Score = (0.50 * 33.33) + (0.30 * 66.67) + (0.20 * 12.5)
      //       = 16.665 + 20.001 + 2.500 = 39.166 -> 39.17
      const result = computeGreenIndex(33.33, 66.67, 12.5);
      expect(Math.abs(result.totalScore - 39.17)).toBeLessThanOrEqual(0.01);
    });
  });

  describe("Boundary Conditions & Edge Cases", () => {
    it("handles absolute minimum boundary [0, 0, 0] returning 0.00", () => {
      const result = computeGreenIndex(0, 0, 0);
      expect(result.totalScore).toBe(0.0);
      expect(result.breakdown.canopyComponent).toBe(0.0);
      expect(result.breakdown.ndviComponent).toBe(0.0);
      expect(result.breakdown.permeableComponent).toBe(0.0);
    });

    it("handles absolute maximum boundary [100, 100, 100] returning 100.00", () => {
      const result = computeGreenIndex(100, 100, 100);
      expect(result.totalScore).toBe(100.0);
      expect(result.breakdown.canopyComponent).toBe(50.0);
      expect(result.breakdown.ndviComponent).toBe(30.0);
      expect(result.breakdown.permeableComponent).toBe(20.0);
    });

    it("handles pure canopy dominance [100, 0, 0] returning 50.00", () => {
      const result = computeGreenIndex(100, 0, 0);
      expect(result.totalScore).toBe(50.0);
    });

    it("handles pure NDVI dominance [0, 100, 0] returning 30.00", () => {
      const result = computeGreenIndex(0, 100, 0);
      expect(result.totalScore).toBe(30.0);
    });

    it("handles pure permeable surface dominance [0, 0, 100] returning 20.00", () => {
      const result = computeGreenIndex(0, 0, 100);
      expect(result.totalScore).toBe(20.0);
    });
  });

  describe("Input Validation & Range Violations", () => {
    it("rejects negative canopy input (< 0)", () => {
      expect(() => computeGreenIndex(-0.1, 50, 50)).toThrow(RangeError);
      expect(() => computeGreenIndex(-10, 50, 50)).toThrow(
        /must be between 0 and 100/
      );
    });

    it("rejects excessive canopy input (> 100)", () => {
      expect(() => computeGreenIndex(100.1, 50, 50)).toThrow(RangeError);
      expect(() => computeGreenIndex(150, 50, 50)).toThrow(
        /must be between 0 and 100/
      );
    });

    it("rejects negative or excessive NDVI input", () => {
      expect(() => computeGreenIndex(50, -1, 50)).toThrow(RangeError);
      expect(() => computeGreenIndex(50, 105, 50)).toThrow(RangeError);
    });

    it("rejects negative or excessive permeable surface input", () => {
      expect(() => computeGreenIndex(50, 50, -5)).toThrow(RangeError);
      expect(() => computeGreenIndex(50, 50, 101)).toThrow(RangeError);
    });

    it("rejects NaN or non-number inputs", () => {
      expect(() => computeGreenIndex(NaN, 50, 50)).toThrow(TypeError);
      expect(() => computeGreenIndex(50, NaN, 50)).toThrow(TypeError);
      expect(() => computeGreenIndex(50, 50, NaN)).toThrow(TypeError);
      // @ts-expect-error runtime type check for non-number input
      expect(() => computeGreenIndex("50", 50, 50)).toThrow(TypeError);
    });
  });

  describe("Invariant & Data Guardrail Integration (INV-001)", () => {
    it("emits payload convertible to valid DerivedCalculation complying with NV-003 and NV-004", () => {
      const result = computeGreenIndex(40.0, 50.0, 30.0);
      const derivedCalc = result.toDerivedCalculation();

      const validation = validateDerivedCalculation(derivedCalc);
      expect(validation.success).toBe(true);

      expect(derivedCalc.equation_id).toBe("EQ-001");
      expect(derivedCalc.input_dataset_ids).toContain("DS-001");
      expect(derivedCalc.input_dataset_ids).toContain("DS-002");
      expect(derivedCalc.derivation_note).toBeTruthy();
      expect(derivedCalc.derivation_note.length).toBeGreaterThan(10);
    });

    it("supports custom confidence level override while preserving glass-box schema", () => {
      const result = computeGreenIndex(60, 40, 50, "HIGH");
      expect(result.confidenceLevel).toBe("HIGH");
      const derived = result.toDerivedCalculation();
      expect(derived.confidence_level).toBe("HIGH");
      const validation = validateDerivedCalculation(derived);
      expect(validation.success).toBe(true);
    });
  });
});
