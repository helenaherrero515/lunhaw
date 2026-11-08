# Data Guardrails & Zero-Hallucination Verification Rubric — Lunhaw

> **Document ID:** `B-M0-01`  
> **Status:** Published & Enforced  
> **Traces Back To:** [methods.md](methods.md), [data-model.md](data-model.md), [security-compliance.md](security-compliance.md), [prd.md](prd.md)  
> **Traces Forward To:** `scripts/osm/filter-ncr-walkways.ts`, `apps/web/src/tests/data-guardrails.test.ts`, `api-spec.md`  

---

## 1. Executive Summary & Core Mandate

Lunhaw is a public discovery platform for green spaces and study havens in Metro Manila operating under a $0/month free-tier architecture. To protect civic trust and student safety, Lunhaw enforces **strict data honesty**. 

Under **Invariant `INV-001`**, Lunhaw operates on a glass-box principle:
1. No synthetic process, Large Language Model (LLM), or AI pipeline can ever assign the `VERIFIED` status to any place, metric, or operating schedule.
2. Every derived metric, score, or transit estimation must explicitly cite an approved equation ID (`EQ-###`) and dataset ID (`DS-###`).
3. Whenever data is uncertain or unconfirmed, the platform must display `ESTIMATE` (with a transparent derivation note) or `NOT_AVAILABLE`. Never fabricate certainty.

---

## 2. Invariant `INV-001`: Zero-Hallucination Rubric

### 2.1 The Three Honest Data States

All entities surfaced to users (places, library hours, green scores, shade indices, transit fares, walking durations) must resolve to one of three mutually exclusive states:

| State | Badge / UI Presentation | Permitted Origin | Mandatory Fields |
|---|---|---|---|
| **`VERIFIED`** | Green Badge (`#245C43` / `#98D746`), `"Verified Official"` | Direct primary government or institutional source (LGU registry, NLP directory, official gazette, LTFRB fare matrix) confirmed by human auditor or signed institutional feed. **Never AI-assigned.** | `official_source_name`, `official_source_url`, `last_verified_at`, `verified_by` |
| **`ESTIMATE`** | Amber/Neutral Tag, `"Calculated Estimate"` | Deterministic derivation pipeline using satellite data, open pedestrian topology, or official base fare rates. | `equation_id`, `input_dataset_ids`, `derivation_note`, `confidence_level` |
| **`NOT_AVAILABLE`** | Muted Grey Tag, `"Data Not Available"` | Missing, uncalibrated, or unverifiable data. | None (placeholder UI with call for community submission or official gazette update) |

### 2.2 Strict AI Prohibition Rule

> **RULE:** No AI model, LLM, automated synthetic heuristic, or autonomous agent may write, update, or assign `status: 'VERIFIED'`.

1. Any automated process, synthetic test generator, or AI ingestion pipeline attempting to persist `status: 'VERIFIED'` without a cryptographically valid primary government source URL or authorized human auditor credential **MUST be rejected with HTTP 422 Unprocessable Entity** and logged as a guardrail violation.
2. Machine learning outputs (e.g. computer vision tree-canopy segmentation, satellite NDVI index processing) are classified strictly as **`ESTIMATE`** and must cite their respective equations.

---

## 3. Equation & Dataset Traceability Contract

Every calculated or derived value within the Lunhaw platform must be traceable to the canonical registries defined below.

### 3.1 Equation Registry (`EQ-###`)

| Equation ID | Name | Formula / Derivation Method | Inputs | Confidence Tier |
|---|---|---|---|---|
| **`EQ-001`** | Green Index Place Score | $Score = (0.50 \times C) + (0.30 \times V) + (0.20 \times P)$<br/>• $C$: Canopy coverage % within boundary (0–100)<br/>• $V$: NDVI Vegetation density scaled (0–100)<br/>• $P$: Permeable ground surface area ratio (0–100) | `DS-001`, `DS-002` | `MEDIUM` |
| **`EQ-002`** | Route Shade Index | $Shade = \frac{\sum_{i=1}^{n} (L_i \times S_i)}{\sum_{i=1}^{n} L_i}$<br/>• $L_i$: Segment length in meters<br/>• $S_i$: Segment canopy/tree coverage ratio ($0.0 \le S_i \le 1.0$) | `DS-001`, `DS-002` | `MEDIUM` |
| **`EQ-003`** | Walking Duration Estimate | $T_{walk} = \frac{D_{walk}}{V_{walk}} \times 3600$<br/>• $D_{walk}$: Pedestrian network distance in km<br/>• $V_{walk} = 4.2\text{ km/h}$ (tropical urban sidewalk speed) | `DS-001` | `HIGH` |
| **`EQ-004`** | Transit Fare Calculation | $Fare = BaseFare + \max(0, \lceil D - D_{base} \rceil \times Rate_{km})$<br/>• Traditional Jeepney: ₱13.00 base (4 km) + ₱1.80/km<br/>• Modern Jeepney: ₱15.00 base (4 km) + ₱2.20/km | `DS-003` | `HIGH` (exact route) / `MEDIUM` (estimated) |

### 3.2 Dataset Registry (`DS-###`)

| Dataset ID | Name | Canonical Source | License / Access | Trust Tier |
|---|---|---|---|---|
| **`DS-001`** | Metro Manila Road & Walkway Network | OpenStreetMap (OSM) Contributors | ODbL (Open Database License) | Tier 1 (High) |
| **`DS-002`** | Sentinel-2 Satellite Multi-Spectral Imagery | European Space Agency (ESA) Copernicus | CC BY-SA / Open Access | Tier 1 (High) |
| **`DS-003`** | Public Utility Vehicle (PUV) Fare Matrix | LTFRB Memorandum Circulars | Official PH Government Record | Tier 1 (High) |
| **`DS-004`** | National Public Libraries Directory | National Library of the Philippines (NLP) | Public Domain / Gov Directory | Tier 2 (Medium) |
| **`DS-005`** | Barangay Reading Center Inventories | NCR 17 Local Government Units (LGUs) | LGU Open Data / FOI Records | Tier 2/3 (Medium/Low) |

### 3.3 Confidence Inheritance Law

The overall confidence level of any derived computation is governed by the weakest link:
$$\text{Confidence}(EQ) = \min_{d \in \text{Inputs}} \text{Tier}(d)$$
If any input dataset is Tier 3 or uncalibrated, the computed metric **must not** display a high-confidence badge and must present a directional range rather than a misleading single-point certainty.

---

## 4. Negative Verification Rules (NV Rules)

The following hard constraints are asserted in CI pipelines and database check constraints (`chk_verification_derivation`, `chk_green_score_bounds`):

- **NV-001: AI Self-Attestation Prohibition**  
  Any ingestion payload where `verified_by` matches synthetic agent signatures (`ai-assistant`, `gpt-*`, `claude-*`, `gemini-*`, `synthetic-bot`, `copilot`) having `status: 'VERIFIED'` is immediately rejected. AI can produce candidates, but only human verification or certified government URLs can mark them `VERIFIED`.

- **NV-002: Missing Primary Source URL on Verified Status**  
  A record having `status: 'VERIFIED'` without a valid `official_source_url` (must be an `http(s)://` URL from a recognized domain or official documentation repository) is structurally invalid.

- **NV-003: Derived Calculation Without Equation ID**  
  Any numerical metric representing a Green Index, Route Shade, Walking Duration, or Fare Estimate that lacks a valid `equation_id` in `['EQ-001', 'EQ-002', 'EQ-003', 'EQ-004', 'EQ-005']` must fail payload validation.

- **NV-004: Missing Derivation Note on Estimates (`chk_verification_derivation`)**  
  Any record with `status: 'ESTIMATE'` where `derivation_note` is empty or null violates database constraint `chk_verification_derivation` and will be rejected at the API gateway layer.

- **NV-005: Motorway / Expressway Infiltration in Pedestrian Networks**  
  Pedestrian routing and walkway filters must strictly reject vehicle-only highways: `motorway`, `motorway_link`, `trunk`, `trunk_link`, toll plazas, and elevated expressway segments (Skyway, NLEX, SLEX, NAIAX, CAVITEX, MCX). No pedestrian route may traverse these ways.

- **NV-006: Zero Coordinate Persistence (`T-003`, RA 10173)**  
  User coordinates submitted for "near me" discovery are ephemeral. Coordinates must be consumed in-memory within worker execution context and **never written to persistent storage, query parameter logs, or analytics pipelines**.

---

## 5. Data Provenance Audit Checklist

Engineers, automated CI runners, and data curators must execute the following checklist prior to merging new dataset seeds or routing pipelines:

- [ ] **Checklist Item 1: Boundary Integrity**  
  All coordinates lie strictly within the National Capital Region (NCR) bounding box:  
  Latitude: $[14.3000, 14.8000]$, Longitude: $[120.9000, 121.2000]$.
- [ ] **Checklist Item 2: Provenance Link Validity**  
  Every `VERIFIED` record points to an active, publicly inspectable source URL.
- [ ] **Checklist Item 3: Glass-Box Attribution**  
  Every calculated estimate contains:
  1. Valid `equation_id`
  2. Input dataset IDs from `DS-001` through `DS-005`
  3. Non-empty `derivation_note` explaining assumptions.
- [ ] **Checklist Item 4: Walkway Safety Filter**  
  Pedestrian graphs are verified to contain zero motorway/trunk segments.
- [ ] **Checklist Item 5: Ephemeral Privacy Assurance**  
  Log scrubbers confirm 0 GPS coordinate entries in HTTP request logs.
