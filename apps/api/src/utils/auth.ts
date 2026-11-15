import type { Context } from 'hono';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
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

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Signs `<header>.<payload>` with HMAC-SHA256 and returns the base64url signature.
 */
export function signHs256(signingInput: string, secret: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(signingInput).digest());
}

/**
 * Verifies an HS256 Supabase JWT (signature, algorithm, expiry) and extracts the user.
 * Fails closed: without a configured secret, no token is accepted.
 *
 * Role is taken only from server-controlled claims (app_metadata.role, then the
 * top-level role claim). user_metadata is writable by the user and is never trusted.
 */
export function verifyJwt(
  token: string,
  secret: string | undefined
): { user: AuthUser | null; error?: string } {
  if (!secret) {
    return { user: null, error: 'NO_SECRET_CONFIGURED' };
  }
  try {
    const parts = token.split('.');
    const [headerPart, payloadPart, signaturePart] = parts;
    if (parts.length !== 3 || !headerPart || !payloadPart || !signaturePart) {
      return { user: null, error: 'MALFORMED' };
    }

    const header = JSON.parse(base64UrlDecode(headerPart));
    if (header?.alg !== 'HS256') {
      return { user: null, error: 'UNSUPPORTED_ALG' };
    }

    const expected = Buffer.from(signHs256(`${headerPart}.${payloadPart}`, secret));
    const actual = Buffer.from(signaturePart);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return { user: null, error: 'BAD_SIGNATURE' };
    }

    const claims = JSON.parse(base64UrlDecode(payloadPart));

    if (typeof claims.exp !== 'number') {
      return { user: null, error: 'MALFORMED' };
    }
    if (claims.exp < Math.floor(Date.now() / 1000)) {
      return { user: null, error: 'EXPIRED' };
    }

    const userId = claims.sub;
    if (!userId || typeof userId !== 'string') {
      return { user: null, error: 'MISSING_SUBJECT' };
    }

    const appRole =
      claims.app_metadata && typeof claims.app_metadata === 'object'
        ? claims.app_metadata.role
        : undefined;
    const role = appRole || claims.role || 'authenticated';

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

    const { user, error } = verifyJwt(token, c.env?.SUPABASE_JWT_SECRET);
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
