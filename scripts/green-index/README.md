# Green Index pipeline (EQ-005)

Computes a 0–100 Green Index for every place from open data. The method, its evidence and its limits are in
[`docs/research/green-index-methodology.md`](../../docs/research/green-index-methodology.md); the formula is
registered as **EQ-005** in [`docs/methods.md`](../../docs/methods.md).

| Input | Dataset | Licence |
|---|---|---|
| Tree canopy (≥ 2 m) | WRI & Meta High Resolution Canopy Height Maps v2, ~1.2 m (Manila imagery 2015–2019) | CC BY 4.0 |
| Other vegetation (NDVI ≥ 0.30) | Copernicus Sentinel-2 L2A, dry-season median, Microsoft Planetary Computer | Copernicus open data |
| Water, built-up | ESA WorldCover 2021 v200, 10 m | CC BY 4.0 |
| Park boundaries, buildings, paving | OpenStreetMap (pinned park IDs in `gi/config.py`) | ODbL |

No accounts are needed. One run for 26 places takes about 15–30 minutes.

## Run

```bash
cd scripts/green-index
uv run python compute.py --season-end 2026            # Dec 2025 – May 2026; writes out/run-*.json and out/units-*.geojson
uv run python compute.py --season-end 2026 --upload   # also saves the results to Supabase
uv run python compute.py --from out/run-X.json         # upload a saved run without recomputing
uv run --group dev pytest -q                          # scoring and publication tests
```

Settings come from the environment or `../../.env.deploy.local` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` for `--upload`). The **Green Index** GitHub workflow runs this every 15 June.

## Publishing a place's score (photo-check)

Nothing is shown in the app until a person has checked it. Every score stays an **Estimate**.

1. `uv run python validate.py sample --run out/run-X.json --units out/units-X.geojson` makes
   `out/check-sheet-X.csv` and `.kml` with 100 random points per place.
2. Open the KML in Google Earth Pro, look at each point on the most recent clear image, and fill in the CSV's
   `label` (`tree`, `other_veg`, `water`, `sealed`, `bare`, or `skip`), `imagery_date` and `labeller`.
   A second person labels 10–20% of the points again (same rows, their own `labeller` name). Use the imagery
   only to decide labels; never publish screenshots.
3. `uv run python validate.py evaluate --run out/run-X.json --labels out/check-sheet-X.csv` compares each place.
   It passes when tree, other green + water and sealed shares are each within 10 percentage points of the
   photo-check. Add `--publish` to make the passing places' scores public.

When the yearly run recomputes a place, it stays published only if the new numbers still agree with its
photo-check; otherwise it returns to "Not available yet" until it is checked again.
