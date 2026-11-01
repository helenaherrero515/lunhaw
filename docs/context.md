---
# FMD context block — schema 1.1.0
project_name: Lunhaw
tagline: "Discover your space. Explore your city. Go greener."
mascot: "grasshopper"
region: "Metro Manila (NCR), Philippines"

team_size: "[TBD]"
mode: solo                      # solo | team [TBD]
build_type: production          # hackathon | graded | company | production [TBD]
time_budget: "[TBD]"
judged: false                   # [TBD]
computes_numbers: true          # Green Index calculates green-space availability and shade
exposed_surface: true           # Platform-neutral API shared by web and mobile
outlives_demo: true             # Long-term production application
selection_mode: auto

# Known unknowns marked as [TBD]
tech_stack: "[TBD]"
data_sources_and_licensing: "[TBD]"
business_model: "[TBD]"
launch_date: "[TBD]"
analytics: "[TBD]"
---

# Project Context — Lunhaw

## 1. Overview
- **Product Name:** Lunhaw
- **Region:** Metro Manila (NCR), Philippines
- **Tagline:** *"Discover your space. Explore your city. Go greener."*
- **Mascot:** Grasshopper
- **Core Journey:** Discover &rarr; Understand &rarr; Get there

## 2. Problem Statement
City life becomes an exhausting loop of work/school, traffic, errands, and home. Parks, quiet corners, public libraries, and barangay reading centers exist nearby across Metro Manila but are difficult to find. Information is fragmented and scattered across obscure sources, making nearby public spaces feel distant and inaccessible.

## 3. Users & Target Audience
- **Students:** Seeking quiet, free places to study with adequate lighting/facilities.
- **Commuters & Walkers:** People navigating urban NCR looking for walkable and greener paths.
- **Families & Neighborhood Residents:** Exploring local green spaces and community centers.
- **Public Transport Riders:** Users relying on jeepneys, buses, trains, and walking.
- **Personas:** `[TBD: add personas]`

## 4. Modules
1. **Explore:**
   - Directory of parks, gardens, libraries, reading centers.
   - Search, categorical filtering, and interactive map previews.
2. **Commute:**
   - Walking and supported public transport routes.
   - Legible step-by-step guidance, boarding/transfer points, and transparent travel estimates.
3. **Green Index:**
   - Green-space availability and shade metrics.
   - Separation of empirical measured data from algorithmic estimates.
   - Glass-box transparency: every score explains its calculation methodology.
4. **Libraries:**
   - Verified directory of public libraries and barangay reading centers.
   - Detailed listings of services, study facilities, access requirements/rules, and verified opening hours.
5. **Saved:**
   - Personal list of places to visit and saved trip routes.

## 5. Non-Negotiable Data-Integrity Principles
Lunhaw **never** invents routes, fares, opening hours, or amenities. Every piece of information carries exactly one of three explicit labels:
1. **Verified:** Official source + last-updated date.
2. **Estimate:** Clearly labelled with an explanatory note describing how it was derived.
3. **Not available yet:** Explicit omission rather than speculation.

- **Location Fallback:** If device location permission is unavailable or denied, users can enter their city/barangay/area manually.
- **Mandatory Disclaimer:** Clear, persistent notice advising users to verify with the facility before traveling.

## 6. Platforms & Architecture
- **Phase 1 (Current):** Web application. Landing page is built; core web app is `[TBD: status]`.
- **Phase 2 (Planned):** Native/cross-platform Mobile app (iOS/Android) `[TBD: framework, timeline]`.
- **Architecture Requirement:** Requirements, data model, and API must remain strictly platform-neutral so web and mobile clients share one unified backend.

## 7. Brand Identity & Design Tokens
- **Color Palette:**
  - Lime: `#98D746`
  - Forest Green: `#245C43`
  - Mint: `#B7F9ED`
  - Off-White: `#F7F7F0`
- **Typography:**
  - Wordmark & Display: `MedievalSharp`
  - UI & Body: `Kufam`

## 8. Known Unknowns `[TBD]`
- Tech stack: `[TBD]`
- Team size: `[TBD]`
- Data sources & licensing: `[TBD]`
- Business model: `[TBD]`
- Launch date: `[TBD]`
- Analytics & instrumentation: `[TBD]`
