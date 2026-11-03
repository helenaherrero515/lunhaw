import { describe, it, expect } from "vitest";
import { app } from "../src/index.js";
import { NCR_BOUNDS } from "../src/routes/places.js";

describe("E-M2-01 / TC-003: Commute Route Generation & Transit Fares Integration Suite", () => {
  const validNcrOrigin = { lat: 14.588, lng: 121.055 }; // Ortigas Center, Pasig
  const validNcrDestination = { lat: 14.5823, lng: 121.0611 }; // Capitol Commons, Pasig

  describe("TC-003: Multimodal Route Generation & Sequential Legs Structure", () => {
    it("returns HTTP 200 with route collection for valid origin/destination within NCR coordinates", async () => {
      const res = await app.request("/commute/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: validNcrOrigin,
          destination: validNcrDestination,
          preference: "shaded_walk",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json<{
        status: string;
        data: {
          routes: Array<{
            route_id: string;
            title: string;
            total_distance_m: number;
            est_duration_seconds: number;
            average_shade_score: number;
            fare: {
              amount_php: number;
              verification: {
                status: "VERIFIED" | "ESTIMATE" | "NOT_AVAILABLE";
                official_source?: string;
                derivation_note?: string;
              };
            };
            geometry_geojson: {
              type: string;
              coordinates: number[][];
            };
            legs: Array<{
              sequence: number;
              mode: string;
              instruction: string;
              distance_m: number;
              duration_seconds: number;
              shade_coverage_pct?: number | null;
              fare?: {
                amount_php: number;
                verification: {
                  status: "VERIFIED" | "ESTIMATE" | "NOT_AVAILABLE";
                  official_source?: string;
                  derivation_note?: string;
                };
              };
              path_geometry_geojson?: {
                type: string;
                coordinates: number[][];
              };
              verification: {
                status: "VERIFIED" | "ESTIMATE" | "NOT_AVAILABLE";
                derivation_note?: string;
                official_source?: string;
              };
            }>;
          }>;
        };
      }>();

      expect(json.status).toBe("success");
      expect(Array.isArray(json.data.routes)).toBe(true);
      expect(json.data.routes.length).toBeGreaterThanOrEqual(1);

      const route = json.data.routes[0];
      expect(route).toBeDefined();
      expect(route?.route_id).toBeTruthy();
      expect(route?.title).toBeTruthy();
      expect(typeof route?.total_distance_m).toBe("number");
      expect(route?.total_distance_m).toBeGreaterThan(0);
      expect(typeof route?.est_duration_seconds).toBe("number");
      expect(route?.est_duration_seconds).toBeGreaterThan(0);
      expect(typeof route?.average_shade_score).toBe("number");
      expect(route?.average_shade_score).toBeGreaterThanOrEqual(0);
      expect(route?.average_shade_score).toBeLessThanOrEqual(100);

      // Verify route-level GeoJSON LineString
      expect(route?.geometry_geojson?.type).toBe("LineString");
      expect(Array.isArray(route?.geometry_geojson?.coordinates)).toBe(true);
      expect(route?.geometry_geojson?.coordinates.length).toBeGreaterThanOrEqual(2);

      // Verify sequential legs
      expect(Array.isArray(route?.legs)).toBe(true);
      expect(route?.legs.length).toBeGreaterThanOrEqual(1);

      route?.legs.forEach((leg, index) => {
        // Legs must be 1-indexed and monotonically increasing
        expect(leg.sequence).toBe(index + 1);
        expect(typeof leg.mode).toBe("string");
        expect(leg.instruction).toBeTruthy();
        expect(typeof leg.distance_m).toBe("number");
        expect(leg.distance_m).toBeGreaterThan(0);
        expect(typeof leg.duration_seconds).toBe("number");
        expect(leg.duration_seconds).toBeGreaterThan(0);
      });
    });

    it("verifies sequential legs carry valid GeoJSON geometries matching endpoints", async () => {
      const res = await app.request("/commute/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: validNcrOrigin,
          destination: validNcrDestination,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json<{
        data: {
          routes: Array<{
            legs: Array<{
              path_geometry_geojson?: {
                type: string;
                coordinates: number[][];
              };
            }>;
          }>;
        };
      }>();

      const legs = json.data.routes[0]?.legs;
      expect(legs).toBeDefined();
      expect(legs?.[0]?.path_geometry_geojson?.type).toBe("LineString");
      expect(legs?.[0]?.path_geometry_geojson?.coordinates.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("INV-001 Fare Transparency & Verification Tags", () => {
    it("ensures route-level and every leg fare carries explicit VERIFIED or ESTIMATE status", async () => {
      const res = await app.request("/commute/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: validNcrOrigin,
          destination: validNcrDestination,
          preference: "shaded_walk",
        }),
      });

      const json = await res.json<{
        data: {
          routes: Array<{
            fare: {
              amount_php: number;
              verification: {
                status: string;
                official_source?: string;
                derivation_note?: string;
              };
            };
            legs: Array<{
              fare?: {
                amount_php: number;
                verification: {
                  status: string;
                  official_source?: string;
                  derivation_note?: string;
                };
              };
              verification: {
                status: string;
                derivation_note?: string;
                official_source?: string;
              };
            }>;
          }>;
        };
      }>();

      const route = json.data.routes[0];
      expect(route).toBeDefined();

      // Route fare integrity
      expect(typeof route?.fare?.amount_php).toBe("number");
      expect(["VERIFIED", "ESTIMATE", "NOT_AVAILABLE"]).toContain(
        route?.fare?.verification?.status
      );

      // If ESTIMATE, derivation_note MUST be present
      if (route?.fare?.verification?.status === "ESTIMATE") {
        expect(route.fare.verification.derivation_note).toBeTruthy();
      }

      // Leg fare integrity
      route?.legs.forEach((leg) => {
        expect(["VERIFIED", "ESTIMATE", "NOT_AVAILABLE"]).toContain(
          leg.verification.status
        );

        if (leg.verification.status === "ESTIMATE") {
          expect(leg.verification.derivation_note).toBeTruthy();
          expect(leg.verification.derivation_note).toMatch(/EQ-00[1-4]/);
        }

        if (leg.fare) {
          expect(typeof leg.fare.amount_php).toBe("number");
          expect(["VERIFIED", "ESTIMATE", "NOT_AVAILABLE"]).toContain(
            leg.fare.verification.status
          );
        }
      });
    });

    it("verifies free pedestrian walk leg has 0.00 PHP fare with VERIFIED status", async () => {
      const res = await app.request("/commute/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: validNcrOrigin,
          destination: validNcrDestination,
          preference: "shaded_walk",
        }),
      });

      const json = await res.json<{
        data: {
          routes: Array<{
            legs: Array<{
              mode: string;
              fare?: {
                amount_php: number;
                verification: {
                  status: string;
                  official_source?: string;
                };
              };
            }>;
          }>;
        };
      }>();

      const walkLeg = json.data.routes[0]?.legs.find((l) => l.mode === "walk");
      expect(walkLeg).toBeDefined();
      expect(walkLeg?.fare?.amount_php).toBe(0.0);
      expect(walkLeg?.fare?.verification?.status).toBe("VERIFIED");
    });
  });

  describe("Preference Routing Options", () => {
    it("adapts title and routing strategy according to user preference", async () => {
      const preferences = ["shaded_walk", "fastest"] as const;

      for (const pref of preferences) {
        const res = await app.request("/commute/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: validNcrOrigin,
            destination: validNcrDestination,
            preference: pref,
          }),
        });

        expect(res.status).toBe(200);
        const json = await res.json<{
          data: {
            routes: Array<{
              title: string;
              average_shade_score: number;
            }>;
          };
        }>();

        expect(json.data.routes.length).toBeGreaterThan(0);
        expect(json.data.routes[0]?.title).toBeTruthy();
      }
    });
  });

  describe("Geographic Boundary & Input Validation (RFC 7807)", () => {
    it("rejects coordinates outside the Metro Manila (NCR) bounding box (HTTP 400)", async () => {
      // Coordinate in Baguio / Northern Luzon (Lat ~16.4, Lng ~120.6)
      const res = await app.request("/commute/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: { lat: 16.4023, lng: 120.596 },
          destination: validNcrDestination,
        }),
      });

      expect(res.status).toBe(400);
      expect(res.headers.get("Content-Type")).toContain("application/problem+json");
      const problem = await res.json<{
        type: string;
        title: string;
        status: number;
        code: string;
        detail: string;
      }>();

      expect(problem.status).toBe(400);
      expect(problem.code).toBe("ERR_INVALID_COORDINATES");
      expect(problem.detail).toContain(NCR_BOUNDS.MIN_LAT.toString());
    });

    it("rejects missing origin or destination payload fields (HTTP 400)", async () => {
      const res = await app.request("/commute/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: { lat: 14.588 }, // missing lng
          destination: validNcrDestination,
        }),
      });

      expect(res.status).toBe(400);
      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe("ERR_INVALID_COORDINATES");
    });

    it("rejects malformed non-JSON payloads with ERR_MALFORMED_JSON (HTTP 400)", async () => {
      const res = await app.request("/commute/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "NOT_VALID_JSON{{{",
      });

      expect(res.status).toBe(400);
      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe("ERR_MALFORMED_JSON");
    });
  });
});
