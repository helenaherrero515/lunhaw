# Security & Compliance / Threat Model — Lunhaw

> **Purpose:** Risk assessment, STRIDE threat model, location privacy standards, and regulatory compliance (Philippine Data Privacy Act).
> Traces back to: [prd.md](prd.md), [system-design.md](system-design.md), [data-model.md](data-model.md). Traces forward to: [qa-test-plan.md](qa-test-plan.md).

## Data classification

| Data Category | Examples | Storage Location | Protection & Controls |
|---|---|---|---|
| **Public Data** | Parks, reading centers, operating hours, Green Index scores, transit lines. | PostgreSQL public read replicas, Redis cache. | Public read-only; writes restricted to verified admin/audit pipeline. |
| **User Geolocation (Sensitive)** | Lat/Lng coordinates submitted for radius search. | Transient in-memory only. | **Never logged to disk or persisted in database.** Ephemeral processing. |
| **Saved Items (Pseudonymous)** | Bookmarked places and saved commute routes. | Browser localStorage; backend tagged by ephemeral session token. | Isolated per session; auto-purged after 90 days idle. |
| **Secrets & Keys** | Database credentials, API Gateway secrets, JWT signing keys. | Secret Manager / Environment variables. | Injected at runtime; never committed to Git. |

## Authn / authz model
- **Public API Surface:** Public endpoints (`/places`, `/commute/routes`, `/locations/areas`) require no user authentication. Read operations are rate-limited by IP address.
- **Admin / Data Moderation Pipeline:** Restricted to authorized civic curators using OAuth 2.0 / JWT tokens with role-based access control (`ROLE_MODERATOR`, `ROLE_ADMIN`).

## Threat model (STRIDE)

| T-ID | Threat (STRIDE) | Vector | Impact | Mitigation | Enforces |
|---|---|---|---|---|---|
| **T-001** | **Tampering / Information Poisoning** | Malicious injection or scraping of incorrect operating hours or transit fares. | Students travel to closed facilities; commuters pay unexpected fares. | Strict database schema constraint: every record requires a valid `verification_id` linking to an official source or estimate note. Unverified fields default to `NOT_AVAILABLE`. | `INV-001`, `BR-001` |
| **T-002** | **Repudiation / Disclaimer Bypass** | Client modifies UI to hide the facility advisory disclaimer. | User blames Lunhaw if a barangay reading center is unexpectedly locked. | Disclaimer is injected directly into server API payloads (`API-002`); contract test verifies mandatory disclaimer rendering. | `INV-002` |
| **T-003** | **Information Disclosure (User Tracking)** | Server logs storing GPS query coordinates, enabling movement tracking. | Violation of user privacy; physical safety exposure. | Web server log sanitization regex strips `lat` and `lng` query params from access logs; reverse proxy enforces coordinate zero-retention. | PH DPA (RA 10173) |
| **T-004** | **Denial of Service (DoS)** | Attacker floods routing engine with complex multi-modal transit calculations. | Commute service degrades for real users. | Token bucket rate limiting (60 req/min per IP); routing query bounding box clamped to maximum 25 km distance. | Service Reliability |
| **T-005** | **Elevation of Privilege** | Unauthenticated user calls admin API to toggle verification status to `VERIFIED`. | Malicious verification of false data. | Admin routes gated behind JWT bearer token validation; mutations logged to immutable audit trail. | `BR-001` |

## Abuse & safety-specific risks (ethical)

| Risk | Who is Harmed | Trigger | Guard (`INV-###` / Mitigation) |
|---|---|---|---|
| **Nighttime Stranding** | Students visiting unfamiliar barangays for study. | User arrives after dark finding the reading center closed. | `INV-001` & `INV-002`: System labels hours as unverified if older than 180 days; prompts warning banner for late evening arrivals. |
| **Severe Heat Stroke Exposure** | Pedestrians walking during extreme NCR heat index warnings (> 42°C). | User chooses walking commute during peak midday sun. | Commute engine surfaces extreme heat advisory banner and flags unshaded segments; advises hydration and public transit. |
| **Dangerous Pedestrian Routing** | Walkers guided through active expressways or hazardous flyovers. | Generic shortest-path routing algorithm. | Pedestrian network strictly filters out expressways (e.g. Skyway, EDSA vehicle-only underpasses); only paths with verified sidewalks are routed. |

## Compliance obligations

### Philippine Data Privacy Act of 2012 (Republic Act No. 10173)
- **Principle of Proportionality:** Lunhaw collects only the minimum data required to render search results.
- **No Compulsory Geolocation:** If users decline GPS permissions, Lunhaw provides full functionality through Manual Area Entry (`F-006`).
- **No Third-Party Ad Trackers:** No third-party behavioral analytics, pixel trackers, or advertising SDKs are embedded in the client applications.

## Secrets handling
- Secrets (DB connection strings, API tokens) reside in `.env.local` during local development (gitignored) and are injected via cloud secret managers in staging/production.
- Zero secrets committed to the repository.

## Audit & logging
- **Logged:** API endpoint latency, HTTP status codes, error stack traces (with sanitized parameters), and admin verification events.
- **FORBIDDEN from Logs:** User IP-paired GPS coordinates, exact street addresses searched, or private user bookmarks.

## Pre-milestone hard-gate checklist
- [ ] Every network-exposed write endpoint requires cryptographic authentication. — 2026-11-01
- [ ] No secrets or API credentials committed in the repository. — 2026-11-01
- [ ] Invariant `INV-001` verified: 0 unverified records rendered without explicit status tag. — 2026-11-01
- [ ] Invariant `INV-002` verified: Facility advisory disclaimer rendered across all place profiles. — 2026-11-01
- [ ] Invariant `INV-003` verified: API contracts remain platform-neutral. — 2026-11-01
