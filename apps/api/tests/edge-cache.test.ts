import { describe, it, expect } from 'vitest';
import { testApp as app } from './helpers.js';
import { createTestJwt } from './helpers.js';

describe('Edge Caching & ETag Middleware (A-M3-03, INV-003, Free Tier Sizing)', () => {
  describe('Public Read Cache-Control & ETag Injection', () => {
    it('injects 5-minute client and 24-hour edge Cache-Control on GET /places', async () => {
      const res = await app.request('/places');
      expect(res.status).toBe(200);

      const cacheControl = res.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=300'); // 5 minutes client
      expect(cacheControl).toContain('s-maxage=86400'); // 24 hours edge
      expect(cacheControl).toContain('stale-while-revalidate=86400');

      const etag = res.headers.get('etag');
      expect(etag).toBeDefined();
      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);

      const vary = res.headers.get('vary');
      expect(vary).toContain('Accept-Encoding');
    });

    it('injects cache headers on GET /locations/areas', async () => {
      const res = await app.request('/locations/areas');
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toContain('max-age=300');
      expect(res.headers.get('etag')).toBeDefined();
    });

    it('serves HTTP 304 Not Modified when If-None-Match matches ETag', async () => {
      const res1 = await app.request('/places');
      const etag = res1.headers.get('etag')!;
      expect(etag).toBeDefined();

      const res2 = await app.request('/places', {
        headers: {
          'If-None-Match': etag
        }
      });

      expect(res2.status).toBe(304);
      expect(res2.headers.get('etag')).toBe(etag);
      expect(res2.headers.get('cache-control')).toContain('max-age=300');
    });

    it('handles weak validator prefix W/ in If-None-Match', async () => {
      const res1 = await app.request('/places');
      const etag = res1.headers.get('etag')!;

      const res2 = await app.request('/places', {
        headers: {
          'If-None-Match': `W/${etag}`
        }
      });

      expect(res2.status).toBe(304);
    });

    it('handles wildcard * in If-None-Match', async () => {
      const res = await app.request('/places', {
        headers: {
          'If-None-Match': '*'
        }
      });
      expect(res.status).toBe(304);
    });

    it('returns full 200 response when If-None-Match does not match', async () => {
      const res = await app.request('/places', {
        headers: {
          'If-None-Match': '"different-unmatched-etag"'
        }
      });
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string }>();
      expect(json.status).toBe('success');
    });
  });

  describe('Exclusions & Privacy Boundaries', () => {
    it('does NOT inject public edge caching on excluded paths (/health)', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      const cacheControl = res.headers.get('cache-control');
      expect(cacheControl).toBeNull();
    });

    it('does NOT inject public edge cache headers on authenticated requests', async () => {
      const token = createTestJwt({ role: 'authenticated' });
      const res = await app.request('/places', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(res.status).toBe(200);
      const cacheControl = res.headers.get('cache-control');
      expect(cacheControl).toBeNull();
    });

    it('does NOT cache mutation requests (POST /saved/places)', async () => {
      const res = await app.request('/saved/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': 'test-edge-cache-sess'
        },
        body: JSON.stringify({ place_id: 'f0010000-0000-0000-0000-000000000020' })
      });
      expect(res.status).toBe(201);
      const cacheControl = res.headers.get('cache-control');
      expect(cacheControl).toBeNull();
    });

    it('preserves existing custom cache headers on routes that define their own (/transit/network)', async () => {
      const res = await app.request('/transit/network');
      expect(res.status).toBe(200);
      const cacheControl = res.headers.get('cache-control');
      // Transit has customized max-age=86400 (not overridden to 300)
      expect(cacheControl).toContain('max-age=86400');
      expect(res.headers.get('etag')).toBe('"lunhaw-transit-v1-20261101"');
    });
  });
});
