# Security & Compliance / Threat Model — Lunhaw

> **Purpose:** Risk assessment, STRIDE threat model, location privacy standards, and regulatory compliance (Philippine Data Privacy Act).
> Traces back to: [prd.md](prd.md), [system-design.md](system-design.md), [data-model.md](data-model.md). Traces forward to: [qa-test-plan.md](qa-test-plan.md).

## Data classification

| Data Category | Examples | Storage Location | Protection & Controls |
|---|---|---|---|
| **Public Data** | Parks, reading centers, operating hours, Green Index scores, transit lines. | PostgreSQL public read replicas, Redis cache. | Public read-only; writes restricted to verified admin/audit pipeline. |
| **User Geolocation (Sensitive)** | Device location, only when the user taps "Use my current location". | Stays in the browser (1.0 computes walking estimates client-side). | **Never sent to our servers, logged or persisted.** The API also strips `lat`/`lng` from its logs. |
| **Saved Items (Pseudonymous)** | Bookmarked places and saved commute routes. | Browser localStorage only in 1.0. | Never leaves the device; cleared with browser data. |
| **Accounts (Personal)** | Name, email, password hash. | Supabase Auth. | Email confirmation; deleted on request ([RELEASE.md](RELEASE.md) section 6). |
| **Newsletter (Personal)** | Email, consent text and time. | Supabase `newsletter_signups` (RLS on, no client access). | Written only by the API with the service role; removed on request. |
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
Reviewed 2026-11-08 for the 1.0 release. Evidence in brackets.

- [x] Every network-exposed write surface is protected. Public tables are writable only by `service_role` (RLS, `00008`); `saved_items` is owner-scoped (`00013`); `newsletter_signups` has RLS on and no client grants (`00014`); the only anonymous write is `POST /newsletter`, which validates input, requires consent and is rate-limited. [`scripts/test-migrations.sh`, `apps/api/tests/public-release.test.ts`]
- [x] No secrets or API credentials committed. Worker secrets are set with `wrangler secret put`, CI secrets live in GitHub; the Supabase anon key is public by design and protected by RLS. [`apps/api/wrangler.toml`, `.github/workflows/deploy.yml`]
- [x] `INV-001`: no record is `VERIFIED` without a named person, date and source; hours, amenities and Green Index show *Not available yet*; the production API refuses to serve fixtures (503). [CI *migrations* job, `apps/api/tests/public-release.test.ts`]
- [x] `INV-002`: the facility notice is rendered on every place profile, with the exact PRD text. [`apps/web/src/tests/public-release.test.tsx`, `disclaimer-presence.test.tsx`]
- [x] `INV-003`: API contracts remain platform-neutral REST/JSON. [`pnpm lint:api`]
- [x] Accounts can't be faked: the mock login only runs in development; only the Supabase session counts as signed in. [`apps/web/src/tests/public-release.test.tsx`]
- [x] Data from the API is HTML-escaped before rendering in `/home`. [`public-release.test.tsx`, "escapes text from the API"]
- [x] T-004: a shared Cloudflare rate-limit binding (60 req/min per IP) is configured for production. [`apps/api/wrangler.toml`]
- [x] Security headers (CSP without `unsafe-eval`, frame denial, HSTS, nosniff) are served from `apps/web/public/_headers`; checked with zero CSP violations on `/`, `/home`, `/privacy`, `/terms`.
- [ ] Privacy Notice and Terms reviewed by someone qualified in Philippine law (owner action, [RELEASE.md](RELEASE.md) section 4).
