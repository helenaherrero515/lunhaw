import { describe, it, expect } from "vitest";
import {
  computeWalkingDuration,
  computeTransitFare,
  WALKING_SPEED_KMH,
  WALKING_SPEED_MPS,
  LTFRB_FARE_TARIFFS,
  type WalkingDurationResult,
  type FareCalculationResult,
} from "../lib/methods/transit-math";
import { validateDerivedCalculation } from "../lib/guardrails";

describe("E-M2-04: Transit Mathematics & Fare Derivations", () => {
  describe("EQ-003: Walking Duration Estimation (4.2 km/h Benchmark)", () => {
    it("confirms pedestrian velocity benchmark constants", () => {
      expect(WALKING_SPEED_KMH).toBe(4.2);
      // 4.2 km/h = 4200 m / 3600 s = 7/6 ≈ 1.166667 m/s
      expect(WALKING_SPEED_MPS).toBeCloseTo(1.1667, 4);
    });

    it("evaluates canonical 1.0 km walk duration (~857 seconds / ~14.3 mins)", () => {
      // T_walk = (1.0 / 4.2) * 3600 = 857.1428... -> 857 seconds
      const result: WalkingDurationResult = computeWalkingDuration(1.0);

      expect(result.durationSeconds).toBe(857);
      expect(result.durationMinutes).toBe(14.3);
      expect(result.distanceKm).toBe(1.0);
      expect(result.distanceMeters).toBe(1000);
      expect(result.speedKmh).toBe(4.2);

      // Glass-box metadata
      expect(result.equationId).toBe("EQ-003");
      expect(result.inputDatasetIds).toEqual(["DS-001"]);
      expect(result.verificationStatus).toBe("VERIFIED");
      expect(result.confidenceLevel).toBe("HIGH");
      expect(result.derivationNote).toContain("EQ-003 walking duration");
      expect(result.derivationNote).toContain("857 seconds (~14.3 mins)");
    });

    it("evaluates canonical guardrail case: 0.9 km (900m) walk yielding 771 seconds (~12.9 mins)", () => {
      // (0.9 / 4.2) * 3600 = 771.428... -> 771 seconds
      const result = computeWalkingDuration(0.9);
      expect(result.durationSeconds).toBe(771);
      expect(result.distanceMeters).toBe(900);
    });

    it("handles zero distance (0 km) returning 0 seconds", () => {
      const result = computeWalkingDuration(0);
      expect(result.durationSeconds).toBe(0);
      expect(result.durationMinutes).toBe(0);
      expect(result.distanceKm).toBe(0);
    });

    it("evaluates short distance (0.1 km / 100 meters) yielding 86 seconds (~1.4 mins)", () => {
      // (0.1 / 4.2) * 3600 = 85.714... -> 86 seconds
      const result = computeWalkingDuration(0.1);
      expect(result.durationSeconds).toBe(86);
      expect(result.durationMinutes).toBe(1.4);
    });

    it("throws RangeError on negative distance or NaN", () => {
      expect(() => computeWalkingDuration(-0.5)).toThrow(RangeError);
      expect(() => computeWalkingDuration(NaN)).toThrow(RangeError);
    });

    it("produces valid DerivedCalculation passing INV-001 guardrails", () => {
      const result = computeWalkingDuration(0.9);
      const derived = result.toDerivedCalculation();
      const validation = validateDerivedCalculation(derived);
      expect(validation.success).toBe(true);
      expect(derived.equation_id).toBe("EQ-003");
      expect(derived.input_dataset_ids).toContain("DS-001");
    });
  });

  describe("EQ-004: LTFRB Fare Matrix Derivation against Official Circulars", () => {
    describe("Traditional Jeepney (LTFRB MC 2023-010: Base ₱13.00 for 4 km, ₱1.80/km)", () => {
      const tariff = LTFRB_FARE_TARIFFS.traditional_jeepney;

      it("verifies tariff configuration matches LTFRB circular", () => {
        expect(tariff.baseFarePhp).toBe(13.0);
        expect(tariff.baseDistanceKm).toBe(4.0);
        expect(tariff.ratePerExcessKm).toBe(1.8);
      });

      it("charges flat base fare ₱13.00 for distance within first 4 km", () => {
        // Distance: 2.5 km -> ₱13.00
        const result: FareCalculationResult = computeTransitFare(
          "traditional_jeepney",
          2.5
        );
        expect(result.farePhp).toBe(13.0);
        expect(result.excessKmCharged).toBe(0);
      });

      it("charges flat base fare ₱13.00 at exactly 4.0 km boundary", () => {
        const result = computeTransitFare("traditional_jeepney", 4.0);
        expect(result.farePhp).toBe(13.0);
        expect(result.excessKmCharged).toBe(0);
      });

      it("charges base + 1 excess km at 4.1 km (ceiling rule): ₱13.00 + 1 * ₱1.80 = ₱14.80", () => {
        // 4.1 - 4.0 = 0.1 -> ceil = 1 km excess -> 13 + 1.80 = 14.80
        const result = computeTransitFare("traditional_jeepney", 4.1);
        expect(result.excessKmCharged).toBe(1);
        expect(result.farePhp).toBe(14.8);
      });

      it("charges base + 1 excess km at exactly 5.0 km: ₱14.80", () => {
        const result = computeTransitFare("traditional_jeepney", 5.0);
        expect(result.excessKmCharged).toBe(1);
        expect(result.farePhp).toBe(14.8);
      });

      it("charges base + 6 excess km for 10.0 km route: ₱13.00 + 6 * ₱1.80 = ₱23.80", () => {
        // 10 - 4 = 6 excess km -> 13 + 6 * 1.80 = 13 + 10.80 = 23.80
        const result = computeTransitFare("traditional_jeepney", 10.0);
        expect(result.excessKmCharged).toBe(6);
        expect(result.farePhp).toBe(23.8);
      });
    });

    describe("Modern Jeepney / MPUJ (LTFRB MC 2023-010: Base ₱15.00 for 4 km, ₱2.20/km)", () => {
      const tariff = LTFRB_FARE_TARIFFS.modern_jeepney;

      it("verifies tariff configuration matches modern PUJ guidelines", () => {
        expect(tariff.baseFarePhp).toBe(15.0);
        expect(tariff.baseDistanceKm).toBe(4.0);
        expect(tariff.ratePerExcessKm).toBe(2.2);
      });

      it("charges flat base fare ₱15.00 for distances <= 4.0 km", () => {
        const result = computeTransitFare("modern_jeepney", 3.8);
        expect(result.farePhp).toBe(15.0);
        expect(result.excessKmCharged).toBe(0);
      });

      it("charges base + 3 excess km for 6.5 km route: ₱15.00 + ceil(2.5) * ₱2.20 = ₱21.60", () => {
        // 6.5 - 4.0 = 2.5 -> ceil = 3 km -> 15.00 + 3 * 2.20 = 15.00 + 6.60 = 21.60
        const result = computeTransitFare("modern_jeepney", 6.5);
        expect(result.excessKmCharged).toBe(3);
        expect(result.farePhp).toBe(21.6);
      });
    });

    describe("Public Utility Buses (Ordinary: Base ₱15 / 5km, ₱2.65/km; Aircon: Base ₱18 / 5km, ₱3.10/km)", () => {
      it("computes ordinary city bus fare for 12.0 km: ₱15.00 + ceil(7.0) * ₱2.65 = ₱33.55", () => {
        // 12.0 - 5.0 = 7.0 km excess -> 15 + 7 * 2.65 = 15 + 18.55 = 33.55
        const result = computeTransitFare("bus_ordinary", 12.0);
        expect(result.excessKmCharged).toBe(7);
        expect(result.farePhp).toBe(33.55);
      });

      it("computes aircon city bus fare for 12.0 km: ₱18.00 + ceil(7.0) * ₱3.10 = ₱39.70", () => {
        // 12.0 - 5.0 = 7.0 km excess -> 18 + 7 * 3.10 = 18 + 21.70 = 39.70
        const result = computeTransitFare("bus_aircon", 12.0);
        expect(result.excessKmCharged).toBe(7);
        expect(result.farePhp).toBe(39.7);
      });
    });

    describe("Metro Rail Transit Lines (LRT-1, LRT-2, MRT-3)", () => {
      it("computes MRT-3 distance fare (Base ₱13 / 2km, ₱1.00/km): 8.0 km = ₱19.00", () => {
        // 8.0 - 2.0 = 6 km excess -> 13 + 6 * 1.00 = 19.00
        const result = computeTransitFare("mrt3", 8.0);
        expect(result.excessKmCharged).toBe(6);
        expect(result.farePhp).toBe(19.0);
      });

      it("computes LRT-1 / LRT-2 distance fare (Base ₱15 / 2km, ₱1.21/km): 7.0 km = ₱21.05", () => {
        // 7.0 - 2.0 = 5 km excess -> 15 + 5 * 1.21 = 15 + 6.05 = 21.05
        const result = computeTransitFare("lrt1", 7.0);
        expect(result.excessKmCharged).toBe(5);
        expect(result.farePhp).toBe(21.05);
      });
    });

    describe("Fare Status & INV-001 Invariant Tags", () => {
      it("marks official verified routes as VERIFIED with HIGH confidence", () => {
        const result = computeTransitFare("traditional_jeepney", 5.0, true);
        expect(result.verificationStatus).toBe("VERIFIED");
        expect(result.confidenceLevel).toBe("HIGH");
        expect(result.inputDatasetIds).toEqual(["DS-003"]);
      });

      it("marks estimated / non-official routes as ESTIMATE with MEDIUM confidence", () => {
        const result = computeTransitFare("traditional_jeepney", 5.0, false);
        expect(result.verificationStatus).toBe("ESTIMATE");
        expect(result.confidenceLevel).toBe("MEDIUM");
      });

      it("converts to valid DerivedCalculation satisfying guardrails schema", () => {
        const result = computeTransitFare("traditional_jeepney", 5.0, true);
        const derived = result.toDerivedCalculation();
        const validation = validateDerivedCalculation(derived);
        expect(validation.success).toBe(true);
        expect(derived.equation_id).toBe("EQ-004");
        expect(derived.input_dataset_ids).toContain("DS-003");
      });

      it("throws RangeError on negative distance or NaN for transit fare", () => {
        expect(() => computeTransitFare("traditional_jeepney", -2)).toThrow(
          RangeError
        );
        expect(() => computeTransitFare("traditional_jeepney", NaN)).toThrow(
          RangeError
        );
      });
    });
  });
});
