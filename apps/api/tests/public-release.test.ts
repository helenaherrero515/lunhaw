import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../src/index';
import { resetRateLimitStore } from '../src/middleware/rate-limiter';
import { resetPlacesCache } from '../src/data/places-source';
import { resetNewsletterStore, getNewsletterStore } from '../src/routes/newsletter';

const SUPABASE = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key' };
const ROW = {
  id: 'ae100000-0000-4000-8000-000000000001',
  name: 'National Library of the Philippines (NLP) - Main Complex',
  category: 'library',
  description: 'Public library in Manila.',
  lgu_city: 'Manila',
  barangay: 'Barangay 666',
  address: 'T.M. Kalaw St, Ermita, Manila',
  lat: 14.5828,
  lng: 120.9822,
  verification_status: 'ESTIMATE',
  official_source_name: null,
  official_source_url: null,
  derivation_note: 'Location compiled from public directory listings and map data; not yet confirmed on site.',
  last_verified_at: null
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('Public release: places come from the database, never fixtures in production', () => {
  beforeEach(() => {
    resetRateLimitStore();
    resetPlacesCache();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reads the public_places view with the anon key and maps rows to places', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([ROW]));
    vi.stubGlobal('fetch', fetchMock);

    const res = await app.request('/places', {}, { ENVIRONMENT: 'production', ...SUPABASE });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.places).toHaveLength(1);
    expect(body.data.places[0]).toMatchObject({
      id: ROW.id,
      city: 'Manila',
      coordinates: { lat: 14.5828, lng: 120.9822 },
      verification: { status: 'ESTIMATE' }
    });
    const [url, init] = fetchMock.mock.calls[0] as any[];
    expect(url).toBe('https://example.supabase.co/rest/v1/public_places?select=*&order=name.asc');
    expect(init.headers.apikey).toBe('anon-key');
  });

  it('refuses to serve fixtures in production when the database is not configured', async () => {
    const res = await app.request('/places', {}, { ENVIRONMENT: 'production' });
    expect(res.status).toBe(503);
    expect(((await res.json()) as any).code).toBe('ERR_DATA_SOURCE_UNAVAILABLE');
  });

  it('returns 503 (not stale fixtures) when the database errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ message: 'boom' }, 500)));
    const res = await app.request('/places', {}, { ENVIRONMENT: 'production', ...SUPABASE });
    expect(res.status).toBe(503);
  });

  it('place profile from the database carries the disclaimer and no invented hours', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([ROW])));
    const res = await app.request(`/places/${ROW.id}`, {}, { ENVIRONMENT: 'production', ...SUPABASE });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.disclaimer).toMatch(/verify/i);
    expect(body.data.schedules).toEqual([]);
  });

  it('Green Index is Not available (score null) when there are no measured inputs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([ROW])));
    const res = await app.request(`/places/${ROW.id}/green-score`, {}, { ENVIRONMENT: 'production', ...SUPABASE });
    const body = (await res.json()) as any;
    expect(body.data.score).toBeNull();
    expect(body.data.verification.status).toBe('NOT_AVAILABLE');
  });
});

describe('Public release: newsletter sign-ups', () => {
  beforeEach(() => {
    resetRateLimitStore();
    resetNewsletterStore();
  });
  afterEach(() => vi.unstubAllGlobals());

  const post = (body: unknown, env: Record<string, unknown> = {}) =>
    app.request('/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, env);

  it('rejects an invalid email', async () => {
    const res = await post({ email: 'not-an-email', consent: true });
    expect(res.status).toBe(400);
    expect(((await res.json()) as any).code).toBe('ERR_INVALID_EMAIL');
  });

  it('requires explicit consent', async () => {
    const res = await post({ email: 'a@b.co' });
    expect(res.status).toBe(400);
    expect(((await res.json()) as any).code).toBe('ERR_CONSENT_REQUIRED');
  });

  it('stores locally in development', async () => {
    const res = await post({ email: 'Reader@Example.com', consent: true });
    expect(res.status).toBe(201);
    expect(getNewsletterStore()).toEqual(['reader@example.com']);
  });

  it('is unavailable in production without the database, rather than pretending to succeed', async () => {
    const res = await post({ email: 'a@b.co', consent: true }, { ENVIRONMENT: 'production' });
    expect(res.status).toBe(503);
  });

  it('writes with the service-role key and answers a duplicate exactly like a new sign-up', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await post(
      { email: 'a@b.co', consent: true },
      { ENVIRONMENT: 'production', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' }
    );
    expect(res.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0] as any[];
    expect(url).toBe('https://example.supabase.co/rest/v1/newsletter_signups');
    expect(init.headers.apikey).toBe('service-key');
    expect(JSON.parse(init.body)).toMatchObject({ email: 'a@b.co', consent_given: true });
  });
});

describe('Public release: shared rate limit binding', () => {
  beforeEach(() => resetRateLimitStore());

  it('returns 429 when the Cloudflare rate limiter rejects the client', async () => {
    const RATE_LIMITER = { limit: vi.fn().mockResolvedValue({ success: false }) };
    const res = await app.request('/health', {}, { RATE_LIMITER });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });
});

describe('Public release: admin freshness audit uses the real data source', () => {
  const ADMIN = { ENVIRONMENT: 'production', ADMIN_API_KEY: 'prod-admin-key', ...SUPABASE };
  const asAdmin = { headers: { 'X-Admin-Key': 'prod-admin-key' } };

  beforeEach(() => {
    resetRateLimitStore();
    resetPlacesCache();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('audits database places in production, not fixtures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([ROW])));
    const res = await app.request('/admin/freshness-audit', asAdmin, ADMIN);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { total_facilities: number } };
    expect(body.data.total_facilities).toBe(1);
  });

  it('returns 503 in production when the database is not configured', async () => {
    const res = await app.request('/admin/freshness-audit', asAdmin, {
      ENVIRONMENT: 'production',
      ADMIN_API_KEY: 'prod-admin-key'
    });
    expect(res.status).toBe(503);
  });
});
