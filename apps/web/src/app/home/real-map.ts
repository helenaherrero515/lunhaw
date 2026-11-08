/**
 * The real Map tab: MapLibre GL with OpenFreeMap vector tiles (ADR-001), restyled in Lunhaw's greens.
 *
 * Loaded on demand (`import("./real-map")`) the first time the Map tab opens, so the ~800 KB map library
 * never slows down Home. If WebGL is missing or the map can't load, createRealMap rejects and the app keeps
 * its simplified drawn map.
 */
import {
  AttributionControl,
  GeolocateControl,
  LngLatBounds,
  Map as MapLibre,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type SymbolLayerSpecification,
  type TransformStyleFunction,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// NCR boundary from OpenStreetMap (scripts/data/fetch-ncr-boundary.mjs).
import NCR from "./data/ncr-boundary.json";
import { drawPin, PIN_RATIO } from "./pin-art";

/** The fields of a place the map needs (the home engine's place objects; text fields are HTML-escaped). */
export interface MapPlace {
  id: string;
  n: string;
  t: "park" | "lib";
  la: number;
  ln: number;
}

export interface RealMapOptions {
  /** Called when someone taps a pin. */
  onSelect: (id: string) => void;
  /** How much of each map edge is covered by floating UI (header, side panel, place card), in pixels. */
  covered?: () => { top: number; right: number; bottom: number; left: number };
}

/** The parts of a planned trip leg the map draws (see lib/api/client Trip). */
export interface TripLegShape {
  mode: "walk" | "rail" | "transfer";
  path?: [number, number][];
  colour?: string;
}

export interface RealMap {
  /** Shows these places. `focus` flies to the selected place (used when it was picked outside the map). */
  update(places: MapPlace[], selected: string | null, focus: boolean): void;
  /** Draws the straight-line walking estimate from a starting point to a place and frames both. */
  showWalk(from: { la: number; ln: number }, to: MapPlace): void;
  /**
   * Draws a planned trip: walking legs dashed, train legs in their line's colour, boarding and alighting
   * stations marked. Kept while `selected` stays `keepFor` (the destination place, or null for none).
   */
  showTrip(legs: TripLegShape[], keepFor: string | null): void;
  /** Call after the map's container becomes visible again. */
  resize(): void;
  destroy(): void;
}

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
export const MAP_WORKER_URL = "/vendor/maplibre-gl-worker.js";
const METRO_MANILA: [number, number] = [121.02, 14.6];
// Keep people roughly within Metro Manila and its neighbours; the data covers NCR only.
const MAX_BOUNDS: [[number, number], [number, number]] = [[120.55, 14.05], [121.55, 15.1]];
const LOAD_TIMEOUT_MS = 15000;

const C = { green: "#245C43", leaf: "#2F7D26", ink: "#1D3B2B" };

type Ring = number[][];
// Twice the signed area (shoelace); the sign tells the ring's winding.
const signedArea = (r: Ring) => r.reduce((s, [x1, y1], i) => { const [x2, y2] = r[(i + 1) % r.length]!; return s + (x1! * y2! - x2! * y1!); }, 0);

/** NCR's outer rings, whichever geometry type OpenStreetMap returned. */
const ncrRings = (): Ring[] => {
  const coords = NCR.geometry.coordinates as unknown;
  return NCR.geometry.type === "Polygon" ? [(coords as Ring[])[0]!] : (coords as Ring[][]).map((p) => p[0]!);
};

/**
 * A large rectangle with NCR cut out of it, used to dim everything outside Metro Manila.
 * MapLibre treats a ring as a hole only when it winds opposite to the outer ring, so the holes are reversed as needed.
 */
function outsideNcr() {
  const world: Ring = [[110, 0], [135, 0], [135, 25], [110, 25], [110, 0]];
  const sign = Math.sign(signedArea(world));
  const holes = ncrRings().map((r) => (Math.sign(signedArea(r)) === sign ? [...r].reverse() : r));
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [world, ...holes] } };
}

/** True when this browser can draw the map at all. */
export function webglAvailable(): boolean {
  if (typeof window === "undefined" || typeof (window as any).WebGLRenderingContext === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Place names arrive HTML-escaped (they're also used in innerHTML); map labels need the plain text.
const unescape = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[e as string]!);


// Lunhaw's palette for OpenFreeMap's light "Positron" style, by layer id. Layers a future style drops are skipped.
const PAINT: Record<string, Record<string, unknown>> = {
  background: { "background-color": "#F1F7EA" },
  water: { "fill-color": "#BFE6DC" },
  waterway: { "line-color": "#BFE6DC" },
  park: { "fill-color": "#CFEBBC", "fill-opacity": 1 },
  landcover_wood: { "fill-color": "#D3EDC2" },
  landuse_residential: { "fill-color": "#EAF1E0" },
  building: { "fill-color": "#E1E9D7" },
  highway_minor: { "line-color": "#FFFFFF" },
  highway_major_casing: { "line-color": "#D9E3CF" },
  highway_major_inner: { "line-color": "#FFFFFF" },
  highway_motorway_casing: { "line-color": "#D2DCC6" },
  highway_motorway_inner: { "line-color": "#FFFBEA" },
  railway_transit: { "line-color": "#B9C7B0" },
};

/**
 * Recolours the style before its first frame (so the default grey never flashes) and drops the US highway-shield
 * layers, which don't apply in Manila and make MapLibre log warnings about their filters.
 */
const lunhawStyle: TransformStyleFunction = (_previous, next) => ({
  ...next,
  layers: next.layers
    .filter((layer) => !/shield/.test(layer.id))
    .map((layer) => {
      const paint = { ...(("paint" in layer && layer.paint) || {}), ...(PAINT[layer.id] ?? {}) } as Record<string, unknown>;
      if (layer.type === "symbol" && /^(label_|water_name|highway-name)/.test(layer.id)) {
        paint["text-color"] = layer.id.startsWith("water") ? "#3F7F70" : "#4A6354";
        paint["text-halo-color"] = "#F7FBF2";
      }
      return { ...layer, paint } as typeof layer;
    }),
});

const point = (p: MapPlace) => ({
  type: "Feature" as const,
  geometry: { type: "Point" as const, coordinates: [p.ln, p.la] },
  properties: { id: p.id, name: unescape(p.n), t: p.t },
});

export async function createRealMap(container: HTMLElement, options: RealMapOptions): Promise<RealMap> {
  if (!webglAvailable()) throw new Error("WebGL is not available");
  setWorkerUrl(MAP_WORKER_URL);

  const map = new MapLibre({
    container,
    style: OPENFREEMAP_STYLE,
    transformStyle: lunhawStyle,
    center: METRO_MANILA,
    zoom: 11,
    minZoom: 9,
    maxZoom: 18,
    maxBounds: MAX_BOUNDS,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.touchZoomRotate.disableRotation();
  // Top-left: the bottom of the map is covered by the place card (and on phones by search and nav).
  map.addControl(new AttributionControl({ compact: true }), "top-left");
  map.addControl(new NavigationControl({ showCompass: false }), "top-right");
  // Asks for location only when someone taps the button (same promise as "Use my current location").
  map.addControl(
    new GeolocateControl({ positionOptions: { enableHighAccuracy: true, timeout: 8000 }, showAccuracyCircle: true }),
    "top-right"
  );

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("The map took too long to load")), LOAD_TIMEOUT_MS);
      map.once("load", () => {
        clearTimeout(timer);
        resolve();
      });
      // Errors before "load" (style or WebGL failures) mean we fall back; later tile hiccups are ignored.
      map.once("error", (e) => {
        if (!map.loaded()) {
          clearTimeout(timer);
          reject(e.error ?? new Error("The map couldn't load"));
        }
      });
    });
  } catch (err) {
    map.remove();
    throw err;
  }

  // 3D-style pins (pin-art.ts). The image has room for a ground shadow below the tip, so it is shifted down
  // by that much to keep the tip exactly on the place.
  const art = {
    park: drawPin("park", false),
    lib: drawPin("lib", false),
    parkSel: drawPin("park", true),
    libSel: drawPin("lib", true),
  };
  map.addImage("pin-park", art.park.image, { pixelRatio: PIN_RATIO });
  map.addImage("pin-lib", art.lib.image, { pixelRatio: PIN_RATIO });
  map.addImage("pin-park-sel", art.parkSel.image, { pixelRatio: PIN_RATIO });
  map.addImage("pin-lib-sel", art.libSel.image, { pixelRatio: PIN_RATIO });
  const font12 = 12;
  const labelAt = (a: { headAboveTip: number }, right: number) => [right / font12, -a.headAboveTip / font12] as [number, number];

  const empty = { type: "FeatureCollection" as const, features: [] as any[] };
  map.addSource("places", { type: "geojson", data: empty, cluster: true, clusterRadius: 44, clusterMaxZoom: 13 });
  map.addSource("selected", { type: "geojson", data: empty });
  map.addSource("walk", { type: "geojson", data: empty });

  const font = ["Noto Sans Bold"];
  // Pins are anchored at their tip; labels sit to the right of the pin's head.
  const label: SymbolLayerSpecification["layout"] = {
    "icon-anchor": "bottom",
    "icon-offset": [0, art.park.padBottom],
    "text-field": ["get", "name"],
    "text-font": font,
    "text-size": 12,
    "text-anchor": "left",
    "text-offset": labelAt(art.park, 22),
    "text-max-width": 12,
    "text-justify": "left",
    "text-optional": true,
  };
  const labelPaint = { "text-color": C.ink, "text-halo-color": "#FFFFFF", "text-halo-width": 2 };

  // NCR highlight: everything outside Metro Manila (labels included) is washed out, and the boundary gets a
  // green outline with a soft glow. Drawn above the base map and under the walk line, clusters and pins.
  map.addSource("ncr-outside", { type: "geojson", data: outsideNcr() });
  map.addSource("ncr", { type: "geojson", data: NCR as any });
  map.addLayer({ id: "ncr-outside", type: "fill", source: "ncr-outside", paint: { "fill-color": "#F4F8EE", "fill-opacity": 0.72 } });
  map.addLayer({
    id: "ncr-glow",
    type: "line",
    source: "ncr",
    layout: { "line-join": "round" },
    paint: { "line-color": "#98D746", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 6, 14, 12], "line-opacity": 0.35, "line-blur": 4 },
  });
  map.addLayer({
    id: "ncr-line",
    type: "line",
    source: "ncr",
    layout: { "line-join": "round" },
    paint: { "line-color": C.leaf, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.6, 14, 2.6], "line-opacity": 0.9 },
  });

  // Trips: train legs as solid lines in the line's colour (with a white casing), walking legs dashed.
  map.addLayer({
    id: "rail-casing",
    type: "line",
    source: "walk",
    filter: ["==", ["get", "kind"], "rail"],
    paint: { "line-color": "#FFFFFF", "line-width": 9 },
    layout: { "line-cap": "round", "line-join": "round" },
  });
  map.addLayer({
    id: "rail-line",
    type: "line",
    source: "walk",
    filter: ["==", ["get", "kind"], "rail"],
    paint: { "line-color": ["coalesce", ["get", "colour"], C.green], "line-width": 5 },
    layout: { "line-cap": "round", "line-join": "round" },
  });
  map.addLayer({
    id: "walk-line",
    type: "line",
    source: "walk",
    filter: ["all", ["==", ["geometry-type"], "LineString"], ["!=", ["get", "kind"], "rail"]],
    paint: { "line-color": C.green, "line-width": 4, "line-dasharray": [0.6, 2] },
    layout: { "line-cap": "round" },
  });
  map.addLayer({
    id: "walk-start",
    type: "circle",
    source: "walk",
    filter: ["all", ["==", ["geometry-type"], "Point"], ["!=", ["get", "kind"], "station"]],
    paint: { "circle-radius": 7, "circle-color": "#FFFFFF", "circle-stroke-color": C.green, "circle-stroke-width": 4 },
  });
  map.addLayer({
    id: "trip-station",
    type: "circle",
    source: "walk",
    filter: ["==", ["get", "kind"], "station"],
    paint: { "circle-radius": 6, "circle-color": "#FFFFFF", "circle-stroke-color": ["coalesce", ["get", "colour"], C.green], "circle-stroke-width": 3.5 },
  });
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "places",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": C.leaf,
      "circle-radius": ["step", ["get", "point_count"], 18, 5, 22, 10, 26],
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 3,
    },
  });
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "places",
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": font, "text-size": 13, "text-allow-overlap": true },
    paint: { "text-color": "#FFFFFF" },
  });
  map.addLayer({
    id: "pins",
    type: "symbol",
    source: "places",
    filter: ["!", ["has", "point_count"]],
    layout: { "icon-image": ["concat", "pin-", ["get", "t"]], "icon-allow-overlap": true, ...label },
    paint: labelPaint,
  });
  map.addLayer({
    id: "pin-selected",
    type: "symbol",
    source: "selected",
    layout: {
      "icon-image": ["concat", "pin-", ["get", "t"], "-sel"],
      "icon-allow-overlap": true,
      ...label,
      "text-offset": labelAt(art.parkSel, 32),
      "icon-offset": [0, art.parkSel.padBottom],
      "text-optional": false,
      "text-allow-overlap": true,
    },
    paint: { ...labelPaint, "text-halo-width": 2.5 },
  });

  const placesSource = map.getSource("places") as GeoJSONSource;
  const selectedSource = map.getSource("selected") as GeoJSONSource;
  const walkSource = map.getSource("walk") as GeoJSONSource;

  const pick = (e: { features?: MapGeoJSONFeature[] }) => {
    const id = e.features?.[0]?.properties?.id;
    if (id) options.onSelect(String(id));
  };
  map.on("click", "pins", pick);
  map.on("click", "pin-selected", pick);
  map.on("click", "clusters", async (e) => {
    const f = e.features?.[0];
    if (!f) return;
    const zoom = await placesSource.getClusterExpansionZoom(f.properties.cluster_id);
    map.easeTo({ center: (f.geometry as any).coordinates, zoom: zoom + 0.5 });
  });
  for (const layer of ["pins", "pin-selected", "clusters"]) {
    map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
  }

  // Frame places in the part of the map that isn't covered by floating UI.
  const padding = () => {
    if (options.covered) {
      const c = options.covered();
      return { top: c.top + 30, right: c.right + 30, bottom: c.bottom + 30, left: c.left + 30 };
    }
    const narrow = container.clientWidth < 720;
    return { top: narrow ? 90 : 50, right: 50, left: 50, bottom: narrow ? 240 : 190 };
  };
  let shownKey = "";
  let walkTo: string | null = null;
  let tripFor: string | null | undefined; // undefined = no trip drawn

  return {
    update(places, selected, focus) {
      // The walking line belongs to one destination; drop it once another place (or none) is chosen.
      if (walkTo && walkTo !== selected) {
        walkSource.setData(empty);
        walkTo = null;
      }
      if (tripFor !== undefined && tripFor !== selected) {
        walkSource.setData(empty);
        tripFor = undefined;
      }
      const sel = places.find((p) => p.id === selected) ?? null;
      placesSource.setData({ type: "FeatureCollection", features: places.filter((p) => p !== sel).map(point) });
      selectedSource.setData({ type: "FeatureCollection", features: sel ? [point(sel)] : [] });
      const key = places.map((p) => p.id).join(",");
      if (sel && focus) {
        map.flyTo({ center: [sel.ln, sel.la], zoom: Math.max(map.getZoom(), 14), padding: padding(), duration: 900 });
      } else if (!sel && key !== shownKey && places.length) {
        // A new set of places (first load, filter or search): frame them all.
        const b = new LngLatBounds();
        places.forEach((p) => b.extend([p.ln, p.la]));
        map.fitBounds(b, { padding: padding(), maxZoom: 15, duration: shownKey ? 700 : 0 });
      }
      shownKey = key;
    },
    showWalk(from, to) {
      walkTo = to.id;
      walkSource.setData({
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[from.ln, from.la], [to.ln, to.la]] } },
          { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [from.ln, from.la] } },
        ],
      });
      const b = new LngLatBounds([from.ln, from.la], [from.ln, from.la]).extend([to.ln, to.la]);
      map.fitBounds(b, { padding: padding(), maxZoom: 16, duration: 900 });
    },
    showTrip(legs, keepFor) {
      walkTo = null;
      tripFor = keepFor;
      const features: any[] = [];
      const b = new LngLatBounds();
      legs.forEach((leg, i) => {
        if (!leg.path || leg.path.length < 2) return;
        leg.path.forEach((c) => b.extend(c));
        if (leg.mode === "rail") {
          features.push({ type: "Feature", properties: { kind: "rail", colour: leg.colour }, geometry: { type: "LineString", coordinates: leg.path } });
          for (const c of [leg.path[0], leg.path[leg.path.length - 1]]) {
            features.push({ type: "Feature", properties: { kind: "station", colour: leg.colour }, geometry: { type: "Point", coordinates: c } });
          }
        } else {
          features.push({ type: "Feature", properties: { kind: "walk" }, geometry: { type: "LineString", coordinates: leg.path } });
          if (i === 0) features.push({ type: "Feature", properties: { kind: "start" }, geometry: { type: "Point", coordinates: leg.path[0] } });
        }
      });
      walkSource.setData({ type: "FeatureCollection", features });
      if (!b.isEmpty()) map.fitBounds(b, { padding: padding(), maxZoom: 16, duration: 900 });
    },
    resize() {
      map.resize();
    },
    destroy() {
      map.remove();
    },
  };
}
