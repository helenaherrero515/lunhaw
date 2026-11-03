# ADR-003: Evaluation & Selection of Phase 2 Mobile Application Framework

> **Document ID:** ADR-003 (C-M4-01)  
> **Date:** 2026-11-03  
> **Status:** Accepted  
> **Driver:** Lead Frontend Architect / Mobile Platform Team  
> **Traces Back To:** `docs/prd.md` (§12 Open Questions), `docs/system-design.md`, `docs/COSTS.md`  
> **Enforces Invariants:** `INV-001` (Data Honesty), `INV-003` (Platform-Neutral API Contract), `T-003` (Zero GPS Coordinate Retention), $0/Month Operational Stack.

---

## 1. Context & Problem Statement

Phase 1 successfully delivered the responsive web application and serverless API gateway for Lunhaw. To achieve high engagement among daily commuters, university students, and transit riders across Metro Manila, Phase 2 introduces a dedicated, high-performance mobile application (`F-101`).

The mobile client must fulfill the following operational and engineering criteria:
1. **$0.00/Month Maintenance Budget:** Must not incur recurring cloud infrastructure or continuous deployment costs.
2. **Maximum Code & Logic Reuse:** Must reuse existing TypeScript mathematical engines (`EQ-001` Green Index, `EQ-002` Shade Index, `EQ-003` Walking Speed, `EQ-004` LTFRB Fare Matrix) and validation schemas without duplicating logic in another programming language.
3. **High-Performance Offline Vector Maps (`F-103`):** Must support client-side offline vector map tiles (OpenFreeMap) and background pathfinding during frequent cellular dead zones in Metro Manila undergrounds or rail transit corridors.
4. **Low-End Android Device Performance:** Must execute smoothly on budget Android hardware (e.g. 2GB–4GB RAM MediaTek/Snapdragon devices commonly used by Filipino commuters).

---

## 2. Options Evaluated

### Option A: React Native with Expo (Chosen Option)
- **Architecture:** Cross-platform React Native utilizing Expo Prebuild, TypeScript monorepo integration with `pnpm workspaces`, and `@maplibre/maplibre-react-native`.
- **Pros:**
  - **Direct Monorepo Code Reuse (85%+):** Directly imports and shares all TypeScript pure-math modules (`green-index.ts`, `shade-calculator.ts`, `transit-math.ts`), Zod schemas (`guardrails.ts`), and design tokens from `@lunhaw/ui`.
  - **Shared Skillset:** Same React/TypeScript engineering team develops and maintains both Web and Mobile apps without hiring separate native engineers.
  - **High-Performance Native Maps:** `@maplibre/maplibre-react-native` renders vector tiles with native Metal (iOS) and OpenGL/Vulkan (Android) hardware acceleration consuming unmetered OpenFreeMap vector tiles.
  - **Free-Tier Build Automation:** Free GitHub Actions runners (Ubuntu) build Android APKs/AABs; Expo Application Services (EAS) free tier provides 30 cloud builds/month for iOS.
- **Cons:**
  - Slightly larger initial binary size (~25MB) compared to pure native Swift/Kotlin.
- **Score:** **9.4 / 10**

### Option B: Flutter (Google)
- **Architecture:** Dart language cross-platform framework rendering UI via the Impeller engine.
- **Pros:**
  - Fast rendering performance and predictable UI across Android versions.
- **Cons:**
  - **Zero Logic Reuse:** Requires complete mathematical re-implementation of `EQ-001`, `EQ-002`, `EQ-003`, `EQ-004` and Zod guardrails in Dart, creating ongoing synchronization and drift risk (`INV-001`).
  - Fragmented team velocity: Team must maintain both TypeScript and Dart codebases.
- **Score:** **6.8 / 10**

### Option C: Enhanced Progressive Web App (PWA)
- **Architecture:** Mobile Safari / Chrome web application with Service Worker offline caching.
- **Pros:**
  - Lowest initial development effort; no app store approval process.
- **Cons:**
  - Severe iOS Safari constraints: WebGL canvas memory limits, limited background geolocation triggers, lack of system haptics, and frequent cache eviction (7 days).
  - Subpar touch responsiveness and gesture physics compared to native touch responders.
- **Score:** **6.2 / 10**

---

## 3. Comparative Evaluation Scorecard

| Evaluation Metric | Weight | React Native (Expo) | Flutter | Enhanced PWA |
|---|:---:|:---:|:---:|:---:|
| **Monorepo Code & Math Reuse** | 30% | **9.8** / 10 | 4.0 / 10 | 9.5 / 10 |
| **$0/Month Maintenance Budget** | 25% | **9.5** / 10 | 9.0 / 10 | 10.0 / 10 |
| **Offline Vector Map Performance** | 20% | **9.2** / 10 | 8.0 / 10 | 5.5 / 10 |
| **Budget Android Responsiveness** | 15% | **8.8** / 10 | 9.2 / 10 | 6.0 / 10 |
| **Developer Velocity & Community** | 10% | **9.5** / 10 | 7.5 / 10 | 8.0 / 10 |
| **Weighted Total** | **100%** | **9.45 / 10** | **7.23 / 10** | **7.78 / 10** |

---

## 4. Decision & Implementation Strategy

### Decision
The Lunhaw core team formally selects **Option A: React Native with Expo** as the canonical mobile application framework for Phase 2.

### Implementation Guidelines
1. **Workspace Location:** Scaffold mobile app inside monorepo at `apps/mobile` utilizing Expo SDK 52+ with New Architecture (Fabric + TurboModules).
2. **Package Sharing:** Directly import math engines from `packages/methods` and shared state from `@lunhaw/store`.
3. **Map Rendering:** Consume vector tiles via `@maplibre/maplibre-react-native` backed by Cloudflare Worker tile proxy endpoint (`/tiles`).
4. **Offline Packs (`F-103`):** Cache SQLite / GeoJSON bundle files locally via `expo-file-system` and `expo-sqlite`.
