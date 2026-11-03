# Phase 2 API Specification Draft — Community Verification & Offline Packs

> **Document ID:** A-M4-01  
> **Status:** Draft / Approved for Phase 2 Architecture  
> **Target Release:** Phase 2 (Mobile App & Community Expansion)  
> **Enforces Invariants:** `INV-001` (Zero Hallucination / Strict Data Honesty), `INV-002` (Mandatory Facility Disclaimer), `INV-003` (Platform-Neutral API Contract), `T-003` (Zero GPS Coordinate Retention), RA 10173.

---

## 1. Architectural Overview & Platform Neutrality (`INV-003`)

This specification defines the non-breaking architectural extension of the Lunhaw REST API for Phase 2. It introduces two primary functional capabilities:
1. **Community Verification & Moderation Pipeline (`F-102`):** Enables registered citizens, students, and librarians to submit updates to operating hours, desk capacity, power outlets, Wi-Fi status, and photographic verification proofs.
2. **Offline Data Pack Manifests (`F-103`):** Provides pre-bundled, compressed municipal datasets (GeoJSON boundaries, walkable pathway graphs, facility metadata) enabling native mobile apps and PWAs to operate in full offline mode without network connectivity.

All schemas strictly enforce **RFC 7946 GeoJSON**, **RFC 7807 Problem Details**, and maintain 100% backward compatibility with Phase 1 endpoints (`/places`, `/commute`, `/saved`).

---

## 2. Phase 2 Endpoint Matrix

| Method | Endpoint | Description | Auth Requirement | SLA / Caching |
|---|---|---|---|---|
| `POST` | `/api/v2/community/submissions` | Submit a facility update, hours correction, or photo proof | Supabase JWT (`authenticated`) | Sub-200ms |
| `GET` | `/api/v2/community/submissions` | List user's own submissions and their audit review statuses | Supabase JWT (`authenticated`) | Private, no-cache |
| `GET` | `/api/v2/community/submissions/{id}` | Inspect details, anomaly score, and review status of a submission | Supabase JWT (`authenticated`) | Private, no-cache |
| `GET` | `/api/v2/admin/review/queue` | Retrieve pending community submissions sorted by anomaly score | Supabase JWT (`moderator` / `admin`) | Private, no-cache |
| `POST` | `/api/v2/admin/review/queue/{id}/decision` | Cryptographically sign approval, rejection, or edit of submission | Supabase JWT (`moderator` / `admin`) | Sub-100ms |
| `GET` | `/api/v2/offline/manifest` | Master manifest of downloadable LGU packages with SHA-256 hashes | Public Read (`anon`) | Edge cached 24h |
| `GET` | `/api/v2/offline/packs/{lgu_id}` | Download pre-bundled, gzip-compressed municipal offline pack | Public Read (`anon`) | Edge cached 7d (R2) |

---

## 3. OpenAPI 3.1 Specification Draft

```yaml
openapi: 3.1.0
info:
  title: Lunhaw Civic Platform API — Phase 2 Extension
  version: 2.0.0-draft
  description: >-
    Platform-neutral REST extension supporting community verification submissions (F-102)
    and offline data pack manifests (F-103) with zero breaking changes to Phase 1.

servers:
  - url: https://api.lunhaw.ph/v2
    description: Production API Gateway (Cloudflare Workers)

paths:
  /community/submissions:
    post:
      summary: Submit a community facility update or verification proof (F-102)
      description: >-
        Allows authenticated users to submit proposed edits to facility hours, study
        amenities, or boundary notes. Submissions enter the PENDING review state and
        can NEVER transition to VERIFIED without cryptographic moderator approval (INV-001).
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CommunitySubmissionInput'
      responses:
        '201':
          description: Submission received and queued for anomaly scoring and moderator review
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommunitySubmissionReceipt'
        '400':
          $ref: '#/components/responses/ProblemDetails400'
        '401':
          $ref: '#/components/responses/ProblemDetails401'
        '429':
          $ref: '#/components/responses/ProblemDetails429'

    get:
      summary: List authenticated user's own submissions
      security:
        - BearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED]
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                required: [status, data]
                properties:
                  status:
                    type: string
                    example: success
                  data:
                    type: object
                    required: [submissions]
                    properties:
                      submissions:
                        type: array
                        items:
                          $ref: '#/components/schemas/CommunitySubmissionRecord'

  /admin/review/queue:
    get:
      summary: Retrieve pending review queue for moderators (F-102)
      security:
        - BearerAuth: []
      parameters:
        - name: min_anomaly_score
          in: query
          description: Filter submissions by minimum heuristic anomaly score (0.0 to 100.0)
          schema:
            type: number
            minimum: 0.0
            maximum: 100.0
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                required: [status, data]
                properties:
                  status: { type: string, example: success }
                  data:
                    type: object
                    required: [queue, total_pending]
                    properties:
                      total_pending: { type: integer, example: 14 }
                      queue:
                        type: array
                        items:
                          $ref: '#/components/schemas/ModerationQueueItem'
        '403':
          $ref: '#/components/responses/ProblemDetails403'

  /admin/review/queue/{id}/decision:
    post:
      summary: Record moderator decision on a community submission (INV-001)
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [decision, review_notes]
              properties:
                decision:
                  type: string
                  enum: [APPROVE, REJECT, REQUEST_REVISION]
                review_notes:
                  type: string
                  minLength: 10
                  description: Mandatory justification for audit log (BR-001)
                override_status:
                  type: string
                  enum: [VERIFIED, ESTIMATE]
                  description: Final status assigned if approved
      responses:
        '200':
          description: Decision committed and audit trail updated
          content:
            application/json:
              schema:
                type: object
                required: [status, data]
                properties:
                  status: { type: string, example: success }
                  data:
                    type: object
                    properties:
                      submission_id: { type: string, format: uuid }
                      new_status: { type: string }
                      reviewed_at: { type: string, format: date-time }

  /offline/manifest:
    get:
      summary: Master manifest of offline municipal data packs (F-103)
      description: Serves versioned manifest of lightweight offline SQLite/GeoJSON data packages.
      responses:
        '200':
          headers:
            Cache-Control:
              schema: { type: string, example: 'public, max-age=86400, s-maxage=86400' }
            ETag:
              schema: { type: string }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OfflineMasterManifest'

  /offline/packs/{lgu_id}:
    get:
      summary: Download pre-compiled municipal offline bundle (F-103)
      parameters:
        - name: lgu_id
          in: path
          required: true
          description: City slug or ID (e.g., pasig, manila, quezon_city)
          schema: { type: string }
      responses:
        '200':
          headers:
            Content-Type:
              schema: { type: string, example: 'application/gzip' }
            Content-Disposition:
              schema: { type: string, example: 'attachment; filename="lunhaw-pasig-v2.bin.gz"' }
            Cache-Control:
              schema: { type: string, example: 'public, max-age=604800, immutable' }
          content:
            application/gzip:
              schema:
                type: string
                format: binary

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    CommunitySubmissionInput:
      type: object
      required:
        - place_id
        - submission_type
        - proposed_changes
        - proof_url
      properties:
        place_id:
          type: string
          format: uuid
        submission_type:
          type: string
          enum: [OPERATING_HOURS_CORRECTION, AMENITY_UPDATE, DESK_CAPACITY_CHANGE, PERMANENT_CLOSURE_REPORT]
        proposed_changes:
          type: object
          description: Structured key-value mapping of proposed field updates
        proof_url:
          type: string
          format: uri
          description: Link to photo evidence (e.g. facility door notice, barangay memorandum)
        contributor_notes:
          type: string
          maxLength: 1000

    CommunitySubmissionReceipt:
      type: object
      required: [status, data]
      properties:
        status: { type: string, example: success }
        data:
          type: object
          required: [submission_id, review_status, estimated_sla_hours]
          properties:
            submission_id: { type: string, format: uuid }
            review_status: { type: string, example: PENDING }
            anomaly_score: { type: number, example: 12.5 }
            estimated_sla_hours: { type: integer, example: 48 }

    CommunitySubmissionRecord:
      type: object
      required: [id, place_id, submission_type, status, created_at]
      properties:
        id: { type: string, format: uuid }
        place_id: { type: string, format: uuid }
        submission_type: { type: string }
        status: { type: string, enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED] }
        proof_url: { type: string, format: uri }
        moderator_notes: { type: string, nullable: true }
        created_at: { type: string, format: date-time }

    ModerationQueueItem:
      allOf:
        - $ref: '#/components/schemas/CommunitySubmissionRecord'
        - type: object
          required: [anomaly_score, risk_category]
          properties:
            anomaly_score:
              type: number
              description: Automated heuristic risk score (0.0=safe, 100.0=critical anomaly)
            risk_category:
              type: string
              enum: [LOW_RISK, MEDIUM_RISK, SUSPICIOUS, LIKELY_VANDALISM]
            conflicts_with_existing:
              type: boolean

    OfflineMasterManifest:
      type: object
      required: [manifest_version, generated_at, packs]
      properties:
        manifest_version: { type: string, example: '2026.11.0' }
        generated_at: { type: string, format: date-time }
        total_size_bytes: { type: integer, example: 38450120 }
        packs:
          type: array
          items:
            $ref: '#/components/schemas/OfflineLguPack'

    OfflineLguPack:
      type: object
      required: [lgu_id, city_name, byte_size, sha256_checksum, download_url]
      properties:
        lgu_id: { type: string, example: 'pasig' }
        city_name: { type: string, example: 'Pasig City' }
        facilities_count: { type: integer, example: 28 }
        walkways_count: { type: integer, example: 1420 }
        byte_size: { type: integer, example: 1845120 }
        sha256_checksum: { type: string, example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
        download_url: { type: string, format: uri }

  responses:
    ProblemDetails400:
      description: Bad Request per RFC 7807
      content:
        application/problem+json:
          schema:
            type: object
            required: [type, title, status]
            properties:
              type: { type: string, format: uri }
              title: { type: string }
              status: { type: integer, example: 400 }
              detail: { type: string }
              code: { type: string }

    ProblemDetails401:
      description: Unauthorized per RFC 7807
      content:
        application/problem+json:
          schema:
            type: object
            required: [type, title, status]
            properties:
              type: { type: string, format: uri }
              title: { type: string, example: 'Unauthorized' }
              status: { type: integer, example: 401 }

    ProblemDetails403:
      description: Forbidden per RFC 7807
      content:
        application/problem+json:
          schema:
            type: object
            required: [type, title, status]
            properties:
              type: { type: string, format: uri }
              title: { type: string, example: 'Forbidden' }
              status: { type: integer, example: 403 }

    ProblemDetails429:
      description: Too Many Requests per RFC 7807
      headers:
        Retry-After:
          schema: { type: integer, example: 60 }
      content:
        application/problem+json:
          schema:
            type: object
            required: [type, title, status]
            properties:
              type: { type: string, format: uri }
              title: { type: string, example: 'Too Many Requests' }
              status: { type: integer, example: 429 }
```

---

## 4. Invariant Compliance Checklist

- [x] **`INV-001` (Zero Hallucination):** No community submission ever transitions to `VERIFIED` automatically; requires explicit moderator authorization.
- [x] **`INV-003` (Platform Neutrality):** Clean GeoJSON and RFC 7807 problem payloads with zero browser DOM or native mobile coupling.
- [x] **`T-003` (Zero GPS Coordinate Retention):** Submissions require a `place_id` reference; contributor location coordinates are NEVER captured or persisted.
- [x] **`F-103` (Offline Budget):** Master manifest bounds total mobile bundle downloads under 50MB across all 17 Metro Manila LGUs.
