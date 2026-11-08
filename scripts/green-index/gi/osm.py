"""OpenStreetMap inputs via the Overpass API: park polygons, buildings, paved areas, nearby green spaces."""
from __future__ import annotations

import time

import requests
from shapely.geometry import LineString, Polygon
from shapely.ops import linemerge, polygonize, unary_union

OVERPASS = "https://overpass-api.de/api/interpreter"
UA = {"User-Agent": "LunhawGreenIndex/1.0 (https://lunhaw.pages.dev; lunhaw.hln@gmail.com)"}


def query(ql: str) -> dict:
    for attempt in range(5):
        r = requests.post(OVERPASS, data={"data": ql}, headers=UA, timeout=180)
        if r.status_code in (429, 502, 503, 504):
            time.sleep(10 * (attempt + 1))
            continue
        r.raise_for_status()
        time.sleep(1.5)  # be polite to the public Overpass instance
        return r.json()
    raise RuntimeError("Overpass kept refusing the request")


def _ring(el) -> list[tuple[float, float]]:
    return [(p["lon"], p["lat"]) for p in el.get("geometry", [])]


def element_polygons(el) -> list[Polygon]:
    """Polygons (lon/lat) for a closed way or a multipolygon relation."""
    if el["type"] == "way":
        pts = _ring(el)
        return [Polygon(pts)] if len(pts) >= 4 and pts[0] == pts[-1] else []
    if el["type"] == "relation":
        outer = [LineString(_ring(m)) for m in el.get("members", []) if m.get("role") in ("outer", "") and len(m.get("geometry", [])) >= 2]
        inner = [LineString(_ring(m)) for m in el.get("members", []) if m.get("role") == "inner" and len(m.get("geometry", [])) >= 2]
        outers = list(polygonize(linemerge(outer))) if outer else []
        holes = list(polygonize(linemerge(inner))) if inner else []
        if not outers:
            return []
        shape = unary_union(outers)
        if holes:
            shape = shape.difference(unary_union(holes))
        return [g for g in getattr(shape, "geoms", [shape]) if isinstance(g, Polygon)]
    return []


def park_polygon(osm_ids: list[tuple[str, int]]) -> tuple[object, list[dict]]:
    """Union of the pinned park elements (lon/lat) and their tags, for the run manifest."""
    parts = " ".join(f"{t}(id:{i});" for t, i in osm_ids)
    data = query(f"[out:json][timeout:120];({parts});out geom;")
    polys, tags = [], []
    for el in data["elements"]:
        polys += element_polygons(el)
        t = el.get("tags", {})
        names = sorted({v for k, v in t.items() if k == "name" or k.startswith(("name:", "alt_name", "old_name"))})
        tags.append({"id": f"{el['type']}/{el['id']}", "name": t.get("name") or (names[0] if names else None), "names": names, "leisure": t.get("leisure")})
    if not polys:
        raise RuntimeError(f"No polygon for {osm_ids}")
    return unary_union(polys), tags


def sealed_features(bbox: tuple[float, float, float, float]) -> tuple[list[Polygon], list[Polygon]]:
    """Buildings and paved areas (lon/lat polygons) inside a lon/lat bbox."""
    w, s, e, n = bbox
    b = f"({s},{w},{n},{e})"
    ql = f"""[out:json][timeout:120];
(
  way["building"]{b}; relation["building"]{b};
  way["area:highway"]{b};
  way["highway"]["area"="yes"]{b};
  way["amenity"="parking"]{b};
  way["place"="square"]{b};
  way["leisure"~"pitch|playground|track"]["surface"~"asphalt|concrete|paving_stones|paved|tartan"]{b};
);
out geom;"""
    buildings, paved = [], []
    for el in query(ql)["elements"]:
        polys = element_polygons(el)
        (buildings if "building" in el.get("tags", {}) else paved).extend(polys)
    return buildings, paved


def public_green_nearby(lon: float, lat: float, radius_m: float) -> list[Polygon]:
    """Public parks and gardens whose area intersects a radius around a point (lon/lat polygons)."""
    ql = f"""[out:json][timeout:120];
(
  way["leisure"~"^(park|garden)$"](around:{radius_m},{lat},{lon});
  relation["leisure"~"^(park|garden)$"](around:{radius_m},{lat},{lon});
);
out geom;"""
    out = []
    for el in query(ql)["elements"]:
        if el.get("tags", {}).get("access") in ("private", "no"):
            continue
        out += element_polygons(el)
    return out
