/**
 * Plans a trip from real data only (INV-001):
 *   * walking: street-level route from OpenRouteService (OpenStreetMap)
 *   * train:   LRT-1 / LRT-2 / MRT-3 legs from OpenStreetMap station data, with real walks to and from stations
 *   * jeepney / bus: not planned here; a Sakay.ph link opens the same trip there
 * Every duration is an Estimate. Train fares are Not available yet: they are shown only once a person
 * confirms the official fare matrix.
 */
import { walk, ORS_CREDIT, type Walk } from './ors.js';
import { haversineM, railPlan, stationsNear, RAIL_SOURCE, MIN_PER_STOP, WAIT_MIN, TRANSFER_MIN, type LatLng, type RideLeg } from './rail.js';

export interface Endpoint extends LatLng {
  label: string;
}

export type Leg =
  | { mode: 'walk'; from: string; to: string; distance_m: number; duration_min: number; steps: { instruction: string; distance_m: number }[]; path: [number, number][] }
  | ({ mode: 'rail'; duration_min: number } & RideLeg)
  | { mode: 'transfer'; at: string; note: string; duration_min: number };

export interface TripOption {
  kind: 'walk' | 'train';
  title: string;
  duration_min: number;
  legs: Leg[];
  fare: { status: 'NOT_AVAILABLE'; note: string } | { status: 'VERIFIED'; amount_php: number; note: string };
}

export interface Trip {
  from: Endpoint;
  to: Endpoint;
  straight_line_km: number;
  options: TripOption[];
  sakay_url: string;
  verification: { status: 'ESTIMATE'; note: string };
  sources: string[];
}

const STATION_RADIUS_M = 1500; // consider stations within ~20 minutes' walk
const MAX_WALK_ONLY_M = 6000; // beyond this, a walk-only option is still shown but never recommended first

const walkLeg = (w: Walk, from: string, to: string): Leg => ({ mode: 'walk', from, to, distance_m: w.distance_m, duration_min: w.duration_min, steps: w.steps, path: w.path });

export function sakayUrl(from: LatLng, to: LatLng): string {
  const f = (p: LatLng) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  return `https://sakay.ph/app/trip?from=${f(from)}&to=${f(to)}`;
}

export async function planTrip(orsKey: string | undefined, from: Endpoint, to: Endpoint): Promise<Trip> {
  const options: TripOption[] = [];
  const direct = await walk(orsKey, from, to);
  options.push({
    kind: 'walk',
    title: 'Walk',
    duration_min: direct.duration_min,
    legs: [walkLeg(direct, from.label, to.label)],
    fare: { status: 'VERIFIED', amount_php: 0, note: 'Walking is free.' },
  });

  // Best train plan by straight-line estimate first, then real walks for the chosen stations only.
  const origins = stationsNear(from, STATION_RADIUS_M).slice(0, 4);
  const dests = stationsNear(to, STATION_RADIUS_M).slice(0, 4);
  let best: { plan: NonNullable<ReturnType<typeof railPlan>>; est: number } | null = null;
  for (const a of origins) {
    for (const b of dests) {
      const plan = railPlan(a, b);
      if (!plan) continue;
      // ~80 m per minute walking, 1.3 detour factor, for ranking only.
      const est = (haversineM(from, a) * 1.3) / 80 + plan.ride_minutes + (haversineM(b, to) * 1.3) / 80;
      if (!best || est < best.est) best = { plan, est };
    }
  }
  if (best && best.est < direct.duration_min) {
    const { plan } = best;
    const [w1, w2] = await Promise.all([walk(orsKey, from, plan.from_station), walk(orsKey, plan.to_station, to)]);
    const legs: Leg[] = [walkLeg(w1, from.label, `${plan.from_station.name} station`)];
    plan.rides.forEach((r, i) => {
      legs.push({ mode: 'rail', ...r, duration_min: Math.round(WAIT_MIN + r.stops * MIN_PER_STOP) });
      const t = plan.transfers[i];
      if (t) legs.push({ mode: 'transfer', at: t.at, note: t.note, duration_min: TRANSFER_MIN });
    });
    legs.push(walkLeg(w2, `${plan.to_station.name} station`, to.label));
    const total = w1.duration_min + plan.ride_minutes + w2.duration_min;
    if (total < direct.duration_min) {
      options.unshift({
        kind: 'train',
        title: plan.rides.map((r) => r.line_name).join(' + '),
        duration_min: Math.round(total),
        legs,
        fare: { status: 'NOT_AVAILABLE', note: 'Train fares aren’t confirmed in Lunhaw yet. Check the fare at the station.' },
      });
    }
  }
  if (direct.distance_m > MAX_WALK_ONLY_M && options[0]?.kind === 'walk' && options.length > 1) options.push(options.shift()!);

  return {
    from,
    to,
    straight_line_km: Math.round(haversineM(from, to) / 100) / 10,
    options,
    sakay_url: sakayUrl(from, to),
    verification: {
      status: 'ESTIMATE',
      note: `Walking times come from the route length. Train times assume about ${MIN_PER_STOP} minutes between stations, ${WAIT_MIN} minutes' wait and ${TRANSFER_MIN} minutes per transfer. Jeepney and bus options are on Sakay.ph.`,
    },
    sources: [ORS_CREDIT, `Train lines and stations: ${RAIL_SOURCE}`],
  };
}
