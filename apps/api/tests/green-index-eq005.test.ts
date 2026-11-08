import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../src/index';
import { resetRateLimitStore } from '../src/middleware/rate-limiter';
import { resetPlacesCache } from '../src/data/places-source';

const SUPABASE = { ENVIRONMENT: 'production', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key' };
const PLACE = {
  id: 'ae200000-0000-4000-8000-000000000002',
  name: 'Arroceros Forest Park',
  category: 'park',
  description: 'Park in Manila.',
  lgu_city: 'Manila',
  barangay: 'Ermita',
  address: 'Antonio Villegas St',
  lat: 14.5946,
  lng: 120.9817,
  verification_status: 'ESTIMATE',
  official_source_name: null,
  official_source_url: null,
  derivation_note: null,
  last_verified_at: null,
};
const RESULT = {
  place_id: PLACE.id,
  method_version: 'EQ-005 v1',
  status: 'ESTIMATE',
  unit_type: 'park_polygon',
  unit_source: 'OSM way/30106291',
  unit_area_m2: 21213,
  tree_pct: 91.2,
  other_veg_pct: 0.2,
  water_pct: 1.1,
  sealed_pct: 7.5,
  bare_pct: 0,
  canopy_sub: 100,
  other_sub: 4.33,
  unsealed_sub: 92.5,
  score: 79.37,
  score_p05: 72.6,
  score_p95: 85.5,
  band: 'High',
  borderline: false,
  ndvi_mean: 0.701,
  green_access_300m: null,
  canopy_imagery_from: '2019-04',
  canopy_imagery_to: '2019-04',
  checked_on: '2026-11-20',
  check_points: 120,
  cross_check: null,
  green_index_runs: {
    period_start: '2025-12-01',
    period_end: '2026-05-31',
    datasets: { canopy: { name: 'CHM', licence: 'CC BY 4.0', credit: 'Canopy height: WRI and Meta (CC BY 4.0).' } },
  },
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('GET /places/:id/green-index (EQ-005)', () => {
  beforeEach(() => {
    resetRateLimitStore();
    resetPlacesCache();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is Not available without a database (never a made-up number)', async () => {
    const res = await app.request('/places/plc_001/green-index', {}, {});
    // Local fixtures: the place may exist, but there is no published result.
    if (res.status === 200) {
      const body = (await res.json()) as any;
      expect(body.data.status).toBe('NOT_AVAILABLE');
      expect(body.data.score).toBeUndefined();
    } else {
      expect(res.status).toBe(404);
    }
  });

  it('asks only for published, ESTIMATE rows and is Not available when there is none', async () => {
    const fetchMock = vi.fn(async (url: string) => (String(url).includes('public_places') ? json([PLACE]) : json([])));
    vi.stubGlobal('fetch', fetchMock);
    const res = await app.request(`/places/${PLACE.id}/green-index`, {}, SUPABASE);
    const body = (await res.json()) as any;
    expect(body.data.status).toBe('NOT_AVAILABLE');
    const giUrl = String(fetchMock.mock.calls.find(([u]) => String(u).includes('green_index_results'))![0]);
    expect(giUrl).toContain('published=is.true');
    expect(giUrl).toContain('status=eq.ESTIMATE');
    expect(giUrl).toContain(encodeURIComponent('EQ-005 v1'));
  });

  it('presents a published result: rounded score, band, range, components vs targets, credits and caveats', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).includes('public_places') ? json([PLACE]) : json([RESULT]))));
    const res = await app.request(`/places/${PLACE.id}/green-index`, {}, SUPABASE);
    const d = ((await res.json()) as any).data;
    expect(d).toMatchObject({ status: 'ESTIMATE', method: 'EQ-005 v1', score: 80, band: 'High', range: [75, 85], borderline: false });
    expect(d.question).toBe('How green is this park?');
    expect(d.unit.area_ha).toBeCloseTo(2.12, 2);
    expect(d.components[0]).toMatchObject({ key: 'tree', value_pct: 91.2, target_pct: 30, weight: 0.6 });
    expect(d.components[2]).toMatchObject({ key: 'unsealed', value_pct: 92.5 });
    expect(d.imagery).toEqual({ canopy: '2019-04', vegetation: '2025-12-01 to 2026-05-31' });
    expect(d.checked).toEqual({ on: '2026-11-20', points: 120 });
    expect(d.sources[0]).toContain('CC BY 4.0');
    expect(d.caveats.join(' ')).toMatch(/not an official inventory/i);
  });
});
