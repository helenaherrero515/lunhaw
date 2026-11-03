import type { MiddlewareHandler, Context } from 'hono';
import type { Env, ProblemDetails } from '../types/index.js';

export interface RateBucket {
  tokens: number;
  lastRefill: number; // timestamp in ms
}

export interface RateLimiterOptions {
  /** Maximum requests allowed in the window period (defaults to 60 or env.RATE_LIMIT_PER_MINUTE) */
  maxRequests?: number;
  /** Window period in milliseconds (defaults to 60,000 ms = 1 minute) */
  windowMs?: number;
  /** Custom key extractor for identifying clients (defaults to IP detection) */
  keyGenerator?: (c: Context<{ Bindings: Env }>) => string;
  /** Custom skip predicate to exempt certain requests */
  skip?: (c: Context<{ Bindings: Env }>) => boolean;
}

export const DEFAULT_MAX_REQUESTS = 60;
export const DEFAULT_WINDOW_MS = 60000; // 60 seconds

// In-memory token bucket store keyed by client identifier (e.g., IP address)
const tokenBucketStore = new Map<string, RateBucket>();

/**
 * Resets the rate limiter store. Useful for unit and integration testing.
 */
export function resetRateLimitStore(): void {
  tokenBucketStore.clear();
}

/**
 * Resolves the client IP address from standard Cloudflare Worker and proxy headers.
 */
export function getClientIp(c: Context<{ Bindings: Env }>): string {
  const cfIp = c.req.header('cf-connecting-ip');
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  const forwardedFor = c.req.header('x-forwarded-for');
  if (forwardedFor && forwardedFor.trim().length > 0) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp && firstIp.length > 0) {
      return firstIp;
    }
  }

  const realIp = c.req.header('x-real-ip');
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Periodically prunes buckets that have reached full capacity and been inactive.
 */
function pruneStaleBuckets(capacity: number, windowMs: number, now: number): void {
  // Prune only when store exceeds 1000 items to avoid frequent iteration overhead
  if (tokenBucketStore.size < 1000) return;

  for (const [key, bucket] of tokenBucketStore.entries()) {
    if (bucket.tokens >= capacity && now - bucket.lastRefill > windowMs * 2) {
      tokenBucketStore.delete(key);
    }
  }
}

/**
 * Token-Bucket Rate Limiter Middleware (A-M1-04, Invariant T-004)
 * Enforces a strict limit of 60 requests per minute per IP address.
 * Responds with HTTP 429 and Retry-After header adhering to RFC 7807 Problem Details.
 */
export function rateLimiter(options?: RateLimiterOptions): MiddlewareHandler<{ Bindings: Env }> {
  const configuredWindowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const keyGen = options?.keyGenerator ?? getClientIp;
  const skipFn = options?.skip;

  return async (c, next) => {
    // 1. Skip preflight OPTIONS requests (CORS handling)
    if (c.req.method === 'OPTIONS') {
      return next();
    }

    // 2. Custom skip check
    if (skipFn && skipFn(c)) {
      return next();
    }

    // 3. Resolve maximum requests (option override -> env variable -> default 60)
    let maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
    if (!options?.maxRequests && c.env?.RATE_LIMIT_PER_MINUTE) {
      const parsedEnv = parseInt(c.env.RATE_LIMIT_PER_MINUTE, 10);
      if (!isNaN(parsedEnv) && parsedEnv > 0) {
        maxRequests = parsedEnv;
      }
    }

    const windowMs = configuredWindowMs;
    const refillRatePerMs = maxRequests / windowMs; // tokens per millisecond

    const clientKey = keyGen(c);
    const now = Date.now();

    pruneStaleBuckets(maxRequests, windowMs, now);

    let bucket = tokenBucketStore.get(clientKey);

    if (!bucket) {
      bucket = {
        tokens: maxRequests,
        lastRefill: now
      };
    } else {
      // Refill tokens based on elapsed time since last request
      const elapsedMs = Math.max(0, now - bucket.lastRefill);
      const tokensToAdd = elapsedMs * refillRatePerMs;
      bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // 4. Check token availability
    if (bucket.tokens >= 1) {
      // Deduct 1 token for this request
      bucket.tokens -= 1;
      tokenBucketStore.set(clientKey, bucket);

      // Set standard rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
      c.header(
        'X-RateLimit-Reset',
        Math.ceil((now + ((maxRequests - bucket.tokens) / maxRequests) * windowMs) / 1000).toString()
      );

      return next();
    }

    // 5. Rate limit exceeded: calculate required wait time in seconds
    const tokensNeeded = 1 - bucket.tokens;
    const waitMs = tokensNeeded / refillRatePerMs;
    const retryAfterSeconds = Math.max(1, Math.ceil(waitMs / 1000));

    // Persist bucket state
    tokenBucketStore.set(clientKey, bucket);

    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_RATE_LIMIT_EXCEEDED',
      title: 'Rate Limit Exceeded',
      status: 429,
      detail: `Rate limit of ${maxRequests} requests per minute exceeded for IP address. Please wait before retrying.`,
      instance: c.req.path,
      code: 'ERR_RATE_LIMIT_EXCEEDED'
    };

    c.header('Retry-After', retryAfterSeconds.toString());
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', '0');
    c.header('X-RateLimit-Reset', Math.ceil((now + waitMs) / 1000).toString());

    return c.json(problem, 429, {
      'Content-Type': 'application/problem+json',
      'Retry-After': retryAfterSeconds.toString()
    });
  };
}
