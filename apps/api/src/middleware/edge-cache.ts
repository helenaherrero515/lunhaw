import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../types/index.js';

export interface EdgeCacheOptions {
  /**
   * Client-side browser cache duration in seconds.
   * Defaults to 300 seconds (5 minutes) per A-M3-03.
   */
  clientMaxAge?: number;

  /**
   * Cloudflare edge CDN cache duration (s-maxage) in seconds.
   * Defaults to 86400 seconds (24 hours) per A-M3-03.
   */
  edgeMaxAge?: number;

  /**
   * Stale-while-revalidate duration in seconds.
   * Defaults to 86400 seconds (24 hours) per A-M3-03.
   */
  staleWhileRevalidate?: number;

  /**
   * Path prefixes to exclude from public edge caching (e.g. dynamic health, user-specific data, admin).
   */
  excludePaths?: string[];
}

export const DEFAULT_CLIENT_MAX_AGE = 300; // 5 minutes
export const DEFAULT_EDGE_MAX_AGE = 86400; // 24 hours
export const DEFAULT_STALE_WHILE_REVALIDATE = 86400; // 24 hours

export const DEFAULT_EXCLUDED_PATHS = [
  '/health',
  '/v1/health',
  '/admin',
  '/v1/admin',
  '/saved',
  '/v1/saved'
];

/**
 * Computes a standard SHA-256 ETag formatted as an HTTP entity-tag.
 */
export async function computeSha256ETag(data: string | ArrayBuffer): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  return `"${hex}"`;
}

/**
 * Checks if the client's If-None-Match header matches the calculated server ETag.
 * Supports wildcards (*), weak tags (W/), and comma-separated lists per RFC 7232.
 */
export function matchesIfNoneMatch(ifNoneMatchHeader: string, serverEtag: string): boolean {
  const trimmed = ifNoneMatchHeader.trim();
  if (trimmed === '*' || trimmed === serverEtag) {
    return true;
  }

  const normalizedServerTag = serverEtag.replace(/^W\//, '').trim();
  const tokens = trimmed.split(',').map((t) => t.replace(/^W\//, '').trim());
  return tokens.includes(normalizedServerTag);
}

/**
 * Edge Caching Middleware (A-M3-03, INV-003, Free Tier Budget)
 * Injects Cache-Control headers and ETags on read responses:
 * - 5-minute client cache (`max-age=300`)
 * - 24-hour edge cache (`s-maxage=86400`) with `stale-while-revalidate=86400`
 * - Evaluates `If-None-Match` requests and returns HTTP 304 Not Modified
 */
export function edgeCache(options: EdgeCacheOptions = {}): MiddlewareHandler<{ Bindings: Env }> {
  const clientMaxAge = options.clientMaxAge ?? DEFAULT_CLIENT_MAX_AGE;
  const edgeMaxAge = options.edgeMaxAge ?? DEFAULT_EDGE_MAX_AGE;
  const staleWhileRevalidate = options.staleWhileRevalidate ?? DEFAULT_STALE_WHILE_REVALIDATE;
  const excludePaths = options.excludePaths ?? DEFAULT_EXCLUDED_PATHS;

  const standardCacheControl = `public, max-age=${clientMaxAge}, s-maxage=${edgeMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  return async (c: Context<{ Bindings: Env }>, next) => {
    // 1. Only cache safe idempotent read operations
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      return next();
    }

    const path = c.req.path;

    // 2. Skip excluded paths (private / health / admin)
    for (const prefix of excludePaths) {
      if (path === prefix || path.startsWith(prefix + '/')) {
        return next();
      }
    }

    // 3. Skip authenticated user requests (Authorization header present) to prevent caching private data
    if (c.req.header('authorization')) {
      return next();
    }

    // 4. Execute downstream handler to generate response
    await next();

    // 5. Only cache successful responses
    if (c.res.status !== 200) {
      return;
    }

    // 6. Inject Cache-Control header if not already customized by the route handler
    const existingCacheControl = c.res.headers.get('cache-control');
    if (!existingCacheControl) {
      c.res.headers.set('cache-control', standardCacheControl);
    }

    // 7. Inject Vary header for CDN edge proxy compression / origin handling
    const existingVary = c.res.headers.get('vary');
    if (!existingVary) {
      c.res.headers.set('vary', 'Accept-Encoding, Origin');
    } else if (!existingVary.includes('Accept-Encoding')) {
      c.res.headers.set('vary', `${existingVary}, Accept-Encoding`);
    }

    // 8. Determine or generate ETag
    let etag = c.res.headers.get('etag');
    if (!etag) {
      try {
        const bodyText = await c.res.clone().text();
        etag = await computeSha256ETag(bodyText);
        c.res.headers.set('etag', etag);
      } catch {
        // If response body cannot be cloned or read, proceed without ETag
        return;
      }
    }

    // 9. Evaluate If-None-Match header for HTTP 304 Not Modified
    const ifNoneMatch = c.req.header('if-none-match');
    if (ifNoneMatch && etag && matchesIfNoneMatch(ifNoneMatch, etag)) {
      const responseHeaders = new Headers(c.res.headers);
      responseHeaders.delete('content-length');
      responseHeaders.delete('content-type');
      c.res = new Response(null, {
        status: 304,
        statusText: 'Not Modified',
        headers: responseHeaders
      });
    }
  };
}
