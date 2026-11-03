import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from '../src/index.js';
import {
  sanitizeUrl,
  sanitizePayload,
  sanitizedLogger,
  REDACTED_COORDINATES,
  type SanitizedLogEntry
} from '../src/middleware/sanitized-logger.js';
import {
  getSavedItemsStore,
  resetSavedItemsStore,
  sanitizeRouteData
} from '../src/routes/saved.js';
import { resetRateLimitStore } from '../src/middleware/rate-limiter.js';
import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';

/**
 * E-M3-02 / T-003: Automated Privacy Audit & Zero-GPS Retention Verification
 * Traces to: T-003, RA 10173 (Philippine Data Privacy Act of 2012), INV-003
 *
 * Invariants Verified:
 * 1. 0 user GPS coordinates retained in disk logs or server stdout/telemetry.
 * 2. 0 user GPS coordinates or tracking trajectories persisted in database records or in-memory stores.
 * 3. Database schema audit verifies user_profiles and saved_items store zero raw GPS columns.
 * 4. Request URL and payload sanitizers strip/redact all coordinate keys recursively.
 */

describe('E-M3-02 / T-003: Privacy Audit — Zero Coordinate Retention (RA 10173)', () => {
  // Canary GPS coordinates with high decimal precision to track throughout the system
  const CANARY_USER_LAT = 14.58239182;
  const CANARY_USER_LNG = 121.06118473;
  const CANARY_ORIGIN_LAT = 14.55471921;
  const CANARY_ORIGIN_LNG = 121.02444315;
  const CANARY_DEST_LAT = 14.59951234;
  const CANARY_DEST_LNG = 120.98421987;

  // Coordinate string representations that must NEVER be found
  const FORBIDDEN_COORDINATE_STRINGS = [
    String(CANARY_USER_LAT),
    String(CANARY_USER_LNG),
    String(CANARY_ORIGIN_LAT),
    String(CANARY_ORIGIN_LNG),
    String(CANARY_DEST_LAT),
    String(CANARY_DEST_LNG),
    `${CANARY_USER_LAT},${CANARY_USER_LNG}`,
    `${CANARY_ORIGIN_LAT},${CANARY_ORIGIN_LNG}`,
  ];

  let capturedConsoleLogs: string[] = [];
  const originalConsoleLog = console.log;

  beforeEach(() => {
    resetRateLimitStore();
    resetSavedItemsStore();
    capturedConsoleLogs = [];
    console.log = vi.fn((...args: unknown[]) => {
      capturedConsoleLogs.push(args.map((a) => String(a)).join(' '));
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Server Log Output Auditing (T-003 / RA 10173)
  // =========================================================================
  describe('1. Server Log Output Audit — 0 GPS Coordinates Leaked to Logs', () => {
    it('redacts canary user coordinates in /places nearby search query logs', async () => {
      const url = `/places?lat=${CANARY_USER_LAT}&lng=${CANARY_USER_LNG}&radius=1000`;
      const res = await app.request(url, {
        headers: { 'X-Forwarded-For': '198.51.100.1' }
      });
      expect(res.status).toBe(200);

      // Verify that server logged the request
      expect(capturedConsoleLogs.length).toBeGreaterThanOrEqual(1);

      // Assert that NONE of the forbidden coordinate strings appear in any log line
      for (const logLine of capturedConsoleLogs) {
        for (const canaryStr of FORBIDDEN_COORDINATE_STRINGS) {
          expect(logLine).not.toContain(canaryStr);
        }
        expect(logLine).toContain(REDACTED_COORDINATES);
      }
    });

    it('redacts canary coordinates in /commute/routes origin and destination queries', async () => {
      const url = `/commute/routes?origin_lat=${CANARY_ORIGIN_LAT}&origin_lng=${CANARY_ORIGIN_LNG}&dest_lat=${CANARY_DEST_LAT}&dest_lng=${CANARY_DEST_LNG}&preference=shaded`;
      const res = await app.request(url, {
        headers: { 'X-Forwarded-For': '198.51.100.2' }
      });
      expect([200, 400, 404]).toContain(res.status);

      expect(capturedConsoleLogs.length).toBeGreaterThanOrEqual(1);
      for (const logLine of capturedConsoleLogs) {
        expect(logLine).not.toContain(String(CANARY_ORIGIN_LAT));
        expect(logLine).not.toContain(String(CANARY_ORIGIN_LNG));
        expect(logLine).not.toContain(String(CANARY_DEST_LAT));
        expect(logLine).not.toContain(String(CANARY_DEST_LNG));
        expect(logLine).toContain(REDACTED_COORDINATES);
      }
    });

    it('redacts comma-separated raw coordinate pairs in URL parameters', async () => {
      const url = `/commute/routes?origin=${CANARY_ORIGIN_LAT},${CANARY_ORIGIN_LNG}&destination=${CANARY_DEST_LAT},${CANARY_DEST_LNG}`;
      await app.request(url, {
        headers: { 'X-Forwarded-For': '198.51.100.3' }
      });

      expect(capturedConsoleLogs.length).toBeGreaterThanOrEqual(1);
      for (const logLine of capturedConsoleLogs) {
        expect(logLine).not.toContain(`${CANARY_ORIGIN_LAT},${CANARY_ORIGIN_LNG}`);
        expect(logLine).not.toContain(`${CANARY_DEST_LAT},${CANARY_DEST_LNG}`);
        expect(logLine).toContain(REDACTED_COORDINATES);
      }
    });

    it('captures zero GPS coordinates across dedicated writer mock', async () => {
      const structuredLogs: SanitizedLogEntry[] = [];
      const customApp = new Hono();
      customApp.use(
        '*',
        sanitizedLogger({
          writer: (entry) => {
            structuredLogs.push(entry);
          }
        })
      );
      customApp.get('/test-coords', (c) => c.text('ok'));

      await customApp.request(
        `/test-coords?latitude=${CANARY_USER_LAT}&longitude=${CANARY_USER_LNG}&coords=${CANARY_ORIGIN_LAT},${CANARY_ORIGIN_LNG}`
      );

      expect(structuredLogs.length).toBe(1);
      const entry = structuredLogs[0]!;
      expect(entry.url).not.toContain(String(CANARY_USER_LAT));
      expect(entry.url).not.toContain(String(CANARY_USER_LNG));
      expect(entry.url).not.toContain(String(CANARY_ORIGIN_LAT));
      expect(entry.url).not.toContain(String(CANARY_ORIGIN_LNG));
      expect(entry.url).toContain(REDACTED_COORDINATES);
    });
  });

  // =========================================================================
  // 2. Database & In-Memory Storage Record Retention Audit (T-003)
  // =========================================================================
  describe('2. Persistence Storage Audit — 0 GPS Coordinates Retained in Stored Records', () => {
    it('ensures POST /saved strips all user GPS traces from saved route payloads', async () => {
      const sessionId = 'privacy-audit-session-001';
      const maliciousRoutePayload = {
        item_type: 'route',
        route_id: 'e3b0c442-98fc-1c14-9af0-2c73650cc001',
        notes: 'User commute saved for offline review',
        route_data: {
          title: 'EDSA to Ortigas Shaded Walk',
          total_distance_m: 1450,
          est_duration_seconds: 1200,
          average_shade_score: 78.5,
          // Unsanitized GPS traces that MUST NOT be retained
          lat: CANARY_ORIGIN_LAT,
          lng: CANARY_ORIGIN_LNG,
          coordinates: [CANARY_ORIGIN_LNG, CANARY_ORIGIN_LAT],
          gps_trace: [
            { lat: CANARY_ORIGIN_LAT, lng: CANARY_ORIGIN_LNG, time: '2026-11-03T08:00:00Z' },
            { lat: CANARY_DEST_LAT, lng: CANARY_DEST_LNG, time: '2026-11-03T08:20:00Z' }
          ],
          geometry: {
            type: 'LineString',
            coordinates: [
              [CANARY_ORIGIN_LNG, CANARY_ORIGIN_LAT],
              [CANARY_DEST_LNG, CANARY_DEST_LAT]
            ]
          }
        }
      };

      const res = await app.request('/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(maliciousRoutePayload)
      });

      expect([201, 200]).toContain(res.status);

      // Inspect internal database / mock store records
      const savedItems = getSavedItemsStore();
      expect(savedItems.length).toBeGreaterThan(0);

      const savedRecordJson = JSON.stringify(savedItems);

      // Zero coordinate retention assertion: canary coordinates must NEVER exist in store
      for (const canary of FORBIDDEN_COORDINATE_STRINGS) {
        expect(savedRecordJson).not.toContain(canary);
      }

      // Assert specific forbidden property keys are stripped
      expect(savedRecordJson).not.toContain('"lat"');
      expect(savedRecordJson).not.toContain('"lng"');
      expect(savedRecordJson).not.toContain('"gps_trace"');
      expect(savedRecordJson).not.toContain('"geometry"');
    });

    it('ensures POST /saved/routes sanitizes nested route data per T-003', async () => {
      const sessionId = 'privacy-audit-session-002';
      const routePayload = {
        route_id: 'e3b0c442-98fc-1c14-9af0-2c73650cc002',
        title: 'Ayala Triangle to Legazpi Active Route',
        total_distance_m: 850,
        est_duration_seconds: 720,
        route_data: {
          leg_summary: '2 legs via Paseo de Roxas',
          user_live_lat: CANARY_USER_LAT,
          user_live_lng: CANARY_USER_LNG
        }
      };

      const res = await app.request('/saved/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(routePayload)
      });

      expect([201, 200]).toContain(res.status);

      const savedItems = getSavedItemsStore();
      const stored = savedItems.find((i) => i.client_session_id === sessionId);
      expect(stored).toBeDefined();

      const storedSerialized = JSON.stringify(stored);
      expect(storedSerialized).not.toContain(String(CANARY_USER_LAT));
      expect(storedSerialized).not.toContain(String(CANARY_USER_LNG));
    });

    it('ensures sanitizeRouteData strips all coordinate keys recursively', () => {
      const dirtyData = {
        route_name: 'Metro Commute',
        lat: 14.582,
        lng: 121.061,
        latitude: 14.582,
        longitude: 121.061,
        coords: [121.061, 14.582],
        point_geojson: { type: 'Point', coordinates: [121.061, 14.582] },
        legs: [
          {
            mode: 'walk',
            distance_m: 300,
            origin_coords: [121.061, 14.582],
            dest_lat: 14.585
          }
        ],
        safe_metric: 'high_shade'
      };

      const cleaned = sanitizeRouteData(dirtyData);
      expect(cleaned).toBeDefined();
      expect(cleaned).not.toBeNull();

      const serializedClean = JSON.stringify(cleaned);
      expect(serializedClean).not.toContain('14.582');
      expect(serializedClean).not.toContain('121.061');
      expect(serializedClean).not.toContain('lat');
      expect(serializedClean).not.toContain('lng');
      expect(serializedClean).toContain('"route_name":"Metro Commute"');
      expect(serializedClean).toContain('"safe_metric":"high_shade"');
    });
  });

  // =========================================================================
  // 3. PostgreSQL / Supabase Schema Audit (00013_saved_items_and_profiles.sql)
  // =========================================================================
  describe('3. Database DDL Schema Audit — Zero Geolocation Retention in Schema', () => {
    it('asserts user_profiles and saved_items DDL contains zero user GPS coordinate columns', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../../supabase/migrations/00013_saved_items_and_profiles.sql'
      );

      expect(fs.existsSync(migrationPath)).toBe(true);
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');

      // 1. user_profiles must only store civic boundary names, never GPS points
      const userProfilesBlockMatch = sqlContent.match(/CREATE TABLE IF NOT EXISTS user_profiles \(([\s\S]*?)\);/i);
      expect(userProfilesBlockMatch).toBeTruthy();
      const userProfilesColumns = (userProfilesBlockMatch?.[1] || '').toLowerCase();

      expect(userProfilesColumns).not.toContain('geometry');
      expect(userProfilesColumns).not.toContain('geography');
      expect(userProfilesColumns).not.toContain('latitude');
      expect(userProfilesColumns).not.toContain('longitude');
      expect(userProfilesColumns).not.toContain('gps');
      expect(userProfilesColumns).not.toContain('point(');

      // Verified civic boundaries are permitted (administrative names only)
      expect(userProfilesColumns).toContain('home_lgu');
      expect(userProfilesColumns).toContain('home_barangay');

      // 2. saved_items must only reference public place/route foreign keys, never user coordinates
      const savedItemsBlockMatch = sqlContent.match(/CREATE TABLE IF NOT EXISTS saved_items \(([\s\S]*?)\);/i);
      expect(savedItemsBlockMatch).toBeTruthy();
      const savedItemsColumns = (savedItemsBlockMatch?.[1] || '').toLowerCase();

      expect(savedItemsColumns).not.toContain('user_lat');
      expect(savedItemsColumns).not.toContain('user_lng');
      expect(savedItemsColumns).not.toContain('user_location');
      expect(savedItemsColumns).not.toContain('current_lat');
      expect(savedItemsColumns).not.toContain('current_lng');
      expect(savedItemsColumns).not.toContain('gps_trace');
    });

    it('verifies that no database migration across the repository defines user trajectory tracking tables', () => {
      const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
      const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

      expect(migrationFiles.length).toBeGreaterThanOrEqual(12);

      const forbiddenTablePatterns = [
        /create\s+table.*user_locations/i,
        /create\s+table.*user_tracking/i,
        /create\s+table.*user_gps/i,
        /create\s+table.*device_locations/i,
        /create\s+table.*location_history/i,
        /create\s+table.*movement_history/i
      ];

      for (const file of migrationFiles) {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        for (const pattern of forbiddenTablePatterns) {
          expect(content).not.toMatch(pattern);
        }
      }
    });
  });

  // =========================================================================
  // 4. Payload and URL Sanitizer Unit Edge Cases
  // =========================================================================
  describe('4. Sanitizer Unit Validation — Exhaustive Redaction', () => {
    it('sanitizes multiple variations of coordinate query parameter keys', () => {
      const testCases = [
        { input: '/places?lat=14.58&lng=121.06', expectedCount: 2 },
        { input: '/api/v1/commute?latitude=14.58&longitude=121.06', expectedCount: 2 },
        { input: '/tiles?center=14.582,121.061', expectedCount: 1 },
        { input: '/route?origin=14.55,121.02&destination=14.59,120.98', expectedCount: 2 },
        { input: '/search?point=14.55,121.02', expectedCount: 1 }
      ];

      for (const tc of testCases) {
        const sanitized = sanitizeUrl(tc.input);
        expect(sanitized).not.toContain('14.58');
        expect(sanitized).not.toContain('121.06');
        expect(sanitized).not.toContain('14.55');
        expect(sanitized).not.toContain('14.59');
        const count = (sanitized.match(new RegExp(REDACTED_COORDINATES.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g')) || []).length;
        expect(count).toBeGreaterThanOrEqual(tc.expectedCount);
      }
    });

    it('sanitizes deep JSON objects and coordinate arrays in request payloads', () => {
      const payload = {
        action: 'save_trip',
        metadata: {
          client: 'web-mobile',
          location: {
            lat: 14.5823,
            lng: 121.0611,
            coordinates: [121.0611, 14.5823]
          }
        },
        waypoints: [
          [121.05, 14.55],
          [121.06, 14.56]
        ]
      };

      const result = sanitizePayload(payload) as Record<string, unknown>;
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain('14.5823');
      expect(serialized).not.toContain('121.0611');
      expect(serialized).not.toContain('14.55');
      expect(serialized).not.toContain('14.56');
      expect(serialized).toContain(REDACTED_COORDINATES);
    });
  });
});
