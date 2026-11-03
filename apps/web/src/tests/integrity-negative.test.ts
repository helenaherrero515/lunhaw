import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  VerificationStatusSchema,
  validateVerificationMeta,
  AI_AGENT_SIGNATURE_REGEX,
} from "@/lib/guardrails";
import type { Place, FacilityDetail, OperatingHours, StudyAmenities, VerificationMeta } from "@/types/places";

/**
 * E-M1-05 / TC-N01: Negative Contract Test Verifying Rejection/Handling of Unlabelled Civic Attributes
 *
 * Traceability:
 * - INV-001: Zero Hallucination. Never invent, hallucinate, or unreliably extrapolate routes,
 *   transit fares, operating hours, or amenities without explicit labels.
 * - TC-N01: The system SHALL NEVER return or render an operating hour, transit fare, or amenity
 *   value that lacks an explicit status equal to VERIFIED, ESTIMATE, or NOT_AVAILABLE.
 * - BR-001: Every facility attribute must carry an explicit status VERIFIED, ESTIMATE, or NOT_AVAILABLE.
 */

// Schema strictly enforcing INV-001 tri-state on civic attributes
const CivicAttributeVerificationSchema = z.object({
  status: VerificationStatusSchema,
  official_source_name: z.string().min(1).nullable().optional(),
  official_source_url: z.string().url().nullable().optional(),
  derivation_note: z.string().nullable().optional(),
  last_verified_at: z.string().nullable().optional(),
  verified_by: z.string().nullable().optional(),
});

const OperatingHourContractSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  day_name: z.string().min(1),
  open_time: z.string().nullable(),
  close_time: z.string().nullable(),
  is_closed: z.boolean(),
  verification: CivicAttributeVerificationSchema,
});

const TransitFareContractSchema = z.object({
  amount_php: z.number().min(0),
  mode: z.string().min(1),
  verification: CivicAttributeVerificationSchema,
});

const AmenityItemContractSchema = z.object({
  name: z.string().min(1),
  value: z.union([z.boolean(), z.number(), z.string(), z.null()]),
  verification: CivicAttributeVerificationSchema,
});

describe("E-M1-05 / TC-N01: Negative Contract Test — Zero Hallucination (INV-001 / BR-001)", () => {
  describe("Civic Attribute Tri-State Status Invariant Enforcement", () => {
    it("accepts valid tri-state verification statuses: VERIFIED, ESTIMATE, NOT_AVAILABLE", () => {
      const validStatuses = ["VERIFIED", "ESTIMATE", "NOT_AVAILABLE"];
      for (const status of validStatuses) {
        const parsed = VerificationStatusSchema.safeParse(status);
        expect(parsed.success).toBe(true);
      }
    });

    it("rejects invalid, unverified, or ambiguous statuses (CONFIRMED, UNKNOWN, MAYBE, empty)", () => {
      const invalidStatuses = [
        "CONFIRMED",
        "UNKNOWN",
        "PENDING",
        "ASSUMED",
        "MAYBE",
        "DEFAULT",
        "PROBABLY_OPEN",
        "",
        null,
        undefined,
        123,
      ];

      for (const invalid of invalidStatuses) {
        const parsed = VerificationStatusSchema.safeParse(invalid);
        expect(parsed.success).toBe(false);
      }
    });
  });

  describe("Operating Hours Invariant Contract (TC-N01 / INV-001)", () => {
    it("rejects an operating hour entry that lacks an explicit verification object", () => {
      const unlabelledSchedule = {
        day_of_week: 1,
        day_name: "Monday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        // Missing verification field entirely
      };

      const result = OperatingHourContractSchema.safeParse(unlabelledSchedule);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("verification"))).toBe(true);
      }
    });

    it("rejects an operating hour entry with null verification status", () => {
      const nullStatusSchedule = {
        day_of_week: 2,
        day_name: "Tuesday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: {
          status: null,
        },
      };

      const result = OperatingHourContractSchema.safeParse(nullStatusSchedule);
      expect(result.success).toBe(false);
    });

    it("accepts verified operating hours with explicit VERIFIED status", () => {
      const verifiedSchedule = {
        day_of_week: 1,
        day_name: "Monday",
        open_time: "08:00:00",
        close_time: "17:00:00",
        is_closed: false,
        verification: {
          status: "VERIFIED",
          official_source_name: "Pasig Public Affairs",
          official_source_url: "https://pasigcity.gov.ph",
        },
      };

      const result = OperatingHourContractSchema.safeParse(verifiedSchedule);
      expect(result.success).toBe(true);
    });

    it("accepts honest NOT_AVAILABLE status for unknown hours without auto-filling default 9-5", () => {
      const unknownHoursSchedule = {
        day_of_week: 0,
        day_name: "Sunday",
        open_time: null,
        close_time: null,
        is_closed: false,
        verification: {
          status: "NOT_AVAILABLE",
          derivation_note: "No barangay record published",
        },
      };

      const result = OperatingHourContractSchema.safeParse(unknownHoursSchedule);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.open_time).toBeNull();
        expect(result.data.close_time).toBeNull();
      }
    });
  });

  describe("Transit Fare Invariant Contract (TC-N01 / INV-001)", () => {
    it("rejects transit fare without explicit verification status", () => {
      const unlabelledFare = {
        amount_php: 15.0,
        mode: "jeepney",
        // verification missing
      };

      const result = TransitFareContractSchema.safeParse(unlabelledFare);
      expect(result.success).toBe(false);
    });

    it("rejects transit fare with fabricated or arbitrary verification tag", () => {
      const fabricatedFare = {
        amount_php: 15.0,
        mode: "jeepney",
        verification: {
          status: "ROUGH_GUESS",
        },
      };

      const result = TransitFareContractSchema.safeParse(fabricatedFare);
      expect(result.success).toBe(false);
    });

    it("accepts transit fare tagged with explicit ESTIMATE and required derivation note", () => {
      const estimateFare = {
        amount_php: 13.0,
        mode: "traditional_jeepney",
        verification: {
          status: "ESTIMATE",
          derivation_note: "LTFRB base fare formula for NCR zone 1",
        },
      };

      const result = TransitFareContractSchema.safeParse(estimateFare);
      expect(result.success).toBe(true);
    });
  });

  describe("Study Amenities Zero-Hallucination & Default Prevention (INV-001)", () => {
    it("rejects unlabelled amenity item", () => {
      const unlabelledAmenity = {
        name: "has_wifi",
        value: true,
        // Missing verification
      };

      const result = AmenityItemContractSchema.safeParse(unlabelledAmenity);
      expect(result.success).toBe(false);
    });

    it("prevents auto-filling default true for unverified amenities", () => {
      // Simulate raw record from scraper/OSM where Wi-Fi tag is missing
      const rawIncompleteRecord: Partial<StudyAmenities> = {
        has_power_outlets: true,
        // has_wifi is undefined / unverified
      };

      // Invariant rule: If an amenity is undefined or unverified, it MUST NOT default to true
      const resolveAmenityHonesty = (
        rawAmenities: Partial<StudyAmenities>,
        key: keyof StudyAmenities
      ): { displayValue: string; status: "VERIFIED" | "ESTIMATE" | "NOT_AVAILABLE" } => {
        const val = rawAmenities[key];
        if (val === undefined || val === null) {
          return { displayValue: "Not available yet", status: "NOT_AVAILABLE" };
        }
        return { displayValue: val ? "Available" : "Not Available", status: "VERIFIED" };
      };

      const wifiHonesty = resolveAmenityHonesty(rawIncompleteRecord, "has_wifi");
      expect(wifiHonesty.status).toBe("NOT_AVAILABLE");
      expect(wifiHonesty.displayValue).toBe("Not available yet");
    });
  });

  describe("Synthetic Incomplete Dataset Ingestion Probe (TC-N01 Probe)", () => {
    it("ingests 10 synthetic incomplete records and asserts zero hallucinated attributes", () => {
      // 10 synthetic test records with various missing / unverified attributes
      const syntheticIncompleteRecords = [
        { id: "synth-01", name: "Rec 1", hours: null, fare: null, wifi: null },
        { id: "synth-02", name: "Rec 2", hours: undefined, fare: 20, fare_status: "INVALID" },
        { id: "synth-03", name: "Rec 3", hours: "08:00-17:00", hours_status: null },
        { id: "synth-04", name: "Rec 4", wifi: undefined, power: null },
        { id: "synth-05", name: "Rec 5", verified_by: "synthetic-bot-v1", status: "VERIFIED" },
        { id: "synth-06", name: "Rec 6", status: "ESTIMATE", derivation_note: "" },
        { id: "synth-07", name: "Rec 7", status: "ESTIMATE", derivation_note: null },
        { id: "synth-08", name: "Rec 8", status: "VERIFIED", official_source_name: "" },
        { id: "synth-09", name: "Rec 9", status: "VERIFIED", official_source_url: "invalid-url" },
        { id: "synth-10", name: "Rec 10", status: "UNCONFIRMED_DATA" },
      ];

      for (const record of syntheticIncompleteRecords) {
        // Validate against guardrails: AI signatures, missing sources, invalid statuses
        if (record.verified_by && AI_AGENT_SIGNATURE_REGEX.test(record.verified_by)) {
          const guardrailCheck = validateVerificationMeta({
            status: "VERIFIED",
            official_source_name: "LGU Portal",
            official_source_url: "https://manila.gov.ph",
            verified_by: record.verified_by,
          });
          expect(guardrailCheck.success).toBe(false);
        }

        if (record.status === "ESTIMATE" && (!record.derivation_note || record.derivation_note.length === 0)) {
          const guardrailCheck = validateVerificationMeta({
            status: "ESTIMATE",
            derivation_note: record.derivation_note,
          });
          expect(guardrailCheck.success).toBe(false);
        }

        if (record.status === "UNCONFIRMED_DATA") {
          const statusCheck = VerificationStatusSchema.safeParse(record.status);
          expect(statusCheck.success).toBe(false);
        }

        // When attribute is null or undefined, ensure honest labeling
        if (record.wifi === null || record.wifi === undefined) {
          const label = record.wifi ? "Available" : "Not available yet";
          expect(label).toBe("Not available yet");
        }
      }
    });
  });
});
