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

### 2026-11-01 — Initial Architecture & Product Specification
- **What changed:** Baselined project intake from context brief. Formally declared core modules (Explore, Commute, Green Index, Libraries, Saved), two-phase deployment (Web Phase 1 &rarr; Mobile Phase 2), and non-negotiable data-integrity principles (`INV-001`, `INV-002`, `INV-003`).
- **Pivot type:** Inception / Foundation.
- **From &rarr; To:** Conceptual idea &rarr; Formal FMD documentation suite.
- **Why:** Establish a single source of truth preventing drift across PRD, API specs, data models, and QA verification.
- **Rejected approaches:**
  1. *Scraping and auto-predicting operating hours using probabilistic ML:* Rejected due to severe risk of sending students to closed barangay centers (violates `INV-001`).
  2. *Single combined web-only architecture:* Rejected in favor of a platform-neutral API service so mobile clients in Phase 2 can consume identical models and business rules (`INV-003`).
