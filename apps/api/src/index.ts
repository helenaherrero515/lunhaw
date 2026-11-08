import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sanitizedLogger } from './middleware/sanitized-logger.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { edgeCache } from './middleware/edge-cache.js';
import { healthRoute } from './routes/health.js';
import { placesRoute } from './routes/places.js';
import { commuteRoute } from './routes/commute.js';
import { locationsRoute } from './routes/locations.js';
import { savedRoute } from './routes/saved.js';
import { transitRoute } from './routes/transit.js';
import { tilesRoute } from './routes/tiles.js';
import { adminRoute } from './routes/admin.js';
import { guideRoute } from './routes/guide.js';
import { newsletterRoute } from './routes/newsletter.js';
import { isPublicEnvironment } from './data/places-source.js';
import type { Env, ProblemDetails } from './types/index.js';

export const app = new Hono<{ Bindings: Env }>();

// 1. CORS Middleware
app.use('*', async (c, next) => {
  const origin = c.env?.CORS_ORIGIN || '*';
  const corsMiddleware = cors({
    origin: origin === '*' ? '*' : origin.split(',').map((o) => o.trim()),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Session-ID',
      'X-Client-Platform',
      'X-Admin-Key',
      'If-None-Match'
    ],
    exposeHeaders: ['Content-Length', 'Retry-After', 'ETag', 'Cache-Control'],
    maxAge: 86400
  });
  return corsMiddleware(c, next);
});

// 2. Privacy-Preserving Sanitized Request Logging (RA 10173 & Invariant T-003)
app.use('*', sanitizedLogger());

// 3. Edge Token-Bucket Rate Limiter (60 req/min per IP per T-004 & A-M1-04)
app.use('*', rateLimiter());

// 4. Cloudflare Edge Caching Middleware (A-M3-03, INV-003, Free Tier Budget)
app.use('*', edgeCache());

// 4b. Retired prototype endpoints. /commute, /transit and /saved served hand-made sample routes, fares and
// saved items. Real trips come from /guide (OpenStreetMap routes + LRT/MRT stations; INV-001), so these
// answer 410 Gone in staging and production. Local development and tests still use them.
const RETIRED = /^\/(v1\/)?(commute|transit|saved)(\/|$)/;
app.use('*', async (c, next) => {
  if (RETIRED.test(c.req.path) && isPublicEnvironment(c.env)) {
    return c.json(
      {
        type: 'https://api.lunhaw.ph/errors/ERR_RETIRED',
        title: 'Endpoint retired',
        status: 410,
        detail: 'This prototype endpoint served sample data and is retired. Use POST /v1/guide/plan for trips.',
        instance: c.req.path,
        code: 'ERR_RETIRED',
      },
      410,
      { 'Content-Type': 'application/problem+json' }
    );
  }
  await next();
});

// 5. Mount Routes (Support both root and /v1 versioned prefix)
app.route('/health', healthRoute);
app.route('/places', placesRoute);
app.route('/commute', commuteRoute);
app.route('/locations', locationsRoute);
app.route('/saved', savedRoute);
app.route('/transit', transitRoute);
app.route('/tiles', tilesRoute);
app.route('/admin', adminRoute);
app.route('/newsletter', newsletterRoute);
app.route('/guide', guideRoute);

// Versioned /v1 routes
app.route('/v1/health', healthRoute);
app.route('/v1/places', placesRoute);
app.route('/v1/commute', commuteRoute);
app.route('/v1/locations', locationsRoute);
app.route('/v1/saved', savedRoute);
app.route('/v1/transit', transitRoute);
app.route('/v1/tiles', tilesRoute);
app.route('/v1/admin', adminRoute);
app.route('/v1/newsletter', newsletterRoute);
app.route('/v1/guide', guideRoute);
// 5. RFC 7807 404 Not Found Handler
app.notFound((c) => {
  const problem: ProblemDetails = {
    type: 'https://api.lunhaw.ph/errors/ERR_ROUTE_NOT_FOUND',
    title: 'Route Not Found',
    status: 404,
    detail: `Cannot ${c.req.method} ${c.req.path}. Endpoint does not exist on Lunhaw API Gateway.`,
    instance: c.req.path,
    code: 'ERR_ROUTE_NOT_FOUND'
  };
  return c.json(problem, 404, { 'Content-Type': 'application/problem+json' });
});

app.onError((err, c) => {
  let status = 500;
  let code = 'ERR_INTERNAL_SERVER_ERROR';

  if (err && typeof err === 'object') {
    if ('status' in err && typeof err.status === 'number') {
      status = err.status;
    }
    if ('code' in err && typeof err.code === 'string') {
      code = err.code;
    } else if (status === 400) {
      code = 'ERR_BAD_REQUEST';
    }
  }

  const problem: ProblemDetails = {
    type: `https://api.lunhaw.ph/errors/${code}`,
    title: status === 500 ? 'Internal Server Error' : (err.name || 'API Error'),
    status,
    detail: err.message || 'An unexpected internal error occurred on the API Gateway.',
    instance: c.req.path,
    code
  };

  return c.json(problem, status as 400 | 500 | 503, { 'Content-Type': 'application/problem+json' });
});

export default app;
