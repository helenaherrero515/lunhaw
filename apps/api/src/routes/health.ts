import { Hono } from 'hono';
import type { Env } from '../types/index.js';

export const healthRoute = new Hono<{ Bindings: Env }>();

const startTime = Date.now();

healthRoute.get('/', (c) => {
  const uptimeSeconds = Math.round((Date.now() - startTime) / 1000);
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptimeSeconds,
    environment: c.env?.ENVIRONMENT || 'development',
    version: '1.0.0'
  });
});
