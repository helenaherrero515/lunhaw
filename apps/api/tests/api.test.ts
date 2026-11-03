import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/index.js';
import {
  sanitizeUrl,
  sanitizePayload,
  sanitizedLogger,
  REDACTED_COORDINATES,
  type SanitizedLogEntry
} from '../src/middleware/sanitized-logger.js';
import { resetRateLimitStore } from '../src/middleware/rate-limiter.js';
import { MANDATORY_FACILITY_DISCLAIMER } from '../src/routes/places.js';
import { NCR_LGUS } from '../src/routes/locations.js';
import { Hono } from 'hono';

describe('Lunhaw API Gateway — M0 & M1 Core Suite', () => {
  beforeEach(() => {
    // Reset rate limiter state between tests to maintain test isolation
    resetRateLimitStore();
  });

  describe('Rate Limiter Middleware (A-M1-04, Invariant T-004)', () => {
    it('allows up to 60 requests per minute from a single client IP', async () => {
      const clientIp = '192.0.2.1';

      for (let i = 1; i <= 60; i++) {
        const res = await app.request('/places', {
          headers: { 'X-Forwarded-For': clientIp }
        });
        expect(res.status).toBe(200);
        expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
        const remaining = parseInt(res.headers.get('X-RateLimit-Remaining') || '-1', 10);
        expect(remaining).toBe(60 - i);
      }
    });

    it('returns HTTP 429 with Retry-After header on the 61st request (> 60 requests/min)', async () => {
      const clientIp = '192.0.2.2';

      // Exhaust 60 tokens
      for (let i = 0; i < 60; i++) {
        const res = await app.request('/places', {
          headers: { 'X-Forwarded-For': clientIp }
        });
        expect(res.status).toBe(200);
      }

      // 61st request MUST be rate limited
      const rateLimitedRes = await app.request('/places', {
        headers: { 'X-Forwarded-For': clientIp }
      });

      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.headers.get('content-type')).toContain('application/problem+json');

      // Retry-After header must be present and at least 1 second
      const retryAfter = rateLimitedRes.headers.get('retry-after');
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter!, 10)).toBeGreaterThanOrEqual(1);

      // Verify RFC 7807 problem details
      const problem = await rateLimitedRes.json<{
        type: string;
        title: string;
        status: number;
        code: string;
        detail: string;
      }>();
      expect(problem.status).toBe(429);
      expect(problem.code).toBe('ERR_RATE_LIMIT_EXCEEDED');
      expect(problem.title).toBe('Rate Limit Exceeded');
      expect(problem.type).toBe('https://api.lunhaw.ph/errors/ERR_RATE_LIMIT_EXCEEDED');
    });

    it('isolates rate limit token buckets between different client IP addresses', async () => {
      const ipA = '192.0.2.10';
      const ipB = '192.0.2.20';

      // Exhaust ipA
      for (let i = 0; i < 60; i++) {
        await app.request('/places', {
          headers: { 'X-Forwarded-For': ipA }
        });
      }

      const blockedRes = await app.request('/places', {
        headers: { 'X-Forwarded-For': ipA }
      });
      expect(blockedRes.status).toBe(429);

      // ipB should remain unblocked
      const freshRes = await app.request('/places', {
        headers: { 'X-Forwarded-For': ipB }
      });
      expect(freshRes.status).toBe(200);
      expect(freshRes.headers.get('X-RateLimit-Remaining')).toBe('59');
    });
  });

  describe('Health Endpoint (/health & /v1/health)', () => {
    it('returns 200 OK with runtime status and metadata', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        timestamp: string;
        uptime_seconds: number;
        environment: string;
        version: string;
      }>();

      expect(json.status).toBe('ok');
      expect(json.version).toBe('1.0.0');
      expect(typeof json.uptime_seconds).toBe('number');
      expect(typeof json.timestamp).toBe('string');
    });

    it('returns 200 OK via versioned /v1/health prefix', async () => {
      const res = await app.request('/v1/health');
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string }>();
      expect(json.status).toBe('ok');
    });
  });

  describe('Location Areas Directory (/locations/areas, A-M1-01, F-006, BR-004)', () => {
    it('returns all 17 Metro Manila LGUs for manual area selection fallback (F-006)', async () => {
      const res = await app.request('/locations/areas');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          lgus: Array<{ city_name: string; total_barangays: number; barangays: string[] }>;
        };
      }>();

      expect(json.status).toBe('success');
      expect(json.data.lgus.length).toBe(17);

      const cityNames = json.data.lgus.map((lgu) => lgu.city_name);
      const expected17LGUs = [
        'Caloocan',
        'Las Piñas',
        'Makati',
        'Malabon',
        'Mandaluyong',
        'Manila',
        'Marikina',
        'Muntinlupa',
        'Navotas',
        'Parañaque',
        'Pasay',
        'Pasig',
        'Pateros',
        'Quezon City',
        'San Juan',
        'Taguig',
        'Valenzuela'
      ];

      for (const expectedCity of expected17LGUs) {
        expect(cityNames).toContain(expectedCity);
      }

      // Assert each LGU carries non-empty barangay directory and positive total count
      for (const lgu of json.data.lgus) {
        expect(lgu.total_barangays).toBeGreaterThan(0);
        expect(lgu.barangays.length).toBeGreaterThan(0);
      }
    });

    it('filters LGUs by city query parameter', async () => {
      const res = await app.request('/locations/areas?city=Pasig');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          lgus: Array<{ city_name: string; total_barangays: number; barangays: string[] }>;
        };
      }>();

      expect(json.data.lgus.length).toBe(1);
      expect(json.data.lgus[0]?.city_name).toBe('Pasig');
      expect(json.data.lgus[0]?.barangays).toContain('San Antonio');
    });

    it('searches LGUs and barangays with free-text query parameter', async () => {
      const res = await app.request('/locations/areas?query=San Antonio');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          lgus: Array<{ city_name: string; barangays: string[] }>;
        };
      }>();

      expect(json.data.lgus.length).toBeGreaterThan(0);
      const hasSanAntonio = json.data.lgus.some(
        (lgu) => lgu.barangays.some((b) => b.includes('San Antonio'))
      );
      expect(hasSanAntonio).toBe(true);
    });
  });

  describe('Places Search & Radius Filter (A-M1-02, F-001, BR-001, INV-003)', () => {
    it('returns 200 OK with paginated places and verification metadata', async () => {
      const res = await app.request('/places');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            name: string;
            category: string;
            coordinates: { lat: number; lng: number };
            verification: { status: string };
          }>;
          pagination: { page: number; per_page: number; total: number };
        };
      }>();

      expect(json.status).toBe('success');
      expect(Array.isArray(json.data.places)).toBe(true);
      expect(json.data.places.length).toBeGreaterThan(0);
      expect(json.data.places[0]?.verification.status).toBe('VERIFIED');
      expect(json.data.pagination.page).toBe(1);
    });

    it('filters places within geographic proximity using ST_DWithin radius logic', async () => {
      // Coordinate near Pasig center (14.5823, 121.0611) with a 3km radius
      const res = await app.request('/places?lat=14.5823&lng=121.0611&radius_km=3.0');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          places: Array<{
            id: string;
            name: string;
            coordinates: { lat: number; lng: number };
            distance_km?: number;
          }>;
        };
      }>();

      expect(json.data.places.length).toBeGreaterThan(0);
      const firstPlace = json.data.places[0];
      expect(firstPlace?.name).toBe('Barangay San Antonio Reading Center');
      expect(firstPlace?.distance_km).toBeDefined();
      expect(firstPlace?.distance_km).toBeLessThanOrEqual(3.0);
    });

    it('excludes faraway facilities outside the specified radius_km', async () => {
      // Coordinate at Pasig (14.5823, 121.0611) with very small radius 0.5km
      const res = await app.request('/places?lat=14.5823&lng=121.0611&radius_km=0.5');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          places: Array<{
            name: string;
            city: string;
          }>;
        };
      }>();

      // Quezon City Public Library (~9km away) must be excluded
      const qcLibrary = json.data.places.find((p) => p.name.includes('Quezon City Public Library'));
      expect(qcLibrary).toBeUndefined();
    });

    it('filters places by category (library, park, garden, reading_center)', async () => {
      const res = await app.request('/places?category=library');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          places: Array<{ category: string }>;
        };
      }>();

      expect(json.data.places.length).toBeGreaterThan(0);
      for (const place of json.data.places) {
        expect(place.category).toBe('library');
      }
    });

    it('filters places by city and barangay', async () => {
      const res = await app.request('/places?city=Manila&barangay=Ermita');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          places: Array<{ city: string; address: string }>;
        };
      }>();

      expect(json.data.places.length).toBeGreaterThan(0);
      for (const place of json.data.places) {
        expect(place.city).toBe('Manila');
      }
    });

    it('filters places by study amenities (power, wifi, aircon, desks)', async () => {
      const res = await app.request('/places?amenities=power,wifi,aircon');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          places: Array<{
            study_amenities?: {
              has_power_outlets: boolean;
              has_wifi: boolean;
              has_aircon: boolean;
            };
          }>;
        };
      }>();

      expect(json.data.places.length).toBeGreaterThan(0);
      for (const place of json.data.places) {
        expect(place.study_amenities?.has_power_outlets).toBe(true);
        expect(place.study_amenities?.has_wifi).toBe(true);
        expect(place.study_amenities?.has_aircon).toBe(true);
      }
    });

    it('returns 400 when only one coordinate parameter is provided', async () => {
      const res = await app.request('/places?lat=14.5823');
      expect(res.status).toBe(400);

      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe('ERR_INVALID_COORDINATES');
    });

    it('returns 400 with RFC 7807 when coordinates lie outside NCR bounding box', async () => {
      const res = await app.request('/places?lat=12.0&lng=125.0');
      expect(res.status).toBe(400);
      expect(res.headers.get('content-type')).toContain('application/problem+json');

      const problem = await res.json<{
        type: string;
        title: string;
        status: number;
        code: string;
        invalid_params?: Array<{ name: string; reason: string }>;
      }>();

      expect(problem.status).toBe(400);
      expect(problem.code).toBe('ERR_INVALID_COORDINATES');
      expect(problem.title).toBe('Coordinates Out of Bounds');
      expect(problem.invalid_params?.length).toBeGreaterThan(0);
    });

    it('returns 400 when radius_km exceeds the 25.0 km boundary (T-004)', async () => {
      const res = await app.request('/places?lat=14.5823&lng=121.0611&radius_km=30.0');
      expect(res.status).toBe(400);

      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe('ERR_INVALID_COORDINATES');
    });
  });

  describe('Places Profile & Invariants (A-M1-03, F-002, INV-001, INV-002)', () => {
    it('returns 200 OK with mandatory facility disclaimer (INV-002) for place profile', async () => {
      const placeId = 'c1f7a0b3-6c7e-4d8a-9f5e-123456789abc';
      const res = await app.request(`/places/${placeId}`);
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          id: string;
          name: string;
          disclaimer: string;
          schedules: Array<{
            day_of_week: number;
            is_closed: boolean;
            verification: { status: string };
          }>;
          verification: { status: string };
          study_amenities: { has_power_outlets: boolean };
        };
      }>();

      expect(json.status).toBe('success');
      expect(json.data.id).toBe(placeId);

      // Invariant INV-002: Exact mandatory disclaimer copy MUST be present in profile
      expect(json.data.disclaimer).toBe(MANDATORY_FACILITY_DISCLAIMER);
      expect(json.data.disclaimer).toContain('Please verify operating hours directly with the facility');

      // Data Honesty (INV-001): Status must be tri-state VERIFIED
      expect(json.data.verification.status).toBe('VERIFIED');
      expect(json.data.schedules.length).toBeGreaterThan(0);
      for (const sched of json.data.schedules) {
        expect(['VERIFIED', 'ESTIMATE', 'NOT_AVAILABLE']).toContain(sched.verification.status);
      }
    });

    it('returns tri-state integrity status for ESTIMATE facilities with derivation notes', async () => {
      const estimatePlaceId = '20000000-0000-0000-0000-000000000003';
      const res = await app.request(`/places/${estimatePlaceId}`);
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          verification: {
            status: string;
            derivation_note?: string | null;
          };
          schedules: Array<{
            verification: { status: string; derivation_note?: string | null };
          }>;
        };
      }>();

      expect(json.data.verification.status).toBe('ESTIMATE');
      expect(json.data.verification.derivation_note).toBeDefined();
      expect(json.data.schedules[0]?.verification.status).toBe('ESTIMATE');
    });

    it('returns tri-state integrity status for NOT_AVAILABLE facilities without hallucination', async () => {
      const pendingPlaceId = '20000000-0000-0000-0000-000000000004';
      const res = await app.request(`/places/${pendingPlaceId}`);
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        data: {
          verification: { status: string };
          schedules: Array<{ verification: { status: string } }>;
        };
      }>();

      expect(json.data.verification.status).toBe('NOT_AVAILABLE');
      expect(json.data.schedules[0]?.verification.status).toBe('NOT_AVAILABLE');
    });

    it('returns 404 with RFC 7807 Problem Details for non-existent place', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await app.request(`/places/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toContain('application/problem+json');

      const problem = await res.json<{
        type: string;
        title: string;
        status: number;
        detail: string;
        code: string;
      }>();

      expect(problem.status).toBe(404);
      expect(problem.code).toBe('ERR_PLACE_NOT_FOUND');
      expect(problem.title).toBe('Place Not Found');
      expect(problem.type).toBe('https://api.lunhaw.ph/errors/ERR_PLACE_NOT_FOUND');
      expect(problem.detail).toContain(nonExistentId);
    });
  });

  describe('RFC 7807 Global Error Handling', () => {
    it('returns 404 RFC 7807 Problem Details for unknown routes', async () => {
      const res = await app.request('/v1/non-existent-endpoint');

      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toContain('application/problem+json');

      const problem = await res.json<{
        type: string;
        title: string;
        status: number;
        detail: string;
        instance: string;
        code: string;
      }>();

      expect(problem.status).toBe(404);
      expect(problem.code).toBe('ERR_ROUTE_NOT_FOUND');
      expect(problem.type).toBe('https://api.lunhaw.ph/errors/ERR_ROUTE_NOT_FOUND');
      expect(problem.title).toBe('Route Not Found');
      expect(problem.instance).toBe('/v1/non-existent-endpoint');
      expect(problem.detail).toContain('Endpoint does not exist');
    });
  });

  describe('Coordinate Sanitization & Logging (RA 10173 & Invariant T-003)', () => {
    it('sanitizes coordinate parameters from query strings', () => {
      const rawUrl = 'https://api.lunhaw.ph/v1/places?lat=14.5823&lng=121.0611&category=park';
      const sanitized = sanitizeUrl(rawUrl);

      expect(sanitized).not.toContain('14.5823');
      expect(sanitized).not.toContain('121.0611');
      expect(sanitized).toContain(`lat=${REDACTED_COORDINATES}`);
      expect(sanitized).toContain(`lng=${REDACTED_COORDINATES}`);
      expect(sanitized).toContain('category=park');
    });

    it('sanitizes coordinates in POST request payloads', () => {
      const rawPayload = {
        origin: { lat: 14.588, lng: 121.055 },
        destination: { lat: 14.5823, lng: 121.0611 },
        preference: 'shaded_walk',
        user_note: 'Meeting at 2pm'
      };

      const sanitized = sanitizePayload(rawPayload) as typeof rawPayload;

      expect(sanitized.origin.lat).toBe(REDACTED_COORDINATES);
      expect(sanitized.origin.lng).toBe(REDACTED_COORDINATES);
      expect(sanitized.destination.lat).toBe(REDACTED_COORDINATES);
      expect(sanitized.destination.lng).toBe(REDACTED_COORDINATES);
      expect(sanitized.preference).toBe('shaded_walk');
      expect(sanitized.user_note).toBe('Meeting at 2pm');
    });

    it('sanitizedLogger middleware scrubs coordinates from log output', async () => {
      let loggedLine = '';
      const customWriter = (_entry: SanitizedLogEntry, formattedLine: string) => {
        loggedLine = formattedLine;
      };

      const testApp = new Hono();
      testApp.use('*', sanitizedLogger({ writer: customWriter }));
      testApp.get('/test', (c) => c.text('ok'));

      await testApp.request('/test?lat=14.5823&lng=121.0611');

      expect(loggedLine).not.toContain('14.5823');
      expect(loggedLine).not.toContain('121.0611');
      expect(loggedLine).toContain(REDACTED_COORDINATES);
    });
  });

  describe('Commute Route Planning (/commute/routes)', () => {
    it('plans multi-modal route within NCR and calculates shade score', async () => {
      const res = await app.request('/commute/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: 14.588, lng: 121.055 },
          destination: { lat: 14.5823, lng: 121.0611 },
          preference: 'shaded_walk'
        })
      });

      expect(res.status).toBe(200);
      const json = await res.json<{
        status: string;
        data: {
          routes: Array<{
            route_id: string;
            average_shade_score: number;
            legs: Array<{ mode: string; shade_coverage_pct: number }>;
          }>;
        };
      }>();

      expect(json.status).toBe('success');
      expect(json.data.routes.length).toBeGreaterThan(0);
      expect(json.data.routes[0]?.average_shade_score).toBeGreaterThan(0);
      expect(json.data.routes[0]?.legs[0]?.mode).toBe('walk');
    });

    it('rejects commute routes with out-of-bounds coordinates (400)', async () => {
      const res = await app.request('/commute/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: 10.0, lng: 120.0 }, // outside NCR
          destination: { lat: 14.5823, lng: 121.0611 }
        })
      });

      expect(res.status).toBe(400);
      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe('ERR_INVALID_COORDINATES');
    });
  });

  describe('Saved Bookmarks (/saved)', () => {
    it('manages pseudonymous session bookmarks', async () => {
      const sessionId = 'test-session-123';

      // 1. Create a bookmark
      const createRes = await app.request('/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          item_type: 'place',
          place_id: 'c1f7a0b3-6c7e-4d8a-9f5e-123456789abc',
          notes: 'Great study haven'
        })
      });

      expect(createRes.status).toBe(201);
      const created = await createRes.json<{
        status: string;
        data: { id: string; client_session_id: string; item_type: string };
      }>();
      expect(created.data.client_session_id).toBe(sessionId);
      expect(created.data.item_type).toBe('place');

      // 2. Fetch bookmarks for session
      const fetchRes = await app.request('/saved', {
        headers: { 'X-Session-ID': sessionId }
      });
      expect(fetchRes.status).toBe(200);
      const fetched = await fetchRes.json<{
        status: string;
        data: { items: Array<{ id: string }> };
      }>();
      expect(fetched.data.items.some((item) => item.id === created.data.id)).toBe(true);

      // 3. Delete bookmark
      const deleteRes = await app.request(`/saved/${created.data.id}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionId }
      });
      expect(deleteRes.status).toBe(204);
    });

    it('returns 400 when session ID is missing from saved request', async () => {
      const res = await app.request('/saved');
      expect(res.status).toBe(400);
      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe('ERR_MISSING_SESSION');
    });
  });
});
