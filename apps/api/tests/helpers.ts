import { app } from '../src/index.js';
import { signHs256 } from '../src/utils/auth.js';
import type { Env } from '../src/types/index.js';

export const TEST_ENV: Env = {
  ENVIRONMENT: 'test',
  SUPABASE_JWT_SECRET: 'test-jwt-secret-do-not-use-in-prod',
  ADMIN_API_KEY: 'test-admin-key-do-not-use-in-prod'
};

/** The app with test bindings (JWT secret, admin key) injected into every request. */
export const testApp = {
  request: (input: string | Request | URL, init?: RequestInit, env: Env = TEST_ENV) =>
    app.request(input, init, env)
};

const toB64Url = (json: string): string =>
  btoa(json).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

/** Encodes a JWT with the given header/claims, signed with `secret` (HS256). */
export function encodeJwt(
  header: Record<string, unknown>,
  claims: Record<string, unknown>,
  secret: string = TEST_ENV.SUPABASE_JWT_SECRET!
): string {
  const input = `${toB64Url(JSON.stringify(header))}.${toB64Url(JSON.stringify(claims))}`;
  return `${input}.${signHs256(input, secret)}`;
}

/** Generates a validly signed Supabase-style JWT for tests. */
export function createTestJwt(
  options: {
    sub?: string;
    id?: string;
    email?: string;
    role?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    exp?: number;
  },
  secret?: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: options.sub || options.id || 'f0000000-0000-0000-0000-000000000001',
    email: options.email || 'user@lunhaw.ph',
    role: 'authenticated',
    app_metadata: options.app_metadata || { role: options.role || 'authenticated' },
    user_metadata: options.user_metadata || {},
    iat: now,
    exp: options.exp !== undefined ? options.exp : now + 3600
  };
  return encodeJwt({ alg: 'HS256', typ: 'JWT' }, claims, secret);
}
