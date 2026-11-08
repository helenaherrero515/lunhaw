# Decision Ledger — Lunhaw

> **What this is.** One append-only, trunk-only record of pivots, rejected approaches, naming decisions, significant choices, and the assumptions/evidence behind those choices. It preserves decision history so a human or agent does not re-derive it from chats. It does **not** override the PRD, system design, QA plan, or implementation plan.
> **Last reconciled:** 2026-11-01

## 1. Names & immutable identifiers (read first)

| Name / ID | Kind | Where it appears | Rule |
|---|---|---|---|
| `Lunhaw` | Public product name | UI, pitch, headers, README | **Immutable.** Cebuano/Bisaya for "green/lush"; do not alter. |
| `"Discover your space. Explore your city. Go greener."` | Official Tagline | Landing page, meta tags, headers | Canonical brand tagline. |
| `Grasshopper` | Official Mascot | Brand assets, UI empty states, illustrations | Symbolic of agility, natural greenery, and urban jumping. |
| `INV-001` | **IMMUTABLE Rule ID** | PRD, Threat Model, Design System, QA | Data Integrity Tri-State: `Verified`, `Estimate`, or `Not available yet`. Never fabricate transit, hours, or amenities. |
| `INV-002` | **IMMUTABLE Rule ID** | PRD, UI Specs, QA | Mandatory disclaimer on facility listings: check with facility before traveling. |
| `INV-003` | **IMMUTABLE Rule ID** | System Design, API Spec, Data Model | Platform-neutral schema and contract shared by Web (Phase 1) and Mobile (Phase 2). |
| `#98D746` | Brand Token: Lime | UI accents, badges, highlights | Primary accent color. |
| `#245C43` | Brand Token: Forest Green | UI primary buttons, headers, brand text | Primary anchor color. |
| `#B7F9ED` | Brand Token: Mint | Card backgrounds, subtle fills, borders | Secondary soft color. |
| `#F7F7F0` | Brand Token: Off-White | Page background, card surfaces | Primary light background. |
| `MedievalSharp` | Font Token: Display | Wordmark, display titles | Primary display font. |
| `Kufam` | Font Token: UI | Body copy, buttons, labels, tables | Primary interface and readability font. |

## 2. Decision assumptions & evidence (confidence, not a product spec)

| SUPPORTED (decision context backed by events) | PROVISIONAL (accepted, not yet verified end-to-end) | UNVALIDATED (do not state as fact) |
|---|---|---|
| Students in NCR struggle to find free, quiet study spaces with power/Wi-Fi and often pay for commercial cafés. | The 3-tier integrity label (`Verified`, `Estimate`, `Not available yet`) builds stronger long-term user trust than speculative auto-filling. | Long-term operational data licensing and updates can be maintained across all 17 NCR LGUs without dedicated paid staff. `[TBD]` |
| Civic and green space data in NCR is severely fragmented across unlinked municipal and barangay channels. | OpenStreetMap (OSM) and open satellite canopy data are sufficient to compute baseline Green Index and shade scores for Metro Manila. | Native mobile apps (Phase 2) are required for core user retention vs. an installable Progressive Web App (PWA). `[TBD]` |
| Generic navigation apps omit barangay reading centers and misstate operating hours. | A platform-neutral API will cleanly support both web frontend and future native iOS/Android clients without breaking changes. | Commercial viability or public sponsorship model for sustained maintenance. `[TBD]` |

## 3. Pivots & decisions (newest first, append at top)

### 2026-11-08 — Public release 1.0: honest data, real wiring, legal pages
- **What changed:** Prepared the web app for public release ([RELEASE.md](RELEASE.md)).
  - **Data:** earlier seeds marked records `VERIFIED` by automated tooling with no human check. Migration `00014` replaces them with 26 places (19 libraries, 7 parks/gardens) whose locations are `ESTIMATE`. Hours, amenities and Green Index are not published. No record may be `VERIFIED` without a named person, date and source ([verification-worksheet.csv](verification-worksheet.csv)).
  - **Held back:** all 17 barangay reading centers, because their existence and several cited sources could not be confirmed.
  - **Wiring:** `/home` reads the live directory through the API; the API reads Supabase and refuses to serve fixtures in production.
  - **Hosting:** the site ships as a Next.js static export on Cloudflare Pages.
  - **Retired:** `/explore` (prototype with hardcoded data) now redirects to `/home`.
  - **Accounts and newsletter:** the mock login runs in development only; the newsletter stores consented sign-ups in Supabase.
  - **Legal:** Privacy Notice and Terms published, operator HLN.
  - **Disclaimer wording:** the PRD's `INV-002` text now matches the wording implemented and tested everywhere ("…before traveling…"); it had never shipped in its earlier form.
- **Pivot type:** Release / Data integrity.
- **Why:** `INV-001` is the product's core promise; publishing machine-asserted "Verified" data, or places that may not exist, would break it on day one.
- **Accepted, revisit:** `/home` requires an account (decided in PRs #96–98). This diverges from [system-design.md](system-design.md)'s original open-access trade-off; tracked as an open question in the PRD.
- **Rejected approaches:**
  1. *Ship the agent-verified dataset as-is:* rejected (`INV-001`).
  2. *Label unconfirmed hours as Estimate:* rejected. An estimate of unconfirmed values is still invention.
  3. *Fall back to fixtures if the database is down:* rejected; the API returns 503 instead of serving stale or fake data.

### 2026-11-03 — ADR-003: Selection of React Native (Expo) for Phase 2 Mobile Application (C-M4-01)
- **What changed:** Evaluated React Native (Expo) vs Flutter vs Progressive Web App (PWA) across monorepo code reuse, $0/month maintenance, offline vector map performance, and low-end Android responsiveness. Formally selected React Native with Expo (SDK 52+ with Fabric/TurboModules).
- **Pivot type:** Architecture / Mobile Framework Selection.
- **From → To:** Unresolved PRD §12 open question on mobile framework → Canonical selection of React Native (Expo) sharing 85%+ TypeScript math models and schemas.
- **Why:** Enables 100% direct code reuse of pure-math engines (EQ-001 Green Index, EQ-002 Shade, EQ-003 Walking Duration, EQ-004 LTFRB Fare Matrix) and Zod guardrails, native hardware-accelerated OpenFreeMap vector tile rendering, free EAS/GitHub Actions build pipelines, and prevents code divergence.
- **Rejected approaches:**
  1. *Flutter (Google):* Rejected due to zero code reuse, requiring duplicate mathematical reimplementations in Dart and high ongoing synchronization risk.
  2. *Progressive Web App (PWA) only:* Rejected due to severe iOS Safari background cache evictions, WebGL memory constraints on mobile browsers, and lack of native haptic/touch physics.

### 2026-11-03 — ADR-002: LGU Civic Data Licensing, FOI Framework & Multi-Tier Cadence (B-M1-04)
- **What changed:** Established open data licensing terms (ODbL 1.0 / CC-BY 4.0 Collective Database doctrine), standardized eFOI request protocol under EO No. 2, s. 2016, and stratified all 17 NCR LGUs into 3 update cadence tiers (Tier A: 90 days, Tier B: 180 days, Tier C: 360 days) with automated 180-day freshness auditing (`BR-002`).
- **Pivot type:** Governance / Data Licensing & Intake Architecture.
- **From → To:** Unresolved open questions regarding LGU data licensing (`PRD §12`) → Formal Collective Database legal separation and multi-tier cadence policy.
- **Why:** Protects civic directory from ODbL viral copyleft contamination, ensures students never encounter stale closed reading centers (`INV-001`), and maintains operations within a sustainable $0/month maintainer workload.
- **Rejected approaches:**
  1. *Negotiating bilateral MOAs with all 17 LGUs prior to launch:* Rejected due to 12-24 month bureaucratic paralysis across city councils.
  2. *Unilateral scraping and AI hour prediction:* Rejected due to severe hallucination risks and violation of Invariant `INV-001`.

### 2026-11-01 — Initial Architecture & Product Specification
- **What changed:** Baselined project intake from context brief. Formally declared core modules (Explore, Commute, Green Index, Libraries, Saved), two-phase deployment (Web Phase 1 &rarr; Mobile Phase 2), and non-negotiable data-integrity principles (`INV-001`, `INV-002`, `INV-003`).
- **Pivot type:** Inception / Foundation.
- **From &rarr; To:** Conceptual idea &rarr; Formal FMD documentation suite.
- **Why:** Establish a single source of truth preventing drift across PRD, API specs, data models, and QA verification.
- **Rejected approaches:**
  1. *Scraping and auto-predicting operating hours using probabilistic ML:* Rejected due to severe risk of sending students to closed barangay centers (violates `INV-001`).
  2. *Single combined web-only architecture:* Rejected in favor of a platform-neutral API service so mobile clients in Phase 2 can consume identical models and business rules (`INV-003`).
