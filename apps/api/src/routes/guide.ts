/**
 * Commute guide.
 *   POST /guide       AI chat (Claude Haiku 5.5) for signed-in users: answers with a reply and a structured trip.
 *   POST /guide/plan  The same trip planner without AI (real walking route, LRT/MRT option, Sakay.ph link).
 *
 * Routes, stations, times and fares come only from real data (trip.ts); see INV-001.
 */
import { Hono, type Context } from 'hono';
import Anthropic from '@anthropic-ai/sdk';
import type { Env, ProblemDetails } from '../types/index.js';
import { loadPlaces, isPublicEnvironment, hasSupabase, DataSourceUnavailableError } from '../data/places-source.js';
import { MOCK_PLACES } from './places.js';
import { planTrip, type Endpoint } from '../guide/trip.js';
import { RoutingUnavailableError } from '../guide/ors.js';
import { runGuide, type ChatTurn, type LunhawPlace } from '../guide/assistant.js';

export const guideRoute = new Hono<{ Bindings: Env }>();

const problem = (c: Context, status: 400 | 401 | 429 | 503, code: string, title: string, detail: string) =>
  c.json({ type: `https://api.lunhaw.ph/errors/${code}`, title, status, detail, instance: c.req.path, code } satisfies ProblemDetails, status, {
    'Content-Type': 'application/problem+json',
  });

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
const point = (v: any): { lat: number; lng: number } | null => {
  const lat = num(v?.lat);
  const lng = num(v?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
};
const endpoint = (v: any): Endpoint | null => {
  const p = point(v);
  return p ? { ...p, label: String(v?.label ?? 'Pinned location').slice(0, 120) } : null;
};

/** The signed-in user's id, checked with Supabase Auth. In local development without Supabase, a stand-in id. */
async function userId(c: Context<{ Bindings: Env }>): Promise<string | null> {
  const token = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!hasSupabase(c.env)) return isPublicEnvironment(c.env) ? null : 'local-dev-user';
  if (!token) return null;
  const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: c.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

async function withinLimit(c: Context<{ Bindings: Env }>, key: string): Promise<boolean> {
  if (!c.env?.GUIDE_LIMITER) return true;
  return (await c.env.GUIDE_LIMITER.limit({ key })).success;
}

/** Which parts are configured, so the app only offers what works. No secrets are revealed. */
guideRoute.get('/status', (c) =>
  c.json({ status: 'success', data: { routing: Boolean(c.env?.ORS_API_KEY), guide: Boolean(c.env?.ANTHROPIC_API_KEY && c.env?.ORS_API_KEY) } })
);

guideRoute.post('/plan', async (c) => {
  // Signed-in users only: each plan spends the free routing quota.
  const uid = await userId(c);
  if (!uid) return problem(c, 401, 'ERR_SIGN_IN_REQUIRED', 'Sign in required', 'Trip planning is available to signed-in users.');
  if (!(await withinLimit(c, `plan:${uid}`))) {
    return c.json(
      { type: 'https://api.lunhaw.ph/errors/ERR_PLAN_RATE_LIMITED', title: 'Too many requests', status: 429, detail: 'Please wait a minute before planning again.', code: 'ERR_PLAN_RATE_LIMITED' },
      429,
      { 'Retry-After': '60', 'Content-Type': 'application/problem+json' }
    );
  }
  const body = (await c.req.json().catch(() => null)) as { from?: unknown; to?: unknown } | null;
  const from = endpoint(body?.from);
  const to = endpoint(body?.to);
  if (!from || !to) return problem(c, 400, 'ERR_INVALID_TRIP', 'Invalid trip', 'Send from and to, each with lat, lng and an optional label.');
  try {
    return c.json({ status: 'success', data: await planTrip(c.env?.ORS_API_KEY, from, to) });
  } catch (e) {
    if (e instanceof RoutingUnavailableError) return problem(c, 503, 'ERR_ROUTING_UNAVAILABLE', 'Routing unavailable', e.message);
    throw e;
  }
});

guideRoute.post('/', async (c) => {
  const uid = await userId(c);
  if (!uid) return problem(c, 401, 'ERR_SIGN_IN_REQUIRED', 'Sign in required', 'The commute guide is available to signed-in users.');
  if (!c.env?.ANTHROPIC_API_KEY) return problem(c, 503, 'ERR_GUIDE_UNAVAILABLE', 'Guide unavailable', 'The commute guide is not configured yet.');
  if (!(await withinLimit(c, `guide:${uid}`))) {
    return c.json(
      { type: 'https://api.lunhaw.ph/errors/ERR_GUIDE_RATE_LIMITED', title: 'Too many messages', status: 429, detail: 'Please wait a minute before asking again.', code: 'ERR_GUIDE_RATE_LIMITED' },
      429,
      { 'Retry-After': '60', 'Content-Type': 'application/problem+json' }
    );
  }

  const body = (await c.req.json().catch(() => null)) as { messages?: unknown; location?: unknown; destination_id?: unknown } | null;
  const messages = (Array.isArray(body?.messages) ? body!.messages : [])
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 1500) })) as ChatTurn[];
  while (messages[0] && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1]!.role !== 'user') {
    return problem(c, 400, 'ERR_INVALID_MESSAGES', 'Invalid messages', 'Send the conversation, ending with the user’s message.');
  }

  let places: LunhawPlace[] = [];
  try {
    places = (await loadPlaces(c.env, MOCK_PLACES)).map((p) => ({ id: p.id, name: p.name, city: p.city, category: p.category, lat: p.coordinates.lat, lng: p.coordinates.lng }));
  } catch (e) {
    if (!(e instanceof DataSourceUnavailableError)) throw e;
  }
  const destination = places.find((p) => p.id === body?.destination_id);

  try {
    const out = await runGuide(c.env.ANTHROPIC_API_KEY, c.env.ORS_API_KEY, places, {
      messages,
      location: point(body?.location) ?? undefined,
      destination,
    });
    return c.json({ status: 'success', data: out });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return problem(c, 503, 'ERR_GUIDE_BUSY', 'Guide busy', 'The guide is busy right now. Please try again shortly.');
    if (e instanceof Anthropic.APIError) return problem(c, 503, 'ERR_GUIDE_UNAVAILABLE', 'Guide unavailable', 'The guide couldn’t answer right now. Please try again.');
    throw e;
  }
});
