import { Hono, type Context } from 'hono';
import type { Env, ProblemDetails } from '../types/index.js';

export const tilesRoute = new Hono<{ Bindings: Env }>();

const OPENFREEMAP_BASE_URL = 'https://tiles.openfreemap.org';
const CACHE_CONTROL_HEADER = 'public, max-age=604800, stale-while-revalidate=86400';

/**
 * Validates Slippy Map tile coordinates (z, x, y).
 */
function isValidTileCoordinate(z: number, x: number, y: number): boolean {
  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }
  if (z < 0 || z > 24) {
    return false;
  }
  const maxTile = 1 << z;
  return x >= 0 && x < maxTile && y >= 0 && y < maxTile;
}

/**
 * Helper to proxy request to OpenFreeMap with edge caching headers.
 */
async function fetchAndCacheOpenFreeMap(
  c: Context<{ Bindings: Env }>,
  remotePath: string
): Promise<Response> {
  const targetUrl = `${OPENFREEMAP_BASE_URL}/${remotePath.replace(/^\/+/, '')}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'Accept': c.req.header('Accept') || '*/*',
        'User-Agent': 'Lunhaw-OpenFreeMap-TileProxy/1.0 (+https://lunhaw.ph)'
      }
    });

    if (!upstreamRes.ok) {
      if (upstreamRes.status === 404) {
        const problem: ProblemDetails = {
          type: 'https://api.lunhaw.ph/errors/ERR_TILE_NOT_FOUND',
          title: 'Map Tile Not Found',
          status: 404,
          detail: `Tile requested at path /${remotePath} was not found on the OpenFreeMap vector tile index.`,
          instance: c.req.path,
          code: 'ERR_TILE_NOT_FOUND'
        };
        return c.json(problem, 404, {
          'Content-Type': 'application/problem+json',
          'Cache-Control': 'public, max-age=3600'
        });
      }

      const problem: ProblemDetails = {
        type: 'https://api.lunhaw.ph/errors/ERR_TILE_GATEWAY_ERROR',
        title: 'Upstream Tile Gateway Error',
        status: 502,
        detail: `OpenFreeMap upstream service responded with status ${upstreamRes.status}.`,
        instance: c.req.path,
        code: 'ERR_TILE_GATEWAY_ERROR'
      };
      return c.json(problem, 502, { 'Content-Type': 'application/problem+json' });
    }

    const responseHeaders = new Headers(upstreamRes.headers);
    responseHeaders.set('Cache-Control', CACHE_CONTROL_HEADER);
    responseHeaders.set('CDN-Cache-Control', CACHE_CONTROL_HEADER);
    responseHeaders.set('X-Proxy-Provider', 'Lunhaw-OpenFreeMap-Proxy');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(upstreamRes.body, {
      status: 200,
      headers: responseHeaders
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_TILE_FETCH_FAILED',
      title: 'Tile Proxy Fetch Failed',
      status: 504,
      detail: message,
      instance: c.req.path,
      code: 'ERR_TILE_FETCH_FAILED'
    };
    return c.json(problem, 504, { 'Content-Type': 'application/problem+json' });
  }
}

/**
 * Standard Slippy Tile endpoint: /tiles/:z/:x/:y or /tiles/:z/:x/:y.pbf
 */
tilesRoute.get('/:z/:x/:y', async (c) => {
  const zStr = c.req.param('z');
  const xStr = c.req.param('x');
  const yWithExt = c.req.param('y');

  const yStr = yWithExt.replace(/\.(pbf|mvt)$/i, '');
  const z = Number(zStr);
  const x = Number(xStr);
  const y = Number(yStr);

  if (!isValidTileCoordinate(z, x, y)) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_INVALID_TILE_COORDINATES',
      title: 'Invalid Tile Coordinates',
      status: 400,
      detail: `Tile coordinates z=${zStr}, x=${xStr}, y=${yStr} are invalid slippy map coordinates (zoom must be 0–24).`,
      instance: c.req.path,
      code: 'ERR_INVALID_TILE_COORDINATES'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  // OpenFreeMap serves planet tiles at planet/{z}/{x}/{y}.pbf
  return fetchAndCacheOpenFreeMap(c, `planet/${z}/${x}/${y}.pbf`);
});

/**
 * Planet tile route explicitly with planet prefix: /tiles/planet/:z/:x/:y
 */
tilesRoute.get('/planet/:z/:x/:y', async (c) => {
  const zStr = c.req.param('z');
  const xStr = c.req.param('x');
  const yWithExt = c.req.param('y');

  const yStr = yWithExt.replace(/\.(pbf|mvt)$/i, '');
  const z = Number(zStr);
  const x = Number(xStr);
  const y = Number(yStr);

  if (!isValidTileCoordinate(z, x, y)) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_INVALID_TILE_COORDINATES',
      title: 'Invalid Tile Coordinates',
      status: 400,
      detail: `Tile coordinates z=${zStr}, x=${xStr}, y=${yStr} are out of bounds.`,
      instance: c.req.path,
      code: 'ERR_INVALID_TILE_COORDINATES'
    };
    return c.json(problem, 400, { 'Content-Type': 'application/problem+json' });
  }

  return fetchAndCacheOpenFreeMap(c, `planet/${z}/${x}/${y}.pbf`);
});

/**
 * Wildcard catch-all for vector style definitions, sprites, and fonts:
 * e.g., /tiles/styles/liberty, /tiles/sprites/..., /tiles/fonts/...
 */
tilesRoute.get('*', async (c) => {
  const subpath = c.req.path.replace(/^\/(?:v1\/)?tiles\/?/, '');
  if (!subpath || subpath === '/') {
    return c.json({
      status: 'ok',
      service: 'Lunhaw OpenFreeMap Vector Tile Proxy',
      cache_control: CACHE_CONTROL_HEADER,
      endpoints: {
        vector_tiles: '/tiles/:z/:x/:y.pbf',
        planet_tiles: '/tiles/planet/:z/:x/:y.pbf',
        styles: '/tiles/styles/liberty'
      }
    });
  }

  return fetchAndCacheOpenFreeMap(c, subpath);
});
