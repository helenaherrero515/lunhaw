# Verification Freshness Audit Report — Lunhaw

> **Superseded (2026-11-08).** This report audited the pre-release, tool-generated dataset (`data/seed-libraries.json`). That dataset was never live, and its `VERIFIED` labels had no human confirmation. The public dataset is described in [RELEASE.md](RELEASE.md); verification status is tracked in [verification-worksheet.csv](verification-worksheet.csv).

> **Audit Date:** 2026-11-03  
> **Freshness Policy Window:** 180 Days (`BR-002`)  
> **Enforces Invariants:** `INV-001` (Data Honesty), `BR-001` (Tri-State Integrity), `BR-002` (Verification Freshness)  
> **Governing Decision:** [ADR-002: LGU Civic Data Licensing & Update Cadence](decisions/ADR-002-lgu-data-licensing.md)  

---

## 1. Executive Summary

This automated audit scans all civic libraries, branch collections, and barangay reading centers registered in the Lunhaw relational database. Under business rule **`BR-002`**, any facility record whose `last_verified_at` timestamp exceeds **180 days** is flagged in the administrative audit queue to prevent students and commuters from acting on obsolete operating hours or study amenities.

| Metric | Value | Target | Status |
|---|---|---|---|
| **Total Facilities Audited** | `36` | — | Complete |
| **Fresh Records (<= 180 Days)** | `28` (77.8%) | >= 80.0% | NEEDS ACTION |
| **Stale Records (> 180 Days)** | `6` (16.7%) | 0 | **FLAGGED FOR AUDIT** |
| **Pending / Field Survey Needed** | `2` (5.6%) | < 10.0% | MONITORING |
| **Coverage across 17 NCR LGUs** | `17 / 17` | 17 / 17 | 100% Monitored |

---

## 2. NCR Local Government Unit (LGU) Freshness Breakdown

The table below audits compliance across all 17 Metro Manila LGUs in accordance with the data intake tiers defined in `ADR-002`:

| LGU City / Municipality | Total Facilities | Fresh (<= 180d) | Stale (> 180d) | Pending Survey | Freshness Compliance | Audit Health |
|---|---|---|---|---|---|---|
| **Caloocan** | 2 | 1 | 1 | 0 | 50% | `ACTION REQUIRED` |
| **Las Piñas** | 2 | 1 | 0 | 1 | 50% | `OK Healthy` |
| **Makati** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |
| **Malabon** | 2 | 1 | 1 | 0 | 50% | `ACTION REQUIRED` |
| **Mandaluyong** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |
| **Manila** | 3 | 2 | 1 | 0 | 66.7% | `ACTION REQUIRED` |
| **Marikina** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |
| **Muntinlupa** | 2 | 1 | 1 | 0 | 50% | `ACTION REQUIRED` |
| **Navotas** | 2 | 1 | 0 | 1 | 50% | `OK Healthy` |
| **Parañaque** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |
| **Pasay** | 2 | 1 | 1 | 0 | 50% | `ACTION REQUIRED` |
| **Pasig** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |
| **Pateros** | 2 | 1 | 1 | 0 | 50% | `ACTION REQUIRED` |
| **Quezon City** | 3 | 3 | 0 | 0 | 100% | `OK Healthy` |
| **San Juan** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |
| **Taguig** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |
| **Valenzuela** | 2 | 2 | 0 | 0 | 100% | `OK Healthy` |

---

## 3. Stale Facilities Queue (> 180 Days — Action Required)

The following **6 facilities** have exceeded the 180-day verification validity threshold and require immediate re-verification before the 360-day deprecation deadline:

| Place ID | Facility Name | Category | LGU & Barangay | Last Verified | Age (Days) | Status | Recommended Action (ADR-002) |
|---|---|---|---|---|---|---|---|
| `f0010000...` | **Barangay 660 Community Reading Nook** | `reading_center` | Manila (Barangay 660) | `2026-03-15` | **232d** | `ESTIMATE` | Execute automated scraper / API sync against official municipal open data portal. |
| `f0010000...` | **Barangay 171 Bagumbong Reading Center** | `reading_center` | Caloocan (Bagong Silang) | `2026-02-18` | **257d** | `ESTIMATE` | Dispatch volunteer community auditor or contact Barangay Council Secretary for hours confirmation (ADR-002 Tier C). |
| `f0010000...` | **Barangay Catmon Reading Center** | `reading_center` | Malabon (Catmon) | `2026-01-20` | **286d** | `ESTIMATE` | Dispatch volunteer community auditor or contact Barangay Council Secretary for hours confirmation (ADR-002 Tier C). |
| `f0010000...` | **Barangay Alabang Community Reading Center** | `reading_center` | Muntinlupa (Alabang) | `2026-03-01` | **246d** | `ESTIMATE` | Submit semi-annual eFOI inventory update request to LGU Public Information Office (ADR-002 Tier B). |
| `f0010000...` | **Barangay 76 Community Reading Room** | `reading_center` | Pasay (Barangay 76) | `2026-02-10` | **265d** | `ESTIMATE` | Dispatch volunteer community auditor or contact Barangay Council Secretary for hours confirmation (ADR-002 Tier C). |
| `f0010000...` | **Barangay Aguho Community Reading Center** | `reading_center` | Pateros (Aguho) | `2026-03-12` | **235d** | `ESTIMATE` | Dispatch volunteer community auditor or contact Barangay Council Secretary for hours confirmation (ADR-002 Tier C). |

---

## 4. Pending Initial Field Survey Queue (`NOT_AVAILABLE`)

The following **2 facilities** are registered with `status = 'NOT_AVAILABLE'` or null timestamps, indicating baseline community entries awaiting formal verification:

| Place ID | Facility Name | Category | LGU & Barangay | Recommended Action |
|---|---|---|---|---|
| `f0010000...` | **Barangay Almanza Uno Study Nook** | `reading_center` | Las Piñas (Almanza Uno) | Conduct baseline field survey and establish initial barangay reading center contact point. |
| `f0010000...` | **Barangay Bagumbayan South Reading Nook** | `reading_center` | Navotas (Bagumbayan South) | Conduct baseline field survey and establish initial barangay reading center contact point. |

---

## 5. Remediation & Operational Next Steps

In accordance with `ADR-002` (LGU Civic Data Licensing & Update Cadence):

1. **Tier A Sync (Quezon City, Pasig, Manila, Makati):** Re-run automated scrapers against updated municipal library portals. Target completion: 7 business days.
2. **Tier B FOI Submission (Marikina, Taguig, Mandaluyong, Valenzuela, Muntinlupa, Parañaque):** File standard eFOI request via `foi.gov.ph` requesting 2026/2027 reading center operating hours schedules.
3. **Tier C Barangay Outreach (Caloocan, Malabon, Navotas, Pasay, Las Piñas, San Juan, Pateros):** Coordinate with local volunteer network to phone or visit barangay halls.
4. **360-Day Auto-Downgrade Warning:** Any record that reaches 360 days without verification will automatically transition to `NOT_AVAILABLE` status in accordance with Invariant `INV-001`.

---

*Report automatically generated by `scripts/data/freshness-audit.ts` on 2026-11-03.*
