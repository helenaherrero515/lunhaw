import { describe, it, expect } from 'vitest';
import { testApp as app } from './helpers.js';
import { createTestJwt, TEST_ENV } from './helpers.js';
import { DEFAULT_FRESHNESS_THRESHOLD_DAYS } from '../src/routes/admin.js';

describe('Admin Freshness Audit Endpoint (A-M3-02, BR-002, T-005)', () => {
  const adminUser = {
    sub: 'admin-uuid-0001',
    email: 'admin@lunhaw.ph',
    role: 'admin'
  };

  const moderatorUser = {
    sub: 'mod-uuid-0002',
    email: 'moderator@lunhaw.ph',
    role: 'moderator'
  };

  const regularUser = {
    sub: 'user-uuid-0003',
    email: 'user@lunhaw.ph',
    role: 'authenticated'
  };

  describe('Authentication & Role-Based Authorization Guard', () => {
    it('returns 401 ERR_UNAUTHORIZED when no token or admin key is provided', async () => {
      const res = await app.request('/admin/freshness-audit');
      expect(res.status).toBe(401);
      const json = await res.json<{ code: string; title: string }>();
      expect(json.code).toBe('ERR_UNAUTHORIZED');
    });

    it('returns 401 ERR_INVALID_AUTH_TOKEN for malformed tokens', async () => {
      const res = await app.request('/admin/freshness-audit', {
        headers: { Authorization: 'Bearer not-a-valid-jwt-token' }
      });
      expect(res.status).toBe(401);
      const json = await res.json<{ code: string }>();
      expect(json.code).toBe('ERR_INVALID_AUTH_TOKEN');
    });

    it('returns 401 ERR_TOKEN_EXPIRED for expired tokens', async () => {
      const pastSeconds = Math.floor(Date.now() / 1000) - 7200;
      const expiredToken = createTestJwt({ ...adminUser, exp: pastSeconds });

      const res = await app.request('/admin/freshness-audit', {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      expect(res.status).toBe(401);
      const json = await res.json<{ code: string }>();
      expect(json.code).toBe('ERR_TOKEN_EXPIRED');
    });

    it('returns 403 ERR_FORBIDDEN when user has insufficient role (authenticated regular user)', async () => {
      const regularToken = createTestJwt(regularUser);

      const res = await app.request('/admin/freshness-audit', {
        headers: { Authorization: `Bearer ${regularToken}` }
      });
      expect(res.status).toBe(403);
      const json = await res.json<{ code: string; title: string }>();
      expect(json.code).toBe('ERR_FORBIDDEN');
    });

    it('allows access for role: moderator', async () => {
      const modToken = createTestJwt(moderatorUser);

      const res = await app.request('/admin/freshness-audit', {
        headers: { Authorization: `Bearer ${modToken}` }
      });
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string }>();
      expect(json.status).toBe('success');
    });

    it('allows access for role: admin', async () => {
      const adminToken = createTestJwt(adminUser);

      const res = await app.request('/admin/freshness-audit', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string }>();
      expect(json.status).toBe('success');
    });

    it('allows access with X-Admin-Key header', async () => {
      const res = await app.request('/admin/freshness-audit', {
        headers: { 'X-Admin-Key': TEST_ENV.ADMIN_API_KEY! }
      });
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string }>();
      expect(json.status).toBe('success');
    });
  });

  describe('Freshness Audit Logic (BR-002: 180-day threshold)', () => {
    const adminToken = createTestJwt(adminUser);

    it('flags verified records older than 180 days and calculates metrics', async () => {
      // Pin reference date to 2026-11-03 for deterministic verification
      const res = await app.request(
        '/admin/freshness-audit?ref_date=2026-11-03T00:00:00Z',
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        status: string;
        data: {
          audit_date: string;
          threshold_days: number;
          total_facilities: number;
          total_schedules: number;
          fresh_count: number;
          stale_count: number;
          pending_count: number;
          overall_compliance_rate: number;
          stale_facilities: Array<{
            place_id: string;
            name: string;
            city: string;
            age_days: number | null;
            freshness_category: string;
            is_stale: boolean;
            recommended_action: string;
          }>;
          stale_schedules: Array<{
            place_id: string;
            day_name: string;
            is_stale: boolean;
          }>;
          lgu_metrics: Array<{
            city: string;
            compliance_rate: number;
            health_status: string;
          }>;
        };
      }>();

      expect(json.status).toBe('success');
      expect(json.data.threshold_days).toBe(DEFAULT_FRESHNESS_THRESHOLD_DAYS);
      expect(json.data.total_facilities).toBeGreaterThan(0);
      expect(json.data.total_schedules).toBeGreaterThan(0);

      // Verify stale facilities include Luneta Park (verified 2026-02-01, > 270 days ago)
      const lunetaPark = json.data.stale_facilities.find((f) =>
        f.name.includes('Luneta')
      );
      expect(lunetaPark).toBeDefined();
      expect(lunetaPark?.is_stale).toBe(true);
      expect(lunetaPark?.age_days).toBeGreaterThan(180);
      expect(lunetaPark?.freshness_category).toBe('STALE');
      expect(lunetaPark?.recommended_action).toBeDefined();

      // Verify unverified facility (last_verified_at: null) is flagged as PENDING_SURVEY
      const pendingFacility = json.data.stale_facilities.find(
        (f) => f.freshness_category === 'PENDING_SURVEY'
      );
      expect(pendingFacility).toBeDefined();
      expect(pendingFacility?.age_days).toBeNull();
      expect(pendingFacility?.is_stale).toBe(true);

      // Verify LGU breakdown metrics
      expect(json.data.lgu_metrics.length).toBeGreaterThan(0);
      expect(
        json.data.lgu_metrics.every((m) => ['HEALTHY', 'NEEDS_ATTENTION', 'CRITICAL'].includes(m.health_status))
      ).toBe(true);
    });

    it('supports custom threshold_days query parameter', async () => {
      // With threshold_days=30, more items should be flagged than with 180
      const res30 = await app.request(
        '/admin/freshness-audit?threshold_days=30&ref_date=2026-11-03T00:00:00Z',
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      const json30 = await res30.json<{ data: { stale_count: number } }>();

      const res180 = await app.request(
        '/admin/freshness-audit?threshold_days=180&ref_date=2026-11-03T00:00:00Z',
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      const json180 = await res180.json<{ data: { stale_count: number } }>();

      expect(json30.data.stale_count).toBeGreaterThanOrEqual(json180.data.stale_count);
    });

    it('supports filtering by city and category', async () => {
      const res = await app.request(
        '/admin/freshness-audit?city=Manila&category=library&ref_date=2026-11-03T00:00:00Z',
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      expect(res.status).toBe(200);
      const json = await res.json<{
        data: {
          total_facilities: number;
          stale_facilities: Array<{ city: string; category: string }>;
        };
      }>();

      expect(
        json.data.stale_facilities.every(
          (f) => f.city.toLowerCase() === 'manila' && f.category.toLowerCase() === 'library'
        )
      ).toBe(true);
    });

    it('is accessible via versioned route /v1/admin/freshness-audit', async () => {
      const res = await app.request('/v1/admin/freshness-audit', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string }>();
      expect(json.status).toBe('success');
    });
  });
});
