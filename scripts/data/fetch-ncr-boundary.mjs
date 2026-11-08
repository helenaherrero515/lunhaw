#!/usr/bin/env node
/**
 * Fetches the National Capital Region (Metro Manila) boundary from OpenStreetMap via Nominatim,
 * simplified to ~50 m, for the map's NCR outline and the dimmed area outside it.
 * Data © OpenStreetMap contributors (ODbL), already credited in the map's attribution.
 *
 * Writes apps/web/src/app/home/data/ncr-boundary.json (bundled with the lazily loaded map code).
 * Usage: node scripts/data/fetch-ncr-boundary.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const url = new URL("https://nominatim.openstreetmap.org/search");
Object.entries({ q: "Metro Manila, Philippines", format: "geojson", polygon_geojson: "1", polygon_threshold: "0.0005", limit: "1" })
  .forEach(([k, v]) => url.searchParams.set(k, v));
const res = await fetch(url, { headers: { "User-Agent": "LunhawBoundaryFetcher/1.0 (https://lunhaw.pages.dev; lunhaw.hln@gmail.com)" } });
if (!res.ok) throw new Error(`Nominatim answered ${res.status}`);
const f = (await res.json()).features?.[0];
if (!f || !/Polygon/.test(f.geometry.type)) throw new Error("No polygon for Metro Manila");
if (!/Metro Manila|National Capital Region/i.test(f.properties.display_name)) throw new Error(`Unexpected match: ${f.properties.display_name}`);

const round = (c) => (typeof c[0] === "number" ? [+c[0].toFixed(5), +c[1].toFixed(5)] : c.map(round));
// Keep outer rings only: the outline and mask only need the region's edge.
const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
const outer = polygons.map((p) => [round(p[0])]);
const geometry = outer.length === 1 ? { type: "Polygon", coordinates: outer[0] } : { type: "MultiPolygon", coordinates: outer };
const out = { type: "Feature", properties: { name: "National Capital Region", source: `OSM ${f.properties.osm_type}/${f.properties.osm_id}`, license: "ODbL, © OpenStreetMap contributors" }, geometry };
const file = resolve(root, "apps/web/src/app/home/data/ncr-boundary.json");
writeFileSync(file, JSON.stringify(out) + "\n");
console.log(`${f.properties.display_name} (${f.properties.osm_type}/${f.properties.osm_id}): ${geometry.type}, ${outer.reduce((n, p) => n + p[0].length, 0)} points, ${(JSON.stringify(out).length / 1024).toFixed(1)} KB`);
