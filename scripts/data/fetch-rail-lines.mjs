#!/usr/bin/env node
/**
 * Saves Metro Manila's operating rail lines (LRT-1, LRT-2, MRT-3) and their stations in order, from
 * OpenStreetMap route relations. Used by the API's trip planner for train legs.
 *
 * Only lines in passenger service are included. The PNR Metro Commuter Line (suspended for NSCR
 * construction) and the Metro Manila Subway (not yet open) are left out on purpose.
 * Data © OpenStreetMap contributors (ODbL).
 *
 * Writes apps/api/src/data/rail-lines.json
 * Usage: node scripts/data/fetch-rail-lines.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const UA = "LunhawRailFetcher/1.0 (https://lunhaw.pages.dev; lunhaw.hln@gmail.com)";

// One direction per line is enough: stations are the same both ways.
const LINES = [
  { id: "LRT1", name: "LRT Line 1", colour: "#2E9E4F", relation: 110418 },
  { id: "LRT2", name: "LRT Line 2", colour: "#6B3FA0", relation: 110410 },
  { id: "MRT3", name: "MRT Line 3", colour: "#1F5FB8", relation: 109159 },
];
// Interchanges where passengers walk between lines (station names as each line calls them).
const TRANSFERS = [
  { a: ["LRT1", "Doroteo Jose"], b: ["LRT2", "Recto"], note: "Covered walkway between Doroteo Jose (LRT-1) and Recto (LRT-2)" },
  { a: ["LRT1", "EDSA"], b: ["MRT3", "Taft Avenue"], note: "Walkway between EDSA (LRT-1) and Taft Avenue (MRT-3)" },
  { a: ["LRT2", "Araneta Center-Cubao"], b: ["MRT3", "Araneta Center-Cubao"], note: "Walkway between the two Araneta Center-Cubao stations (LRT-2 and MRT-3)" },
];

async function overpass(ql) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(ql),
    });
    if (r.ok) return r.json();
    // The public Overpass instance is busy at times; back off and retry.
    if (attempt < 5 && [429, 502, 503, 504].includes(r.status)) {
      await new Promise((res) => setTimeout(res, 8000 * attempt));
      continue;
    }
    throw new Error(`Overpass answered ${r.status}`);
  }
}

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const clean = (s) => s.replace(/\s+(LRT|MRT)(-?\d)?\s+Station$/i, "").replace(/\s+Station$/i, "").trim();

/** Name of the railway station closest to a stop, for stops whose own name tag is broken. */
async function stationNameNear(lat, lon) {
  const d = await overpass(`[out:json][timeout:60];nwr(around:300,${lat},${lon})["railway"="station"];out tags;`);
  const named = d.elements.map((e) => clean(e.tags?.name || "")).filter((x) => /[a-z]/i.test(x));
  if (!named.length) throw new Error(`No named station near ${lat},${lon}`);
  return named[0];
}

const out = { source: "OpenStreetMap route relations", licence: "ODbL, © OpenStreetMap contributors", fetched_on: new Date().toISOString().slice(0, 10), lines: [], transfers: [] };

for (const line of LINES) {
  // All member nodes in one step (chained node(r:...) statements would run against the previous result).
  const data = await overpass(`[out:json][timeout:120];relation(${line.relation});out body;node(r);out body;`);
  const rel = data.elements.find((e) => e.type === "relation");
  const nodes = new Map(data.elements.filter((e) => e.type === "node").map((n) => [n.id, n]));
  const stops = [];
  for (const m of rel.members) {
    if (m.type !== "node" || !/^stop/.test(m.role)) continue;
    const n = nodes.get(m.ref);
    if (!n) continue;
    let name = clean(n.tags?.name || "");
    // Some stops carry a broken name tag (United Nations' stop is name="/"): use the nearby station's name.
    if (!/[a-z]/i.test(name)) name = await stationNameNear(n.lat, n.lon);
    if (stops.some((s) => norm(s.name) === norm(name))) continue;
    stops.push({ name, lat: +n.lat.toFixed(6), lng: +n.lon.toFixed(6), osm: `node/${n.id}` });
  }
  if (stops.length < 8) throw new Error(`${line.name}: only ${stops.length} stops found; check relation ${line.relation}`);
  out.lines.push({ ...line, relation: `relation/${line.relation}`, stations: stops });
  console.log(`${line.name}: ${stops.length} stations (${stops[0].name} → ${stops.at(-1).name})`);
  await new Promise((r) => setTimeout(r, 1500));
}

for (const t of TRANSFERS) {
  const find = ([lid, name]) => {
    const l = out.lines.find((x) => x.id === lid);
    const want = norm(name);
    const s =
      l.stations.find((x) => norm(x.name) === want) ||
      l.stations.find((x) => norm(x.name) && (norm(x.name).startsWith(want) || want.startsWith(norm(x.name))));
    if (!s) throw new Error(`Transfer station ${name} not found on ${lid}: ${l.stations.map((x) => x.name).join(", ")}`);
    return { line: lid, station: s.name };
  };
  out.transfers.push({ a: find(t.a), b: find(t.b), note: t.note });
}

writeFileSync(resolve(root, "apps/api/src/data/rail-lines.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote apps/api/src/data/rail-lines.json (${out.transfers.length} transfers)`);
