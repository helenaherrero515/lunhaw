# API Specification — Lunhaw

> **Purpose:** Platform-neutral REST API contract serving both Web (Phase 1) and Mobile (Phase 2) clients.
> Traces back to: [prd.md](prd.md), [system-design.md](system-design.md), [data-model.md](data-model.md). Traces forward to: [qa-test-plan.md](qa-test-plan.md).

## Overview
- **Base URL:** `https://api.lunhaw.ph/v1` (Production `[TBD]`)
- **Protocol:** HTTPS / JSON
- **Platform Neutrality (`INV-003`):** Endpoints and payloads contain no web-specific or mobile-specific assumptions. All geometry is serialized in RFC 7946 standard GeoJSON.

## Authentication & authorization
- **Public Read Access:** Facility search, reading center directories, green index scores, and commute directions are publicly accessible without authentication.
- **Client Identification:** Client apps include header `X-Client-Platform: web | ios | android`.
- **Administrative Operations:** Data audits, manual verifications, and LGU imports require `Authorization: Bearer <jwt_token>` with role `moderator` or `admin`.

## Endpoints / operations

### API-001 — GET /places — Search & Filter Places
- **Serves:** `F-001`, `F-002`
- **Description:** Search and retrieve parks, gardens, libraries, and reading centers with filtering by category, amenities, or location.
- **Request Parameters:**
  - `query` (optional, string): Free-text search.
  - `category` (optional, string): `park`, `garden`, `library`, `reading_center`.
  - `city` (optional, string): NCR LGU city name (e.g. `Manila`, `Pasig`).
  - `barangay` (optional, string): Barangay name.
  - `lat`, `lng`, `radius_km` (optional, float): Coordinate radius filter.
  - `amenities` (optional, string comma-separated): `power`, `wifi`, `aircon`, `desks`.
- **Response Schema (`200 OK`):**
```json
{
  "status": "success",
  "data": {
    "places": [
      {
        "id": "c1f7a0b3-6c7e-4d8a-9f5e-123456789abc",
        "name": "Barangay San Antonio Reading Center",
        "category": "reading_center",
        "city": "Pasig",
        "barangay": "San Antonio",
        "address": "San Antonio Community Complex, Pasig",
        "coordinates": { "lat": 14.5823, "lng": 121.0611 },
        "green_index_score": 68.5,
        "verification": {
          "status": "VERIFIED",
          "official_source": "Pasig LGU Public Affairs",
          "last_verified_at": "2026-09-15T08:00:00Z"
        },
        "study_amenities": {
          "desk_capacity": 25,
          "has_power_outlets": true,
          "has_wifi": true,
          "has_aircon": true
        }
      }
    ],
    "pagination": { "page": 1, "per_page": 20, "total": 1 }
  }
}
```

### API-002 — GET /places/{id} — Place Profile & Operating Hours
- **Serves:** `F-001`, `F-002`, `INV-001`, `INV-002`
- **Description:** Retrieves detailed place record, operating schedule, full amenity checklist, and mandatory facility disclaimer.
- **Response Schema (`200 OK`):**
```json
{
  "status": "success",
  "data": {
    "id": "c1f7a0b3-6c7e-4d8a-9f5e-123456789abc",
    "name": "Barangay San Antonio Reading Center",
    "disclaimer": "Please verify operating hours directly with the facility before traveling, as barangay schedules may change without notice.",
    "verification": {
      "status": "VERIFIED",
      "official_source": "Pasig LGU Public Affairs",
      "source_url": "https://pasigcity.gov.ph/reading-centers",
      "last_verified_at": "2026-09-15T08:00:00Z"
    },
    "schedules": [
      {
        "day_of_week": 1,
        "day_name": "Monday",
        "open_time": "08:00:00",
        "close_time": "17:00:00",
        "is_closed": false,
        "verification": { "status": "VERIFIED" }
      }
    ],
    "access_requirements": "Valid student or government-issued ID required."
  }
}
```

### API-003 — POST /commute/routes — Plan Green & Shaded Commute
- **Serves:** `F-003`, `F-004`, `INV-001`
- **Description:** Calculates walking and transit routes with tree canopy shade index, step directions, and transparent fare tags.
- **Request Body:**
```json
{
  "origin": { "lat": 14.5880, "lng": 121.0550 },
  "destination": { "lat": 14.5823, "lng": 121.0611 },
  "preference": "shaded_walk"
}
```
- **Response Schema (`200 OK`):**
```json
{
  "status": "success",
  "data": {
    "routes": [
      {
        "route_id": "r-001",
        "title": "Shaded Walk via San Miguel Ave",
        "total_distance_m": 850,
        "est_duration_seconds": 720,
        "average_shade_score": 78.4,
        "fare": {
          "amount_php": 0.00,
          "verification": { "status": "VERIFIED", "note": "Pedestrian walking route" }
        },
        "legs": [
          {
            "sequence": 1,
            "mode": "walk",
            "instruction": "Walk south along San Miguel Ave sidewalk under tree canopy",
            "distance_m": 450,
            "shade_coverage_pct": 85.0,
            "verification": {
              "status": "ESTIMATE",
              "derivation_note": "Canopy calculated from Sentinel-2 NDVI overlay via EQ-002"
            }
          }
        ]
      }
    ]
  }
}
```

### API-004 — GET /locations/areas — City & Barangay Directory
- **Serves:** `F-006` (Manual Area Entry Fallback)
- **Description:** Returns the complete hierarchy of 17 Metro Manila LGUs and their barangays for manual location selection.
- **Response Schema (`200 OK`):**
```json
{
  "status": "success",
  "data": {
    "lgus": [
      {
        "city_name": "Manila",
        "total_barangays": 897,
        "barangays": ["Barangay 659", "Barangay 660", "Intramuros"]
      },
      {
        "city_name": "Pasig",
        "total_barangays": 30,
        "barangays": ["San Antonio", "Kapitolyo", "Ugong"]
      }
    ]
  }
}
```

## Error codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `ERR_INVALID_COORDINATES` | 400 | Latitude or Longitude outside valid NCR bounding box (`14.3°N–14.8°N, 120.9°E–121.2°E`). |
| `ERR_PLACE_NOT_FOUND` | 404 | Facility ID does not exist. |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | Exceeded 60 requests/minute. |
| `ERR_INTERNAL_ROUTING` | 500 | Geographic routing engine failed to compute path. |

## Rate limits
- **Public Tier:** 60 requests/minute per client IP.
- **Exceeded Behavior:** HTTP `429 Too Many Requests` with `Retry-After: <seconds>` header.
