"""Photo-check the Green Index before it is published (Olofsson et al. 2014 good practice, i-Tree Canopy style).

1. Make a check sheet: random points inside each place's unit, as CSV + KML (opens in Google Earth Pro).
     uv run python validate.py sample --run out/run-XXXX.json --units out/units-XXXX.geojson [--points 100]
2. A person looks at each point on recent high-resolution imagery and fills in `label` with one of
     tree | other_veg | water | sealed | bare | skip      (skip = can't tell, or open water outside the land area)
   and `imagery_date` (YYYY-MM-DD of the image they used) and `labeller`. A second person relabels
   10-20% of the points (same sheet, `labeller` = their name) to measure agreement.
   Only use the imagery to decide labels. Publish our own numbers, never screenshots or tiles.
3. Compare and (optionally) publish the places that pass:
     uv run python validate.py evaluate --run out/run-XXXX.json --labels check-sheet.csv [--publish]

A place passes when tree, other green+water and sealed shares from the satellite method are each within
10 percentage points of the photo-checked shares (a Lunhaw convention). Passing places are marked
published with the check date and sample size; failing places stay "Not available yet".
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import math
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path
from xml.sax.saxutils import escape

import requests
from shapely.geometry import Point, shape

from compute import env

LABELS = ("tree", "other_veg", "water", "sealed", "bare")
TOLERANCE_PP = 10.0


def sample(a) -> None:
    run = json.loads(Path(a.run).read_text(encoding="utf-8"))
    ok = {r["place_id"] for r in run["results"] if r.get("status") == "ESTIMATE"}
    units = json.loads(Path(a.units).read_text(encoding="utf-8"))["features"]
    rng = random.Random(a.seed)
    rows = []
    for f in units:
        pid = f["properties"]["place_id"]
        if pid not in ok:
            continue
        geom = shape(f["geometry"])
        minx, miny, maxx, maxy = geom.bounds
        pts = 0
        while pts < a.points:
            p = Point(rng.uniform(minx, maxx), rng.uniform(miny, maxy))
            if geom.contains(p):
                pts += 1
                rows.append({"place_id": pid, "name": f["properties"]["name"], "point": pts, "lat": round(p.y, 7), "lon": round(p.x, 7),
                             "label": "", "imagery_date": "", "labeller": "", "note": ""})
    stem = Path(a.run).with_name("check-sheet-" + Path(a.run).stem.removeprefix("run-"))
    with open(f"{stem}.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    marks = "".join(
        f"<Placemark><name>{escape(r['name'][:24])} #{r['point']}</name><Point><coordinates>{r['lon']},{r['lat']},0</coordinates></Point></Placemark>"
        for r in rows
    )
    Path(f"{stem}.kml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Lunhaw Green Index check</name>{marks}</Document></kml>',
        encoding="utf-8",
    )
    print(f"Wrote {len(rows)} points for {len(ok)} places: {stem}.csv and {stem}.kml")


def evaluate(a) -> int:
    run = json.loads(Path(a.run).read_text(encoding="utf-8"))
    product = {r["place_id"]: r for r in run["results"] if r.get("status") == "ESTIMATE"}
    by_place: dict[str, list[str]] = defaultdict(list)
    dates: dict[str, list[str]] = defaultdict(list)
    seen: dict[tuple, dict[str, str]] = defaultdict(dict)
    with open(a.labels, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            lab = row["label"].strip().lower()
            if lab not in LABELS + ("skip", ""):
                sys.exit(f"Unknown label {lab!r} at {row['name']} #{row['point']}")
            key = (row["place_id"], row["point"])
            if row.get("labeller"):
                seen[key][row["labeller"]] = lab
            if lab in LABELS and len(seen[key]) <= 1:  # first labeller's answer counts; others measure agreement
                by_place[row["place_id"]].append(lab)
                if row.get("imagery_date"):
                    dates[row["place_id"]].append(row["imagery_date"])

    pairs = [list(v.values())[:2] for v in seen.values() if len(v) >= 2]
    if pairs:
        agree = sum(x == y for x, y in pairs) / len(pairs)
        print(f"Interpreter agreement on {len(pairs)} double-labelled points: {agree:.0%}")

    passed, report = [], []
    for pid, labs in by_place.items():
        if pid not in product or len(labs) < 50:
            print(f"  skip {pid}: {len(labs)} usable labels (need 50+)")
            continue
        n = len(labs)
        c = Counter(labs)
        photo = {k: 100.0 * c[k] / n for k in LABELS}
        se = {k: 100.0 * math.sqrt((photo[k] / 100) * (1 - photo[k] / 100) / n) for k in LABELS}
        p = product[pid]
        comp = {
            "tree": (p["tree_pct"], photo["tree"]),
            "other_green_water": (p["other_veg_pct"] + p["water_pct"], photo["other_veg"] + photo["water"]),
            "sealed": (p["sealed_pct"], photo["sealed"]),
        }
        ok = all(abs(sat - ph) <= TOLERANCE_PP for sat, ph in comp.values())
        summary = {
            "points": n, "photo_pct": {k: round(v, 1) for k, v in photo.items()}, "photo_se_pp": {k: round(v, 1) for k, v in se.items()},
            "satellite_vs_photo_pp": {k: [round(s, 1), round(ph, 1)] for k, (s, ph) in comp.items()},
            "tolerance_pp": TOLERANCE_PP, "imagery_dates": [min(dates[pid]), max(dates[pid])] if dates[pid] else None, "passed": ok,
        }
        report.append((p["name"], summary))
        if ok:
            passed.append((pid, summary))
        print(f"  {'PASS' if ok else 'FAIL'} {p['name'][:44]:44s} n={n:3d} "
              + "  ".join(f"{k} {s:4.1f} vs {ph:4.1f}" for k, (s, ph) in comp.items()))
    for comp_name in ("tree", "other_green_water", "sealed"):
        within = [abs(s["satellite_vs_photo_pp"][comp_name][0] - s["satellite_vs_photo_pp"][comp_name][1]) <= TOLERANCE_PP for _, s in report]
        if within:
            share = sum(within) / len(within)
            print(f"Component {comp_name}: within ±{TOLERANCE_PP:.0f} pp at {share:.0%} of places ({'accepted' if share >= 0.8 else 'NOT accepted'}: rule is 80%)")

    if a.publish and passed:
        e = env()
        key = e["SUPABASE_SERVICE_ROLE_KEY"]
        h = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        today = dt.date.today().isoformat()
        for pid, summary in passed:
            r = requests.patch(
                f"{e['SUPABASE_URL']}/rest/v1/green_index_results?place_id=eq.{pid}&method_version=eq.{run['run']['method_version']}&run_id=eq.{run['run']['id']}",
                headers=h, json={"published": True, "checked_on": today, "check_points": summary["points"], "check_summary": summary}, timeout=60,
            )
            r.raise_for_status()
        print(f"Published {len(passed)} place(s).")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sample")
    s.add_argument("--run", required=True)
    s.add_argument("--units", required=True)
    s.add_argument("--points", type=int, default=100)
    s.add_argument("--seed", type=int, default=2026)
    e = sub.add_parser("evaluate")
    e.add_argument("--run", required=True)
    e.add_argument("--labels", required=True)
    e.add_argument("--publish", action="store_true")
    a = ap.parse_args()
    if a.cmd == "sample":
        sample(a)
        return 0
    return evaluate(a)


if __name__ == "__main__":
    sys.exit(main())
