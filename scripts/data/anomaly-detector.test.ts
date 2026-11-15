import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  haversineDistanceMeters,
  detectAnomalies,
  generateAnomalyMarkdownReport,
  type DataAnomaly,
} from "./anomaly-detector";
import type { NormalizedCivicDataset } from "../../../../scripts/data/normalize-records";

describe("Geographic Anomaly Detector & Quality Pipeline (B-M3-01)", () => {
  const seedDatasetPath = path.resolve(process.cwd(), "data/normalized-libraries.json");
  const seedDataset: NormalizedCivicDataset = JSON.parse(
    fs.readFileSync(seedDatasetPath, "utf-8")
  );

  function createMockDataset(overrides?: Partial<NormalizedCivicDataset>): NormalizedCivicDataset {
    return {
      places: [
        {
          id: "place-001",
          name: "Ermita Public Reading Hub",
          category: "library",
          description: "Civic reading room in Ermita",
          lgu_city: "Manila",
          barangay: "Barangay 660",
          address: "123 Kalaw St, Manila",
          coordinates: { lat: 14.5828, lng: 120.9822 },
          point_geojson: {
            type: "Point",
            coordinates: [120.9822, 14.5828],
          },
          boundary_geojson: null,
          verification_id: "meta-001",
          created_at: "2026-11-01T00:00:00Z",
          updated_at: "2026-11-01T00:00:00Z",
          tri_state_status: "VERIFIED",
        },
      ],
      library_details: [
        {
          place_id: "place-001",
          is_barangay_reading_center: false,
          desk_capacity: 40,
          has_power_outlets: true,
          has_wifi: true,
          has_aircon: true,
          access_requirements: "Open to all students",
          fee_description: "Free",
          verification_id: "meta-001",
          tri_state_status: "VERIFIED",
        },
      ],
      operating_hours: [
        {
          id: "hour-001",
          place_id: "place-001",
          day_of_week: 1, // Monday
          open_time: "08:00:00",
          close_time: "17:00:00",
          is_closed: false,
          schedule_label: "Weekday Hours",
          verification_id: "meta-001",
          tri_state_status: "VERIFIED",
        },
      ],
      verification_meta: [
        {
          id: "meta-001",
          status: "VERIFIED",
          official_source_name: "Manila City Library Board",
          official_source_url: "https://manila.gov.ph/libraries",
          derivation_note: null,
          last_verified_at: "2026-10-15T08:00:00Z",
          verified_by: "Maria Santos (City Librarian)",
          is_stale_flag: false,
          age_in_days: 19,
        },
      ],
      summary: {
        totalPlaces: 1,
        totalLibraryDetails: 1,
        totalOperatingHours: 1,
        totalVerificationMeta: 1,
        statusBreakdown: { VERIFIED: 1, ESTIMATE: 0, NOT_AVAILABLE: 0 },
        staleRecordsCount: 0,
        freshRecordsCount: 1,
        validationPassed: true,
        normalizedAt: "2026-11-01T00:00:00Z",
      },
      ...overrides,
    };
  }

  describe("Haversine Distance Metric", () => {
    it("returns 0 meters for identical coordinates", () => {
      const dist = haversineDistanceMeters(14.5828, 120.9822, 14.5828, 120.9822);
      expect(dist).toBe(0);
    });

    it("calculates accurate metric distance between known Metro Manila landmarks", () => {
      // Manila City Hall (14.5895, 120.9815) to National Library (14.5828, 120.9822) ~ 745m
      const dist = haversineDistanceMeters(14.5895, 120.9815, 14.5828, 120.9822);
      expect(dist).toBeGreaterThan(700);
      expect(dist).toBeLessThan(800);
    });
  });

  describe("1. Coordinate Bounds & Geometry Checks (NCR Bounding Box)", () => {
    it("flags coordinates located outside the Metro Manila bounding box as CRITICAL", () => {
      const mock = createMockDataset();
      mock.places[0]!.coordinates = { lat: 15.5, lng: 120.9822 }; // North of NCR (Baguio/Central Luzon)

      const report = detectAnomalies(mock);
      const boundsAnomalies = report.anomalies.filter((a) => a.category === "COORDINATES_BOUNDS");

      expect(boundsAnomalies.length).toBe(1);
      expect(boundsAnomalies[0]?.severity).toBe("CRITICAL");
      expect(boundsAnomalies[0]?.ruleCode).toBe("NCR_BOUNDING_BOX");
      expect(report.validationPassed).toBe(false);
    });

    it("flags non-finite or NaN coordinates as CRITICAL", () => {
      const mock = createMockDataset();
      mock.places[0]!.coordinates = { lat: NaN, lng: 120.9822 };

      const report = detectAnomalies(mock);
      const geomAnomalies = report.anomalies.filter((a) => a.category === "COORDINATES_GEOMETRY");

      expect(geomAnomalies.some((a) => a.severity === "CRITICAL")).toBe(true);
      expect(report.validationPassed).toBe(false);
    });

    it("flags mismatch between GeoJSON point coordinates and record coordinates", () => {
      const mock = createMockDataset();
      mock.places[0]!.point_geojson = {
        type: "Point",
        coordinates: [121.05, 14.65], // Divergent from record coordinates [120.9822, 14.5828]
      };

      const report = detectAnomalies(mock);
      const mismatch = report.anomalies.find((a) => a.ruleCode === "GEOJSON_COORDINATE_MISMATCH");

      expect(mismatch).toBeDefined();
      expect(mismatch?.severity).toBe("HIGH");
    });
  });

  describe("2. Spatial Proximity & Duplicate Facilities (< 50m radius)", () => {
    it("flags facilities within 50m of each other as duplicates", () => {
      const mock = createMockDataset();
      const p1 = mock.places[0]!;

      // Add a second facility 15 meters away with similar name
      mock.places.push({
        ...p1,
        id: "place-002",
        name: "Ermita Public Reading Hub Extension",
        coordinates: {
          lat: p1.coordinates.lat + 0.0001, // ~11m offset
          lng: p1.coordinates.lng,
        },
        point_geojson: {
          type: "Point",
          coordinates: [p1.coordinates.lng, p1.coordinates.lat + 0.0001],
        },
      });

      const report = detectAnomalies(mock, { proximityThresholdMeters: 50.0 });
      const dup = report.anomalies.find((a) => a.category === "SPATIAL_DUPLICATE");

      expect(dup).toBeDefined();
      expect(dup?.severity).toBe("HIGH");
      expect(dup?.ruleCode).toBe("PROXIMITY_50M");
      expect(report.validationPassed).toBe(false);
    });

    it("does not flag facilities separated by more than 50 meters", () => {
      const mock = createMockDataset();
      const p1 = mock.places[0]!;

      mock.places.push({
        ...p1,
        id: "place-002",
        name: "Intramuros Study Nook",
        coordinates: {
          lat: p1.coordinates.lat + 0.005, // ~550m away
          lng: p1.coordinates.lng,
        },
        point_geojson: {
          type: "Point",
          coordinates: [p1.coordinates.lng, p1.coordinates.lat + 0.005],
        },
      });

      const report = detectAnomalies(mock, { proximityThresholdMeters: 50.0 });
      const dup = report.anomalies.find((a) => a.category === "SPATIAL_DUPLICATE");

      expect(dup).toBeUndefined();
    });
  });

  describe("3. Operating Hours Schedule Conflicts & Inversions", () => {
    it("detects time inversion where close_time <= open_time", () => {
      const mock = createMockDataset();
      mock.operating_hours[0]!.open_time = "18:00:00";
      mock.operating_hours[0]!.close_time = "08:00:00"; // Inverted

      const report = detectAnomalies(mock);
      const inversion = report.anomalies.find((a) => a.category === "OPERATING_HOURS_INVERSION");

      expect(inversion).toBeDefined();
      expect(inversion?.severity).toBe("HIGH");
      expect(inversion?.ruleCode).toBe("TIME_INVERSION");
    });

    it("detects missing times when facility is marked as open (is_closed: false)", () => {
      const mock = createMockDataset();
      mock.operating_hours[0]!.is_closed = false;
      mock.operating_hours[0]!.open_time = null;

      const report = detectAnomalies(mock);
      const stateErr = report.anomalies.find((a) => a.ruleCode === "OPEN_HOURS_MISSING");

      expect(stateErr).toBeDefined();
      expect(stateErr?.severity).toBe("HIGH");
    });

    it("flags conflicting open and closed schedules on the same day", () => {
      const mock = createMockDataset();
      // Add a second schedule for Monday marked is_closed: true
      mock.operating_hours.push({
        id: "hour-002",
        place_id: "place-001",
        day_of_week: 1, // Same Monday
        open_time: null,
        close_time: null,
        is_closed: true,
        schedule_label: "Closed holiday",
        verification_id: "meta-001",
        tri_state_status: "VERIFIED",
      });

      const report = detectAnomalies(mock);
      const overlap = report.anomalies.find((a) => a.ruleCode === "CONTRADICTORY_DAY_STATE");

      expect(overlap).toBeDefined();
      expect(overlap?.severity).toBe("HIGH");
    });

    it("flags overlapping shifts on the same day", () => {
      const mock = createMockDataset();
      // Hour 1: 08:00 - 13:00
      mock.operating_hours[0]!.open_time = "08:00:00";
      mock.operating_hours[0]!.close_time = "13:00:00";

      // Hour 2: 12:00 - 17:00 (overlaps between 12:00 and 13:00)
      mock.operating_hours.push({
        id: "hour-002",
        place_id: "place-001",
        day_of_week: 1,
        open_time: "12:00:00",
        close_time: "17:00:00",
        is_closed: false,
        schedule_label: "Afternoon shift",
        verification_id: "meta-001",
        tri_state_status: "VERIFIED",
      });

      const report = detectAnomalies(mock);
      const overlap = report.anomalies.find((a) => a.ruleCode === "SCHEDULE_TIME_OVERLAP");

      expect(overlap).toBeDefined();
      expect(overlap?.severity).toBe("HIGH");
    });
  });

  describe("4. Verification Metadata & AI Guardrails (INV-001, NV-001, NV-002, NV-004)", () => {
    it("flags forbidden AI signatures in verified_by as CRITICAL (NV-001)", () => {
      const mock = createMockDataset();
      mock.verification_meta[0]!.verified_by = "gpt-4o-auditor-agent";

      const report = detectAnomalies(mock);
      const aiAnom = report.anomalies.find((a) => a.category === "METADATA_AI_FORBIDDEN");

      expect(aiAnom).toBeDefined();
      expect(aiAnom?.severity).toBe("CRITICAL");
      expect(aiAnom?.ruleCode).toBe("NV-001");
      expect(report.validationPassed).toBe(false);
    });

    it("flags missing official source URL for VERIFIED records as HIGH (NV-002)", () => {
      const mock = createMockDataset();
      mock.verification_meta[0]!.official_source_url = "not-a-valid-url";

      const report = detectAnomalies(mock);
      const urlAnom = report.anomalies.find((a) => a.category === "METADATA_INVALID_URL");

      expect(urlAnom).toBeDefined();
      expect(urlAnom?.severity).toBe("HIGH");
      expect(urlAnom?.ruleCode).toBe("NV-002");
    });

    it("flags missing derivation note for ESTIMATE records as HIGH (NV-004)", () => {
      const mock = createMockDataset();
      mock.verification_meta[0]!.status = "ESTIMATE";
      mock.verification_meta[0]!.derivation_note = null; // Missing required derivation note

      const report = detectAnomalies(mock);
      const metaAnom = report.anomalies.find((a) => a.ruleCode === "NV-004");

      expect(metaAnom).toBeDefined();
      expect(metaAnom?.severity).toBe("HIGH");
    });
  });

  describe("5. Relational & Foreign Key Integrity", () => {
    it("flags missing verification_meta record referenced by a place as CRITICAL", () => {
      const mock = createMockDataset();
      mock.places[0]!.verification_id = "non-existent-meta-id";

      const report = detectAnomalies(mock);
      const fkAnom = report.anomalies.find((a) => a.ruleCode === "FK_VERIFICATION_META");

      expect(fkAnom).toBeDefined();
      expect(fkAnom?.severity).toBe("CRITICAL");
      expect(report.validationPassed).toBe(false);
    });
  });

  describe("6. Baseline Production Seed Dataset Audit", () => {
    it("validates the normalized production dataset with 100/100 integrity score and zero blockers", () => {
      const report = detectAnomalies(seedDataset);

      expect(report.datasetStats.totalPlaces).toBe(36);
      expect(report.datasetStats.totalOperatingHours).toBe(252);
      expect(report.integrityScore).toBe(100);
      expect(report.validationPassed).toBe(true);
      expect(report.anomaliesSummary.critical).toBe(0);
      expect(report.anomaliesSummary.high).toBe(0);
    });

    it("generates markdown report with executive scorecard and zero defects confirmation", () => {
      const report = detectAnomalies(seedDataset);
      const markdown = generateAnomalyMarkdownReport(report);

      expect(markdown).toContain("# Data Quality & Geographic Anomaly Report — Lunhaw");
      expect(markdown).toContain("Dataset Integrity Score");
      expect(markdown).toContain("100/100");
      expect(markdown).toContain("No anomalies detected.");
      expect(markdown).toContain("Remediation Workflow & Data Governance (ADR-002)");
    });
  });
});
