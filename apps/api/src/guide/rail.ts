/**
 * Train legs on Metro Manila's operating rail lines (LRT-1, LRT-2, MRT-3), from OpenStreetMap station data
 * (scripts/data/fetch-rail-lines.mjs). Times are estimates; fares are not known yet and are never guessed.
 */
import RAIL from '../data/rail-lines.json';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Station extends LatLng {
  name: string;
  line: string;
  index: number;
}

export interface RailLine {
  id: string;
  name: string;
  colour: string;
  stations: { name: string; lat: number; lng: number }[];
}

export interface RideLeg {
  line: string;
  line_name: string;
  colour: string;
  board: string;
  alight: string;
  towards: string;
  stops: number;
  path: [number, number][]; // [lng, lat] for the map
}

export interface RailPlan {
  from_station: Station;
  to_station: Station;
  rides: RideLeg[];
  transfers: { at: string; note: string }[];
  ride_minutes: number;
}

// Estimates (labelled as such wherever shown): average time between stations, waiting and transfer walks.
export const MIN_PER_STOP = 2.5;
export const WAIT_MIN = 5;
export const TRANSFER_MIN = 7;

export const LINES: RailLine[] = (RAIL as { lines: RailLine[] }).lines;
const TRANSFERS = (RAIL as { transfers: { a: { line: string; station: string }; b: { line: string; station: string }; note: string }[] }).transfers;

export const RAIL_SOURCE = `${(RAIL as { source: string }).source} (${(RAIL as { licence: string }).licence}), ${(RAIL as { fetched_on: string }).fetched_on}`;

export function haversineM(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 12_742_000 * Math.asin(Math.sqrt(x));
}

const allStations: Station[] = LINES.flatMap((l) => l.stations.map((s, index) => ({ ...s, line: l.id, index })));

/** Stations within `radiusM` (straight line) of a point, nearest first. */
export function stationsNear(p: LatLng, radiusM: number): Station[] {
  return allStations
    .map((s) => ({ s, d: haversineM(p, s) }))
    .filter((x) => x.d <= radiusM)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.s);
}

const lineOf = (id: string) => LINES.find((l) => l.id === id)!;

function ride(line: RailLine, from: number, to: number): RideLeg {
  const step = to > from ? 1 : -1;
  const path: [number, number][] = [];
  for (let i = from; i !== to + step; i += step) path.push([line.stations[i]!.lng, line.stations[i]!.lat]);
  return {
    line: line.id,
    line_name: line.name,
    colour: line.colour,
    board: line.stations[from]!.name,
    alight: line.stations[to]!.name,
    towards: line.stations[step > 0 ? line.stations.length - 1 : 0]!.name,
    stops: Math.abs(to - from),
    path,
  };
}

const stationIndex = (lineId: string, name: string) => lineOf(lineId).stations.findIndex((s) => s.name === name);

/**
 * The fewest-transfer, fewest-stop rail plan between two stations (at most one transfer, which covers every
 * pair on today's three lines). Returns null when the stations are the same or no plan exists.
 */
export function railPlan(a: Station, b: Station): RailPlan | null {
  if (a.line === b.line) {
    if (a.index === b.index) return null;
    const r = ride(lineOf(a.line), a.index, b.index);
    return { from_station: a, to_station: b, rides: [r], transfers: [], ride_minutes: WAIT_MIN + r.stops * MIN_PER_STOP };
  }
  let best: RailPlan | null = null;
  for (const t of TRANSFERS) {
    for (const [x, y] of [
      [t.a, t.b],
      [t.b, t.a],
    ] as const) {
      if (x.line !== a.line || y.line !== b.line) continue;
      const xi = stationIndex(x.line, x.station);
      const yi = stationIndex(y.line, y.station);
      if (xi < 0 || yi < 0 || xi === a.index || yi === b.index) continue;
      const r1 = ride(lineOf(a.line), a.index, xi);
      const r2 = ride(lineOf(b.line), yi, b.index);
      const minutes = 2 * WAIT_MIN + TRANSFER_MIN + (r1.stops + r2.stops) * MIN_PER_STOP;
      if (!best || minutes < best.ride_minutes) {
        best = { from_station: a, to_station: b, rides: [r1, r2], transfers: [{ at: `${x.station} → ${y.station}`, note: t.note }], ride_minutes: minutes };
      }
    }
  }
  return best;
}
