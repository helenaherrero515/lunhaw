import type { Context } from 'hono';
import type { Env, ProblemDetails } from '../types/index.js';

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export interface AuthContext {
  user: AuthUser | null;
  sessionId: string | null;
  error?: ProblemDetails;
}

/**
 * Extracts the bearer token from the Authorization header
 */
export function parseBearerToken(authHeader: string | undefined | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/i);
  return match && match[1] ? match[1] : null;
}

/**
 * Base64URL decode helper compatible with Edge / Web Workers and Node.js
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Decodes and validates a JWT token payload
 */
export function decodeJwtClaims(token: string): { user: AuthUser | null; error?: string } {
  try {
    const parts = token.split('.');
    const payloadPart = parts[1];
    if (parts.length !== 3 || !payloadPart) {
      return { user: null, error: 'MALFORMED' };
    }

    const payloadJson = base64UrlDecode(payloadPart);
    const claims = JSON.parse(payloadJson);

    // Check expiration if exp claim is present
    if (typeof claims.exp === 'number') {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (claims.exp < nowSeconds) {
        return { user: null, error: 'EXPIRED' };
      }
    }

    const userId = claims.sub || claims.user_id || claims.id;
    if (!userId || typeof userId !== 'string') {
      return { user: null, error: 'MISSING_SUBJECT' };
    }

    // Role can be in top-level claims, app_metadata, or user_metadata (Supabase convention)
    let role: unknown = claims.role;
    if (
      !role &&
      claims.app_metadata &&
      typeof claims.app_metadata === 'object' &&
      'role' in claims.app_metadata
    ) {
      role = claims.app_metadata.role;
    }
    if (
      !role &&
      claims.user_metadata &&
      typeof claims.user_metadata === 'object' &&
      'role' in claims.user_metadata
    ) {
      role = claims.user_metadata.role;
    }
    if (!role) {
      role = 'authenticated';
    }

    const user: AuthUser = {
      id: userId,
      email: typeof claims.email === 'string' ? claims.email : undefined,
      role: String(role),
      app_metadata: claims.app_metadata,
      user_metadata: claims.user_metadata
    };

    return { user };
  } catch {
    return { user: null, error: 'MALFORMED' };
  }
}

/**
 * Validates request authentication: parses Authorization header and X-Session-ID
 */
export function resolveAuth(c: Context<{ Bindings: Env }>): AuthContext {
  const authHeader = c.req.header('authorization');
  const sessionId = c.req.header('x-session-id') || c.req.query('session_id') || null;

  if (authHeader) {
    const token = parseBearerToken(authHeader);
    if (!token) {
      return {
        user: null,
        sessionId,
        error: {
          type: 'https://api.lunhaw.ph/errors/ERR_INVALID_AUTH_TOKEN',
          title: 'Invalid Authentication Token',
          status: 401,
          detail: 'The Authorization header format must be: Bearer <token>.',
          instance: c.req.path,
          code: 'ERR_INVALID_AUTH_TOKEN'
        }
      };
    }

    const { user, error } = decodeJwtClaims(token);
    if (error === 'EXPIRED') {
      return {
        user: null,
        sessionId,
        error: {
          type: 'https://api.lunhaw.ph/errors/ERR_TOKEN_EXPIRED',
          title: 'Token Expired',
          status: 401,
          detail: 'The provided authentication token has expired. Please re-authenticate.',
          instance: c.req.path,
          code: 'ERR_TOKEN_EXPIRED'
        }
      };
    }

    if (!user) {
      return {
        user: null,
        sessionId,
        error: {
          type: 'https://api.lunhaw.ph/errors/ERR_INVALID_AUTH_TOKEN',
          title: 'Invalid Authentication Token',
          status: 401,
          detail: 'The Authorization Bearer token could not be verified or is malformed.',
          instance: c.req.path,
          code: 'ERR_INVALID_AUTH_TOKEN'
        }
      };
    }

    return {
      user,
      sessionId,
      error: undefined
    };
  }

  return {
    user: null,
    sessionId,
    error: undefined
  };
}

/**
 * Test helper for generating mock Supabase JWT tokens for unit and integration testing
 */
export function createTestJwt(options: {
  sub?: string;
  id?: string;
  email?: string;
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  exp?: number;
}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: options.sub || options.id || 'f0000000-0000-0000-0000-000000000001',
    email: options.email || 'user@lunhaw.ph',
    role: options.role || 'authenticated',
    app_metadata: options.app_metadata || { role: options.role || 'authenticated' },
    user_metadata: options.user_metadata || {},
    iat: now,
    exp: options.exp !== undefined ? options.exp : now + 3600
  };

  const toB64Url = (json: string): string =>
    btoa(json).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const b64Header = toB64Url(JSON.stringify(header));
  const b64Claims = toB64Url(JSON.stringify(claims));
  const signature = 'test_signature_mock';

  return `${b64Header}.${b64Claims}.${signature}`;
}
