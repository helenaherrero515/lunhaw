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

export interface RealMap {
  /** Shows these places. `focus` flies to the selected place (used when it was picked outside the map). */
  update(places: MapPlace[], selected: string | null, focus: boolean): void;
  /** Draws the straight-line walking estimate from a starting point to a place and frames both. */
  showWalk(from: { la: number; ln: number }, to: MapPlace): void;
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

// Teardrop map pin (24-unit box, tip at 12,22) and the white icons drawn in its head (centred on 12,9.5).
const PIN_PATH = "M12 1.5C7.3 1.5 3.5 5.1 3.5 9.6c0 5.9 7.2 12 7.8 12.5a1.1 1.1 0 0 0 1.4 0c.6-.5 7.8-6.6 7.8-12.5 0-4.5-3.8-8.1-8.5-8.1z";
const ICONS: Record<MapPlace["t"], { fill: string[]; stroke: string[] }> = {
  // A round-canopy tree.
  park: {
    fill: ["M12 3.6c-1.9 0-3.4 1.4-3.6 3.2A3.1 3.1 0 0 0 7.2 12.4h9.6a3.1 3.1 0 0 0-1.2-5.6C15.4 5 13.9 3.6 12 3.6z"],
    stroke: ["M12 11.6v4.3"],
  },
  // A stack of three books on a shelf, the last one leaning.
  lib: {
    fill: ["M6.6 5.4h2.5v8.8H6.6z", "M9.9 6.6h2.5v7.6H9.9z", "M13.3 6.9l2.4-.6 2 7.4-2.4.6z"],
    stroke: ["M5.8 15.4h12.4"],
  },
};
const PIN_COLOURS: Record<MapPlace["t"], { fill: string; dark: string }> = {
  park: { fill: "#3D8F2B", dark: "#245C43" },
  lib: { fill: "#E9A11B", dark: "#B4740B" },
};

/** Draws a teardrop pin with the place's icon. Returns ImageData at 2× for crispness; anchor it at the bottom. */
function pinImage(type: MapPlace["t"], selected: boolean): ImageData {
  const ratio = 2;
  const scale = selected ? 2.2 : 1.75; // pin size in px per unit of the 24-unit box
  const pad = 4; // room for the drop shadow
  const w = Math.ceil(24 * scale + pad * 2);
  const h = Math.ceil(23 * scale + pad * 2);
  const canvas = document.createElement("canvas");
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  ctx.translate(pad, pad - 1.5 * scale + 1);
  ctx.scale(scale, scale);
  const pin = new Path2D(PIN_PATH);
  const { fill, dark } = PIN_COLOURS[type];
  ctx.shadowColor = "rgba(29,59,43,.35)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = selected ? dark : fill;
  ctx.fill(pin);
  ctx.shadowColor = "transparent";
  ctx.lineWidth = selected ? 1.6 : 1.3;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke(pin);
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  // Icons are drawn in their own 24-unit box, shrunk to fit the pin's head.
  ctx.translate(12, 9.5);
  ctx.scale(0.72, 0.72);
  ctx.translate(-12, -9.5);
  for (const d of ICONS[type].fill) ctx.fill(new Path2D(d));
  for (const d of ICONS[type].stroke) ctx.stroke(new Path2D(d));
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

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

  map.addImage("pin-park", pinImage("park", false), { pixelRatio: 2 });
  map.addImage("pin-lib", pinImage("lib", false), { pixelRatio: 2 });
  map.addImage("pin-park-sel", pinImage("park", true), { pixelRatio: 2 });
  map.addImage("pin-lib-sel", pinImage("lib", true), { pixelRatio: 2 });

  const empty = { type: "FeatureCollection" as const, features: [] as any[] };
  map.addSource("places", { type: "geojson", data: empty, cluster: true, clusterRadius: 44, clusterMaxZoom: 13 });
  map.addSource("selected", { type: "geojson", data: empty });
  map.addSource("walk", { type: "geojson", data: empty });

  const font = ["Noto Sans Bold"];
  // Pins are anchored at their tip; labels sit to the right of the pin's head.
  const label: SymbolLayerSpecification["layout"] = {
    "icon-anchor": "bottom",
    "text-field": ["get", "name"],
    "text-font": font,
    "text-size": 12,
    "text-anchor": "left",
    "text-offset": [1.4, -2.5],
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

  map.addLayer({
    id: "walk-line",
    type: "line",
    source: "walk",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: { "line-color": C.green, "line-width": 4, "line-dasharray": [0.6, 2] },
    layout: { "line-cap": "round" },
  });
  map.addLayer({
    id: "walk-start",
    type: "circle",
    source: "walk",
    filter: ["==", ["geometry-type"], "Point"],
    paint: { "circle-radius": 7, "circle-color": "#FFFFFF", "circle-stroke-color": C.green, "circle-stroke-width": 4 },
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
      "text-offset": [1.75, -3.1],
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

  return {
    update(places, selected, focus) {
      // The walking line belongs to one destination; drop it once another place (or none) is chosen.
      if (walkTo && walkTo !== selected) {
        walkSource.setData(empty);
        walkTo = null;
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
    resize() {
      map.resize();
    },
    destroy() {
      map.remove();
    },
  };
}
