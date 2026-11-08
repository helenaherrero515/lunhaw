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
  /** SVG inner markup for the pin icons (24×24 stroke icons), keyed by place type. */
  icons: { park: string; lib: string };
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

const C = { green: "#245C43", leaf: "#2F7D26", park: "#98D746", lib: "#F6B93B", ink: "#1D3B2B" };

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

/** Draws a round pin with the place's icon, matching the app's drawn pins. Returns ImageData at 2× for crispness. */
function pinImage(fill: string, iconSvg: string, selected: boolean): ImageData {
  const ratio = 2;
  const r = selected ? 16 : 13;
  const ring = selected ? 21 : 0;
  const size = (Math.max(r, ring) + 4) * 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  ctx.translate(size / 2, size / 2);
  if (selected) {
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.green;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.shadowColor = "rgba(29,59,43,.25)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  // The icons are 24×24 stroked paths; scale them to sit inside the circle.
  const scale = (r * 1.15) / 24;
  ctx.save();
  ctx.translate(-12 * scale, -12 * scale);
  ctx.scale(scale, scale);
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.ink;
  for (const m of iconSvg.matchAll(/d="([^"]+)"/g)) ctx.stroke(new Path2D(m[1]));
  ctx.restore();
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

  map.addImage("pin-park", pinImage(C.park, options.icons.park, false), { pixelRatio: 2 });
  map.addImage("pin-lib", pinImage(C.lib, options.icons.lib, false), { pixelRatio: 2 });
  map.addImage("pin-park-sel", pinImage(C.park, options.icons.park, true), { pixelRatio: 2 });
  map.addImage("pin-lib-sel", pinImage(C.lib, options.icons.lib, true), { pixelRatio: 2 });

  const empty = { type: "FeatureCollection" as const, features: [] as any[] };
  map.addSource("places", { type: "geojson", data: empty, cluster: true, clusterRadius: 44, clusterMaxZoom: 13 });
  map.addSource("selected", { type: "geojson", data: empty });
  map.addSource("walk", { type: "geojson", data: empty });

  const font = ["Noto Sans Bold"];
  const label: SymbolLayerSpecification["layout"] = {
    "text-field": ["get", "name"],
    "text-font": font,
    "text-size": 12,
    "text-anchor": "left",
    "text-offset": [1.35, 0],
    "text-max-width": 12,
    "text-justify": "left",
    "text-optional": true,
  };
  const labelPaint = { "text-color": C.ink, "text-halo-color": "#FFFFFF", "text-halo-width": 2 };

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
      "text-offset": [1.9, 0],
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
