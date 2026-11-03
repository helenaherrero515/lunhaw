import { describe, it, expect, vi } from 'vitest';
import { app } from '../src/index.js';
import {
  sanitizeUrl,
  sanitizePayload,
  sanitizedLogger,
  REDACTED_COORDINATES,
  type SanitizedLogEntry
} from '../src/middleware/sanitized-logger.js';
import { Hono } from 'hono';

describe('Lunhaw API Gateway — M0 Foundation & Core Primitives', () => {
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

  describe('Places Endpoints (/places, /places/:id)', () => {
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
          schedules: Array<{ day_of_week: number; is_closed: boolean }>;
          verification: { status: string };
        };
      }>();

      expect(json.status).toBe('success');
      expect(json.data.id).toBe(placeId);
      // Invariant INV-002: Mandatory facility disclaimer MUST be present in detail payload
      expect(json.data.disclaimer).toBeDefined();
      expect(json.data.disclaimer).toContain('Please verify operating hours directly with the facility');
      expect(json.data.schedules.length).toBeGreaterThan(0);
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

    it('returns 400 with RFC 7807 when coordinates lie outside NCR bounding box', async () => {
      // Latitude 12.0 and Longitude 125.0 are far outside NCR (14.3N-14.8N, 120.9E-121.2E)
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
        code: string;
      }>();

      expect(problem.status).toBe(404);
      expect(problem.code).toBe('ERR_ROUTE_NOT_FOUND');
      expect(problem.title).toBe('Route Not Found');
    });
  });

  describe('Coordinate Sanitization & Logging (RA 10173 & Invariant T-003)', () => {
    it('redacts lat and lng query parameters from URLs', () => {
      const rawUrl = 'https://api.lunhaw.ph/v1/places?lat=14.5823&lng=121.0611&radius_km=5';
      const sanitized = sanitizeUrl(rawUrl);

      expect(sanitized).not.toContain('14.5823');
      expect(sanitized).not.toContain('121.0611');
      expect(sanitized).toContain(`lat=${REDACTED_COORDINATES}`);
      expect(sanitized).toContain(`lng=${REDACTED_COORDINATES}`);
      expect(sanitized).toContain('radius_km=5');
    });

    it('redacts full coordinate parameter variants (latitude, longitude, coords)', () => {
      const rawUrl = 'https://api.lunhaw.ph/v1/places?latitude=14.6000&longitude=121.0100&coords=14.6,121.0';
      const sanitized = sanitizeUrl(rawUrl);

      expect(sanitized).not.toContain('14.6000');
      expect(sanitized).not.toContain('121.0100');
      expect(sanitized).toContain(`latitude=${REDACTED_COORDINATES}`);
      expect(sanitized).toContain(`longitude=${REDACTED_COORDINATES}`);
    });

    it('redacts coordinate values from JSON payloads recursively', () => {
      const payload = {
        origin: { lat: 14.588, lng: 121.055 },
        destination: { lat: 14.5823, lng: 121.0611 },
        preference: 'shaded_walk',
        filter: {
          category: 'library'
        }
      };

      const sanitized = sanitizePayload(payload) as {
        origin: { lat: string; lng: string };
        destination: { lat: string; lng: string };
        preference: string;
        filter: { category: string };
      };

      expect(sanitized.origin.lat).toBe(REDACTED_COORDINATES);
      expect(sanitized.origin.lng).toBe(REDACTED_COORDINATES);
      expect(sanitized.destination.lat).toBe(REDACTED_COORDINATES);
      expect(sanitized.destination.lng).toBe(REDACTED_COORDINATES);
      expect(sanitized.preference).toBe('shaded_walk');
      expect(sanitized.filter.category).toBe('library');
    });

    it('sanitizedLogger middleware scrubs coordinates from log output', async () => {
      let loggedLine = '';
      let capturedEntry: SanitizedLogEntry | null = null;

      const testApp = new Hono();
      testApp.use(
        '*',
        sanitizedLogger({
          writer: (entry, line) => {
            capturedEntry = entry;
            loggedLine = line;
          }
        })
      );
      testApp.get('/test-places', (c) => c.text('ok'));

      const res = await testApp.request('/test-places?lat=14.5823&lng=121.0611&category=park');
      expect(res.status).toBe(200);

      expect(capturedEntry).not.toBeNull();
      expect(capturedEntry!.url).not.toContain('14.5823');
      expect(capturedEntry!.url).not.toContain('121.0611');
      expect(capturedEntry!.url).toContain(`lat=${REDACTED_COORDINATES}`);
      expect(capturedEntry!.url).toContain(`lng=${REDACTED_COORDINATES}`);
      expect(capturedEntry!.url).toContain('category=park');

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

  describe('Location Areas Directory (/locations/areas)', () => {
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
      expect(cityNames).toContain('Manila');
      expect(cityNames).toContain('Pasig');
      expect(cityNames).toContain('Quezon City');
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
