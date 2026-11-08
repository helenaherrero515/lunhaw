import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../src/index';
import { resetRateLimitStore } from '../src/middleware/rate-limiter';
import { resetPlacesCache } from '../src/data/places-source';
import { railPlan, stationsNear, haversineM, LINES } from '../src/guide/rail';
import { sakayUrl } from '../src/guide/trip';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Katipunan (LRT-2) area -> Carriedo (LRT-1) area: far apart, both near stations.
const KATIPUNAN = { lat: 14.6311, lng: 121.0727, label: 'Katipunan Avenue' };
const QUIAPO = { lat: 14.5996, lng: 120.9815, label: 'Quiapo Church' };

const station = (line: string, name: string) => {
  const l = LINES.find((x) => x.id === line)!;
  const index = l.stations.findIndex((s) => s.name === name);
  return { ...l.stations[index]!, line, index };
};

/** Stand-in for OpenRouteService: a straight walk at ~1.3x the straight-line distance, 80 m per minute. */
function orsWalk(body: string) {
  const [[aLng, aLat], [bLng, bLat]] = JSON.parse(body).coordinates;
  const d = haversineM({ lat: aLat, lng: aLng }, { lat: bLat, lng: bLng }) * 1.3;
  return json({
    type: 'FeatureCollection',
    features: [
      {
        geometry: { type: 'LineString', coordinates: [[aLng, aLat], [bLng, bLat]] },
        properties: { summary: { distance: d, duration: (d / 80) * 60 }, segments: [{ steps: [{ instruction: 'Head west', distance: d }] }] },
      },
    ],
  });
}

function fetchStub(anthropicReplies: unknown[] = []) {
  const calls: { url: string; body?: string }[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const body = typeof init?.body === 'string' ? init.body : input instanceof Request ? await input.clone().text() : undefined;
    calls.push({ url, body });
    if (url.includes('openrouteservice.org/v2/directions')) return orsWalk(body!);
    if (url.includes('openrouteservice.org/geocode')) {
      return json({ features: [{ properties: { name: 'Quiapo Church', label: 'Quiapo Church, Manila' }, geometry: { coordinates: [QUIAPO.lng, QUIAPO.lat] } }] });
    }
    if (url.includes('api.anthropic.com')) return json(anthropicReplies.shift());
    if (url.includes('/auth/v1/user')) return json({ id: 'user-1' });
    if (url.includes('public_places')) return json([]);
    return json({}, 404);
  });
  vi.stubGlobal('fetch', fn);
  return { fn, calls };
}

const msg = (content: unknown[], stop_reason: string) => ({
  id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-haiku-5-5', content, stop_reason, stop_sequence: null,
  usage: { input_tokens: 100, output_tokens: 20 },
});

describe('Rail planner (OpenStreetMap stations)', () => {
  it('rides one line when both stations are on it', () => {
    const p = railPlan(station('MRT3', 'Ortigas'), station('MRT3', 'Ayala'))!;
    expect(p.rides).toHaveLength(1);
    expect(p.rides[0]).toMatchObject({ line: 'MRT3', board: 'Ortigas', alight: 'Ayala', towards: 'Taft Avenue', stops: 5 });
    expect(p.transfers).toEqual([]);
  });

  it('transfers between lines at a real interchange', () => {
    const p = railPlan(station('LRT2', 'Katipunan'), station('LRT1', 'Carriedo'))!;
    expect(p.rides.map((r) => [r.line, r.board, r.alight])).toEqual([
      ['LRT2', 'Katipunan', 'Recto'],
      ['LRT1', 'Doroteo Jose', 'Carriedo'],
    ]);
    expect(p.transfers[0]!.at).toBe('Recto → Doroteo Jose');
  });

  it('finds stations near a point, nearest first', () => {
    const near = stationsNear(KATIPUNAN, 1500);
    expect(near[0]!.name).toBe('Katipunan');
  });

  it('builds the Sakay.ph trip link from coordinates', () => {
    expect(sakayUrl(KATIPUNAN, QUIAPO)).toBe('https://sakay.ph/app/trip?from=14.631100,121.072700&to=14.599600,120.981500');
  });
});

describe('POST /guide/plan', () => {
  beforeEach(() => {
    resetRateLimitStore();
    resetPlacesCache();
  });
  afterEach(() => vi.unstubAllGlobals());

  const plan = (env: Record<string, unknown>, headers: Record<string, string> = {}) =>
    app.request('/v1/guide/plan', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ from: KATIPUNAN, to: QUIAPO }) }, env);

  it('requires sign-in in production', async () => {
    fetchStub();
    const res = await plan({ ENVIRONMENT: 'production', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon', ORS_API_KEY: 'k' });
    expect(res.status).toBe(401);
  });

  it('returns a real walking route, a faster LRT option, honest fares and a Sakay.ph link', async () => {
    const { calls } = fetchStub();
    const res = await plan({ ORS_API_KEY: 'ors-key' });
    expect(res.status).toBe(200);
    const trip = ((await res.json()) as any).data;
    expect(trip.options[0].kind).toBe('train');
    // Quiapo Church is a short walk from Recto, so LRT-2 alone beats transferring to LRT-1.
    expect(trip.options[0].legs.map((l: any) => l.mode)).toEqual(['walk', 'rail', 'walk']);
    expect(trip.options[0].legs[1]).toMatchObject({ line: 'LRT2', board: 'Katipunan', alight: 'Recto' });
    expect(trip.options[0].fare.status).toBe('NOT_AVAILABLE');
    const walkOpt = trip.options.find((o: any) => o.kind === 'walk');
    expect(walkOpt.fare).toMatchObject({ status: 'VERIFIED', amount_php: 0 });
    expect(trip.options[0].duration_min).toBeLessThan(walkOpt.duration_min);
    expect(trip.verification.status).toBe('ESTIMATE');
    expect(trip.sakay_url).toContain('sakay.ph/app/trip?from=');
    expect(trip.sources.join(' ')).toMatch(/OpenStreetMap/);
    expect(calls.some((c) => c.url.includes('foot-walking'))).toBe(true);
  });

  it('says routing is unavailable without a key instead of guessing', async () => {
    fetchStub();
    const res = await plan({});
    expect(res.status).toBe(503);
  });
});

describe('POST /guide (AI commute guide)', () => {
  beforeEach(() => {
    resetRateLimitStore();
    resetPlacesCache();
  });
  afterEach(() => vi.unstubAllGlobals());

  const ask = (env: Record<string, unknown>, body: unknown, headers: Record<string, string> = {}) =>
    app.request('/v1/guide', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }, env);

  it('requires sign-in in production and is unavailable without an Anthropic key', async () => {
    fetchStub();
    const prod = { ENVIRONMENT: 'production', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon' };
    expect((await ask(prod, { messages: [{ role: 'user', content: 'hi' }] })).status).toBe(401);
    const res = await ask(prod, { messages: [{ role: 'user', content: 'hi' }] }, { Authorization: 'Bearer token' });
    expect(res.status).toBe(503);
  });

  it('plans with tools, then replies; the app gets the structured trip', async () => {
    const replies = [
      msg([{ type: 'tool_use', id: 'tu_1', name: 'plan_trip', input: { from: KATIPUNAN, to: QUIAPO } }], 'tool_use'),
      msg([{ type: 'text', text: 'Take LRT-2 from Katipunan to Recto, then LRT-1 to Carriedo. About 40 minutes.' }], 'end_turn'),
    ];
    const { calls } = fetchStub(replies);
    const res = await ask({ ANTHROPIC_API_KEY: 'sk-test', ORS_API_KEY: 'ors' }, {
      messages: [{ role: 'user', content: 'How do I get to Quiapo Church?' }],
      location: { lat: KATIPUNAN.lat, lng: KATIPUNAN.lng },
    });
    expect(res.status).toBe(200);
    const d = ((await res.json()) as any).data;
    expect(d.reply).toContain('LRT-2');
    expect(d.trip.options[0].title).toBe('LRT Line 2');
    expect(d.trip.sakay_url).toContain('sakay.ph');

    const first = JSON.parse(calls.find((c) => c.url.includes('api.anthropic.com'))!.body!);
    expect(first.model).toBe('claude-haiku-5-5');
    expect(first.output_config).toEqual({ effort: 'low' });
    expect(first.tools.map((t: any) => t.name)).toEqual(['find_place', 'plan_trip']);
    expect(first.tools.every((t: any) => t.strict === true)).toBe(true);
    expect(first.system).toMatch(/Never invent or guess jeepney or bus routes/);
    // The shared location reaches the model as operator context, not as user text.
    expect(first.messages.at(-1)).toMatchObject({ role: 'system' });
  });

  it('rejects a conversation that does not end with the user', async () => {
    fetchStub();
    const res = await ask({ ANTHROPIC_API_KEY: 'sk-test' }, { messages: [{ role: 'assistant', content: 'Hello' }] });
    expect(res.status).toBe(400);
  });
});

describe('Retired prototype endpoints', () => {
  beforeEach(() => resetRateLimitStore());

  it('answer 410 Gone in production instead of serving sample routes', async () => {
    for (const path of ['/v1/commute/routes', '/v1/transit/lines', '/v1/saved/places']) {
      const res = await app.request(path, { method: path.includes('commute') ? 'POST' : 'GET' }, { ENVIRONMENT: 'production' });
      expect(res.status).toBe(410);
    }
  });
});

describe('GET /guide/status', () => {
  beforeEach(() => resetRateLimitStore());

  it('says which parts are configured without revealing anything else', async () => {
    const none = ((await (await app.request('/v1/guide/status', {}, {})).json()) as any).data;
    expect(none).toEqual({ routing: false, guide: false });
    const routingOnly = ((await (await app.request('/v1/guide/status', {}, { ORS_API_KEY: 'k' })).json()) as any).data;
    expect(routingOnly).toEqual({ routing: true, guide: false });
    const both = ((await (await app.request('/v1/guide/status', {}, { ORS_API_KEY: 'k', ANTHROPIC_API_KEY: 'a' })).json()) as any).data;
    expect(both).toEqual({ routing: true, guide: true });
  });
});
