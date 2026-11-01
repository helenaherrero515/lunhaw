---
status: draft
schema_version: 2.1.0
origin: "Lunhaw Project Context"
payer_status: none-found
---

# Idea: Lunhaw

## 1. Problem statement
In Metro Manila (NCR), everyday life collapses into an exhausting loop of work or school, congested traffic, domestic errands, and home. While pocket parks, quiet public corners, municipal libraries, and barangay reading centers exist within neighborhoods, they are practically invisible to the public. Critical facility information—such as true operating hours, admission rules, and study amenities—is fragmented across obsolete government notices, local social media pages, and word-of-mouth. Consequently, urban residents remain isolated from nearby civic green spaces, and accessible public study centers feel deceptively far away.

## 2. Target segment
- **Tertiary and secondary students in NCR:** Seeking quiet, free, and safe spaces to study, read, and collaborate away from expensive commercial cafés.
- **Urban commuters and daily walkers:** Pedestrians looking for shaded, walkable pathways and clear multi-modal public transit routes.
- **Families and neighborhood residents:** Local residents seeking weekend recreation, greenery, and outdoor public spaces for physical and mental well-being.
- **Transit-dependent commuters:** Commuters relying on Metro Manila's complex transit network (jeepneys, buses, EDSA Carousel, LRT/MRT, and walking) who need reliable route guidance without fabricated times or fares.
- **Personas:** `[TBD: add personas]`

## 3. Evidence
- Urban density in Metro Manila exceeds 21,000 people per square kilometer, yet accessible public open green space is estimated below 1–2 square meters per capita across most LGUs.
- Students frequently pay 150–300 PHP per session in commercial study hubs or co-working cafés due to unawareness of nearby barangay reading centers or public libraries.
- Standard consumer map services frequently list outdated or nonexistent hours for government civic facilities in NCR.

The four tests:

| Test | Pass / Fail | Why |
|---|---|---|
| Real | Pass | Metro Manila residents actively suffer from park scarcity, extreme heat islands, and lack of free study areas. |
| Large | Pass | NCR has over 13.4 million residents across 16 cities and 1 municipality, with millions of students and daily commuters. |
| Significant | Pass | Urban green exposure directly affects mental health, heat resilience, and student academic success. |
| Urgent | Pass | Accelerating climate heat in NCR and transit fare volatility make shaded paths and verified free public spaces critical. |

## 4. Root cause (the WHY)
1. *Why are public spaces hard to find?* Information is not aggregated in one searchable platform; each LGU and barangay publishes updates independently on fragmented channels.
2. *Why isn't it aggregated on commercial maps?* Google Maps and Apple Maps rely heavily on automated scraping and crowdsourcing that misses small barangay reading centers, municipal pocket parks, and local transit boarding nodes.
3. *Why do existing transit apps fall short?* Metro Manila's informal transit (jeepneys, UV Express, tricycles) lacks GTFS feeds; apps often approximate routes with false precision or hallucinate fixed schedules.
4. *Why are green-space metrics unavailable?* Environmental and urban forestry data is locked in academic research or municipal planning PDFs rather than delivered as actionable shade guidance for pedestrians.
5. *Root Cause:* Absence of a dedicated, civic-focused open data platform built specifically for NCR's micro-geography that honors data transparency rather than speculative completion.

## 5. Market & alternatives
- **Size band:** Millions (Metro Manila commuter and student population) — *Philippine Statistics Authority (PSA)*
- **Reachability:** University belts (Manila U-Belt, Katipunan, Intramuros, Taft), public transit hubs (EDSA MRT/LRT interchanges), local community youth councils (Sangguniang Kabataan).
- **Top alternatives + key gaps:**
  1. *Google Maps / Apple Maps:* Fails to index barangay reading centers, lacks shade scoring, and frequently displays inaccurate opening hours for local civic facilities.
  2. *Sakay.ph:* Strong for transit routing, but does not index civic parks, green shade metrics, or public study facilities.
  3. *LGU & Barangay Facebook Pages:* Highly fragmented, unsearchable, unstructured, and buried under administrative announcements.

## 6. Value proposition
For **Metro Manila students, commuters, and residents** who **struggle to find accessible civic spaces and shaded transit routes**, Lunhaw is a **public-spaces and green-mobility platform** that **empowers citizens to discover verified parks, libraries, and walkable routes with transparent green scores**, unlike **generic navigation tools and commercial map apps**, because **Lunhaw never invents missing information, explicitly separates measured data from estimates, and spotlights hidden barangay facilities**.

## 7. Feature set

### MVP — Smallest path to core value
- **F-001 — Explore Directory & Map Previews:** Discover parks, gardens, civic plazas, libraries, and reading centers with search, categorical filters, and interactive map previews. &rarr; *Solves discovery fragmentation.*
- **F-002 — Public Libraries & Barangay Reading Centers Directory:** Comprehensive profiles including services, study desk availability, electrical outlets, air conditioning/ventilation, access requirements (e.g. valid IDs), and verified operating hours. &rarr; *Solves lack of free study spaces for students.*
- **F-003 — Commute & Walking Route Planner:** Step-by-step guidance combining walking and supported public transit (jeepney, bus, rail), with boarding/alighting points, transfer directions, and transparent travel estimates. &rarr; *Solves transit unpredictability and heat exposure.*
- **F-004 — Green Index & Shade Calculator:** Neighborhood and route green-space density and canopy shade score, separating measured canopy data from algorithmic approximations with glass-box formulas. &rarr; *Solves urban heat island navigation.*
- **F-005 — Saved Places & Trips:** User bookmarking for favorite study spots, parks, and frequent commute journeys. &rarr; *Solves daily navigation convenience.*
- **F-006 — Manual Area Entry Fallback:** Explicit location selection by City and Barangay when browser/device geolocation is disabled or unavailable. &rarr; *Solves accessibility without location tracking.*

### Final product — Full vision
- **F-101 — Native Mobile App (iOS / Android):** Unified mobile experience sharing the platform-neutral backend API.
- **F-102 — Community Verification & Audit Workflow:** Citizen contribution portal for reporting facility schedule changes, temporary closures, and amenity updates with moderator verification.
- **F-103 — Offline Route & Facility Caching:** Local SQLite/IndexedDB caching allowing commuters to access saved journeys and facility guides in low-connectivity areas.

## 8. Success metrics
- **Activation:** 60% of first-time visitors complete a search and view at least one facility detail card or commute route within 60 seconds.
- **Retention:** 35% 30-day returning users for study space and commute route lookups.
- **Data Integrity Rate:** 100% compliance with labelling standards—0% unverified data presented as fact; 100% of data points carry `Verified`, `Estimate`, or `Not available yet`.

## 9. Constraints, risks & kill criteria
- **Single riskiest assumption:** Public library and barangay reading center operating hours and amenity data can be verified and kept fresh across Metro Manila's 17 LGUs.

**Kill criteria:**
- *Regulatory:* If municipal data licensing or LGU agreements impose prohibitive liabilities or access restrictions.
- *Unit economics:* If cloud map tile and geocoding transit costs exceed free civic operational budgets `[TBD]`.
- *Technical:* If routing and green index calculations cannot run performantly on standard mobile web browsers without battery-draining client calculations.

**Invariants (`INV-###`) — Non-negotiable product rules:**
- **INV-001 (Zero Hallucination of Civic Data):** The system SHALL NEVER invent, hallucinate, or unreliably extrapolate routes, transit fares, operating hours, or facility amenities. Every displayed detail MUST carry one of three labels: `Verified` (with official source and timestamp), `Estimate` (with transparent derivation note), or `Not available yet`.
- **INV-002 (Mandatory Facility Verification Disclaimer):** Every facility detail view SHALL display a persistent disclaimer advising users to confirm with the institution prior to travel.
- **INV-003 (Platform-Neutral Core):** Domain models, business rules, and API contracts SHALL remain strictly platform-neutral and decoupled from client-specific presentation logic.

## 10. Out of scope (for now)
- Commercial retail advertising, sponsored café placements, and paid venue listings.
- Real-time GPS bus/jeepney tracking (requires dedicated transit hardware not currently available across NCR fleets).
- Booking fees, ticket purchases, or on-platform commercial monetary transactions.
- Social networking feeds, user-to-user private messaging, or open unmoderated comment boards.
