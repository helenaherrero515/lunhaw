"""Compute Lunhaw's Green Index (EQ-005) for every published place.

Usage (from scripts/green-index):
  uv run python compute.py --season-end 2026            # dry season Dec 2025 - May 2026, writes out/
  uv run python compute.py --season-end 2026 --upload   # also upserts draft results to Supabase

Reads SUPABASE_URL / SUPABASE_ANON_KEY (places) and, for --upload, SUPABASE_SERVICE_ROLE_KEY from the
environment or ../../.env.deploy.local. Results are uploaded with published = false: a place's score only
becomes public after a person photo-checks it (validate.py) and marks it published.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import requests
from pyproj import Transformer
from rasterio.features import rasterize
from shapely.geometry import Point, mapping
from shapely.ops import transform as shp_transform, unary_union

from gi import config, osm
from gi.classify import Layers, fractions, worldcover_cross_check
from gi.rasters import Grid, chm_dates, chm_tiles, ndvi_composites, read_chm, read_worldcover, s2_items
from gi.score import Fractions, band, monte_carlo, score, sub_scores

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
TO_UTM = Transformer.from_crs("EPSG:4326", config.UTM, always_xy=True).transform
TO_LL = Transformer.from_crs(config.UTM, "EPSG:4326", always_xy=True).transform


def env() -> dict[str, str]:
    vals = dict(os.environ)
    f = ROOT / ".env.deploy.local"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                vals.setdefault(k.strip(), v.strip())
    return vals


def load_places(e: dict[str, str]) -> list[dict]:
    r = requests.get(
        f"{e['SUPABASE_URL']}/rest/v1/public_places?select=id,name,category,lat,lng&order=name.asc",
        headers={"apikey": e["SUPABASE_ANON_KEY"], "Authorization": f"Bearer {e['SUPABASE_ANON_KEY']}"}, timeout=60,
    )
    r.raise_for_status()
    return r.json()


def build_unit(place: dict) -> dict:
    """The spatial unit for a place: its OSM park polygon, or a 300 m circle around a library."""
    pid = place["id"]
    if pid in config.PARK_OSM:
        spec = config.PARK_OSM[pid]
        geom_ll, tags = osm.park_polygon(spec["osm"])
        names = " ".join(" ".join(t.get("names") or []) for t in tags)  # any name tag (Rizal Park has only alt/foreign names)
        if spec["expect"] and spec["expect"].lower() not in names.lower():
            raise RuntimeError(f"OSM element for {spec['name']} is now named {names!r}; re-check the pinned id")
        return {
            "type": "park_polygon", "geom_utm": shp_transform(TO_UTM, geom_ll),
            "source": "OSM " + ", ".join(t["id"] for t in tags), "osm_tags": tags,
        }
    if place["category"] in ("library", "reading_center"):
        x, y = TO_UTM(place["lng"], place["lat"])
        return {"type": "library_300m", "geom_utm": Point(x, y).buffer(config.LIBRARY_RADIUS_M, 64), "source": "300 m buffer"}
    raise RuntimeError(f"No unit rule for {place['name']} ({place['category']}); add its OSM park id to config.PARK_OSM")


def rasterize_ll(polys, grid: Grid) -> np.ndarray:
    shapes = [shp_transform(TO_UTM, p) for p in polys if not p.is_empty]
    if not shapes:
        return np.zeros(grid.shape1, dtype=bool)
    return rasterize(((s, 1) for s in shapes), out_shape=grid.shape1, transform=grid.t1, dtype="uint8").astype(bool)


def green_access(place: dict) -> bool:
    """Is there a public park or garden of at least 0.5 ha within 300 m? (WHO access rule of thumb)"""
    polys = osm.public_green_nearby(place["lng"], place["lat"], config.LIBRARY_RADIUS_M)
    return any(shp_transform(TO_UTM, p).area >= config.SMALL_PARK_M2 for p in polys)


def r2(v):
    return None if v is None else round(float(v), 2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--season-end", type=int, default=dt.date.today().year if dt.date.today().month >= 6 else dt.date.today().year - 1)
    ap.add_argument("--only", nargs="*", help="place ids to compute (default: all)")
    ap.add_argument("--upload", action="store_true")
    ap.add_argument("--from", dest="from_run", help="upload an existing out/run-*.json instead of recomputing")
    a = ap.parse_args()

    e = env()
    if a.from_run:
        saved = json.loads(Path(a.from_run).read_text(encoding="utf-8"))
        upload(e, saved["run"], saved["results"])
        return 0
    y = a.season_end
    dry = (f"{y - 1}-12-01", f"{y}-05-31")
    full = (f"{y - 1}-06-01", f"{y}-05-31")
    run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True, cwd=ROOT).stdout.strip() or None
    t0 = time.time()

    places = [p for p in load_places(e) if not a.only or p["id"] in a.only]
    print(f"{len(places)} places · Sentinel-2 dry season {dry[0]} to {dry[1]} · run {run_id}")

    units, grids, layers, results = {}, {}, {}, []
    for p in places:
        u = build_unit(p)
        g = Grid.around(u["geom_utm"].bounds)
        u["grid"] = g
        u["geom_ll"] = shp_transform(TO_LL, u["geom_utm"])
        units[p["id"]], grids[p["id"]] = u, g
        print(f"  unit  {p['name'][:46]:46s} {u['type']:13s} {u['geom_utm'].area / 10_000:7.2f} ha")

    print("Sentinel-2: searching scenes…")
    items = s2_items(dry)
    print(f"  {len(items)} dry-season scenes with < {config.S2_MAX_SCENE_CLOUD}% cloud; building cloud-masked medians…")
    comps = ndvi_composites(items, grids)
    low = [k for k, (_, cnt, _) in comps.items() if not (cnt > 0).any() or float(cnt[cnt > 0].mean()) < config.MIN_CLEAR_OBS]
    fallback = set()
    if low:
        print(f"  {len(low)} unit(s) below {config.MIN_CLEAR_OBS} clear looks; using the full year {full[0]} to {full[1]}")
        fb = ndvi_composites(s2_items(full), {k: grids[k] for k in low})
        comps.update(fb)
        fallback = set(low)

    for p in places:
        pid, u, g = p["id"], units[p["id"]], grids[p["id"]]
        print(f"  score {p['name'][:46]}")
        lonlat = u["geom_ll"].bounds
        tiles = chm_tiles(lonlat)
        unit_mask = rasterize([(u["geom_utm"], 1)], out_shape=g.shape1, transform=g.t1, dtype="uint8").astype(bool)
        bbox_ll = shp_transform(TO_LL, u["geom_utm"].envelope.buffer(5)).bounds
        buildings, paved = osm.sealed_features(bbox_ll)
        ndvi10, cnt10, s2_ids = comps[pid]
        lay = Layers(
            unit=unit_mask, chm=read_chm(g, tiles), worldcover=read_worldcover(g, bbox_ll), ndvi=ndvi10,
            building=rasterize_ll(buildings, g), paved=rasterize_ll(paved, g),
        )
        row = {"place_id": pid, "name": p["name"], "unit_type": u["type"], "unit_source": u["source"]}
        try:
            base, diag = fractions(lay, config.CANOPY_HEIGHT_M, config.NDVI_VEG_CUT, config.OPEN_WATER_M2)
        except ValueError as err:
            results.append({**row, "status": "NOT_AVAILABLE", "not_available_reason": str(err)})
            continue
        variants = [fractions(lay, h, c, config.OPEN_WATER_M2)[0] for h in config.CANOPY_VARIANTS_M for c in config.NDVI_VARIANTS]
        unc = monte_carlo(variants, base, n_eff=config.MC_N_EFF, draws=config.MC_DRAWS)
        s = score(base)
        cs, os_, us = sub_scores(base)
        inside10 = Grid.up(np.ones_like(cnt10, dtype=bool)) & unit_mask
        cnt_in = Grid.up(cnt10)[inside10]
        nd_in = Grid.up(ndvi10)[inside10]
        nd_in = nd_in[np.isfinite(nd_in)]
        d_from, d_to = chm_dates(tiles, u["geom_ll"])
        reasons = []
        if diag["chm_missing_share"] > 0.05:
            reasons.append("canopy map does not cover this place")
        if diag["ndvi_unknown_share"] > 0.5:
            reasons.append("too few cloud-free satellite images")
        row.update(
            status="NOT_AVAILABLE" if reasons else "ESTIMATE",
            not_available_reason="; ".join(reasons) or None,
            unit_area_m2=round(diag["land_m2"], 1),
            tree_pct=r2(base.tree), other_veg_pct=r2(base.other_veg), water_pct=r2(base.water),
            sealed_pct=r2(base.sealed), bare_pct=r2(base.bare),
            canopy_sub=r2(cs), other_sub=r2(os_), unsealed_sub=r2(us),
            score=r2(s), score_p05=r2(unc.p05), score_p95=r2(unc.p95), band=band(s),
            band_flip_rate=round(unc.band_flip_rate, 3), borderline=unc.borderline,
            ndvi_mean=round(float(nd_in.mean()), 3) if nd_in.size else None,
            ndvi_p10=round(float(np.percentile(nd_in, 10)), 3) if nd_in.size else None,
            ndvi_p90=round(float(np.percentile(nd_in, 90)), 3) if nd_in.size else None,
            n_clear_mean=round(float(cnt_in.mean()), 1) if cnt_in.size else 0, n_clear_min=int(cnt_in.min()) if cnt_in.size else 0,
            low_obs=pid in fallback,
            green_access_300m=green_access(p) if u["type"] == "library_300m" else None,
            canopy_imagery_from=d_from, canopy_imagery_to=d_to, s2_item_ids=s2_ids,
            cross_check={**worldcover_cross_check(lay, config.OPEN_WATER_M2), **{k: round(v, 3) if isinstance(v, float) else v for k, v in diag.items()},
                         "small_park": u["type"] == "park_polygon" and diag["land_m2"] < config.SMALL_PARK_M2,
                         "s2_window": "full year" if pid in fallback else "dry season"},
        )
        results.append(row)
        print(f"        T {base.tree:5.1f}%  G {base.other_veg:5.1f}%  W {base.water:4.1f}%  S {base.sealed:5.1f}%  B {base.bare:5.1f}%"
              f"  -> {s:5.1f} ({unc.p05:4.1f}-{unc.p95:4.1f}) {band(s)}{' borderline' if unc.borderline else ''}")

    years = sorted({dry[0][:4], dry[1][:4]})
    datasets = json.loads(json.dumps(config.DATASETS))
    datasets["vegetation"]["credit"] = datasets["vegetation"]["credit"].format(years="–".join(years))
    run = {
        "id": run_id, "method_version": config.METHOD_VERSION, "git_sha": sha, "period_start": dry[0], "period_end": dry[1],
        "params": {
            "canopy_height_m": config.CANOPY_HEIGHT_M, "canopy_variants_m": config.CANOPY_VARIANTS_M, "ndvi_cut": config.NDVI_VEG_CUT,
            "ndvi_variants": config.NDVI_VARIANTS, "target_pct": 30, "weights": [0.6, 0.2, 0.2], "library_radius_m": config.LIBRARY_RADIUS_M,
            "open_water_m2": config.OPEN_WATER_M2, "min_clear_obs": config.MIN_CLEAR_OBS, "max_scene_cloud": config.S2_MAX_SCENE_CLOUD,
            "mc_draws": config.MC_DRAWS, "mc_n_eff": config.MC_N_EFF, "s2_scenes": len(items),
        },
        "datasets": datasets,
    }
    out = HERE / "out"
    out.mkdir(exist_ok=True)
    stamp = run_id.replace(":", "").replace("-", "")
    (out / f"run-{stamp}.json").write_text(json.dumps({"run": run, "results": results}, indent=2, default=str), encoding="utf-8")
    (out / f"units-{stamp}.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {"place_id": pid, "name": next(p["name"] for p in places if p["id"] == pid), "unit": u["type"]},
         "geometry": mapping(u["geom_ll"])} for pid, u in units.items()]}), encoding="utf-8")
    print(f"Wrote out/run-{stamp}.json and out/units-{stamp}.geojson in {time.time() - t0:.0f} s")

    if a.upload:
        upload(e, run, results)
    return 0


def upload(e: dict[str, str], run: dict, results: list[dict]) -> None:
    key = e["SUPABASE_SERVICE_ROLE_KEY"]
    h = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}
    base = f"{e['SUPABASE_URL']}/rest/v1"
    requests.post(f"{base}/green_index_runs", headers=h, json=run, timeout=60).raise_for_status()
    prev = requests.get(
        f"{base}/green_index_results?method_version=eq.{config.METHOD_VERSION}&select=place_id,published,checked_on,check_points,check_summary",
        headers=h, timeout=60,
    )
    prev.raise_for_status()
    previous = {p["place_id"]: p for p in prev.json()}
    rows, kept = [], 0
    for r in results:
        row = {k: v for k, v in r.items() if k != "name"}
        check = {"published": False, "checked_on": None, "check_points": None, "check_summary": None}
        p = previous.get(r["place_id"])
        # A place stays published only if its new numbers still agree with its earlier photo-check.
        if p and p.get("published") and r.get("status") == "ESTIMATE" and still_agrees(r, p.get("check_summary") or {}):
            check = {k: p[k] for k in check}
            kept += 1
        rows.append({**row, **check, "method_version": config.METHOD_VERSION, "run_id": run["id"], "computed_at": run["id"]})
    r = requests.post(f"{base}/green_index_results?on_conflict=place_id,method_version", headers=h, json=rows, timeout=120)
    if not r.ok:
        sys.exit(f"Upload failed: {r.status_code} {r.text[:400]}")
    print(f"Uploaded {len(rows)} results for run {run['id']}: {kept} still match their photo-check and stay published; "
          f"the rest stay unpublished until checked (validate.py).")


def still_agrees(row: dict, summary: dict, tolerance_pp: float = 10.0) -> bool:
    """New fractions are each within the tolerance of the photo-checked shares recorded for this place."""
    photo = summary.get("photo_pct")
    if not photo:
        return False
    pairs = (
        (row["tree_pct"], photo.get("tree", 0)),
        (row["other_veg_pct"] + row["water_pct"], photo.get("other_veg", 0) + photo.get("water", 0)),
        (row["sealed_pct"], photo.get("sealed", 0)),
    )
    return all(abs(a - b) <= tolerance_pp for a, b in pairs)


if __name__ == "__main__":
    sys.exit(main())
