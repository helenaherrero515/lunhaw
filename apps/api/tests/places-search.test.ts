import { describe, it, expect } from 'vitest';
import { app } from '../src/index.js';
import { NCR_BOUNDS, MANDATORY_FACILITY_DISCLAIMER } from '../src/routes/places.js';

/**
 * E-M1-01 / TC-001: Places Search, Spatial Filter, and Latency SLA (< 500ms) Integration Test Suite
 *
 * Traceability:
 * - F-001: Explore Directory & Maps (Search & Filter)
 * - TC-001: Integration test for places search, radius filter, and latency SLA
 * - INV-001: Zero-Hallucination & Explicit Verification Metadata Status
 * - INV-002: Mandatory Advisory Disclaimer Banner Presence
 * - T-004: Latency SLA (< 500ms)
 */
describe('E-M1-01 / TC-001: Places Search, Spatial Filtering & Latency SLA', () => {
  describe('Directory Search by Category and LGU City (TC-001 positive path)', () => {
    it('returns matching reading centers for Pasig City with valid coordinates and verification metadata', async () => {
      const res = await app.request('/places?category=reading_center&city=Pasig');
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            name: string;
            category: string;
            city: string;
            barangay: string;
            coordinates: { lat: number; lng: number };
            verification: { status: string; official_source?: string };
            study_amenities?: {
              has_power_outlets: boolean;
              has_wifi: boolean;
            };
          }>;
          pagination: { page: number; per_page: number; total: number };
        };
      }>();

      expect(body.status).toBe('success');
      expect(Array.isArray(body.data.places)).toBe(true);
      expect(body.data.places.length).toBeGreaterThan(0);

      for (const place of body.data.places) {
        expect(place.category).toBe('reading_center');
        expect(place.city.toLowerCase()).toBe('pasig');
        // Coordinates must be within NCR bounds
        expect(place.coordinates.lat).toBeGreaterThanOrEqual(NCR_BOUNDS.MIN_LAT);
        expect(place.coordinates.lat).toBeLessThanOrEqual(NCR_BOUNDS.MAX_LAT);
        expect(place.coordinates.lng).toBeGreaterThanOrEqual(NCR_BOUNDS.MIN_LNG);
        expect(place.coordinates.lng).toBeLessThanOrEqual(NCR_BOUNDS.MAX_LNG);

        // Invariant INV-001: Must carry explicit verification status
        expect(['VERIFIED', 'ESTIMATE', 'NOT_AVAILABLE']).toContain(place.verification.status);
      }
    });

    it('returns public libraries for Manila with study amenities and coordinates', async () => {
      const res = await app.request('/places?category=library&city=Manila');
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            name: string;
            category: string;
            city: string;
            barangay: string;
            coordinates: { lat: number; lng: number };
            verification: { status: string };
            study_amenities?: {
              has_power_outlets: boolean;
              has_wifi: boolean;
              has_aircon: boolean;
            };
          }>;
        };
      }>();

      expect(body.status).toBe('success');
      expect(body.data.places.length).toBeGreaterThan(0);
      expect(body.data.places.every((p) => p.category === 'library')).toBe(true);
      expect(body.data.places.every((p) => p.city.toLowerCase() === 'manila')).toBe(true);
    });

    it('supports free-text keyword query matching facility names and descriptions', async () => {
      const res = await app.request('/places?query=Arroceros');
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            name: string;
            description?: string;
          }>;
        };
      }>();

      expect(body.status).toBe('success');
      expect(body.data.places.length).toBeGreaterThan(0);
      expect(
        body.data.places.some((p) => p.name.includes('Arroceros') || p.description?.includes('Arroceros'))
      ).toBe(true);
    });
  });

  describe('Spatial Radius Filtering (ST_DWithin Haversine logic)', () => {
    it('filters places within radius_km from center coordinates and sorts by distance', async () => {
      // Pasig City Hall coordinates: ~14.5580, 121.0820
      const centerLat = 14.558;
      const centerLng = 121.082;
      const radiusKm = 4.0;

      const res = await app.request(`/places?lat=${centerLat}&lng=${centerLng}&radius_km=${radiusKm}`);
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            name: string;
            coordinates: { lat: number; lng: number };
            distance_km?: number;
          }>;
          pagination: { total: number };
        };
      }>();

      expect(body.status).toBe('success');
      expect(body.data.places.length).toBeGreaterThan(0);

      // Verify every returned place is within the requested radius
      for (const place of body.data.places) {
        expect(place.distance_km).toBeDefined();
        expect(place.distance_km!).toBeLessThanOrEqual(radiusKm);
      }

      // Verify ascending distance ordering
      for (let i = 1; i < body.data.places.length; i++) {
        const prevDist = body.data.places[i - 1]?.distance_km ?? 0;
        const currDist = body.data.places[i]?.distance_km ?? 0;
        expect(currDist).toBeGreaterThanOrEqual(prevDist);
      }
    });

    it('returns narrower results or empty when radius is tightened', async () => {
      // Valenzuela coordinates: 14.7011, 120.9830 with very small radius 0.2km
      const centerLat = 14.7011;
      const centerLng = 120.983;
      const smallRadiusKm = 0.2;

      const res = await app.request(`/places?lat=${centerLat}&lng=${centerLng}&radius_km=${smallRadiusKm}`);
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{ id: string; distance_km?: number }>;
        };
      }>();

      expect(body.status).toBe('success');
      for (const place of body.data.places) {
        expect(place.distance_km!).toBeLessThanOrEqual(smallRadiusKm);
      }
    });
  });

  describe('Amenity Filtering (Study Haven discovery)', () => {
    it('filters places that provide Wi-Fi and power outlets', async () => {
      const res = await app.request('/places?amenities=wifi,power');
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            name: string;
            study_amenities?: {
              has_power_outlets: boolean;
              has_wifi: boolean;
            };
          }>;
        };
      }>();

      expect(body.status).toBe('success');
      expect(body.data.places.length).toBeGreaterThan(0);
      for (const place of body.data.places) {
        expect(place.study_amenities?.has_wifi).toBe(true);
        expect(place.study_amenities?.has_power_outlets).toBe(true);
      }
    });

    it('filters places that provide air conditioning', async () => {
      const res = await app.request('/places?amenities=aircon');
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            study_amenities?: { has_aircon: boolean };
          }>;
        };
      }>();

      expect(body.status).toBe('success');
      for (const place of body.data.places) {
        expect(place.study_amenities?.has_aircon).toBe(true);
      }
    });
  });

  describe('Pagination & Boundary Controls', () => {
    it('respects page and per_page parameters', async () => {
      const resPage1 = await app.request('/places?page=1&per_page=2');
      expect(resPage1.status).toBe(200);

      const body1 = await resPage1.json<{
        status: string;
        data: {
          places: Array<{ id: string }>;
          pagination: { page: number; per_page: number; total: number };
        };
      }>();

      expect(body1.data.places.length).toBeLessThanOrEqual(2);
      expect(body1.data.pagination.page).toBe(1);
      expect(body1.data.pagination.per_page).toBe(2);

      if (body1.data.pagination.total > 2) {
        const resPage2 = await app.request('/places?page=2&per_page=2');
        expect(resPage2.status).toBe(200);

        const body2 = await resPage2.json<{
          status: string;
          data: {
            places: Array<{ id: string }>;
            pagination: { page: number };
          };
        }>();

        expect(body2.data.pagination.page).toBe(2);
        // Page 1 and Page 2 should not share the first item
        expect(body1.data.places[0]?.id).not.toBe(body2.data.places[0]?.id);
      }
    });
  });

  describe('Coordinate Validation & Error Handling (RFC 7807)', () => {
    it('rejects coordinates outside the Metro Manila NCR bounding box with 400 ERR_INVALID_COORDINATES', async () => {
      // 12.0 N, 125.0 E is in Eastern Samar, well outside NCR bounds (14.3–14.8 N, 120.9–121.2 E)
      const res = await app.request('/places?lat=12.0&lng=125.0');
      expect(res.status).toBe(400);
      expect(res.headers.get('content-type')).toContain('application/problem+json');

      const problem = await res.json<{
        type: string;
        title: string;
        status: number;
        detail: string;
        code: string;
        invalid_params?: Array<{ name: string; reason: string }>;
      }>();

      expect(problem.status).toBe(400);
      expect(problem.code).toBe('ERR_INVALID_COORDINATES');
      expect(problem.title).toBe('Coordinates Out of Bounds');
      expect(problem.invalid_params?.length).toBeGreaterThan(0);
    });

    it('rejects incomplete coordinates when lat is provided without lng', async () => {
      const res = await app.request('/places?lat=14.55');
      expect(res.status).toBe(400);

      const problem = await res.json<{ code: string; title: string }>();
      expect(problem.code).toBe('ERR_INVALID_COORDINATES');
      expect(problem.title).toBe('Incomplete Coordinates');
    });

    it('rejects invalid radius_km parameter outside [0.1, 25.0] km', async () => {
      const res = await app.request('/places?lat=14.55&lng=121.05&radius_km=50.0');
      expect(res.status).toBe(400);

      const problem = await res.json<{ code: string; title: string }>();
      expect(problem.code).toBe('ERR_INVALID_COORDINATES');
      expect(problem.title).toBe('Invalid Radius Parameter');
    });
  });

  describe('Performance SLA (< 500ms query latency target)', () => {
    it('executes category and city search within 500ms latency SLA (T-004 / E-M1-01)', async () => {
      const startTime = performance.now();
      const res = await app.request('/places?category=reading_center&city=Pasig');
      const elapsedMs = performance.now() - startTime;

      expect(res.status).toBe(200);
      expect(elapsedMs).toBeLessThan(500);
    });

    it('executes spatial radius calculation within 500ms latency SLA (T-004 / E-M1-01)', async () => {
      const startTime = performance.now();
      const res = await app.request('/places?lat=14.5828&lng=120.9822&radius_km=5.0');
      const elapsedMs = performance.now() - startTime;

      expect(res.status).toBe(200);
      expect(elapsedMs).toBeLessThan(500);
    });

    it('executes complex multi-filter search (amenities + radius) within 500ms latency SLA', async () => {
      const startTime = performance.now();
      const res = await app.request(
        '/places?category=library&lat=14.59&lng=120.99&radius_km=10.0&amenities=wifi'
      );
      const elapsedMs = performance.now() - startTime;

      expect(res.status).toBe(200);
      expect(elapsedMs).toBeLessThan(500);
    });
  });

  describe('Negative Invariant Guardrails (INV-001 Zero Hallucination & INV-002 Disclaimer)', () => {
    it('asserts every returned place has explicit verification status (INV-001)', async () => {
      const res = await app.request('/places?per_page=50');
      expect(res.status).toBe(200);

      const body = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            verification: {
              status: string;
              official_source?: string;
              source_url?: string;
              derivation_note?: string;
            };
          }>;
        };
      }>();

      for (const place of body.data.places) {
        expect(['VERIFIED', 'ESTIMATE', 'NOT_AVAILABLE']).toContain(place.verification.status);
        if (place.verification.status === 'VERIFIED') {
          expect(place.verification.official_source).toBeDefined();
        }
      }
    });

    it('asserts place detail endpoint returns the mandatory advisory disclaimer copy (INV-002)', async () => {
      // First get a place ID
      const listRes = await app.request('/places?per_page=1');
      const listBody = await listRes.json<{ data: { places: Array<{ id: string }> } }>();
      const placeId = listBody.data.places[0]?.id;
      expect(placeId).toBeDefined();

      const detailRes = await app.request(`/places/${placeId}`);
      expect(detailRes.status).toBe(200);

      const detailBody = await detailRes.json<{
        data: {
          id: string;
          disclaimer: string;
          schedules: Array<{ day_of_week: number; verification: { status: string } }>;
        };
      }>();

      expect(detailBody.data.disclaimer).toBeDefined();
      expect(detailBody.data.disclaimer).toContain(
        'Please verify operating hours directly with the facility'
      );
      expect(detailBody.data.schedules.length).toBeGreaterThan(0);
      for (const schedule of detailBody.data.schedules) {
        expect(['VERIFIED', 'ESTIMATE', 'NOT_AVAILABLE']).toContain(schedule.verification.status);
      }
    });
  });
});
