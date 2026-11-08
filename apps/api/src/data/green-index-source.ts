/**
 * Green Index EQ-005 results (supabase/migrations/00015_green_index_eq005.sql).
 *
 * Results are computed yearly by scripts/green-index and stay unpublished until a person photo-checks them.
 * The anon key can only read published rows (row-level security), so an unchecked score can never leak.
 */
import type { Env } from '../types/index.js';
import { hasSupabase } from './places-source.js';

export const GREEN_INDEX_METHOD = 'EQ-005 v1';

export interface GreenIndexRun {
  period_start: string;
  period_end: string;
  datasets: Record<string, { name: string; licence: string; credit: string }>;
}

export interface GreenIndexRow {
  place_id: string;
  method_version: string;
  status: 'ESTIMATE' | 'NOT_AVAILABLE';
  unit_type: 'park_polygon' | 'library_300m';
  unit_source: string;
  unit_area_m2: number | null;
  tree_pct: number;
  other_veg_pct: number;
  water_pct: number;
  sealed_pct: number;
  bare_pct: number;
  canopy_sub: number;
  other_sub: number;
  unsealed_sub: number;
  score: number;
  score_p05: number;
  score_p95: number;
  band: 'Low' | 'Moderate' | 'High';
  borderline: boolean;
  ndvi_mean: number | null;
  green_access_300m: boolean | null;
  canopy_imagery_from: string | null;
  canopy_imagery_to: string | null;
  checked_on: string | null;
  check_points: number | null;
  cross_check: Record<string, unknown> | null;
  green_index_runs: GreenIndexRun | null;
}

const round5 = (v: number) => Math.round(v / 5) * 5;
const num = (v: unknown) => Number(v);

/** The published EQ-005 result for a place, or null when there isn't one (yet). */
export async function loadGreenIndex(env: Env | undefined, placeId: string): Promise<GreenIndexRow | null> {
  if (!hasSupabase(env)) return null;
  const url =
    `${env.SUPABASE_URL}/rest/v1/green_index_results` +
    `?place_id=eq.${encodeURIComponent(placeId)}&method_version=eq.${encodeURIComponent(GREEN_INDEX_METHOD)}` +
    `&published=is.true&status=eq.ESTIMATE&select=*,green_index_runs(period_start,period_end,datasets)`;
  const res = await fetch(url, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Green Index lookup failed (${res.status})`);
  const rows = (await res.json()) as GreenIndexRow[];
  return rows[0] ?? null;
}

/** Shapes a published row for the app: rounded score, band, range, components vs targets, sources, caveats. */
export function presentGreenIndex(row: GreenIndexRow) {
  const run = row.green_index_runs;
  const isPark = row.unit_type === 'park_polygon';
  const low = Math.max(0, round5(num(row.score_p05)));
  const high = Math.min(100, round5(num(row.score_p95)));
  return {
    status: 'ESTIMATE' as const,
    method: row.method_version,
    question: isPark ? 'How green is this park?' : 'How green is the area within a 5-minute walk (300 m)?',
    score: round5(num(row.score)),
    band: row.band,
    range: [low, high] as [number, number],
    borderline: row.borderline,
    unit: { type: row.unit_type, source: row.unit_source, area_ha: row.unit_area_m2 ? Math.round(num(row.unit_area_m2) / 100) / 100 : null },
    components: [
      { key: 'tree', label: 'Tree canopy', value_pct: num(row.tree_pct), target_pct: 30, weight: 0.6, sub_score: num(row.canopy_sub) },
      {
        key: 'other_green',
        label: 'Other greenery and water',
        value_pct: Math.round((num(row.other_veg_pct) + num(row.water_pct)) * 100) / 100,
        target_pct: 30,
        weight: 0.2,
        sub_score: num(row.other_sub),
      },
      { key: 'unsealed', label: 'Unsealed ground', value_pct: Math.round((100 - num(row.sealed_pct)) * 100) / 100, target_pct: null, weight: 0.2, sub_score: num(row.unsealed_sub) },
    ],
    vegetation_vigour_ndvi: row.ndvi_mean === null ? null : num(row.ndvi_mean),
    green_access_300m: row.green_access_300m,
    imagery: {
      canopy: row.canopy_imagery_from ? `${row.canopy_imagery_from}${row.canopy_imagery_to && row.canopy_imagery_to !== row.canopy_imagery_from ? ` to ${row.canopy_imagery_to}` : ''}` : null,
      vegetation: run ? `${run.period_start} to ${run.period_end}` : null,
    },
    checked: { on: row.checked_on, points: row.check_points },
    sources: run ? Object.values(run.datasets).map((d) => d.credit) : [],
    caveats: [
      'Satellite-based screening estimate; may miss small trees, recent changes or paved areas. Not an official inventory.',
      'Weights are a Lunhaw convention, not a scientific standard; tree canopy is weighted most because tree shade is the best-evidenced driver of cooling and perceived greenness.',
    ],
  };
}
