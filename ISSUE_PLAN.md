# Lunhaw — GitHub Issue Plan (Dry Run)

> **Document Status:** PROPOSED / DRY RUN REVIEW (historical). The implemented web stack is Next.js 14 (static export on Cloudflare Pages), not React + Vite; see `docs/RELEASE.md`.  
> **Prepared by:** Senior Engineering Lead & Delivery Manager  
> **Target Repository:** `helenaherrero515/lunhaw`  
> **Target Cost Profile:** $0/month Free Tier Architecture  
> **Traceability Anchor:** `docs/prd.md`, `docs/system-design.md`, `docs/data-model.md`, `docs/methods.md`, `docs/qa-test-plan.md`, `docs/security-compliance.md`, `docs/decision-ledger.md`

---

## 1. Issue Coding & Classification Scheme

Every issue strictly adheres to the canonical identifier scheme:

$$\text{Title Format: } \mathbf{[<TRACK>-<MILESTONE>-<NN>]\ <Feature\ refs\ if\ any>\ <Imperative\ task\ title>}$$

### Tracks
- **A — Backend & API:** Platform-neutral REST contracts, OpenAPI, places/directory search, commute proxy, caching, and audit endpoints.
- **B — AI & Data Intelligence:** Satellite canopy/NDVI processing, Green Index glass-box calculations, transit network graph, data normalization, and stale detection.
- **C — Frontend:** React 18 + Vite app shell, design tokens, MapLibre GL + OpenFreeMap, integrity badges, facility views, commute UI, and a11y.
- **D — Cloud & Infrastructure:** Cloudflare Pages/Workers/R2, Docker Compose, GitHub Actions CI/CD, Supabase keep-alive, and cost monitoring.
- **E — QA & Release:** Vitest integration tests, Playwright E2E suites, negative invariant guardrail tests (TC-N01..03), a11y audits, and launch checklists.
- **F — Database & Data Model:** PostGIS spatial schema, verification metadata, operating hours, transit topology, RLS policies, seeds, and size budgeting.

### Milestones
- **M0 — Foundation:** Tooling, schema skeleton, design tokens, CI/CD, environments, platform-neutral contracts.
- **M1 — Explore, Libraries & Manual Area:** Features F-001, F-002, F-006; geolocation fallback, integrity badges, and mandatory disclaimers.
- **M2 — Routing & Green Index:** Features F-003, F-004; Rust/Wasm A* routing in Web Worker, glass-box canopy and shade scoring.
- **M3 — Saved, Accounts & Hardening:** Feature F-005; local storage bookmarks, optional Supabase Auth sync, security audit, WCAG 2.1 AA a11y, 180-day freshness audit.
- **MR — Release:** Staging rehearsal across UJ-001/002/003, docs, cost limit verification, production cutover.
- **M4 — Phase 2 Backlog:** Features F-101, F-102, F-103 (Native mobile app, community verification, offline map caching) — unscheduled backlog.

---

## 2. GitHub Labels & Milestones Specification

### Labels to Create
| Label Name | Color | Description |
|---|---|---|
| `track:backend` | `#0E8A16` | Track A: Platform-neutral API, Workers, routing services |
| `track:ai` | `#5319E7` | Track B: Satellite processing, glass-box calculations, graph prep |
| `track:frontend` | `#1D76DB` | Track C: React/Vite UI, MapLibre GL, client state, accessibility |
| `track:cloud` | `#BFDADC` | Track D: Cloudflare Pages/Workers/R2, CI/CD, environments, costs |
| `track:qa-release` | `#D93F0B` | Track E: Playwright E2E, Vitest integration, invariant guardrails |
| `track:database` | `#F9D0C4` | Track F: PostGIS spatial schema, migrations, RLS, seed datasets |
| `milestone:m0-foundation` | `#E99695` | M0: Foundation & Core Primitives |
| `milestone:m1-explore-libraries` | `#FEF2C0` | M1: Explore, Libraries & Manual Area (F-001, F-002, F-006) |
| `milestone:m2-routing-greenindex` | `#C2E0C6` | M2: Commute Routing & Green Index (F-003, F-004) |
| `milestone:m3-saved-hardening` | `#BFDADc` | M3: Saved Places, Accounts & Hardening (F-005) |
| `milestone:mr-release` | `#D4C5F9` | MR: Launch Rehearsal & Production Cutover |
| `milestone:m4-phase2` | `#EDEDED` | M4: Phase 2 Backlog (Unscheduled) |
| `type:feature` | `#A2EEEF` | End-user functional feature implementation |
| `type:task` | `#7057FF` | Internal engineering task, tooling, or infrastructure |
| `type:decision` | `#D876E3` | Architectural or policy decision resolving PRD [TBD] |
| `type:spike` | `#006B75` | Timeboxed technical investigation or evaluation |
| `priority:P0` | `#B60205` | Blocker / Critical path requirement |
| `priority:P1` | `#E99695` | High priority milestone deliverable |
| `priority:P2` | `#FEF2C0` | Normal priority deliverable |
| `phase:mvp` | `#0E8A16` | Required for MVP public release |
| `phase:2` | `#C5DEF5` | Phase 2 future evolution |

---

## 3. Master Issue Summary Table (88 Issues)

| Code | Title | Track | Milestone | Feature Refs | Priority | Est. | Dependencies (Planned) |
|---|---|:---:|:---:|---|:---:|:---:|---|
| **[A-M0-01]** | INV-003 Define platform-neutral OpenAPI 3.1 specification for Lunhaw REST API | A | M0 | INV-003, F-001..F-006 | P0 | M | None |
| **[A-M0-02]** | INV-003 Scaffold Cloudflare Worker API gateway with TypeScript and router | A | M0 | INV-003 | P0 | M | [A-M0-01], [D-M0-03] |
| **[A-M0-03]** | T-003 Implement request logging with coordinate sanitization and zero-retention filter | A | M0 | T-003, INV-003 | P0 | S | [A-M0-02] |
| **[A-M1-01]** | F-006 Implement GET /locations/areas endpoint for 17 NCR LGUs and barangays | A | M1 | F-006, BR-004, INV-003 | P0 | S | [A-M0-02], [F-M1-01] |
| **[A-M1-02]** | F-001 Implement GET /places search and radius filter endpoint with 500ms SLA | A | M1 | F-001, BR-001, INV-003 | P0 | M | [A-M0-02], [F-M1-02] |
| **[A-M1-03]** | F-002, INV-001, INV-002 Implement GET /places/:id facility profile endpoint with mandatory disclaimer injection | A | M1 | F-002, INV-001, INV-002, BR-001, BR-005 | P0 | M | [A-M1-02], [F-M0-04] |
| **[A-M1-04]** | T-004 Implement Cloudflare Worker edge rate limiting (60 req/min per IP) | A | M1 | T-004 | P1 | S | [A-M0-02] |
| **[A-M2-01]** | F-003, INV-003 Implement GET /transit/network endpoint serving static transit graph and schedule baselines | A | M2 | F-003, INV-001, INV-003 | P1 | M | [A-M0-02], [F-M2-01] |
| **[A-M2-02]** | F-003, INV-001 Implement POST /commute/routes proxy and fare matrix calculation endpoint | A | M2 | F-003, INV-001, BR-001, EQ-003, EQ-004 | P0 | M | [A-M2-01], [B-M2-04] |
| **[A-M2-03]** | F-004, BR-003 Implement GET /places/:id/green-score and route shade endpoints with glass-box breakdown | A | M2 | F-004, BR-003, EQ-001, EQ-002 | P0 | M | [A-M1-02], [F-M2-03] |
| **[A-M3-01]** | F-005 Implement /saved/places and /saved/routes sync endpoints | A | M3 | F-005, INV-003 | P1 | M | [A-M0-02], [F-M3-01] |
| **[A-M3-02]** | BR-002 Implement GET /admin/freshness-audit endpoint flagging records older than 180 days | A | M3 | BR-002, T-005 | P1 | S | [A-M1-03], [F-M0-02] |
| **[A-M3-03]** | Implement edge caching (Cache-Control/ETags) and response compression on Cloudflare Worker | A | M3 | INV-003 | P1 | S | [A-M1-02], [A-M2-03] |
| **[A-M4-01]** | F-102, F-103 Design Phase 2 API specifications for community verification and offline pack manifests | A | M4 | F-102, F-103, INV-003 | P2 | M | [A-M0-01] |
| **[B-M0-01]** | INV-001 Establish AI & Derived Data guardrails and zero-hallucination verification rubric | B | M0 | INV-001, BR-001 | P0 | S | None |
| **[B-M0-02]** | Ingest and validate OpenStreetMap NCR pedestrian walkway and road network (DS-001) | B | M0 | F-003, DS-001 | P0 | M | [B-M0-01] |
| **[B-M1-01]** | F-002 Ingest and normalize NLP public library directory and 17 LGU reading center inventories (DS-004, DS-005) | B | M1 | F-002, DS-004, DS-005 | P0 | M | [B-M0-01], [F-M0-04] |
| **[B-M1-02]** | BR-001 Build data normalization pipeline applying tri-state integrity tags (VERIFIED / ESTIMATE / NOT_AVAILABLE) | B | M1 | BR-001, INV-001 | P0 | M | [B-M1-01], [F-M0-02] |
| **[B-M1-03]** | BR-002 Build automated 180-day verification freshness audit and stale-record detector | B | M1 | BR-002 | P1 | S | [B-M1-02] |
| **[B-M1-04]** | PRD [TBD] Decision: Establish data licensing terms and update cadence with 17 NCR LGUs | B | M1 | F-002, BR-002 | P1 | S | [B-M1-01] |
| **[B-M2-01]** | F-004 Process Copernicus Sentinel-2 satellite canopy and NDVI coverage for Metro Manila (DS-002) | B | M2 | F-004, DS-002 | P0 | L | [B-M0-01] |
| **[B-M2-02]** | F-004, BR-003 Implement EQ-001 Green Index glass-box scoring pipeline with measured vs estimated breakdown | B | M2 | F-004, BR-003, EQ-001, DS-002 | P0 | M | [B-M2-01], [F-M0-05] |
| **[B-M2-03]** | F-004, BR-003 Implement EQ-002 street segment canopy shade calculator | B | M2 | F-004, BR-003, EQ-002, DS-001, DS-002 | P0 | M | [B-M2-01], [B-M0-02] |
| **[B-M2-04]** | F-003, EQ-003, EQ-004 Build transit network topology graph and fare/duration derivation algorithms | B | M2 | F-003, EQ-003, EQ-004, DS-001, DS-003 | P0 | M | [B-M0-02], [F-M2-01] |
| **[B-M3-01]** | Implement data quality validation pipeline and geographic anomaly detector | B | M3 | INV-001, BR-001 | P1 | M | [B-M1-02], [B-M2-04] |
| **[B-M4-01]** | F-102 Design Phase 2 community verification ingestion and anomaly detection pipeline | B | M4 | F-102, INV-001 | P2 | M | [B-M3-01] |
| **[C-M0-01]** | Configure Vite + React 18 + TypeScript app shell with Tailwind CSS and brand tokens | C | M0 | Design System | P0 | M | None |
| **[C-M0-02]** | BR-001, INV-001 Implement reusable VerificationBadge component for tri-state integrity | C | M0 | BR-001, INV-001, Design System | P0 | S | [C-M0-01] |
| **[C-M0-03]** | INV-002, BR-005 Implement persistent FacilityDisclaimerBanner component | C | M0 | INV-002, BR-005, Design System | P0 | S | [C-M0-01] |
| **[C-M0-04]** | Integrate MapLibre GL with OpenFreeMap vector tile base map | C | M0 | F-001 | P0 | M | [C-M0-01] |
| **[C-M1-01]** | F-006, BR-004 Implement graceful geolocation hook with automatic fallback to manual area entry | C | M1 | F-006, BR-004, UJ-003 | P0 | S | [C-M0-01] |
| **[C-M1-02]** | F-006 Implement LGUSelectorModal for 17 Metro Manila cities and barangays | C | M1 | F-006, BR-004, UJ-003 | P0 | M | [C-M1-01], [A-M1-01] |
| **[C-M1-03]** | F-001 Build interactive map explore view with markers and category filters | C | M1 | F-001, UJ-001 | P0 | M | [C-M0-04], [A-M1-02] |
| **[C-M1-04]** | F-002 Build facility detail profile page with operating hours table and study amenity chips | C | M1 | F-002, INV-001, INV-002, BR-005, UJ-001 | P0 | M | [C-M0-02], [C-M0-03], [A-M1-03] |
| **[C-M2-01]** | F-003 Build Rust/WebAssembly A* routing engine in a Web Worker | C | M2 | F-003 | P0 | L | [B-M2-04], [D-M2-01] |
| **[C-M2-02]** | F-003 Build commute route planner UI with origin/destination search and pin picker | C | M2 | F-003, UJ-002 | P0 | M | [C-M0-04], [A-M2-02] |
| **[C-M2-03]** | F-003 Build route option comparison cards and sequential RouteStepCard components | C | M2 | F-003, BR-001, INV-001, UJ-002 | P0 | M | [C-M2-01], [C-M2-02] |
| **[C-M2-04]** | F-004, BR-003 Build GreenIndexPill and glass-box measured vs estimated breakdown modal | C | M2 | F-004, BR-003, EQ-001 | P0 | M | [C-M0-02], [A-M2-03] |
| **[C-M2-05]** | F-004 Build route shade profile polyline visualization on MapLibre | C | M2 | F-004, EQ-002, UJ-002 | P1 | M | [C-M0-04], [C-M2-03] |
| **[C-M3-01]** | F-005 Build local storage bookmarking for places and routes with saved counter badge | C | M3 | F-005, UJ-001, UJ-002 | P0 | S | [C-M1-04], [C-M2-03] |
| **[C-M3-02]** | F-005 Build Saved Places & Trips drawer and optional Supabase Auth dialog | C | M3 | F-005, T-005 | P1 | M | [C-M3-01], [A-M3-01] |
| **[C-M3-03]** | WCAG 2.1 AA accessibility hardening and outdoor sunlight high-contrast pass | C | M3 | Design System, WCAG 2.1 AA | P0 | M | [C-M1-04], [C-M2-03] |
| **[C-M4-01]** | PRD [TBD] Decision: Evaluate and select Phase 2 mobile application framework (React Native vs Flutter vs PWA) | C | M4 | F-101 | P1 | S | None |
| **[D-M0-01]** | Configure Docker Compose local dev environment (PostgreSQL/PostGIS, Worker emulator) | D | M0 | Infrastructure | P0 | M | None |
| **[D-M0-02]** | Setup Cloudflare Pages project for frontend hosting on $0/month free tier | D | M0 | Infrastructure | P0 | S | None |
| **[D-M0-03]** | Setup Cloudflare Workers environment for API gateway and routing proxy | D | M0 | Infrastructure, INV-003 | P0 | S | None |
| **[D-M0-04]** | Configure GitHub Actions CI workflow for linting, typechecking, and automated testing | D | M0 | QA, CI | P0 | S | None |
| **[D-M0-05]** | Create docs/COSTS.md tracking free-tier limits, quotas, and upgrade triggers | D | M0 | Cost Governance | P0 | S | None |
| **[D-M0-06]** | PRD [TBD] Decision: Confirm production backend runtime and database hosting architecture on $0/month stack | D | M0 | PRD Open Questions, System Design | P0 | S | None |
| **[D-M1-01]** | Configure Cloudflare R2 bucket for static GeoJSON boundaries and vector assets | D | M1 | F-001, F-006 | P1 | S | [D-M0-02] |
| **[D-M1-02]** | Setup GitHub Actions scheduled workflow for Supabase free-tier keep-alive ping | D | M1 | Operations | P1 | S | [F-M0-01] |
| **[D-M2-01]** | Optimize WebAssembly routing binary compilation pipeline in CI | D | M2 | F-003 | P1 | M | [D-M0-04] |
| **[D-M2-02]** | Setup OpenFreeMap tile endpoint proxy with edge caching headers | D | M2 | F-001, F-003 | P1 | S | [D-M0-03] |
| **[D-M3-01]** | BR-002 Setup GitHub Actions cron job for scheduled 180-day data freshness audit | D | M3 | BR-002 | P1 | S | [A-M3-02], [B-M1-03] |
| **[D-M3-02]** | Configure automated database backup export to Cloudflare R2 within free storage budget | D | M3 | Operations, Free Tier | P1 | M | [D-M1-01], [F-M0-01] |
| **[D-MR-01]** | Execute production environment deployment, DNS cutover rehearsal, and SSL verification | D | MR | Release | P0 | M | [D-M0-02], [D-M0-03] |
| **[D-MR-02]** | PRD [TBD] Decision: Define long-term hosting, domain maintenance, and civic sponsorship model | D | MR | PRD Open Questions | P1 | S | [D-M0-05] |
| **[E-M0-01]** | Setup Vitest unit test harness and Playwright E2E testing framework | E | M0 | QA Strategy | P0 | M | None |
| **[E-M0-02]** | INV-003, TC-N03 Implement platform-neutral OpenAPI contract linting suite | E | M0 | INV-003, TC-N03 | P0 | S | [A-M0-01] |
| **[E-M1-01]** | F-001, TC-001 Implement integration tests for places search, filter, and 500ms latency target | E | M1 | F-001, TC-001 | P0 | M | [A-M1-02], [E-M0-01] |
| **[E-M1-02]** | F-002, TC-002 Implement E2E test for library details, operating hours, and amenity chips | E | M1 | F-002, TC-002, UJ-001 | P0 | M | [C-M1-04], [E-M0-01] |
| **[E-M1-03]** | F-006, BR-004, TC-006 Implement E2E test for graceful geolocation fallback to manual LGU selector | E | M1 | F-006, BR-004, TC-006, UJ-003 | P0 | M | [C-M1-01], [C-M1-02] |
| **[E-M1-04]** | INV-002, TC-N02 Implement negative E2E test asserting persistent disclaimer banner across all facility views | E | M1 | INV-002, TC-N02, BR-005 | P0 | S | [C-M0-03], [C-M1-04] |
| **[E-M1-05]** | INV-001, TC-N01 Implement negative contract test verifying rejection of unlabelled civic attributes | E | M1 | INV-001, TC-N01, BR-001 | P0 | S | [A-M1-03], [F-M0-02] |
| **[E-M2-01]** | F-003, TC-003 Implement route generation integration test with sequential legs and fare tags | E | M2 | F-003, TC-003, UJ-002 | P0 | M | [A-M2-02], [C-M2-03] |
| **[E-M2-02]** | F-004, TC-004 Implement unit tests for EQ-001 Green Index glass-box formula | E | M2 | F-004, TC-004, EQ-001 | P0 | S | [B-M2-02] |
| **[E-M2-03]** | F-004 Implement unit tests for EQ-002 route shade index calculation | E | M2 | F-004, EQ-002 | P0 | S | [B-M2-03] |
| **[E-M2-04]** | F-003 Implement unit tests for EQ-003 walking duration and EQ-004 fare derivation | E | M2 | F-003, EQ-003, EQ-004 | P0 | S | [B-M2-04] |
| **[E-M3-01]** | F-005, TC-005 Implement local storage persistence and session isolation tests | E | M3 | F-005, TC-005 | P0 | S | [C-M3-01] |
| **[E-M3-02]** | T-003 Execute privacy audit verifying zero coordinate persistence in logs and database | E | M3 | T-003, RA 10173 | P0 | S | [A-M0-03] |
| **[E-M3-03]** | Conduct automated WCAG 2.1 AA accessibility audit with axe-core across all pages | E | M3 | Accessibility, Design System | P0 | M | [C-M3-03] |
| **[E-MR-01]** | Execute release rehearsal covering end-to-end user journeys UJ-001, UJ-002, and UJ-003 | E | MR | UJ-001, UJ-002, UJ-003 | P0 | M | [E-M1-02], [E-M1-03], [E-M2-01] |
| **[E-MR-02]** | Complete production launch readiness checklist and sign-off | E | MR | Launch Governance | P0 | S | [E-MR-01], [D-MR-01] |
| **[F-M0-01]** | Initialize Supabase PostgreSQL database with PostGIS spatial extension | F | M0 | Schema Skeleton | P0 | S | None |
| **[F-M0-02]** | BR-001, INV-001 Create verification_meta table with status enum and derivation note check constraint | F | M0 | BR-001, INV-001 | P0 | S | [F-M0-01] |
| **[F-M0-03]** | F-001 Create places table with spatial geography point, boundary geometry, and FK to verification_meta | F | M0 | F-001, BR-001 | P0 | M | [F-M0-02] |
| **[F-M0-04]** | F-002 Create library_details and operating_hours tables with integrity constraints | F | M0 | F-002, BR-001, INV-001 | P0 | M | [F-M0-03] |
| **[F-M0-05]** | F-004 Create green_index_metrics table with 0-100 score check constraint | F | M0 | F-004, BR-003 | P0 | S | [F-M0-03] |
| **[F-M0-06]** | Setup database migration tooling and local seed scripts | F | M0 | Tooling | P0 | S | [F-M0-01], [D-M0-01] |
| **[F-M1-01]** | F-006 Create lgu_regions and barangays tables and seed 17 Metro Manila LGUs | F | M1 | F-006, BR-004 | P0 | M | [F-M0-01] |
| **[F-M1-02]** | Create spatial GiST index on places.coordinates and compound B-tree index on (lgu_city, barangay) | F | M1 | F-001, F-006, Performance | P0 | S | [F-M0-03], [F-M1-01] |
| **[F-M1-03]** | Configure Row Level Security (RLS) policies for public read access on places and libraries | F | M1 | Security, INV-003 | P0 | S | [F-M0-03], [F-M0-04] |
| **[F-M1-04]** | Develop baseline seed migration with verified NCR parks and municipal libraries | F | M1 | F-001, F-002, BR-001 | P0 | M | [F-M0-03], [F-M0-04], [B-M1-02] |
| **[F-M2-01]** | F-003 Create transit_routes, transit_stops, and route_legs tables | F | M2 | F-003, INV-001 | P0 | M | [F-M0-02] |
| **[F-M2-02]** | F-003 Seed baseline LTFRB transit routes and MRT/LRT rail line station nodes | F | M2 | F-003, DS-003 | P0 | M | [F-M2-01], [B-M2-04] |
| **[F-M2-03]** | F-004 Seed precomputed Green Index scores and canopy metrics for NCR barangays | F | M2 | F-004, BR-003, EQ-001 | P0 | M | [F-M0-05], [B-M2-02] |
| **[F-M3-01]** | F-005 Create saved_items and user_profiles tables with RLS user isolation | F | M3 | F-005, Security | P1 | M | [F-M0-03] |
| **[F-M3-02]** | Establish database storage size budget plan to ensure staying within Supabase 500MB free tier | F | M3 | Cost Governance, Free Tier | P0 | S | [F-M1-04], [F-M2-02] |

---

## 4. Detailed Issue Specifications by Track

### Track A — Backend & API

#### `[A-M0-01]` INV-003 Define platform-neutral OpenAPI 3.1 specification for Lunhaw REST API
- **Context:** Establishes the authoritative REST contract for the entire platform, guaranteeing that Web (Phase 1) and future Native Mobile (Phase 2) share identical data models without frontend-specific coupling (`INV-003`).
- **Scope:** Complete OpenAPI 3.1 specification covering `/places`, `/places/{id}`, `/commute/routes`, `/locations/areas`, `/saved`, and `/health`. Geometry formats defined strictly via RFC 7946 GeoJSON.
- **Acceptance criteria:**
  - WHEN the OpenAPI document is linted with Spectral, THE SYSTEM SHALL pass with zero warnings or errors.
  - THE SYSTEM SHALL NEVER include HTML or client-specific response structures in API schemas.
- **Traceability:** `INV-003`, `F-001`, `F-002`, `F-003`, `F-004`, `F-006`
- **Dependencies:** `Blocked by None`
- **Definition of done:** OpenAPI 3.1 YAML committed in `docs/openapi.yaml`, automated lint check passing in CI.
- **Estimate:** M

#### `[A-M0-02]` INV-003 Scaffold Cloudflare Worker API gateway with TypeScript and router
- **Context:** Provides the serverless edge gateway executing on Cloudflare Workers ($0/month tier) with fast cold-start performance across Metro Manila.
- **Scope:** TypeScript worker scaffold using Hono/Itty-Router, CORS configuration, standard JSON error formatting, and environment secret injection.
- **Acceptance criteria:**
  - WHEN a client sends an invalid request, THE SYSTEM SHALL return standard RFC 7807 problem details with appropriate HTTP status codes.
- **Traceability:** `INV-003`
- **Dependencies:** `Blocked by [A-M0-01], [D-M0-03]`
- **Definition of done:** Local worker runs via Wrangler, unit tests verify routing and CORS policies.
- **Estimate:** M

#### `[A-M0-03]` T-003 Implement request logging with coordinate sanitization and zero-retention filter
- **Context:** Enforces Philippine Data Privacy Act (RA 10173) and threat mitigation `T-003` by guaranteeing that user GPS coordinates are never retained or logged.
- **Scope:** Logging middleware filtering `lat`, `lng`, and raw query coordinates from access log outputs and telemetry.
- **Acceptance criteria:**
  - WHEN a request containing query parameters `lat=14.5&lng=121.0` is processed, THE SYSTEM SHALL scrub coordinates before writing to standard console or log collectors.
- **Traceability:** `T-003`, `RA 10173`
- **Dependencies:** `Blocked by [A-M0-02]`
- **Definition of done:** Automated test verifies regex sanitization of coordinate queries in logs.
- **Estimate:** S

#### `[A-M1-01]` F-006 Implement GET /locations/areas endpoint for 17 NCR LGUs and barangays
- **Context:** Serves the manual administrative area picker when users deny or disable geolocation (`UJ-003`, `BR-004`).
- **Scope:** Edge endpoint returning hierarchical JSON list of all 17 NCR LGUs and their verified barangays.
- **Acceptance criteria:**
  - WHEN a client requests `GET /api/v1/locations/areas`, THE SYSTEM SHALL return all 17 NCR LGUs and their barangay lists within 100ms.
- **Traceability:** `F-006`, `BR-004`, `INV-003`
- **Dependencies:** `Blocked by [A-M0-02], [F-M1-01]`
- **Definition of done:** Vitest integration test passing, response payload schema validated.
- **Estimate:** S

#### `[A-M1-02]` F-001 Implement GET /places search and radius filter endpoint with 500ms SLA
- **Context:** Core discovery endpoint powering the explore map, category filters, and location searches (`UJ-001`).
- **Scope:** PostGIS query handler supporting radius search (`ST_DWithin`), bounding box, city/barangay filter, and category pills (`park`, `library`, `reading_center`).
- **Acceptance criteria:**
  - WHEN a user submits coordinate radius or category filters, THE SYSTEM SHALL return matching places within 500ms carrying data integrity tags.
- **Traceability:** `F-001`, `BR-001`, `INV-003`
- **Dependencies:** `Blocked by [A-M0-02], [F-M1-02]`
- **Definition of done:** Benchmarked under 500ms on local PostGIS with 50 seed places, integration tests passing.
- **Estimate:** M

#### `[A-M1-03]` F-002, INV-001, INV-002 Implement GET /places/:id facility profile endpoint with mandatory disclaimer injection
- **Context:** Returns comprehensive reading center / library profile including study amenities and hours while strictly enforcing `INV-002` disclaimer injection.
- **Scope:** Facility profile endpoint joining `places`, `library_details`, `operating_hours`, and `verification_meta`. Directly injects the disclaimer string in the root JSON response.
- **Acceptance criteria:**
  - WHEN a facility profile is requested, THE SYSTEM SHALL return HTTP 200 containing the exact disclaimer string: "Please verify operating hours directly with the facility before traveling...".
  - IF an amenity or schedule has no verification record, THE SYSTEM SHALL return status `NOT_AVAILABLE`.
- **Traceability:** `F-002`, `INV-001`, `INV-002`, `BR-001`, `BR-005`
- **Dependencies:** `Blocked by [A-M1-02], [F-M0-04]`
- **Definition of done:** Contract test TC-N02 verifies presence of disclaimer in payload.
- **Estimate:** M

#### `[A-M1-04]` T-004 Implement Cloudflare Worker edge rate limiting (60 req/min per IP)
- **Context:** Mitigates Denial of Service (`T-004`) and preserves Supabase/Cloudflare free tier quotas from automated scrapers.
- **Scope:** Token-bucket rate limiting middleware running at Cloudflare edge, limiting requests to 60 req/min per IP.
- **Acceptance criteria:**
  - WHEN a single IP submits more than 60 requests in a 60-second window, THE SYSTEM SHALL respond with HTTP 429 and `Retry-After` header.
- **Traceability:** `T-004`
- **Dependencies:** `Blocked by [A-M0-02]`
- **Definition of done:** Rate limit test suite passing, verified under load.
- **Estimate:** S

#### `[A-M2-01]` F-003, INV-003 Implement GET /transit/network endpoint serving static transit graph and schedule baselines
- **Context:** Powers the client-side WebAssembly routing engine by serving precomputed transit nodes and line segments without dynamic backend routing load.
- **Scope:** Endpoint serving versioned static GeoJSON transit network (MRT/LRT, EDSA Carousel, traditional jeepneys).
- **Acceptance criteria:**
  - WHEN requested, THE SYSTEM SHALL serve the network payload with aggressive edge caching (`Cache-Control: public, max-age=86400`).
- **Traceability:** `F-003`, `INV-001`, `INV-003`
- **Dependencies:** `Blocked by [A-M0-02], [F-M2-01]`
- **Definition of done:** Response payload compressed < 500KB, schema validated against GeoJSON standard.
- **Estimate:** M

#### `[A-M2-02]` F-003, INV-001 Implement POST /commute/routes proxy and fare matrix calculation endpoint
- **Context:** Validates commute origin/destination within NCR bounds and calculates official fare breakdown per leg (`UJ-002`, `EQ-004`).
- **Scope:** Endpoint computing sequential leg fares, attaching `VERIFIED` status for official LTFRB fare matrix routes or `ESTIMATE` with calculation notes.
- **Acceptance criteria:**
  - WHEN a route calculation is requested, THE SYSTEM SHALL output sequential steps where each leg carries an explicit fare object and integrity tag (`INV-001`).
- **Traceability:** `F-003`, `INV-001`, `BR-001`, `EQ-003`, `EQ-004`
- **Dependencies:** `Blocked by [A-M2-01], [B-M2-04]`
- **Definition of done:** Tested against DOTr/LTFRB fare rules with integration tests passing.
- **Estimate:** M

#### `[A-M2-03]` F-004, BR-003 Implement GET /places/:id/green-score and route shade endpoints with glass-box breakdown
- **Context:** Exposes computed Green Index (0-100) and pathway shade scores with complete mathematical transparency (`BR-003`, `EQ-001`, `EQ-002`).
- **Scope:** Read endpoints returning total score, canopy cover percentage, NDVI vegetation ratio, and methodology citation note.
- **Acceptance criteria:**
  - WHEN a green score is queried, THE SYSTEM SHALL return the numerical score (0-100) alongside the exact measured vs estimated breakdown.
- **Traceability:** `F-004`, `BR-003`, `EQ-001`, `EQ-002`
- **Dependencies:** `Blocked by [A-M1-02], [F-M2-03]`
- **Definition of done:** Integration test proves output matches formula output to 2 decimal places.
- **Estimate:** M

#### `[A-M3-01]` F-005 Implement /saved/places and /saved/routes sync endpoints
- **Context:** Enables optional cross-device synchronization of bookmarked places and trips for logged-in users while keeping unauthenticated usage local.
- **Scope:** CRUD endpoints on `/saved` protected by Supabase JWT bearer token validation.
- **Acceptance criteria:**
  - WHEN an authenticated user posts a bookmark, THE SYSTEM SHALL persist the reference and return HTTP 201.
  - IF an unauthenticated user calls the endpoint, THE SYSTEM SHALL return HTTP 401.
- **Traceability:** `F-005`, `INV-003`
- **Dependencies:** `Blocked by [A-M0-02], [F-M3-01]`
- **Definition of done:** Integration tests with mock JWT tokens passing.
- **Estimate:** M

#### `[A-M3-02]` BR-002 Implement GET /admin/freshness-audit endpoint flagging records older than 180 days
- **Context:** Enforces rule `BR-002` by exposing an audit query identifying verified facilities that have not been re-audited in 180 days.
- **Scope:** Protected administrative endpoint querying `verification_meta.last_verified_at < NOW() - INTERVAL '180 days'`.
- **Acceptance criteria:**
  - WHEN invoked by an authorized moderator, THE SYSTEM SHALL return all records older than 180 days flagged for manual review.
- **Traceability:** `BR-002`, `T-005`
- **Dependencies:** `Blocked by [A-M1-03], [F-M0-02]`
- **Definition of done:** Role-based access control tested, SQL query plan verified.
- **Estimate:** S

#### `[A-M3-03]` Implement edge caching (Cache-Control/ETags) and response compression on Cloudflare Worker
- **Context:** Minimizes Supabase database connection and egress utilization to stay within free tier limits.
- **Scope:** Cache-Control header injection, ETag generation, and gzip/brotli compression on read responses.
- **Acceptance criteria:**
  - WHEN an identical GET /places query is repeated within 5 minutes, THE SYSTEM SHALL serve the response from Cloudflare edge cache with HTTP 304 or cache HIT.
- **Traceability:** `INV-003`, Free Tier Budget
- **Dependencies:** `Blocked by [A-M1-02], [A-M2-03]`
- **Definition of done:** Edge cache hit ratio verified via Wrangler dev testing.
- **Estimate:** S

#### `[A-M4-01]` F-102, F-103 Design Phase 2 API specifications for community verification and offline pack manifests
- **Context:** Prepares architectural foundations for Phase 2 community moderation and offline map caching without changing MVP contracts (`INV-003`).
- **Scope:** Draft OpenAPI paths for `/community/submissions`, `/admin/review`, and `/offline/manifest`.
- **Acceptance criteria:**
  - WHEN reviewed against Phase 1 endpoints, THE SYSTEM SHALL exhibit zero breaking changes or schema incompatibilities.
- **Traceability:** `F-102`, `F-103`, `INV-003`
- **Dependencies:** `Blocked by [A-M0-01]`
- **Definition of done:** Markdown / OpenAPI draft submitted to `docs/phase2-api-draft.md`.
- **Estimate:** M

---

### Track B — AI & Data Intelligence

#### `[B-M0-01]` INV-001 Establish AI & Derived Data guardrails and zero-hallucination verification rubric
- **Context:** Canonical guardrail standard ensuring no machine learning, generative model, or heuristic derivation ever fabricates civic or transit information (`INV-001`).
- **Scope:** Documentation and validation schemas defining rules: no AI output may ever be tagged `VERIFIED`; all derived metrics must cite an explicit equation ID and dataset ID.
- **Acceptance criteria:**
  - THE SYSTEM SHALL reject any ingestion pipeline or mathematical model output lacking an explicit `equation_id` and input citations.
- **Traceability:** `INV-001`, `BR-001`
- **Dependencies:** `Blocked by None`
- **Definition of done:** Guardrail checklist published and committed in `docs/data-guardrails.md`.
- **Estimate:** S

#### `[B-M0-02]` Ingest and validate OpenStreetMap NCR pedestrian walkway and road network (DS-001)
- **Context:** Establishes the spatial network graph used for pedestrian walking calculations and commute routing (`UJ-002`, `DS-001`).
- **Scope:** Filter OSM extract for NCR bounding box (14.3°N–14.8°N, 120.9°E–121.2°E), extracting walkable footways, sidewalks, and secondary streets while stripping vehicle-only expressways (Skyway, underpasses).
- **Acceptance criteria:**
  - WHEN the network is generated, THE SYSTEM SHALL contain zero expressway segments in pedestrian routing layers.
- **Traceability:** `F-003`, `DS-001`
- **Dependencies:** `Blocked by [B-M0-01]`
- **Definition of done:** GeoJSON / graph dataset validated and committed to pipeline storage.
- **Estimate:** M

#### `[B-M1-01]` F-002 Ingest and normalize NLP public library directory and 17 LGU reading center inventories (DS-004, DS-005)
- **Context:** Compiles baseline facility records from the National Library of the Philippines and municipal portals (`F-002`, `UJ-001`).
- **Scope:** Ingest scripts parsing NLP directories and available LGU open data tables into unified relational schema with verified LGU / barangay jurisdictions.
- **Acceptance criteria:**
  - WHEN ingested, THE SYSTEM SHALL assign each facility valid NCR coordinates, jurisdiction, and initial amenity flags.
- **Traceability:** `F-002`, `DS-004`, `DS-005`
- **Dependencies:** `Blocked by [B-M0-01], [F-M0-04]`
- **Definition of done:** Ingestion script runs cleanly, producing normalized JSON seed records.
- **Estimate:** M

#### `[B-M1-02]` BR-001 Build data normalization pipeline applying tri-state integrity tags (VERIFIED / ESTIMATE / NOT_AVAILABLE)
- **Context:** Enforces rule `BR-001` across all ingested civic facilities and schedules before insertion into PostgreSQL.
- **Scope:** Normalization script checking source provenance: officially confirmed items get `VERIFIED` + ISO date; derived values get `ESTIMATE` + note; unconfirmed items get `NOT_AVAILABLE`.
- **Acceptance criteria:**
  - WHEN any facility attribute is processed, THE SYSTEM SHALL assign exactly one of the three tri-state labels.
- **Traceability:** `BR-001`, `INV-001`
- **Dependencies:** `Blocked by [B-M1-01], [F-M0-02]`
- **Definition of done:** 100% of seed records pass tri-state validation check.
- **Estimate:** M

#### `[B-M1-03]` BR-002 Build automated 180-day verification freshness audit and stale-record detector
- **Context:** Automated audit script identifying records that have exceeded the 180-day verification validity window (`BR-002`).
- **Scope:** Scheduled script scanning database records, generating a Markdown report of stale facilities requiring re-verification.
- **Acceptance criteria:**
  - WHEN a record's `last_verified_at` timestamp exceeds 180 days, THE SYSTEM SHALL output it to the audit queue.
- **Traceability:** `BR-002`
- **Dependencies:** `Blocked by [B-M1-02]`
- **Definition of done:** Script executed against test database with synthetic stale dates, output verified.
- **Estimate:** S

#### `[B-M1-04]` PRD [TBD] Decision: Establish data licensing terms and update cadence with 17 NCR LGUs
- **Context:** PRD Open Question §12 regarding civic data licensing, FOI request workflows, and update cadence agreements across Metro Manila LGUs.
- **Scope:** Architectural decision record detailing acceptable open data licenses (ODbL, CC-BY, Government Open Data), update frequency, and fallback policies.
- **Acceptance criteria:**
  - THE TEAM SHALL document and approve the LGU data intake agreement and license compatibility ledger.
- **Traceability:** `F-002`, `BR-002`
- **Dependencies:** `Blocked by [B-M1-01]`
- **Definition of done:** ADR committed in `docs/decisions/ADR-002-lgu-data-licensing.md`.
- **Estimate:** S

#### `[B-M2-01]` F-004 Process Copernicus Sentinel-2 satellite canopy and NDVI coverage for Metro Manila (DS-002)
- **Context:** Ingests European Space Agency Sentinel-2 multispectral satellite data to measure actual urban tree canopy and vegetation ratios (`F-004`, `DS-002`).
- **Scope:** Automated raster processing pipeline computing Normalized Difference Vegetation Index (NDVI) at 10-meter resolution across Metro Manila.
- **Acceptance criteria:**
  - WHEN satellite tiles are processed, THE SYSTEM SHALL output calibrated NDVI grid values between -1.0 and +1.0 for NCR coordinates.
- **Traceability:** `F-004`, `DS-002`
- **Dependencies:** `Blocked by [B-M0-01]`
- **Definition of done:** GeoTIFF raster processed, sample coordinates tested against known ground parks (e.g. Arroceros, QC Memorial Circle).
- **Estimate:** L

#### `[B-M2-02]` F-004, BR-003 Implement EQ-001 Green Index glass-box scoring pipeline with measured vs estimated breakdown
- **Context:** Computes transparent 0-100 Green Index scores for all public spaces using canonical equation `EQ-001` (`BR-003`).
- **Scope:** Implementation of $Score = (0.50 \times C) + (0.30 \times V) + (0.20 \times P)$ where $C$ is canopy %, $V$ is NDVI vegetation %, and $P$ is permeable ratio.
- **Acceptance criteria:**
  - WHEN scores are computed, THE SYSTEM SHALL output total score bounded in [0.00, 100.00] alongside sub-scores for $C$, $V$, and $P$.
- **Traceability:** `F-004`, `BR-003`, `EQ-001`, `DS-002`
- **Dependencies:** `Blocked by [B-M2-01], [F-M0-05]`
- **Definition of done:** Unit tests assert output precision $\pm 0.01$ against hand-calculated benchmarks.
- **Estimate:** M

#### `[B-M2-03]` F-004, BR-003 Implement EQ-002 street segment canopy shade calculator
- **Context:** Calculates tree canopy shade index along pedestrian paths using equation `EQ-002` (`UJ-002`).
- **Scope:** Geometric intersection algorithm overlaying road/sidewalk vectors onto satellite canopy masks to calculate segment canopy coverage ratios $S_i$.
- **Acceptance criteria:**
  - WHEN a street segment is evaluated, THE SYSTEM SHALL output length-weighted shade coverage between 0.0% and 100.0% with equation citation.
- **Traceability:** `F-004`, `BR-003`, `EQ-002`, `DS-001`, `DS-002`
- **Dependencies:** `Blocked by [B-M2-01], [B-M0-02]`
- **Definition of done:** Validated on sample corridors (San Miguel Ave, Ayala Ave sidewalk).
- **Estimate:** M

#### `[B-M2-04]` F-003, EQ-003, EQ-004 Build transit network topology graph and fare/duration derivation algorithms
- **Context:** Prepares multimodal graph connecting rail, bus, and jeepney networks with pedestrian walkways, calculating walking times and fares (`F-003`).
- **Scope:** Graph construction implementing walking speed $4.2\text{ km/h}$ (`EQ-003`) and LTFRB base + per-km fare matrix equations (`EQ-004`).
- **Acceptance criteria:**
  - WHEN a route leg is calculated, THE SYSTEM SHALL output estimated walking duration and exact PUV fare tagged `VERIFIED` or `ESTIMATE`.
- **Traceability:** `F-003`, `EQ-003`, `EQ-004`, `DS-001`, `DS-003`
- **Dependencies:** `Blocked by [B-M0-02], [F-M2-01]`
- **Definition of done:** Mathematical accuracy verified against official LTFRB PUV fare circular.
- **Estimate:** M

#### `[B-M3-01]` Implement data quality validation pipeline and geographic anomaly detector
- **Context:** Safeguards platform integrity by detecting conflicting schedules, duplicate facilities, and out-of-boundary coordinates.
- **Scope:** Automated validation suite running spatial outlier detection and schema verification against all facility records.
- **Acceptance criteria:**
  - WHEN any facility has coordinates outside NCR bounding box or conflicting operating hours, THE SYSTEM SHALL flag the record.
- **Traceability:** `INV-001`, `BR-001`
- **Dependencies:** `Blocked by [B-M1-02], [B-M2-04]`
- **Definition of done:** Automated validation job integrated into CI data testing pipeline.
- **Estimate:** M

#### `[B-M4-01]` F-102 Design Phase 2 community verification ingestion and anomaly detection pipeline
- **Context:** Prepares data ingestion architecture for community contributions (Phase 2, `F-102`) with strict moderation barriers.
- **Scope:** Design specification for user-submitted operating hours updates, photo proofs, and anomaly scoring to prevent vandalism.
- **Acceptance criteria:**
  - THE DESIGN SHALL guarantee that no community submission can transition to `VERIFIED` status without moderator cryptographic approval.
- **Traceability:** `F-102`, `INV-001`
- **Dependencies:** `Blocked by [B-M3-01]`
- **Definition of done:** Design document committed to `docs/phase2-community-pipeline.md`.
- **Estimate:** M

---

### Track C — Frontend

#### `[C-M0-01]` Configure Vite + React 18 + TypeScript app shell with Tailwind CSS and brand tokens
- **Context:** Creates the lightweight client application configured for instant loading and $0/month Cloudflare Pages hosting.
- **Scope:** Vite build configuration, React 18, TypeScript strict mode, Tailwind CSS preset with brand palette (`#245C43`, `#98D746`, `#B7F9ED`, `#F7F7F0`), and Google fonts `MedievalSharp` & `Kufam`.
- **Acceptance criteria:**
  - WHEN built, THE SYSTEM SHALL compile an initial JS bundle under 150KB gzip with zero lint or TypeScript warnings.
- **Traceability:** `Design System`
- **Dependencies:** `Blocked by None`
- **Definition of done:** App shell renders homepage hero with mascot illustration and brand tokens.
- **Estimate:** M

#### `[C-M0-02]` BR-001, INV-001 Implement reusable VerificationBadge component for tri-state integrity
- **Context:** Primary visual component enforcing radical data honesty across every facility profile, amenity chip, and fare tag (`INV-001`, `BR-001`).
- **Scope:** Component rendering three explicit states: `VERIFIED` (green check + source tooltip), `ESTIMATE` (amber info + method note), `NOT_AVAILABLE` (slate dash).
- **Acceptance criteria:**
  - WHEN rendered with any state, THE SYSTEM SHALL display high-contrast accessible text and semantic icons without relying on color alone.
- **Traceability:** `BR-001`, `INV-001`, `Design System`
- **Dependencies:** `Blocked by [C-M0-01]`
- **Definition of done:** Unit tests with React Testing Library cover all 3 states and hover tooltips.
- **Estimate:** S

#### `[C-M0-03]` INV-002, BR-005 Implement persistent FacilityDisclaimerBanner component
- **Context:** Non-negotiable advisory banner required on every public reading center and library view (`INV-002`, `BR-005`).
- **Scope:** Reusable banner component rendering exact required copy: *"Please verify operating hours directly with the facility before traveling, as local barangay schedules may change without notice."*
- **Acceptance criteria:**
  - THE SYSTEM SHALL render the banner prominently above facility hours, preventing dismissal or hiding.
- **Traceability:** `INV-002`, `BR-005`, `Design System`
- **Dependencies:** `Blocked by [C-M0-01]`
- **Definition of done:** Component unit tested asserting exact copy match.
- **Estimate:** S

#### `[C-M0-04]` Integrate MapLibre GL with OpenFreeMap vector tile base map
- **Context:** Core spatial canvas providing high-performance map previews centered on Metro Manila with zero monthly map tile costs.
- **Scope:** MapLibre GL React wrapper initialized at NCR coordinates (`[120.9842, 14.5995]`, zoom 12) consuming OpenFreeMap vector tile style.
- **Acceptance criteria:**
  - WHEN map initializes, THE SYSTEM SHALL load vector tiles within 1.5s on 4G mobile emulation with navigation controls.
- **Traceability:** `F-001`
- **Dependencies:** `Blocked by [C-M0-01]`
- **Definition of done:** Map component renders smoothly in test page with zero console errors.
- **Estimate:** M

#### `[C-M1-01]` F-006, BR-004 Implement graceful geolocation hook with automatic fallback to manual area entry
- **Context:** Ensures privacy and seamless user experience when users decline browser location access (`BR-004`, `UJ-003`).
- **Scope:** `useUserLocation` React hook listening to Geolocation API permissions, errors, and 5-second timeouts, triggering manual fallback without error modals.
- **Acceptance criteria:**
  - WHEN geolocation permission is denied or times out, THE SYSTEM SHALL seamlessly transition to manual City + Barangay entry without blocking dialogs.
- **Traceability:** `F-006`, `BR-004`, `UJ-003`
- **Dependencies:** `Blocked by [C-M0-01]`
- **Definition of done:** Hook tested with mocked Geolocation API in all 3 permission states.
- **Estimate:** S

#### `[C-M1-02]` F-006 Implement LGUSelectorModal for 17 Metro Manila cities and barangays
- **Context:** Interactive selector allowing manual navigation across all 17 NCR LGUs and their barangays (`F-006`, `UJ-003`).
- **Scope:** Accessible modal dialog featuring searchable dropdowns for 17 cities and corresponding barangays, persisting chosen jurisdiction in local state.
- **Acceptance criteria:**
  - WHEN a user selects a City (e.g. Pasig) and Barangay (e.g. San Antonio), THE SYSTEM SHALL center the map and filter the facilities list to that area.
- **Traceability:** `F-006`, `BR-004`, `UJ-003`
- **Dependencies:** `Blocked by [C-M1-01], [A-M1-01]`
- **Definition of done:** Full keyboard navigation tested, ARIA modal attributes verified.
- **Estimate:** M

#### `[C-M1-03]` F-001 Build interactive map explore view with markers and category filters
- **Context:** Primary exploration interface connecting residents with nearby green spaces and study hubs (`F-001`, `UJ-001`).
- **Scope:** MapLibre marker clustering, category pill bar (`All`, `Parks & Gardens`, `Libraries & Reading Centers`), responsive split/drawer view.
- **Acceptance criteria:**
  - WHEN category pill "Libraries" is clicked, THE SYSTEM SHALL update map pins and list view within 200ms.
- **Traceability:** `F-001`, `UJ-001`
- **Dependencies:** `Blocked by [C-M0-04], [A-M1-02]`
- **Definition of done:** Component and interaction tests passing.
- **Estimate:** M

#### `[C-M1-04]` F-002 Build facility detail profile page with operating hours table and study amenity chips
- **Context:** Detailed profile view for reading centers and municipal libraries answering students' core study needs (`F-002`, `UJ-001`).
- **Scope:** Facility view rendering title, persistent disclaimer banner (`INV-002`), operating hours schedule grid, study chips (Power Outlets, Wi-Fi, AC, Desk Capacity), and Save button.
- **Acceptance criteria:**
  - WHEN viewing a facility, THE SYSTEM SHALL display study amenity chips with their verified tags and the persistent advisory disclaimer.
- **Traceability:** `F-002`, `INV-001`, `INV-002`, `BR-005`, `UJ-001`
- **Dependencies:** `Blocked by [C-M0-02], [C-M0-03], [A-M1-03]`
- **Definition of done:** Page rendered and tested under Playwright, verified against banned copy rules.
- **Estimate:** M

#### `[C-M2-01]` F-003 Build Rust/WebAssembly A* routing engine in a Web Worker
- **Context:** Delivers instant, client-side walking and transit pathfinding off-the-main-thread with zero backend server costs (`F-003`).
- **Scope:** Rust crate implementing A* pathfinding compiled to WebAssembly via `wasm-pack`, executed inside a Dedicated Web Worker communicating via postMessage.
- **Acceptance criteria:**
  - WHEN origin and destination coordinates are provided, THE SYSTEM SHALL return sequential walking route legs in under 300ms without freezing UI.
- **Traceability:** `F-003`
- **Dependencies:** `Blocked by [B-M2-04], [D-M2-01]`
- **Definition of done:** Wasm worker benchmarked on sample 2km NCR walking journeys, automated unit tests passing.
- **Estimate:** L

#### `[C-M2-02]` F-003 Build commute route planner UI with origin/destination search and pin picker
- **Context:** Interface enabling commuters to enter starting point and destination or drop pins on the map (`F-003`, `UJ-002`).
- **Scope:** Input panel with address autocompletion, map point picker, reverse route button, and preference selector (`Fastest`, `Shaded Green`).
- **Acceptance criteria:**
  - WHEN a user clicks on the map, THE SYSTEM SHALL populate the active coordinate input field and calculate route options.
- **Traceability:** `F-003`, `UJ-002`
- **Dependencies:** `Blocked by [C-M0-04], [A-M2-02]`
- **Definition of done:** Tested with React Hook Form and keyboard accessibility.
- **Estimate:** M

#### `[C-M2-03]` F-003 Build route option comparison cards and sequential RouteStepCard components
- **Context:** Presents candidate commute options side-by-side with transparent boarding steps and fare breakdowns (`F-003`, `UJ-002`).
- **Scope:** Route summary cards showing fast route vs high-shade route, expandable sequential `RouteStepCard`s detailing boarding, transfers, walking, and fare chips.
- **Acceptance criteria:**
  - WHEN route cards render, THE SYSTEM SHALL display every transit fare with an explicit `VERIFIED` or `ESTIMATE` badge (`INV-001`).
- **Traceability:** `F-003`, `BR-001`, `INV-001`, `UJ-002`
- **Dependencies:** `Blocked by [C-M2-01], [C-M2-02]`
- **Definition of done:** Unit tests verify rendering of multi-modal transfer steps and fare badges.
- **Estimate:** M

#### `[C-M2-04]` F-004, BR-003 Build GreenIndexPill and glass-box measured vs estimated breakdown modal
- **Context:** Visual indicator of environmental greenery and canopy shade with a transparent calculation inspector (`F-004`, `BR-003`).
- **Scope:** Pill component (0-100 score with color ramp) and expandable modal displaying sub-scores: tree canopy %, NDVI vegetation density, and dataset citation.
- **Acceptance criteria:**
  - WHEN the Green Index pill is clicked, THE SYSTEM SHALL display the glass-box modal showing measured vs estimated component breakdown (`BR-003`).
- **Traceability:** `F-004`, `BR-003`, `EQ-001`
- **Dependencies:** `Blocked by [C-M0-02], [A-M2-03]`
- **Definition of done:** Modal tested with screen readers; high-contrast score readability verified.
- **Estimate:** M

#### `[C-M2-05]` F-004 Build route shade profile polyline visualization on MapLibre
- **Context:** Renders visual route polylines on the map color-coded by tree canopy shade coverage (`F-004`, `UJ-002`).
- **Scope:** MapLibre line layers with gradient or segmented styling indicating high shade (Forest Green), moderate shade (Lime), and exposed sun (Amber).
- **Acceptance criteria:**
  - WHEN a shaded route is selected, THE SYSTEM SHALL render the polyline with distinct segment colors matching canopy coverage.
- **Traceability:** `F-004`, `EQ-002`, `UJ-002`
- **Dependencies:** `Blocked by [C-M0-04], [C-M2-03]`
- **Definition of done:** Tested across Chromium and WebKit rendering engines.
- **Estimate:** M

#### `[C-M3-01]` F-005 Build local storage bookmarking for places and routes with saved counter badge
- **Context:** Instant, frictionless saving of favorite study spots and routes without requiring an account (`F-005`, `UJ-001`).
- **Scope:** Bookmarking hook persisting saved place IDs and route parameters to `localStorage`, with animated heart/bookmark button and header counter badge.
- **Acceptance criteria:**
  - WHEN a user clicks the bookmark button on any facility, THE SYSTEM SHALL immediately save the item to localStorage and increment the badge count.
- **Traceability:** `F-005`, `UJ-001`, `UJ-002`
- **Dependencies:** `Blocked by [C-M1-04], [C-M2-03]`
- **Definition of done:** Local storage quota tests and state rehydration tests passing.
- **Estimate:** S

#### `[C-M3-02]` F-005 Build Saved Places & Trips drawer and optional Supabase Auth dialog
- **Context:** Drawer interface for viewing bookmarks with an optional login modal for cross-device cloud synchronization (`F-005`).
- **Scope:** Slide-over drawer listing saved facilities and trips, with action buttons to remove or navigate, and optional Supabase magic-link login dialog.
- **Acceptance criteria:**
  - WHEN drawer is opened, THE SYSTEM SHALL list all saved items with instant tap-to-view navigation.
- **Traceability:** `F-005`, `T-005`
- **Dependencies:** `Blocked by [C-M3-01], [A-M3-01]`
- **Definition of done:** Drawer interaction verified on mobile viewports; auth modal tested.
- **Estimate:** M

#### `[C-M3-03]` WCAG 2.1 AA accessibility hardening and outdoor sunlight high-contrast pass
- **Context:** Ensures readability and usability under harsh outdoor tropical sunlight and meets WCAG 2.1 AA compliance.
- **Scope:** Contrast ratio audit (> 4.5:1 body, > 3:1 large headers), focus-visible styling (`#245C43` 2px rings), 44x44px touch targets, and ARIA labels.
- **Acceptance criteria:**
  - THE SYSTEM SHALL achieve zero violations in automated axe-core accessibility checks.
- **Traceability:** `Design System`, `WCAG 2.1 AA`
- **Dependencies:** `Blocked by [C-M1-04], [C-M2-03]`
- **Definition of done:** Axe-core audit report clean; keyboard-only navigation passes.
- **Estimate:** M

#### `[C-M4-01]` PRD [TBD] Decision: Evaluate and select Phase 2 mobile application framework (React Native vs Flutter vs PWA)
- **Context:** PRD Open Question §12 regarding mobile framework selection for Phase 2 (`F-101`).
- **Scope:** Evaluation spike comparing React Native (sharing web TypeScript/React logic), Flutter, and an enhanced Progressive Web App (PWA).
- **Acceptance criteria:**
  - THE TEAM SHALL publish a comparative scorecard evaluating developer velocity, $0/month maintenance, and offline map support.
- **Traceability:** `F-101`
- **Dependencies:** `Blocked by None`
- **Definition of done:** Decision ADR published in `docs/decisions/ADR-003-mobile-framework.md`.
- **Estimate:** S

---

### Track D — Cloud & Infrastructure

#### `[D-M0-01]` Configure Docker Compose local dev environment (PostgreSQL/PostGIS, Worker emulator)
- **Context:** Provides a reproducible local development environment that matches production spatial and serverless capabilities.
- **Scope:** `docker-compose.yml` defining PostgreSQL 16 with PostGIS extension, MinIO (R2 mock), and Wrangler local dev environment.
- **Acceptance criteria:**
  - WHEN `docker compose up` is executed, THE SYSTEM SHALL bring up PostGIS and seed data ready for local development within 60 seconds.
- **Traceability:** `Infrastructure`
- **Dependencies:** `Blocked by None`
- **Definition of done:** Docker compose file tested on clean clone with startup verification script.
- **Estimate:** M

#### `[D-M0-02]` Setup Cloudflare Pages project for frontend hosting on $0/month free tier
- **Context:** Provisions the continuous deployment hosting for the web application on Cloudflare Pages ($0/month unlimited bandwidth).
- **Scope:** Cloudflare Pages project connection to GitHub repo, build command `pnpm build`, output directory `apps/web/dist`, and security header rules.
- **Acceptance criteria:**
  - WHEN a commit lands on `main`, THE SYSTEM SHALL automatically build and deploy the frontend to the Cloudflare edge within 2 minutes.
- **Traceability:** `Infrastructure`
- **Dependencies:** `Blocked by None`
- **Definition of done:** Successful deployment verified on `*.pages.dev` domain.
- **Estimate:** S

#### `[D-M0-03]` Setup Cloudflare Workers environment for API gateway and routing proxy
- **Context:** Provisions serverless edge computing on Cloudflare Workers (free tier: 100,000 requests/day).
- **Scope:** `wrangler.toml` configuration, staging/production environments, Supabase service bindings, and deployment automation.
- **Acceptance criteria:**
  - WHEN deployed, THE SYSTEM SHALL execute API gateway routes with sub-50ms cold-start latency.
- **Traceability:** `Infrastructure`, `INV-003`
- **Dependencies:** `Blocked by None`
- **Definition of done:** Worker deployed and responding to `/health` endpoint.
- **Estimate:** S

#### `[D-M0-04]` Configure GitHub Actions CI workflow for linting, typechecking, and automated testing
- **Context:** Continuous integration gate ensuring code quality, type safety, and test coverage before merging.
- **Scope:** Workflow `.github/workflows/ci.yml` running pnpm install, linting, TypeScript compilation, and Vitest test suites.
- **Acceptance criteria:**
  - WHEN a PR is opened, THE SYSTEM SHALL complete all CI checks within 3 minutes.
- **Traceability:** `QA`, `CI`
- **Dependencies:** `Blocked by None`
- **Definition of done:** CI pipeline green on pull requests and commits to main.
- **Estimate:** S

#### `[D-M0-05]` Create docs/COSTS.md tracking free-tier limits, quotas, and upgrade triggers
- **Context:** Enforces strict adherence to the $0/month budget by documenting service quotas and alert triggers across all cloud providers.
- **Scope:** Living documentation tracking Supabase (500MB DB, 50k MAU), Cloudflare Workers (100k req/day), Cloudflare R2 (10GB storage), and Actions minutes.
- **Acceptance criteria:**
  - THE SYSTEM SHALL define explicit utilization triggers (e.g. 80% quota warning) for every connected cloud service.
- **Traceability:** `Cost Governance`
- **Dependencies:** `Blocked by None`
- **Definition of done:** `docs/COSTS.md` created with official provider documentation citations.
- **Estimate:** S

#### `[D-M0-06]` PRD [TBD] Decision: Confirm production backend runtime and database hosting architecture on $0/month stack
- **Context:** Formally resolves PRD Open Question §12 regarding production backend and database architecture confirmation.
- **Scope:** Decision record evaluating Cloudflare Workers + Supabase PostGIS vs alternative free-tier cloud stacks.
- **Acceptance criteria:**
  - THE TEAM SHALL approve the architecture baseline verifying zero monthly recurring charges.
- **Traceability:** `PRD Open Questions`, `System Design`
- **Dependencies:** `Blocked by None`
- **Definition of done:** ADR published in `docs/decisions/ADR-001-cloud-architecture.md`.
- **Estimate:** S

#### `[D-M1-01]` Configure Cloudflare R2 bucket for static GeoJSON boundaries and vector assets
- **Context:** Provides zero-egress-fee object storage (10GB free tier) for large spatial boundary files and map icons.
- **Scope:** Cloudflare R2 bucket creation, public read access policies, and asset sync script for NCR barangay polygons and brand graphics.
- **Acceptance criteria:**
  - WHEN a client requests static GeoJSON boundary files, THE SYSTEM SHALL serve them with public caching headers without hitting database.
- **Traceability:** `F-001`, `F-006`
- **Dependencies:** `Blocked by [D-M0-02]`
- **Definition of done:** Bucket provisioned, test assets downloaded and verified.
- **Estimate:** S

#### `[D-M1-02]` Setup GitHub Actions scheduled workflow for Supabase free-tier keep-alive ping
- **Context:** Prevents Supabase free-tier PostgreSQL projects from auto-pausing after 7 days of inactivity.
- **Scope:** Scheduled GitHub Actions cron job running every Monday and Thursday executing a lightweight health check query against Supabase.
- **Acceptance criteria:**
  - WHEN the cron triggers, THE SYSTEM SHALL execute a `SELECT 1` query via REST and verify database active status.
- **Traceability:** `Operations`
- **Dependencies:** `Blocked by [F-M0-01]`
- **Definition of done:** Workflow tested and scheduled in `.github/workflows/supabase-keepalive.yml`.
- **Estimate:** S

#### `[D-M2-01]` Optimize WebAssembly routing binary compilation pipeline in CI
- **Context:** Automates compilation and optimization of the Rust A* routing engine into the web bundle (`F-003`).
- **Scope:** GitHub Actions step installing Rust toolchain, `wasm-pack`, and `wasm-opt`, emitting optimized `.wasm` artifacts with gzip compression.
- **Acceptance criteria:**
  - WHEN compiled, THE SYSTEM SHALL produce a final `.wasm` file smaller than 250KB.
- **Traceability:** `F-003`
- **Dependencies:** `Blocked by [D-M0-04]`
- **Definition of done:** Build script output measured and verified in CI.
- **Estimate:** M

#### `[D-M2-02]` Setup OpenFreeMap tile endpoint proxy with edge caching headers
- **Context:** Protects OpenFreeMap tile performance by caching vector map tiles at the Cloudflare edge.
- **Scope:** Cloudflare Worker proxy route appending immutable `Cache-Control: public, max-age=604800, stale-while-revalidate=86400` headers.
- **Acceptance criteria:**
  - WHEN repeated tile requests occur, THE SYSTEM SHALL serve cached responses from edge POPs in Manila.
- **Traceability:** `F-001`, `F-003`
- **Dependencies:** `Blocked by [D-M0-03]`
- **Definition of done:** Response headers inspected and confirmed via curl.
- **Estimate:** S

#### `[D-M3-01]` BR-002 Setup GitHub Actions cron job for scheduled 180-day data freshness audit
- **Context:** Automates the recurring audit of verified records exceeding 180 days (`BR-002`).
- **Scope:** Daily GitHub Actions workflow calling the backend freshness audit endpoint and opening a GitHub issue if stale records are found.
- **Acceptance criteria:**
  - WHEN stale records are detected, THE SYSTEM SHALL automatically log an issue with the list of affected facilities.
- **Traceability:** `BR-002`
- **Dependencies:** `Blocked by [A-M3-02], [B-M1-03]`
- **Definition of done:** Workflow tested with simulated stale records.
- **Estimate:** S

#### `[D-M3-02]` Configure automated database backup export to Cloudflare R2 within free storage budget
- **Context:** Protects civic and spatial database assets against loss while remaining strictly within the free tier.
- **Scope:** Scheduled GitHub Actions job executing `pg_dump`, gzip compressing the export, and saving it to Cloudflare R2 with a 30-day retention purge.
- **Acceptance criteria:**
  - WHEN executed, THE SYSTEM SHALL generate an encrypted backup file under 50MB and upload to R2.
- **Traceability:** `Operations`, `Free Tier`
- **Dependencies:** `Blocked by [D-M1-01], [F-M0-01]`
- **Definition of done:** Backup and restore test run verified in local container.
- **Estimate:** M

#### `[D-MR-01]` Execute production environment deployment, DNS cutover rehearsal, and SSL verification
- **Context:** Final cloud infrastructure verification prior to public release.
- **Scope:** Custom domain configuration (`lunhaw.ph` or alternative), Cloudflare DNS proxying, SSL/TLS full encryption, and cutover dry run.
- **Acceptance criteria:**
  - WHEN accessed via production domain, THE SYSTEM SHALL serve HTTPS traffic with valid SSL certificate and A+ SSL Labs rating.
- **Traceability:** `Release`
- **Dependencies:** `Blocked by [D-M0-02], [D-M0-03]`
- **Definition of done:** Production URL responds with 200 OK across public internet.
- **Estimate:** M

#### `[D-MR-02]` PRD [TBD] Decision: Define long-term hosting, domain maintenance, and civic sponsorship model
- **Context:** Formally resolves PRD Open Question §12 regarding long-term hosting and maintenance funding model.
- **Scope:** Architectural policy document outlining civic tech partnerships, university hosting grants, or open-source community sponsorships to guarantee zero personal financial liability.
- **Acceptance criteria:**
  - THE TEAM SHALL establish a documented roadmap for ongoing domain renewal and civic stewardship.
- **Traceability:** `PRD Open Questions`
- **Dependencies:** `Blocked by [D-M0-05]`
- **Definition of done:** Policy approved and documented in `docs/decisions/ADR-004-funding-model.md`.
- **Estimate:** S

---

### Track E — QA & Release

#### `[E-M0-01]` Setup Vitest unit test harness and Playwright E2E testing framework
- **Context:** Establishes the automated testing foundation for unit, integration, and browser end-to-end tests.
- **Scope:** Vitest configuration in monorepo, Playwright setup with headless Chromium, standard viewport fixtures (Desktop 1280x720, Mobile 375x667).
- **Acceptance criteria:**
  - WHEN `npm test` and `npm run test:e2e` are invoked, THE SYSTEM SHALL execute test runners and output JUnit/HTML reports.
- **Traceability:** `QA Strategy`
- **Dependencies:** `Blocked by None`
- **Definition of done:** Baseline smoke tests passing in CI.
- **Estimate:** M

#### `[E-M0-02]` INV-003, TC-N03 Implement platform-neutral OpenAPI contract linting suite
- **Context:** Automated guardrail preventing platform-specific dependencies or non-standard JSON schemas from entering backend contracts (`INV-003`, `TC-N03`).
- **Scope:** Spectral linter ruleset validating OpenAPI 3.1 definitions for JSON RFC 8259 and GeoJSON RFC 7946 compliance.
- **Acceptance criteria:**
  - THE SYSTEM SHALL fail PR builds if any endpoint introduces client-specific parameters or non-standard payload structures.
- **Traceability:** `INV-003`, `TC-N03`
- **Dependencies:** `Blocked by [A-M0-01]`
- **Definition of done:** Spectral CLI check integrated into `npm run lint:api`.
- **Estimate:** S

#### `[E-M1-01]` F-001, TC-001 Implement integration tests for places search, filter, and 500ms latency target
- **Context:** Proves functional compliance of places search and verifies < 500ms query performance SLA (`F-001`, `TC-001`).
- **Scope:** Vitest integration tests against test PostGIS database querying across categories, amenity filters, and radius coordinates.
- **Acceptance criteria:**
  - WHEN search query is submitted, THE SYSTEM SHALL return matching places with valid integrity metadata in under 500ms.
- **Traceability:** `F-001`, `TC-001`
- **Dependencies:** `Blocked by [A-M1-02], [E-M0-01]`
- **Definition of done:** Automated test passing with performance timing assertion.
- **Estimate:** M

#### `[E-M1-02]` F-002, TC-002 Implement E2E test for library details, operating hours, and amenity chips
- **Context:** Proves user journey `UJ-001` for discovering study spaces with verified hours and amenities (`F-002`, `TC-002`).
- **Scope:** Playwright browser test navigating from explore list to reading center profile, checking study amenity chips (power outlets, Wi-Fi) and hours table.
- **Acceptance criteria:**
  - THE SYSTEM SHALL assert that amenity chips and operating hours render with visible integrity badges.
- **Traceability:** `F-002`, `TC-002`, `UJ-001`
- **Dependencies:** `Blocked by [C-M1-04], [E-M0-01]`
- **Definition of done:** Playwright E2E spec passing in CI.
- **Estimate:** M

#### `[E-M1-03]` F-006, BR-004, TC-006 Implement E2E test for graceful geolocation fallback to manual LGU selector
- **Context:** Proves user journey `UJ-003` and rule `BR-004` when geolocation permission is denied (`F-006`, `TC-006`).
- **Scope:** Playwright test configuring browser permissions context to `denied`, asserting that homepage opens manual LGU City/Barangay selector modal without crash.
- **Acceptance criteria:**
  - WHEN browser geolocation is denied, THE SYSTEM SHALL display the City and Barangay selector modal with all 17 LGUs available.
- **Traceability:** `F-006`, `BR-004`, `TC-006`, `UJ-003`
- **Dependencies:** `Blocked by [C-M1-01], [C-M1-02]`
- **Definition of done:** Playwright trace recording verified.
- **Estimate:** M

#### `[E-M1-04]` INV-002, TC-N02 Implement negative E2E test asserting persistent disclaimer banner across all facility views
- **Context:** Non-negotiable invariant guardrail test proving that the facility advisory disclaimer can never be hidden or omitted (`INV-002`, `TC-N02`).
- **Scope:** Playwright test iterating through all seeded facility profiles, asserting visibility of `#facility-disclaimer-banner` containing exact required copy.
- **Acceptance criteria:**
  - IF a facility profile is rendered, THE SYSTEM SHALL display the exact disclaimer text: "Please verify operating hours directly with the facility before traveling...".
- **Traceability:** `INV-002`, `TC-N02`, `BR-005`
- **Dependencies:** `Blocked by [C-M0-03], [C-M1-04]`
- **Definition of done:** Negative test fails if disclaimer is modified, hidden, or removed.
- **Estimate:** S

#### `[E-M1-05]` INV-001, TC-N01 Implement negative contract test verifying rejection of unlabelled civic attributes
- **Context:** Invariant guardrail test proving zero hallucination or unlabelled extrapolation of civic/transit data (`INV-001`, `TC-N01`).
- **Scope:** Integration test injecting synthetic incomplete records with missing hours or amenities, asserting the system renders `Not available yet` rather than fabricated values.
- **Acceptance criteria:**
  - THE SYSTEM SHALL NEVER output an operating hour, fare, or amenity without an explicit status equal to `VERIFIED`, `ESTIMATE`, or `NOT_AVAILABLE`.
- **Traceability:** `INV-001`, `TC-N01`, `BR-001`
- **Dependencies:** `Blocked by [A-M1-03], [F-M0-02]`
- **Definition of done:** Contract test passing in CI test suite.
- **Estimate:** S

#### `[E-M2-01]` F-003, TC-003 Implement route generation integration test with sequential legs and fare tags
- **Context:** Verifies commute route calculation correctness, sequential leg ordering, and fare transparency (`F-003`, `TC-003`, `UJ-002`).
- **Scope:** Vitest integration test submitting commute requests between sample Metro Manila coordinates, validating sequential legs, duration, and fare tags.
- **Acceptance criteria:**
  - WHEN a route is computed, THE SYSTEM SHALL return sequential walking and transit legs where each transit leg carries a tagged fare object.
- **Traceability:** `F-003`, `TC-003`, `UJ-002`
- **Dependencies:** `Blocked by [A-M2-02], [C-M2-03]`
- **Definition of done:** Multi-modal test journeys pass assertions.
- **Estimate:** M

#### `[E-M2-02]` F-004, TC-004 Implement unit tests for EQ-001 Green Index glass-box formula
- **Context:** Proves exact mathematical accuracy of the Green Index formula `EQ-001` (`F-004`, `TC-004`).
- **Scope:** Unit tests validating $Score = (0.50 \times C) + (0.30 \times V) + (0.20 \times P)$ across boundary conditions (0.00 to 100.00).
- **Acceptance criteria:**
  - WHEN inputs are provided (e.g. Canopy=40.0, NDVI=50.0, Permeable=30.0), THE SYSTEM SHALL output exactly 41.00 $\pm 0.01$.
- **Traceability:** `F-004`, `TC-004`, `EQ-001`
- **Dependencies:** `Blocked by [B-M2-02]`
- **Definition of done:** 100% code coverage on `green-index.ts` math module.
- **Estimate:** S

#### `[E-M2-03]` F-004 Implement unit tests for EQ-002 route shade index calculation
- **Context:** Verifies length-weighted canopy shade aggregation along multi-segment pedestrian routes (`F-004`, `EQ-002`).
- **Scope:** Unit tests testing length-weighted summation of segment canopy ratios $S_i$ over total distance.
- **Acceptance criteria:**
  - THE SYSTEM SHALL output shade scores strictly between 0.00 and 100.00 matching mathematical test vectors.
- **Traceability:** `F-004`, `EQ-002`
- **Dependencies:** `Blocked by [B-M2-03]`
- **Definition of done:** Unit tests passing with edge cases (zero length, 100% shade, 0% shade).
- **Estimate:** S

#### `[E-M2-04]` F-003 Implement unit tests for EQ-003 walking duration and EQ-004 fare derivation
- **Context:** Validates pedestrian walking duration modeling (4.2 km/h) and LTFRB PUV fare calculation equations (`F-003`, `EQ-003`, `EQ-004`).
- **Scope:** Unit tests validating walking time across distances and calculating traditional/modern jeepney and LRT/MRT fares.
- **Acceptance criteria:**
  - WHEN a 1.0 km walk is calculated, THE SYSTEM SHALL output duration 857 seconds ($\approx 14.3$ mins).
  - WHEN a 5.0 km jeepney ride is calculated, THE SYSTEM SHALL output fare based on base + km rate tagged `VERIFIED` or `ESTIMATE`.
- **Traceability:** `F-003`, `EQ-003`, `EQ-004`
- **Dependencies:** `Blocked by [B-M2-04]`
- **Definition of done:** Unit test assertions verified against official fare tables.
- **Estimate:** S

#### `[E-M3-01]` F-005, TC-005 Implement local storage persistence and session isolation tests
- **Context:** Proves saved places and trips persist in client browser storage across page reloads (`F-005`, `TC-005`).
- **Scope:** Playwright tests clicking bookmark actions, reloading the page, and asserting items remain present in the Saved drawer.
- **Acceptance criteria:**
  - WHEN a user reloads the application after bookmarking, THE SYSTEM SHALL retain all saved facilities and trips.
- **Traceability:** `F-005`, `TC-005`
- **Dependencies:** `Blocked by [C-M3-01]`
- **Definition of done:** E2E persistence spec passing in CI.
- **Estimate:** S

#### `[E-M3-02]` T-003 Execute privacy audit verifying zero coordinate persistence in logs and database
- **Context:** Security and compliance verification for Philippine Data Privacy Act (RA 10173) and threat `T-003`.
- **Scope:** Automated audit script submitting queries with unique test coordinates, querying database tables and log files to assert zero retention.
- **Acceptance criteria:**
  - THE SYSTEM SHALL prove 0 instances of user query coordinates stored in disk logs or database rows.
- **Traceability:** `T-003`, `RA 10173`
- **Dependencies:** `Blocked by [A-M0-03]`
- **Definition of done:** Audit report clean, signed off in QA test artifacts.
- **Estimate:** S

#### `[E-M3-03]` Conduct automated WCAG 2.1 AA accessibility audit with axe-core across all pages
- **Context:** Formal accessibility verification across all Lunhaw application views.
- **Scope:** Automated Playwright + `@axe-core/playwright` test sweeping Explore, Facility Profile, Route Planner, and Saved Places.
- **Acceptance criteria:**
  - THE SYSTEM SHALL report zero critical or serious WCAG 2.1 AA accessibility violations.
- **Traceability:** `Accessibility`, `Design System`
- **Dependencies:** `Blocked by [C-M3-03]`
- **Definition of done:** Axe accessibility report committed in `tests/reports/a11y-audit.json`.
- **Estimate:** M

#### `[E-MR-01]` Execute release rehearsal covering end-to-end user journeys UJ-001, UJ-002, and UJ-003
- **Context:** Pre-launch dry run asserting that all core user personas and journeys function flawlessly in the staging environment.
- **Scope:** Complete walkthrough: Mika discovering quiet reading center (`UJ-001`), Paolo planning shaded walking commute (`UJ-002`), and Maria using manual LGU fallback (`UJ-003`).
- **Acceptance criteria:**
  - All 3 user journeys SHALL execute end-to-end without console errors, visual regressions, or broken disclaimers.
- **Traceability:** `UJ-001`, `UJ-002`, `UJ-003`
- **Dependencies:** `Blocked by [E-M1-02], [E-M1-03], [E-M2-01]`
- **Definition of done:** Rehearsal test recording and checklist completed and signed off.
- **Estimate:** M

#### `[E-MR-02]` Complete production launch readiness checklist and sign-off
- **Context:** Final governance gate ensuring operational, legal, and financial readiness before public announcement.
- **Scope:** Verification of: 100% tests passing, zero monthly cloud costs ($0/mo), disclaimer present on 100% of facilities, rate limits active, and README documentation up-to-date.
- **Acceptance criteria:**
  - THE LEAD SHALL confirm all launch gate items are checked and verified.
- **Traceability:** `Launch Governance`
- **Dependencies:** `Blocked by [E-MR-01], [D-MR-01]`
- **Definition of done:** Launch sign-off document committed in `docs/launch-signoff.md`.
- **Estimate:** S

---

### Track F — Database & Data Model

#### `[F-M0-01]` Initialize Supabase PostgreSQL database with PostGIS spatial extension
- **Context:** Sets up the relational spatial database foundation using Supabase ($0/month free tier).
- **Scope:** Database initialization with `CREATE EXTENSION IF NOT EXISTS postgis;` and configuration of geographic SRID 4326.
- **Acceptance criteria:**
  - WHEN spatial query `SELECT ST_Version();` is executed, THE SYSTEM SHALL return valid PostGIS version information.
- **Traceability:** `Schema Skeleton`
- **Dependencies:** `Blocked by None`
- **Definition of done:** Migration committed in `supabase/migrations/00001_init_postgis.sql`.
- **Estimate:** S

#### `[F-M0-02]` BR-001, INV-001 Create verification_meta table with status enum and derivation note check constraint
- **Context:** Foundational schema entity enforcing radical data integrity and provenance for all civic and transit records (`BR-001`, `INV-001`).
- **Scope:** Table `verification_meta` with status enum (`VERIFIED`, `ESTIMATE`, `NOT_AVAILABLE`), source URL, auditor ID, and check constraint `chk_verification_derivation`.
- **Acceptance criteria:**
  - THE SYSTEM SHALL reject database inserts where `status = 'ESTIMATE'` and `derivation_note IS NULL`.
- **Traceability:** `BR-001`, `INV-001`
- **Dependencies:** `Blocked by [F-M0-01]`
- **Definition of done:** Migration file committed and verified with negative SQL insert tests.
- **Estimate:** S

#### `[F-M0-03]` F-001 Create places table with spatial geography point, boundary geometry, and FK to verification_meta
- **Context:** Core spatial entity storing public parks, gardens, reading centers, and civic spaces (`F-001`).
- **Scope:** Table `places` with columns `id`, `name`, `category`, `lgu_city`, `barangay`, `address`, `coordinates` (GEOGRAPHY(Point, 4326)), `boundary_geojson`, and FK `verification_id`.
- **Acceptance criteria:**
  - THE SYSTEM SHALL require a valid `verification_id` foreign key for every inserted place record.
- **Traceability:** `F-001`, `BR-001`
- **Dependencies:** `Blocked by [F-M0-02]`
- **Definition of done:** Schema migration committed, foreign key constraints active.
- **Estimate:** M

#### `[F-M0-04]` F-002 Create library_details and operating_hours tables with integrity constraints
- **Context:** Stores study-specific facility amenities (power outlets, Wi-Fi, desk capacity) and weekly schedules (`F-002`, `INV-001`).
- **Scope:** Tables `library_details` (extends `places`) and `operating_hours` (one-to-many schedules, days 0-6, open/close times, FK to `verification_meta`).
- **Acceptance criteria:**
  - THE SYSTEM SHALL link each operating schedule row to a valid verification metadata record.
- **Traceability:** `F-002`, `BR-001`, `INV-001`
- **Dependencies:** `Blocked by [F-M0-03]`
- **Definition of done:** Migration committed with foreign keys and cascade delete rules.
- **Estimate:** M

#### `[F-M0-05]` F-004 Create green_index_metrics table with 0-100 score check constraint
- **Context:** Stores calculated canopy coverage and Green Index metrics linked to places and neighborhoods (`F-004`, `BR-003`).
- **Scope:** Table `green_index_metrics` with `total_score`, `canopy_cover_pct`, `measured_data_source`, and check constraint `chk_green_score_bounds (total_score BETWEEN 0.0 AND 100.0)`.
- **Acceptance criteria:**
  - THE SYSTEM SHALL reject scores outside the range 0.00 to 100.00.
- **Traceability:** `F-004`, `BR-003`
- **Dependencies:** `Blocked by [F-M0-03]`
- **Definition of done:** Migration committed and tested with out-of-bound insert assertions.
- **Estimate:** S

#### `[F-M0-06]` Setup database migration tooling and local seed scripts
- **Context:** Ensures reliable, version-controlled database migrations across local Docker Compose and remote Supabase environments.
- **Scope:** Supabase CLI configuration, migration runner scripts, and seed data execution scripts.
- **Acceptance criteria:**
  - WHEN `supabase db reset` is executed, THE SYSTEM SHALL reapply all migrations and seeds cleanly.
- **Traceability:** `Tooling`
- **Dependencies:** `Blocked by [F-M0-01], [D-M0-01]`
- **Definition of done:** Migration commands documented in README and verified locally.
- **Estimate:** S

#### `[F-M1-01]` F-006 Create lgu_regions and barangays tables and seed 17 Metro Manila LGUs
- **Context:** Stores the authoritative administrative boundary hierarchy for manual location discovery (`F-006`, `BR-004`).
- **Scope:** Tables `lgu_regions` and `barangays` seeded with all 17 Metro Manila LGUs (Manila, Quezon City, Pasig, Makati, etc.) and their barangays.
- **Acceptance criteria:**
  - WHEN queried, THE SYSTEM SHALL return all 17 LGUs and their verified barangay names.
- **Traceability:** `F-006`, `BR-004`
- **Dependencies:** `Blocked by [F-M0-01]`
- **Definition of done:** Seed migration verified containing all 17 LGU entities.
- **Estimate:** M

#### `[F-M1-02]` Create spatial GiST index on places.coordinates and compound B-tree index on (lgu_city, barangay)
- **Context:** Guarantees sub-500ms database performance for spatial radius queries and manual area lookups.
- **Scope:** Index creation: `CREATE INDEX idx_places_coordinates ON places USING GIST (coordinates);` and `CREATE INDEX idx_places_lgu_barangay ON places (lgu_city, barangay);`.
- **Acceptance criteria:**
  - WHEN spatial query `EXPLAIN ANALYZE SELECT ... WHERE ST_DWithin(...)` is run, THE SYSTEM SHALL utilize index scan with execution under 10ms.
- **Traceability:** `F-001`, `F-006`, `Performance`
- **Dependencies:** `Blocked by [F-M0-03], [F-M1-01]`
- **Definition of done:** Query execution plan output committed in migration documentation.
- **Estimate:** S

#### `[F-M1-03]` Configure Row Level Security (RLS) policies for public read access on places and libraries
- **Context:** Secures Supabase PostgreSQL instance, granting public unauthenticated read access while strictly blocking unauthorized writes.
- **Scope:** RLS policies enabling `SELECT` for role `anon` and `authenticated` on public civic tables; restricting `INSERT`, `UPDATE`, `DELETE` to role `service_role`.
- **Acceptance criteria:**
  - WHEN an unauthenticated user attempts to mutate a place record, THE SYSTEM SHALL reject the operation with an RLS permission error.
- **Traceability:** `Security`, `INV-003`
- **Dependencies:** `Blocked by [F-M0-03], [F-M0-04]`
- **Definition of done:** RLS policies tested using anon key via Supabase client.
- **Estimate:** S

#### `[F-M1-04]` Develop baseline seed migration with verified NCR parks and municipal libraries
- **Context:** Provides realistic, verified seed data for development, testing, and public MVP exploration (`F-001`, `F-002`).
- **Scope:** Seed data populating major NCR parks (Rizal Park, Paco Park, Arroceros, QC Memorial Circle, Marikina River Park) and public libraries with verified hours.
- **Acceptance criteria:**
  - All seeded facilities SHALL possess valid coordinates, verified operating hours, and valid `verification_meta` links.
- **Traceability:** `F-001`, `F-002`, `BR-001`
- **Dependencies:** `Blocked by [F-M0-03], [F-M0-04], [B-M1-02]`
- **Definition of done:** Seed SQL script executed and verified in test database.
- **Estimate:** M

#### `[F-M2-01]` F-003 Create transit_routes, transit_stops, and route_legs tables
- **Context:** Relational data model for public transit lines, stations, and route legs (`F-003`).
- **Scope:** Tables `transit_routes`, `transit_stops`, and `route_legs` with spatial coordinates, line geometries, transit modes (`walk`, `jeepney`, `bus`, `lrt_mrt`), and fare references.
- **Acceptance criteria:**
  - THE SYSTEM SHALL represent transit routes with sequential legs and spatial stop nodes.
- **Traceability:** `F-003`, `INV-001`
- **Dependencies:** `Blocked by [F-M0-02]`
- **Definition of done:** Schema migration committed with spatial indexes on `transit_stops.coordinates`.
- **Estimate:** M

#### `[F-M2-02]` F-003 Seed baseline LTFRB transit routes and MRT/LRT rail line station nodes
- **Context:** Populates the core transit graph for Metro Manila rail and major bus/jeepney corridors (`F-003`, `DS-003`).
- **Scope:** Seed records for MRT-3, LRT-1, LRT-2 stations, EDSA Busway stops, and major traditional jeepney routes with official fare matrices.
- **Acceptance criteria:**
  - All transit stops SHALL have verified coordinates and official fare citations.
- **Traceability:** `F-003`, `DS-003`
- **Dependencies:** `Blocked by [F-M2-01], [B-M2-04]`
- **Definition of done:** Seed SQL verified and loaded into test database.
- **Estimate:** M

#### `[F-M2-03]` F-004 Seed precomputed Green Index scores and canopy metrics for NCR barangays
- **Context:** Populates baseline environmental metrics and canopy scores across Metro Manila public spaces (`F-004`, `BR-003`).
- **Scope:** Seed records in `green_index_metrics` computed from Sentinel-2 satellite data and equation `EQ-001`.
- **Acceptance criteria:**
  - Every seeded civic space SHALL link to a Green Index score with canopy coverage % and calculation method note.
- **Traceability:** `F-004`, `BR-003`, `EQ-001`
- **Dependencies:** `Blocked by [F-M0-05], [B-M2-02]`
- **Definition of done:** Precomputed scores verified and seeded.
- **Estimate:** M

#### `[F-M3-01]` F-005 Create saved_items and user_profiles tables with RLS user isolation
- **Context:** Schema supporting optional authenticated user bookmark synchronization across devices (`F-005`).
- **Scope:** Tables `saved_items` (user_id FK, place_id FK, route_id FK) and `user_profiles` with RLS policies restricting data access strictly to `auth.uid() = user_id`.
- **Acceptance criteria:**
  - THE SYSTEM SHALL strictly prevent any user from reading or mutating another user's saved items.
- **Traceability:** `F-005`, `Security`
- **Dependencies:** `Blocked by [F-M0-03]`
- **Definition of done:** RLS user isolation verified with multi-user test tokens.
- **Estimate:** M

#### `[F-M3-02]` Establish database storage size budget plan to ensure staying within Supabase 500MB free tier
- **Context:** Enforces long-term operation on Supabase's 500MB free database tier without risking sudden quota overages or charges.
- **Scope:** Database sizing plan documenting byte allocations per table, index bloat control, vacuum schedules, and monitoring queries.
- **Acceptance criteria:**
  - THE SIZING MODEL SHALL demonstrate that the full MVP dataset (places, schedules, transit graph) consumes less than 150MB (<30% of free tier).
- **Traceability:** `Cost Governance`, `Free Tier`
- **Dependencies:** `Blocked by [F-M1-04], [F-M2-02]`
- **Definition of done:** Sizing budget document committed in `docs/DATABASE_SIZE_BUDGET.md`.
- **Estimate:** S

---

## 5. Decision Issues (`type:decision`) for PRD Open Items

| Code | Title | PRD Section | Issue Type | Milestone | Summary |
|---|---|---|---|---|---|
| **[D-M0-06]** | PRD [TBD] Decision: Confirm production backend runtime and database hosting architecture on $0/month stack | PRD §12 (Tech Stack) | `type:decision` | M0 | Formally baseline Cloudflare Workers + Supabase PostGIS free tier vs VPS |
| **[B-M1-04]** | PRD [TBD] Decision: Establish data licensing terms and update cadence with 17 NCR LGUs | PRD §12 (Data Licensing) | `type:decision` | M1 | Define ODbL/CC-BY license protocols and annual verification cadence |
| **[C-M4-01]** | PRD [TBD] Decision: Evaluate and select Phase 2 mobile application framework (React Native vs Flutter vs PWA) | PRD §12 (Mobile Framework) | `type:decision` | M4 | Compare React Native vs Flutter vs PWA for Phase 2 mobile app |
| **[D-MR-02]** | PRD [TBD] Decision: Define long-term hosting, domain maintenance, and civic sponsorship model | PRD §12 (Funding Model) | `type:decision` | MR | Establish civic sponsorship / academic grant model for domain renewals |

---

## 6. Execution Roadmap & Next Steps

1. **Review & Approval:** User reviews `ISSUE_PLAN.md` and provides GitHub Project details (Owner + Project Number).
2. **Label & Milestone Creation:** Programmatically create all 6 milestones and 21 standard labels via GitHub CLI (`gh`).
3. **Idempotent Issue Generation:** Check for existing issues by code (`code:<CODE>`), creating each issue with title, labels, milestone, and standardized markdown body.
4. **Project Association:** Add all created issues to the designated GitHub Project and populate custom fields (Track, Milestone, Priority, Estimate).
5. **Dependency Cross-Referencing:** Execute a second pass updating `Blocked by [CODE]` placeholders with real GitHub issue numbers (`Blocked by #<n>`).
6. **Documentation Ledger:** Generate `docs/ISSUE_CODES.md` with complete issue reference table.
