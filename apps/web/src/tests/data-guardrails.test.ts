import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect } from "vitest";
import {
  validateVerificationMeta,
  validateDerivedCalculation,
  VerificationMeta,
  DerivedCalculation,
} from "@/lib/guardrails";
import {
  ALLOWED_PEDESTRIAN_HIGHWAYS,
  FORBIDDEN_HIGHWAYS,
  filterNcrPedestrianNetwork,
  isCoordinateInNcr,
  OsmFeatureCollection,
  OsmFeature,
} from "../../../../scripts/osm/filter-ncr-walkways";

describe("Data Guardrails & Zero-Hallucination Verification (INV-001)", () => {
  describe("AI & Synthetic Verification Prohibition (NV-001 & NV-002)", () => {
    it("rejects VERIFIED status when assigned by an AI agent or synthetic bot", () => {
      const syntheticAIAttempt: VerificationMeta = {
        status: "VERIFIED",
        official_source_name: "LGU Public Library Registry",
        official_source_url: "https://manila.gov.ph/libraries",
        verified_by: "gpt-4o-auditor-agent",
      };

      const result = validateVerificationMeta(syntheticAIAttempt);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "AI / synthetic agent (gpt-4o-auditor-agent) is prohibited from assigning VERIFIED status"
        );
      }
    });

    it("rejects VERIFIED status with other AI signatures (claude, gemini, synthetic-bot)", () => {
      const aiAgents = [
        "claude-3-5-sonnet",
        "gemini-pro-crawler",
        "synthetic-pipeline",
        "llm_reviewer",
        "copilot-bot",
      ];

      for (const agent of aiAgents) {
        const attempt = {
          status: "VERIFIED",
          official_source_name: "Quezon City Library Portal",
          official_source_url: "https://quezoncity.gov.ph/libraries",
          verified_by: agent,
        };
        const result = validateVerificationMeta(attempt);
        expect(result.success).toBe(false);
      }
    });

    it("rejects VERIFIED status when official_source_url is missing or empty", () => {
      const missingUrlAttempt = {
        status: "VERIFIED",
        official_source_name: "National Library of the Philippines",
        official_source_url: "",
        verified_by: "human_curator_01",
      };

      const result = validateVerificationMeta(missingUrlAttempt);
      expect(result.success).toBe(false);
      if (!result.success) {
        const urlIssue = result.error.issues.find(
          (issue) => issue.path.includes("official_source_url")
        );
        expect(urlIssue).toBeDefined();
      }
    });

    it("rejects VERIFIED status when official_source_name is missing or empty", () => {
      const missingNameAttempt = {
        status: "VERIFIED",
        official_source_name: "  ",
        official_source_url: "https://nlp.gov.ph/directory",
        verified_by: "human_curator_01",
      };

      const result = validateVerificationMeta(missingNameAttempt);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameIssue = result.error.issues.find(
          (issue) => issue.path.includes("official_source_name")
        );
        expect(nameIssue).toBeDefined();
      }
    });

    it("accepts VERIFIED status when backed by official primary source and human auditor", () => {
      const validVerifiedRecord: VerificationMeta = {
        status: "VERIFIED",
        official_source_name: "National Library of the Philippines (NLP) Directory",
        official_source_url: "https://web.nlp.gov.ph/nlp/?q=node/1447",
        last_verified_at: "2026-11-01T08:00:00.000Z",
        verified_by: "nlp_registered_librarian",
      };

      const result = validateVerificationMeta(validVerifiedRecord);
      expect(result.success).toBe(true);
    });

    it("enforces chk_verification_derivation: ESTIMATE requires a non-empty derivation_note", () => {
      const invalidEstimate = {
        status: "ESTIMATE",
        derivation_note: "",
      };

      const result = validateVerificationMeta(invalidEstimate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "chk_verification_derivation Violation: ESTIMATE records require a non-empty derivation_note"
        );
      }
    });

    it("accepts ESTIMATE when an explicit derivation note is provided", () => {
      const validEstimate: VerificationMeta = {
        status: "ESTIMATE",
        derivation_note:
          "Canopy percentage derived from Copernicus Sentinel-2 NDVI raster (DS-002) via EQ-001.",
      };

      const result = validateVerificationMeta(validEstimate);
      expect(result.success).toBe(true);
    });

    it("accepts NOT_AVAILABLE status without requiring source or derivation note", () => {
      const notAvailableRecord: VerificationMeta = {
        status: "NOT_AVAILABLE",
      };

      const result = validateVerificationMeta(notAvailableRecord);
      expect(result.success).toBe(true);
    });
  });

  describe("Derived Calculations Glass-Box Equation Contract", () => {
    it("fails validation when equation_id is missing from a derived metric", () => {
      const missingEquation = {
        metric_name: "Green Index Score",
        value: 78.5,
        input_dataset_ids: ["DS-001", "DS-002"],
        confidence_level: "MEDIUM",
        derivation_note: "Calculated using canopy and NDVI weighted sums.",
      };

      const result = validateDerivedCalculation(missingEquation);
      expect(result.success).toBe(false);
      if (!result.success) {
        const eqIssue = result.error.issues.find(
          (issue) => issue.path.includes("equation_id")
        );
        expect(eqIssue).toBeDefined();
      }
    });

    it("fails validation when equation_id is unapproved or hallucinated", () => {
      const fakeEquation = {
        metric_name: "Hypothetical Carbon Offset",
        value: 42.0,
        equation_id: "EQ-999-AI-GENERATED",
        input_dataset_ids: ["DS-001"],
        confidence_level: "LOW",
        derivation_note: "Estimated via random heuristic.",
      };

      const result = validateDerivedCalculation(fakeEquation);
      expect(result.success).toBe(false);
    });

    it("fails validation when input_dataset_ids cites an unregistered dataset", () => {
      const fakeDataset = {
        metric_name: "Walking Duration Estimate",
        value: 900,
        equation_id: "EQ-003",
        input_dataset_ids: ["DS-UNOFFICIAL-SCRAPE"],
        confidence_level: "LOW",
        derivation_note: "Estimated distance at 4.2 km/h.",
      };

      const result = validateDerivedCalculation(fakeDataset);
      expect(result.success).toBe(false);
    });

    it("validates legitimate calculations for EQ-001, EQ-002, EQ-003, and EQ-004", () => {
      const testCases: DerivedCalculation[] = [
        {
          metric_name: "Green Index Score",
          value: 82.5,
          equation_id: "EQ-001",
          input_dataset_ids: ["DS-001", "DS-002"],
          confidence_level: "MEDIUM",
          derivation_note:
            "Glass-box derivation: 0.50 * 85 (canopy) + 0.30 * 80 (ndvi) + 0.20 * 80 (permeable).",
        },
        {
          metric_name: "Route Shade Index",
          value: 72.0,
          equation_id: "EQ-002",
          input_dataset_ids: ["DS-001", "DS-002"],
          confidence_level: "MEDIUM",
          derivation_note:
            "Weighted segment shade coverage across 450 meters total path.",
        },
        {
          metric_name: "Walking Duration Seconds",
          value: 771,
          equation_id: "EQ-003",
          input_dataset_ids: ["DS-001"],
          confidence_level: "HIGH",
          derivation_note:
            "Walking duration at 4.2 km/h across 900 meters sidewalk network.",
        },
        {
          metric_name: "Jeepney Fare Estimate PHP",
          value: 14.8,
          equation_id: "EQ-004",
          input_dataset_ids: ["DS-003"],
          confidence_level: "HIGH",
          derivation_note:
            "Base fare 13.00 PHP for 4 km + 1 km excess at 1.80 PHP/km.",
        },
      ];

      for (const tc of testCases) {
        const result = validateDerivedCalculation(tc);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Sample OSM Pedestrian Network Invariant Validation", () => {
    function resolveSampleGeoJsonPath(): string {
      const candidates = [
        path.resolve(process.cwd(), "../../data/ncr-walkways-sample.geojson"),
        path.resolve(process.cwd(), "data/ncr-walkways-sample.geojson"),
        path.resolve(process.cwd(), "../data/ncr-walkways-sample.geojson"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
      return candidates[0] ?? "";
    }

    it("verifies the sample pedestrian GeoJSON fixture file exists", () => {
      const resolvedPath = resolveSampleGeoJsonPath();
      expect(fs.existsSync(resolvedPath)).toBe(true);
    });

    it("asserts that sample OSM network contains zero motorway or expressway features", () => {
      const resolvedPath = resolveSampleGeoJsonPath();
      const fileContent = fs.readFileSync(resolvedPath, "utf8");
      const geojson = JSON.parse(fileContent) as OsmFeatureCollection;

      expect(geojson.type).toBe("FeatureCollection");
      expect(geojson.features.length).toBeGreaterThan(0);

      for (const feature of geojson.features) {
        const highway = feature.properties.highway.toLowerCase().trim();

        // Must NOT be in forbidden highways
        expect(FORBIDDEN_HIGHWAYS[highway]).toBeUndefined();

        // Must NOT be toll road
        expect(feature.properties.toll).not.toBe("yes");

        // Must NOT have pedestrian ban
        expect(feature.properties.foot).not.toBe("no");

        // Must be in permitted highway types
        expect(ALLOWED_PEDESTRIAN_HIGHWAYS[highway]).toBe(true);

        // Coordinates must be strictly in NCR
        if (feature.geometry.type === "LineString") {
          const coords = feature.geometry.coordinates as [number, number][];
          for (const coord of coords) {
            const [lng, lat] = coord;
            expect(isCoordinateInNcr(lng, lat)).toBe(true);
          }
        }
      }
    });

    it("verifies filterNcrPedestrianNetwork filters out forbidden motorways and skyways", () => {
      const dirtyDataset: OsmFeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "safe-footway",
            properties: {
              highway: "footway",
              name: "Valid Park Footway",
              foot: "yes",
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [121.05, 14.55],
                [121.06, 14.56],
              ],
            },
          },
          {
            type: "Feature",
            id: "forbidden-skyway",
            properties: {
              highway: "motorway",
              name: "Metro Manila Skyway Stage 3",
              toll: "yes",
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [121.01, 14.58],
                [121.02, 14.59],
              ],
            },
          },
          {
            type: "Feature",
            id: "forbidden-nlex-link",
            properties: {
              highway: "motorway_link",
              name: "NLEX Connector Ramp",
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [120.99, 14.65],
                [121.0, 14.66],
              ],
            },
          },
          {
            type: "Feature",
            id: "forbidden-trunk",
            properties: {
              highway: "trunk",
              name: "C-5 Elevated Expressway Segment",
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [121.07, 14.57],
                [121.08, 14.58],
              ],
            },
          },
          {
            type: "Feature",
            id: "out-of-bounds-provincial-road",
            properties: {
              highway: "footway",
              name: "Baguio Session Road Walkway",
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [120.59, 16.41],
                [120.6, 16.42],
              ],
            },
          },
        ] as OsmFeature[],
      };

      const clean = filterNcrPedestrianNetwork(dirtyDataset);

      // Only the safe footway should pass
      expect(clean.features.length).toBe(1);
      expect(clean.features[0]?.id).toBe("safe-footway");
      expect(clean.features[0]?.properties.name).toBe("Valid Park Footway");
    });
  });
});
