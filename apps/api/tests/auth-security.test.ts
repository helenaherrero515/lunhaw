import { describe, it, expect } from 'vitest';
import { testApp as app, createTestJwt, encodeJwt, TEST_ENV } from './helpers.js';
import { verifyJwt } from '../src/utils/auth.js';

const AUDIT = '/admin/freshness-audit';
const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
const now = () => Math.floor(Date.now() / 1000);
const adminClaims = () => ({
  sub: 'attacker-0001',
  role: 'authenticated',
  app_metadata: { role: 'admin' },
  exp: now() + 3600
});

describe('JWT signature verification', () => {
  it('rejects a token signed with the wrong secret', async () => {
    const forged = createTestJwt({ role: 'admin' }, 'attacker-chosen-secret');
    const res = await app.request(AUDIT, bearer(forged));
    expect(res.status).toBe(401);
  });

  it('rejects a token whose payload was tampered with after signing', async () => {
    const [h, , s] = createTestJwt({ role: 'authenticated' }).split('.');
    const payload = btoa(JSON.stringify(adminClaims()))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const res = await app.request(AUDIT, bearer(`${h}.${payload}.${s}`));
    expect(res.status).toBe(401);
  });

  it('rejects alg "none" tokens', async () => {
    const [h, p] = encodeJwt({ alg: 'none', typ: 'JWT' }, adminClaims()).split('.');
    expect(verifyJwt(`${h}.${p}.x`, TEST_ENV.SUPABASE_JWT_SECRET).error).toBe('UNSUPPORTED_ALG');
    const res = await app.request(AUDIT, bearer(`${h}.${p}.x`));
    expect(res.status).toBe(401);
  });

  it('rejects tokens without an exp claim', () => {
    const { exp: _exp, ...noExp } = adminClaims();
    const token = encodeJwt({ alg: 'HS256', typ: 'JWT' }, noExp);
    expect(verifyJwt(token, TEST_ENV.SUPABASE_JWT_SECRET).user).toBeNull();
  });

  it('fails closed when SUPABASE_JWT_SECRET is not configured', async () => {
    const valid = createTestJwt({ role: 'admin' });
    const res = await app.request(AUDIT, bearer(valid), { ...TEST_ENV, SUPABASE_JWT_SECRET: undefined });
    expect(res.status).toBe(401);
  });

  it('ignores a role claimed in user-editable user_metadata', async () => {
    const token = createTestJwt({
      app_metadata: { role: 'authenticated' },
      user_metadata: { role: 'admin' }
    });
    const res = await app.request(AUDIT, bearer(token));
    expect(res.status).toBe(403);
  });

  it('honours an admin role set in app_metadata alongside the Supabase top-level role', async () => {
    const res = await app.request(AUDIT, bearer(createTestJwt({ role: 'admin' })));
    expect(res.status).toBe(200);
  });
});

describe('Admin API key', () => {
  it('rejects the old hardcoded fallback key', async () => {
    const res = await app.request(AUDIT, { headers: { 'X-Admin-Key': 'lunhaw-admin-secret-2026' } });
    expect(res.status).toBe(401);
  });

  it('disables key access entirely when ADMIN_API_KEY is not configured', async () => {
    const res = await app.request(
      AUDIT,
      { headers: { 'X-Admin-Key': TEST_ENV.ADMIN_API_KEY! } },
      { ...TEST_ENV, ADMIN_API_KEY: undefined }
    );
    expect(res.status).toBe(401);
  });

  it('accepts the configured key', async () => {
    const res = await app.request(AUDIT, { headers: { 'X-Admin-Key': TEST_ENV.ADMIN_API_KEY! } });
    expect(res.status).toBe(200);
  });
});
