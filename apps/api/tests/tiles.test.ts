import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from '../src/index.js';

describe('D-M2-02: OpenFreeMap Vector Tile Proxy & Edge Caching Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('GET /tiles (Metadata & Service Info)', () => {
    it('returns service details and cache-control headers on base endpoint', async () => {
      const res = await app.request('/tiles');
      expect(res.status).toBe(200);

      const json = await res.json<{
        status: string;
        service: string;
        cache_control: string;
        endpoints: Record<string, string>;
      }>();

      expect(json.status).toBe('ok');
      expect(json.service).toContain('OpenFreeMap');
      expect(json.cache_control).toBe('public, max-age=604800, stale-while-revalidate=86400');
      expect(json.endpoints.vector_tiles).toBeDefined();
    });

    it('supports versioned prefix /v1/tiles', async () => {
      const res = await app.request('/v1/tiles');
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string }>();
      expect(json.status).toBe('ok');
    });
  });

  describe('Tile Coordinate Validation', () => {
    it('rejects invalid zoom levels with RFC 7807 400 Bad Request', async () => {
      const res = await app.request('/tiles/25/100/100.pbf');
      expect(res.status).toBe(400);

      const problem = await res.json<{
        type: string;
        code: string;
        status: number;
        title: string;
      }>();

      expect(problem.status).toBe(400);
      expect(problem.code).toBe('ERR_INVALID_TILE_COORDINATES');
      expect(problem.title).toBe('Invalid Tile Coordinates');
    });

    it('rejects negative or non-integer tile coordinates', async () => {
      const res = await app.request('/tiles/12/-1/500');
      expect(res.status).toBe(400);
      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe('ERR_INVALID_TILE_COORDINATES');
    });

    it('rejects tile coordinates exceeding slippy bounds for zoom (x >= 2^z)', async () => {
      // At zoom 2, max coordinate is 2^2 - 1 = 3
      const res = await app.request('/tiles/2/4/1');
      expect(res.status).toBe(400);
      const problem = await res.json<{ code: string }>();
      expect(problem.code).toBe('ERR_INVALID_TILE_COORDINATES');
    });
  });

  describe('Upstream Proxy & Edge Caching Headers', () => {
    it('appends immutable edge caching headers on successful tile retrieval', async () => {
      const mockTileData = new Uint8Array([0x1a, 0x02, 0x18, 0x01]);

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(mockTileData, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-protobuf',
            'ETag': '"mock-tile-etag"'
          }
        })
      );

      const res = await app.request('/tiles/14/13697/7542.pbf');
      expect(res.status).toBe(200);

      // Verify immutable edge caching headers (D-M2-02)
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=604800, stale-while-revalidate=86400');
      expect(res.headers.get('CDN-Cache-Control')).toBe('public, max-age=604800, stale-while-revalidate=86400');
      expect(res.headers.get('X-Proxy-Provider')).toBe('Lunhaw-OpenFreeMap-Proxy');
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const body = await res.arrayBuffer();
      expect(body.byteLength).toBe(mockTileData.byteLength);
    });

    it('handles upstream 404 cleanly with RFC 7807 problem details', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' })
      );

      const res = await app.request('/tiles/12/100/100.pbf');
      expect(res.status).toBe(404);

      const problem = await res.json<{ code: string; status: number }>();
      expect(problem.status).toBe(404);
      expect(problem.code).toBe('ERR_TILE_NOT_FOUND');
    });

    it('handles upstream gateway errors with 502 Bad Gateway', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response('Internal Server Error', { status: 500 })
      );

      const res = await app.request('/tiles/12/100/100.pbf');
      expect(res.status).toBe(502);

      const problem = await res.json<{ code: string; status: number }>();
      expect(problem.status).toBe(502);
      expect(problem.code).toBe('ERR_TILE_GATEWAY_ERROR');
    });
  });
});
