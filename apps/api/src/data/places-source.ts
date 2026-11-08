import type { Env, Place, PlaceCategory, VerificationStatus } from '../types/index.js';

/**
 * Where facility records come from.
 *
 *  - Supabase configured (SUPABASE_URL + SUPABASE_ANON_KEY): read the `public_places` view.
 *  - Not configured, local development / tests: the in-repo fixtures passed in by the caller.
 *  - Not configured in staging/production: fail loudly (503). Never serve fixtures to the public.
 */

export class DataSourceUnavailableError extends Error {
  status = 503;
  code = 'ERR_DATA_SOURCE_UNAVAILABLE';
  constructor(detail: string) {
    super(detail);
    this.name = 'Data Source Unavailable';
  }
}

interface PublicPlaceRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  lgu_city: string;
  barangay: string;
  address: string | null;
  lat: number;
  lng: number;
  verification_status: VerificationStatus;
  official_source_name: string | null;
  official_source_url: string | null;
  derivation_note: string | null;
  last_verified_at: string | null;
}

const CACHE_TTL_MS = 60_000;
let cache: { key: string; at: number; places: Place[] } | null = null;

/** Clears the in-isolate cache (tests). */
export function resetPlacesCache(): void {
  cache = null;
}

export function isPublicEnvironment(env: Env | undefined): boolean {
  const e = (env?.ENVIRONMENT || '').toLowerCase();
  return e === 'production' || e === 'staging';
}

export function hasSupabase(env: Env | undefined): env is Env & { SUPABASE_URL: string; SUPABASE_ANON_KEY: string } {
  return Boolean(env?.SUPABASE_URL && env?.SUPABASE_ANON_KEY);
}

export function rowToPlace(r: PublicPlaceRow): Place {
  return {
    id: r.id,
    name: r.name,
    category: r.category as PlaceCategory,
    description: r.description,
    city: r.lgu_city,
    barangay: r.barangay,
    address: r.address ?? '',
    coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
    point_geojson: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] },
    green_index_score: null,
    verification: {
      status: r.verification_status,
      official_source_name: r.official_source_name,
      official_source_url: r.official_source_url,
      derivation_note: r.derivation_note,
      last_verified_at: r.last_verified_at
    },
    schedules: []
  };
}

export async function loadPlaces(env: Env | undefined, fixtures: Place[]): Promise<Place[]> {
  if (!hasSupabase(env)) {
    if (isPublicEnvironment(env)) {
      throw new DataSourceUnavailableError('The places database is not configured for this environment.');
    }
    return fixtures;
  }

  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  if (cache && cache.key === base && Date.now() - cache.at < CACHE_TTL_MS) return cache.places;

  let res: Response;
  try {
    res = await fetch(`${base}/rest/v1/public_places?select=*&order=name.asc`, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Accept: 'application/json'
      }
    });
  } catch {
    throw new DataSourceUnavailableError('Could not reach the places database.');
  }
  if (!res.ok) {
    throw new DataSourceUnavailableError(`The places database returned HTTP ${res.status}.`);
  }

  const rows = (await res.json()) as PublicPlaceRow[];
  const places = rows.map(rowToPlace);
  cache = { key: base, at: Date.now(), places };
  return places;
}
