# QA — Test Plan & Test Cases — Lunhaw

> **Purpose:** Quality assurance strategy, traceability matrix, automated verification suites, and invariant negative tests. Proves that Lunhaw satisfies all functional requirements and strictly obeys non-negotiable data-integrity principles.
> Traces back to: [prd.md](prd.md), [system-design.md](system-design.md), [methods.md](methods.md), [security-compliance.md](security-compliance.md).

## Test strategy

- **Unit:** Pure logic validation (Green Index formulas `EQ-001`, `EQ-002`, fare calculator `EQ-004`, time estimation `EQ-003`, and coordinate bounding box validation).
- **Integration & Contract:** API payload schema validation (`api-spec.md`), database constraint enforcement (`chk_verification_derivation`), and platform-neutral JSON response assertions.
- **E2E (Playwright):** Critical user journeys (`UJ-001`, `UJ-002`, `UJ-003`): discovering study spaces, checking operating hours + disclaimer, and manual area selection.

## Test profile (context-scaled)

- **Browser UI present:** Yes (Web Phase 1).
- **Core smoke journey:** `UJ-001` (Discover reading center & check verified hours).
- **PR gate command:** `npm test`
- **Full gate command:** `npm run test:e2e`
- **CI budget/constraints:** Fast automated pipeline (< 3 minutes total run).
- **Required environments:** Node.js 20+, Chromium (primary).

## Scope

### In scope
- Verification of data integrity tags (`VERIFIED`, `ESTIMATE`, `NOT_AVAILABLE`).
- Enforcement of mandatory facility disclaimer banner on all facility profiles.
- Formula calculation precision for Green Index and shade scoring.
- Manual Area Entry fallback flow when browser geolocation is blocked.
- Local storage persistence for saved places and trips.

### Out of scope
- Live GPS hardware simulation for transit vehicles.
- Payment gateway integrations (no financial transactions).
- Native mobile device build pipelines (Phase 2).

## Traceability matrix

| F-ID | Feature | Test Case ID(s) | Lowest Proving Level | Automation | Status |
|---|---|---|---|---|---|
| **F-001** | Explore Directory & Maps | `TC-001` | Integration / UI | Automated | Planned |
| **F-002** | Libraries & Reading Centers | `TC-002` | E2E | Automated | Planned |
| **F-003** | Commute & Route Planner | `TC-003` | Integration / Unit | Automated | Planned |
| **F-004** | Green Index & Shade Calculator | `TC-004` | Unit (`EQ-001`, `EQ-002`) | Automated | Planned |
| **F-005** | Saved Places & Trips | `TC-005` | Unit / LocalStorage | Automated | Planned |
| **F-006** | Manual Area Entry Fallback | `TC-006` | E2E | Automated | Planned |

## Automation contract

| Test ID | Level / Tool | Test Path | Command | Trigger | Artifact / Evidence |
|---|---|---|---|---|---|
| `TC-001` | Integration / Vitest | `tests/api/places.test.ts` | `npm test -- tests/api/places` | PR / Main | Console JUnit report |
| `TC-002` | E2E / Playwright | `tests/e2e/study-discovery.spec.ts` | `npx playwright test study-discovery` | Pre-merge | Playwright HTML report |
| `TC-003` | Integration / Vitest | `tests/routing/commute.test.ts` | `npm test -- tests/routing/commute` | PR / Main | Console log |
| `TC-004` | Unit / Vitest | `tests/methods/green-index.test.ts` | `npm test -- tests/methods` | Local / PR | Unit test report |
| `TC-005` | Unit / Vitest | `tests/storage/saved.test.ts` | `npm test -- tests/storage` | Local / PR | Unit test report |
| `TC-006` | E2E / Playwright | `tests/e2e/manual-location.spec.ts` | `npx playwright test manual-location` | Pre-merge | Trace recording |
| `TC-N01` | Negative Contract / Vitest | `tests/integrity/zero-hallucination.test.ts` | `npm test -- tests/integrity` | Every commit | Assertions pass |
| `TC-N02` | Negative E2E / Playwright | `tests/integrity/disclaimer-presence.spec.ts` | `npx playwright test disclaimer-presence` | Every commit | Assertions pass |
| `TC-N03` | Contract / Spectral | `tests/contract/platform-neutral.test.ts` | `npm run lint:api` | PR / Main | OpenAPI lint report |

## Test cases

### TC-001 — Explore Directory Search & Filter
- **Covers:** `F-001`
- **Level:** Integration / UI
- **Preconditions:** Controlled database seeded with 10 NCR parks and reading centers.
- **Steps:** Submit `GET /api/v1/places?category=reading_center&city=Pasig`.
- **Expected (EARS):** The system SHALL return HTTP 200 with an array of matching reading centers containing valid coordinates, category tags, and verification metadata.

### TC-002 — Public Library Details & Amenity Display
- **Covers:** `F-002`
- **Level:** E2E
- **Preconditions:** Facility seeded with `has_power_outlets = true` and `has_wifi = true`.
- **Steps:** Navigate to `/places/{id}`.
- **Expected (EARS):** The system SHALL render the study amenity chips (Power, Wi-Fi), operating hours table, and the persistent verification disclaimer banner.

### TC-003 — Commute Route Generation with Fare Transparency
- **Covers:** `F-003`
- **Level:** Integration / Unit
- **Preconditions:** Valid origin and destination within NCR coordinates.
- **Steps:** Request route via `POST /api/v1/commute/routes`.
- **Expected (EARS):** The system SHALL output walking and transit steps where each leg carries a valid fare object tagged `VERIFIED` or `ESTIMATE` with calculation notes.

### TC-004 — Green Index & Shade Glass-Box Calculation
- **Covers:** `F-004`
- **Level:** Unit
- **Preconditions:** Known test inputs: Canopy = 40.0%, NDVI = 50.0%, Permeable = 30.0%.
- **Steps:** Execute `computeGreenIndex(canopy, ndvi, permeable)`.
- **Expected (EARS):** The system SHALL output score `41.00` ($\pm 0.01$) strictly conforming to `EQ-001`.

### TC-005 — Saved Places Local Persistence
- **Covers:** `F-005`
- **Level:** Unit / Web Storage
- **Steps:** Invoke save handler on a facility ID; trigger page reload.
- **Expected (EARS):** The system SHALL retain the saved place in localStorage and render it within the Saved Places drawer.

### TC-006 — Manual Area Entry Graceful Fallback
- **Covers:** `F-006`
- **Level:** E2E
- **Preconditions:** Browser geolocation permissions set to `denied`.
- **Steps:** Load application homepage.
- **Expected (EARS):** WHEN geolocation is denied, the system SHALL automatically surface the LGU City and Barangay selector modal without blocking UI interaction.

---

## Invariant (negative) tests — The `INV-###` guardrails

| INV-ID | Invariant (Must Never...) | Negative Test ID | Status |
|---|---|---|---|
| **INV-001** | Never invent, hallucinate, or unreliably extrapolate routes, transit fares, operating hours, or amenities without explicit labels. | `TC-N01` | Active / Gate |
| **INV-002** | Never render facility profiles without the mandatory advisory disclaimer banner. | `TC-N02` | Active / Gate |
| **INV-003** | Never expose platform-specific models or endpoints restricted to a single client type. | `TC-N03` | Active / Gate |

### TC-N01 — Asserts INV-001 is Never Violated (Zero Hallucination)
- **Covers:** `INV-001`
- **Assertion (EARS Unwanted):** The system SHALL NEVER return or render an operating hour, transit fare, or amenity value that lacks an explicit `status` equal to `VERIFIED`, `ESTIMATE`, or `NOT_AVAILABLE`.
- **Probe / Test Method:** Ingest a synthetic dataset containing incomplete records where `operating_hours` or `fares` are NULL or unverified. Verify that API and UI outputs mark them explicitly as `Not available yet` and do not auto-fill default values.
- **Automation:** `tests/integrity/zero-hallucination.test.ts` (Command: `npm test -- tests/integrity`).

### TC-N02 — Asserts INV-002 is Never Violated (Mandatory Disclaimer)
- **Covers:** `INV-002`
- **Assertion (EARS Unwanted):** The system SHALL NEVER display a facility profile view WHERE the mandatory advisory disclaimer text is missing or hidden.
- **Probe / Test Method:** Query 50 randomly selected facility profile endpoints and render them via Playwright headless browser; assert that `#facility-disclaimer-banner` is visible with text containing *"Please verify operating hours directly with the facility before traveling"*.
- **Automation:** `tests/integrity/disclaimer-presence.spec.ts`.

### TC-N03 — Asserts INV-003 is Never Violated (Platform Neutrality)
- **Covers:** `INV-003`
- **Assertion (EARS Unwanted):** The system SHALL NEVER return payloads containing client-specific markup, mobile-exclusive binary protocols, or platform-coupled keys.
- **Probe / Test Method:** Validate all OpenAPI endpoints against schema linter ensuring 100% adherence to standard JSON RFC 8259 and GeoJSON RFC 7946.
- **Automation:** `npm run lint:api`.

---

## Browser E2E with Playwright

- Core smoke test asserts full user flow: Landing page &rarr; Explore search &rarr; View Reading Center profile &rarr; Confirm disclaimer presence (`INV-002`) &rarr; Bookmark to Saved list.
- Locators bind strictly to user-facing ARIA labels and semantic role identifiers (`role="button"`, `aria-label="Save facility"`), never brittle CSS selectors.
- Tested on Chromium in headless mode.

## Regression plan
- **Per Commit:** Unit tests (`methods`, `integrity`, and negative invariant checks).
- **Per Pull Request:** Full API integration tests + Playwright core smoke suite.
- **Pre-Release Milestone:** Full E2E suite across all 17 LGU area selections and manual fallback paths.

## Exit criteria
- 100% passing rate on all `TC-###` and `TC-N##` test cases.
- Zero orphaned `F-###` features or unverified `INV-###` invariants in the traceability matrix.
