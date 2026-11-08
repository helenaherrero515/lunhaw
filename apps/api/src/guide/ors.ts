/**
 * OpenRouteService: walking directions and place search over OpenStreetMap data.
 * Free plan, non-commercial (https://openrouteservice.org/plans/). Key in the ORS_API_KEY secret.
 * Routes © openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors.
 */
import type { LatLng } from './rail.js';

const ORS = 'https://api.openrouteservice.org';
// Metro Manila and its edges, to keep place search local.
const NCR_RECT = { minLng: 120.85, minLat: 14.3, maxLng: 121.25, maxLat: 14.85 };

export const ORS_CREDIT = 'Walking routes © openrouteservice.org by HeiGIT · Map data © OpenStreetMap contributors';

export class RoutingUnavailableError extends Error {}

export interface WalkStep {
  instruction: string;
  distance_m: number;
}

export interface Walk {
  distance_m: number;
  duration_min: number;
  steps: WalkStep[];
  path: [number, number][];
}

export interface PlaceHit extends LatLng {
  name: string;
  label: string;
  source: 'openrouteservice';
}

function key(apiKey: string | undefined): string {
  if (!apiKey) throw new RoutingUnavailableError('Walking routes are not configured (ORS_API_KEY).');
  return apiKey;
}

/** A walking route along streets and paths. */
export async function walk(apiKey: string | undefined, from: LatLng, to: LatLng): Promise<Walk> {
  const res = await fetch(`${ORS}/v2/directions/foot-walking/geojson`, {
    method: 'POST',
    headers: { Authorization: key(apiKey), 'Content-Type': 'application/json', Accept: 'application/geo+json' },
    body: JSON.stringify({ coordinates: [[from.lng, from.lat], [to.lng, to.lat]], instructions: true, language: 'en', units: 'm' }),
  });
  if (!res.ok) throw new RoutingUnavailableError(`Walking route unavailable (${res.status})`);
  const data = (await res.json()) as any;
  const f = data.features?.[0];
  if (!f) throw new RoutingUnavailableError('No walking route found');
  const steps: WalkStep[] = (f.properties.segments ?? []).flatMap((s: any) =>
    (s.steps ?? []).map((st: any) => ({ instruction: String(st.instruction), distance_m: Math.round(Number(st.distance)) }))
  );
  return {
    distance_m: Math.round(Number(f.properties.summary?.distance ?? 0)),
    duration_min: Math.max(1, Math.round(Number(f.properties.summary?.duration ?? 0) / 60)),
    steps,
    path: f.geometry.coordinates.map((c: number[]) => [c[0], c[1]] as [number, number]),
  };
}

/** Places matching free text, limited to Metro Manila. */
export async function searchPlaces(apiKey: string | undefined, text: string, near?: LatLng): Promise<PlaceHit[]> {
  const q = new URLSearchParams({
    text,
    size: '5',
    'boundary.country': 'PH',
    'boundary.rect.min_lon': String(NCR_RECT.minLng),
    'boundary.rect.min_lat': String(NCR_RECT.minLat),
    'boundary.rect.max_lon': String(NCR_RECT.maxLng),
    'boundary.rect.max_lat': String(NCR_RECT.maxLat),
  });
  if (near) {
    q.set('focus.point.lat', String(near.lat));
    q.set('focus.point.lon', String(near.lng));
  }
  const res = await fetch(`${ORS}/geocode/search?${q}`, { headers: { Authorization: key(apiKey), Accept: 'application/json' } });
  if (!res.ok) throw new RoutingUnavailableError(`Place search unavailable (${res.status})`);
  const data = (await res.json()) as any;
  return (data.features ?? []).map((f: any) => ({
    name: String(f.properties.name),
    label: String(f.properties.label),
    lat: Number(f.geometry.coordinates[1]),
    lng: Number(f.geometry.coordinates[0]),
    source: 'openrouteservice' as const,
  }));
}
