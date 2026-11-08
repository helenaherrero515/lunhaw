# Methods & Traceability — Glass-Box Ledger — Lunhaw

> **Purpose:** Canonical documentation for all derived mathematical calculations, environmental indices, and transit estimates. Guarantees that Lunhaw never surfaces a black-box or hallucinated number.
> Traces back to: [context.md](context.md), [prd.md](prd.md). Traces forward to: [data-model.md](data-model.md), [qa-test-plan.md](qa-test-plan.md).

## The glass-box contract (non-negotiable)

Every numerical score, duration estimate, or fare calculation emitted by Lunhaw MUST resolve to:
1. An explicit **`equation_id`** (defined in §2).
2. Its verifiable **`input_dataset_ids`** (defined in §3).
3. A **computed confidence level** (`HIGH`, `MEDIUM`, `LOW`) derived from the quality and freshness of its inputs.

**Core Invariant Rule (`INV-001`):** Lunhaw never invents numbers. Any output that cannot cite an equation and verifiable inputs will be suppressed or labelled `Not available yet`.

## 1. Confidence rubric

| Level | UI Presentation | Trigger & Condition |
|---|---|---|
| **High** | Exact point value + `"Verified Official"` badge | All input datasets are Tier 1 (official government fare matrix, surveyed LGU boundaries, verified sensor data < 90 days old). |
| **Medium** | Point value + explicit calculation breakdown note | Mathematical estimation using validated geographic models (e.g. canopy percentage from satellite imagery or standard LTFRB per-km formula). |
| **Low** | Directional range only (e.g. `~15–25 mins`, `Low Shade`) | Incomplete input data, unverified route geometry, or uncalibrated urban microclimate variables. |

*Inheritance Rule:* A computed score inherits the confidence level of its lowest-tier input dataset.

## 2. Equation registry

| `EQ-###` | Output | Formula / Method | Input Dataset IDs | Confidence | Reference |
|---|---|---|---|---|---|
| **EQ-001** *(superseded by EQ-005; never published)* | Green Index Place Score (0–100) | $Score = (0.50 \times C) + (0.30 \times V) + (0.20 \times P)$<br/>where:<br/>• $C$ = Canopy coverage percentage within boundary (0–100)<br/>• $V$ = NDVI Vegetation density scaled (0–100)<br/>• $P$ = Permeable ground surface area ratio (0–100) | `DS-001`, `DS-002` | `MEDIUM` | WHO Urban Green Space Guidelines |
| **EQ-005** | Green Index Place Score v2 (0–100), shown rounded to 5 with a Low (0–39) / Moderate (40–69) / High (70–100) band and a 5th–95th percentile range | Land in the unit is split into exclusive classes (precedence water > building > tree > paved > other vegetation > bare): $T$ tree, $G$ other vegetation, $W$ water, $S$ sealed.<br/>$Score = 0.60,C_s + 0.20,O_s + 0.20,U_s$<br/>• $C_s = min(100, 100,T/30)$: tree canopy (height ≥ 2 m) against the 3-30-300 rule's 30% target<br/>• $O_s = min(100, 100,(G+W)/30)$: other vegetation (dry-season NDVI ≥ 0.30) plus water<br/>• $U_s = 100 - S$: unsealed ground<br/>Unit: park = its OSM polygon; library = 300 m land-only circle (water bodies > 5 ha excluded). Weights are a Lunhaw convention; robustness by Monte Carlo (5,000 draws over input error, 2 m/5 m canopy, NDVI 0.25–0.35, target 25–35%, Dirichlet weights); band flips in > 20% of draws = borderline. | `DS-001`, `DS-002`, `DS-006`, `DS-007` | `MEDIUM` (canopy `LOW`–`MEDIUM` until photo-checked) | WHO Europe 2017 (300 m access); Konijnendijk 3-30-300; OECD/JRC Handbook on Composite Indicators (2008); research report `docs/research/green-index-methodology.md`. Pipeline: `scripts/green-index`. Results are Estimates and are published per place only after a photo-check (`validate.py`). |
| **EQ-002** | Route Shade Index (0–100) | $Shade = \frac{\sum_{i=1}^{n} (L_i \times S_i)}{\sum_{i=1}^{n} L_i}$<br/>where:<br/>• $L_i$ = Length of route segment $i$ in meters<br/>• $S_i$ = Segment canopy/tree coverage ratio ($0.0 \le S_i \le 1.0$) | `DS-001`, `DS-002` | `MEDIUM` | Pedestrian Microclimate Shade Model |
| **EQ-003** | Walking Duration Estimate (Seconds) | $T_{walk} = \frac{D_{walk}}{V_{walk}} \times 3600$<br/>where:<br/>• $D_{walk}$ = Network pedestrian distance in km<br/>• $V_{walk}$ = 4.2 km/h (average tropical urban walking speed accounting for heat/sidewalk friction) | `DS-001` | `HIGH` | DOTr Pedestrian Velocity Benchmark |
| **EQ-004** | Estimated Jeepney / Bus Fare (PHP) | $Fare = BaseFare + \max(0, \lceil D - D_{base} \rceil \times Rate_{km})$<br/>where:<br/>• Traditional Jeepney: Base 13.00 PHP (first 4 km), 1.80 PHP/km thereafter<br/>• Modern Jeepney: Base 15.00 PHP (first 4 km), 2.20 PHP/km thereafter | `DS-003` | `HIGH` (if route distance known); else `MEDIUM` | LTFRB Memorandum Circular Fare Matrix |

## 3. Dataset / input registry

| `DS-###` | Input / Dataset | Source | Access & License | Confidence Tier |
|---|---|---|---|---|
| **DS-001** | Metro Manila Road & Walkway Network | OpenStreetMap (OSM) Contributors | ODbL (Open Database License) | High |
| **DS-002** | Sentinel-2 L2A surface reflectance (NDVI, 10 m), dry-season median via Microsoft Planetary Computer | European Space Agency (ESA) Copernicus | Copernicus free and open data; credit "Contains modified Copernicus Sentinel data [year]" | High |
| **DS-006** | High Resolution Canopy Height Maps v2 (~1.2 m; Manila imagery 2015–2019) | WRI and Meta (AWS Open Data) | CC BY 4.0; "Source imagery for CHM © 2016 Vantor" | Medium |
| **DS-007** | ESA WorldCover 2021 v200 (10 m land cover: water, built-up; tree cross-check) | ESA WorldCover consortium | CC BY 4.0 | Medium |
| **DS-003** | Public Utility Vehicle (PUV) Fare Matrix | Land Transportation Franchising & Regulatory Board (LTFRB) | Public Government Record | High |
| **DS-004** | National Public Libraries Directory | National Library of the Philippines (NLP) | Public Domain / Government Agency | Medium |
| **DS-005** | Barangay Reading Center Inventories | Individual NCR Local Government Units (17 LGUs) | Mixed (LGU Open Data / FOI requests) | Medium / Low |

## 4. Traceability (numbers ⇄ features ⇄ tests)

- **F-001 / F-002 (Explore & Libraries):** Green Index scores for civic facilities MUST cite `EQ-001` and `DS-002`. Tested in `TC-004`.
- **F-003 (Commute Planner):** Walking durations MUST cite `EQ-003` and `DS-001`. Transit fare estimates MUST cite `EQ-004` and `DS-003`. Tested in `TC-003`.
- **F-004 (Green Index):** Route shade scores MUST cite `EQ-002`. Tested in `TC-004`.
- **Invariant `INV-001` Check:** Any score or fare displayed without an explicit calculation tag or official source MUST fail QA automated verification (`TC-N01`).
