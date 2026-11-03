/**
 * scripts/data/anomaly-detector.ts
 *
 * Data quality validation pipeline and geographic anomaly detector.
 * Performs rigorous multi-dimensional integrity audits across civic datasets:
 *  1. Geographic bounds verification (canonical NCR bounding box per B-M3-01)
 *  2. Spatial proximity & duplicate facility detection (< 50m radius via Haversine)
 *  3. Operating hours schedule conflict, inversion, and overlap detection
 *  4. Mandatory verification metadata completeness and AI guardrails (INV-001, BR-001, NV-001..004)
 *  5. Relational foreign-key integrity across places, library details, and hours
 *
 * Outputs human-readable audit report to docs/anomaly-report.md and optional JSON summary.
 *
 * Traces back to: B-M3-01, INV-001, BR-001, BR-002, NV-001, NV-002, NV-004.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  NCR_BOUNDING_BOX,
  ingestLibraries,
  type VerificationStatus,
} from './ingest-libraries';
import {
  normalizeCivicRecords,
  FORBIDDEN_AI_SIGNATURES,
  isValidHttpUrl,
  type NormalizedCivicDataset,
  type NormalizedPlace,
  type NormalizedLibraryDetail,
  type NormalizedOperatingHour,
  type NormalizedVerificationMeta,
} from './normalize-records';

export const DEFAULT_PROXIMITY_THRESHOLD_METERS = 50.0;

export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AnomalyCategory =
  | 'COORDINATES_BOUNDS'
  | 'COORDINATES_GEOMETRY'
  | 'SPATIAL_DUPLICATE'
  | 'OPERATING_HOURS_INVERSION'
  | 'OPERATING_HOURS_OVERLAP'
  | 'OPERATING_HOURS_STATE'
  | 'OPERATING_HOURS_FORMAT'
  | 'OPERATING_HOURS_INCOMPLETE'
  | 'METADATA_MISSING'
  | 'METADATA_AI_FORBIDDEN'
  | 'METADATA_INVALID_URL'
  | 'METADATA_INVALID_DATE'
  | 'RELATIONAL_INTEGRITY';

export interface DataAnomaly {
  id: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  ruleCode: string;
  entityType: 'place' | 'operating_hour' | 'library_detail' | 'verification_meta';
  entityId: string;
  facilityName: string | null;
  lguCity: string | null;
  description: string;
  remediationAction: string;
  contextData?: Record<string, unknown>;
}

export interface AnomalyReportData {
  generatedAt: string;
  datasetStats: {
    totalPlaces: number;
    totalLibraryDetails: number;
    totalOperatingHours: number;
    totalVerificationMeta: number;
  };
  proximityThresholdMeters: number;
  integrityScore: number;
  validationPassed: boolean;
  anomaliesSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<AnomalyCategory, number>;
  };
  anomalies: DataAnomaly[];
}

export interface AnomalyDetectorOptions {
  proximityThresholdMeters?: number;
  failOnCritical?: boolean;
}

/**
 * Calculates great-circle distance between two geographic coordinates using Haversine formula (meters)
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Mean Earth radius in meters
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const STOP_WORDS: Record<string, true> = {
  the: true,
  of: true,
  and: true,
  in: true,
  at: true,
  barangay: true,
  brgy: true,
  city: true,
  public: true,
  library: true,
  reading: true,
  center: true,
  nook: true,
};

/**
 * Calculates token-level Jaccard similarity between two facility names
 */
function calculateNameSimilarity(nameA: string, nameB: string): number {
  const normA = nameA.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const normB = nameB.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (normA === normB) return 1.0;

  const tokensA = new Set(normA.split(' ').filter((t) => t.length > 1 && !STOP_WORDS[t]));
  const tokensB = new Set(normB.split(' ').filter((t) => t.length > 1 && !STOP_WORDS[t]));

  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0.0;
}

/**
 * Parses time string (HH:MM or HH:MM:SS) into seconds from midnight
 */
function parseTimeToSeconds(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Validates full relational dataset against geographic, proximity, operating hours,
 * and metadata integrity rules.
 */
export function detectAnomalies(
  dataset: NormalizedCivicDataset,
  options?: AnomalyDetectorOptions
): AnomalyReportData {
  const proximityThreshold = options?.proximityThresholdMeters ?? DEFAULT_PROXIMITY_THRESHOLD_METERS;
  const anomalies: DataAnomaly[] = [];
  let anomalySeq = 1;

  function pushAnomaly(
    category: AnomalyCategory,
    severity: AnomalySeverity,
    ruleCode: string,
    entityType: DataAnomaly['entityType'],
    entityId: string,
    facilityName: string | null,
    lguCity: string | null,
    description: string,
    remediationAction: string,
    contextData?: Record<string, unknown>
  ): void {
    const id = `ANOM-${String(anomalySeq++).padStart(4, '0')}`;
    anomalies.push({
      id,
      category,
      severity,
      ruleCode,
      entityType,
      entityId,
      facilityName,
      lguCity,
      description,
      remediationAction,
      contextData,
    });
  }

  // 1. Build Lookups for Referential and Relational Integrity Checks
  const placeById = new Map<string, NormalizedPlace>();
  const metaById = new Map<string, NormalizedVerificationMeta>();
  const referencedMetaIds = new Set<string>();
  const referencedPlaceIdsInDetails = new Set<string>();
  const referencedPlaceIdsInHours = new Set<string>();

  for (const place of dataset.places) {
    placeById.set(place.id, place);
  }

  for (const meta of dataset.verification_meta) {
    metaById.set(meta.id, meta);
  }

  // 2. Audit Places: Coordinates, Geometry, and Bounding Box Validation
  for (const place of dataset.places) {
    const { lat, lng } = place.coordinates;

    // Numerical and finite validity
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || isNaN(lat) || isNaN(lng)) {
      pushAnomaly(
        'COORDINATES_GEOMETRY',
        'CRITICAL',
        'INV-001',
        'place',
        place.id,
        place.name,
        place.lgu_city,
        `Facility has non-finite or NaN coordinates (lat: ${lat}, lng: ${lng}).`,
        'Re-geocode facility address with official cadastral or OpenStreetMap survey data.',
        { lat, lng }
      );
    } else {
      // NCR Bounding Box validation
      if (
        lat < NCR_BOUNDING_BOX.MIN_LAT ||
        lat > NCR_BOUNDING_BOX.MAX_LAT ||
        lng < NCR_BOUNDING_BOX.MIN_LNG ||
        lng > NCR_BOUNDING_BOX.MAX_LNG
      ) {
        pushAnomaly(
          'COORDINATES_BOUNDS',
          'CRITICAL',
          'NCR_BOUNDING_BOX',
          'place',
          place.id,
          place.name,
          place.lgu_city,
          `Coordinates (${lat}, ${lng}) lie outside the canonical NCR bounding box [${NCR_BOUNDING_BOX.MIN_LAT}..${NCR_BOUNDING_BOX.MAX_LAT}, ${NCR_BOUNDING_BOX.MIN_LNG}..${NCR_BOUNDING_BOX.MAX_LNG}].`,
          'Verify facility address and re-pin coordinates to local barangay boundaries within Metro Manila.',
          { lat, lng, boundingBox: NCR_BOUNDING_BOX }
        );
      }
    }

    // Point GeoJSON coordinate consistency check [lng, lat]
    if (place.point_geojson) {
      if (place.point_geojson.type !== 'Point') {
        pushAnomaly(
          'COORDINATES_GEOMETRY',
          'HIGH',
          'GEOJSON_TYPE',
          'place',
          place.id,
          place.name,
          place.lgu_city,
          `point_geojson type is "${place.point_geojson.type}"; expected "Point".`,
          'Correct GeoJSON geometry representation to standard Point feature.',
          { type: place.point_geojson.type }
        );
      } else {
        const [geoLng, geoLat] = place.point_geojson.coordinates;
        const latDiff = Math.abs(geoLat - lat);
        const lngDiff = Math.abs(geoLng - lng);
        if (latDiff > 0.0001 || lngDiff > 0.0001) {
          pushAnomaly(
            'COORDINATES_GEOMETRY',
            'HIGH',
            'GEOJSON_COORDINATE_MISMATCH',
            'place',
            place.id,
            place.name,
            place.lgu_city,
            `GeoJSON coordinates [${geoLng}, ${geoLat}] diverge from record coordinates (${lat}, ${lng}).`,
            'Synchronize point_geojson coordinates with top-level coordinates object.',
            { coordinates: { lat, lng }, pointGeoJson: [geoLng, geoLat] }
          );
        }
      }
    } else {
      pushAnomaly(
        'COORDINATES_GEOMETRY',
        'HIGH',
        'GEOJSON_MISSING',
        'place',
        place.id,
        place.name,
        place.lgu_city,
        'point_geojson is null or missing.',
        'Generate standard Point GeoJSON feature from facility coordinates.'
      );
    }

    // Verification ID linkage
    if (!place.verification_id) {
      pushAnomaly(
        'METADATA_MISSING',
        'CRITICAL',
        'INV-001',
        'place',
        place.id,
        place.name,
        place.lgu_city,
        'Place has null or missing verification_id.',
        'Attach a valid verification_meta record to maintain tri-state data provenance.'
      );
    } else {
      referencedMetaIds.add(place.verification_id);
      if (!metaById.has(place.verification_id)) {
        pushAnomaly(
          'RELATIONAL_INTEGRITY',
          'CRITICAL',
          'FK_VERIFICATION_META',
          'place',
          place.id,
          place.name,
          place.lgu_city,
          `Place references non-existent verification_id "${place.verification_id}".`,
          'Ensure foreign key integrity by creating or repairing corresponding verification_meta entry.',
          { verification_id: place.verification_id }
        );
      }
    }
  }

  // 3. Spatial Proximity & Duplicate Facilities Detection (< 50m radius)
  const places = dataset.places;
  for (let i = 0; i < places.length; i++) {
    const pA = places[i];
    for (let j = i + 1; j < places.length; j++) {
      const pB = places[j];

      // Calculate distance between pA and pB
      const distanceMeters = haversineDistanceMeters(
        pA.coordinates.lat,
        pA.coordinates.lng,
        pB.coordinates.lat,
        pB.coordinates.lng
      );

      if (distanceMeters < proximityThreshold) {
        const similarity = calculateNameSimilarity(pA.name, pB.name);
        const isSameCategory = pA.category === pB.category;
        const isSameLgu = pA.lgu_city === pB.lgu_city;

        // Determine severity:
        // HIGH if distance < 50m and (similar name or same category)
        // MEDIUM if distance < 50m but different categories and names (potential co-location)
        const isProbableDuplicate = similarity >= 0.4 || (isSameCategory && isSameLgu);
        const severity: AnomalySeverity = isProbableDuplicate ? 'HIGH' : 'MEDIUM';

        pushAnomaly(
          'SPATIAL_DUPLICATE',
          severity,
          'PROXIMITY_50M',
          'place',
          pA.id,
          pA.name,
          pA.lgu_city,
          `Facility is only ${distanceMeters.toFixed(1)}m from "${pB.name}" (${pB.lgu_city}), below the ${proximityThreshold}m threshold. (Name similarity: ${(similarity * 100).toFixed(0)}%, Categories: ${pA.category} / ${pB.category}).`,
          isProbableDuplicate
            ? 'Investigate records for duplicate ingestion; merge records if representing the same civic space.'
            : 'Perform physical site audit to verify if distinct institutions share the same civic complex/campus.',
          {
            facilityA: { id: pA.id, name: pA.name, lgu: pA.lgu_city, coordinates: pA.coordinates },
            facilityB: { id: pB.id, name: pB.name, lgu: pB.lgu_city, coordinates: pB.coordinates },
            distanceMeters: Math.round(distanceMeters * 10) / 10,
            nameSimilarity: Math.round(similarity * 100) / 100,
          }
        );
      }
    }
  }

  // 4. Operating Hours Schedule Conflicts, Overlaps, and Time Inversions
  // Group operating hours by place_id
  const hoursByPlace = new Map<string, NormalizedOperatingHour[]>();
  for (const hour of dataset.operating_hours) {
    referencedPlaceIdsInHours.add(hour.place_id);
    if (hour.verification_id) {
      referencedMetaIds.add(hour.verification_id);
    }

    // Relational check
    if (!placeById.has(hour.place_id)) {
      pushAnomaly(
        'RELATIONAL_INTEGRITY',
        'CRITICAL',
        'FK_PLACE',
        'operating_hour',
        hour.id,
        null,
        null,
        `Operating hour references non-existent place_id "${hour.place_id}".`,
        'Purge orphaned operating hour record or reassign to valid place.',
        { place_id: hour.place_id }
      );
    }

    if (!hour.verification_id || !metaById.has(hour.verification_id)) {
      pushAnomaly(
        'RELATIONAL_INTEGRITY',
        'HIGH',
        'FK_VERIFICATION_META',
        'operating_hour',
        hour.id,
        null,
        null,
        `Operating hour references missing or non-existent verification_id "${hour.verification_id}".`,
        'Assign valid verification_meta foreign key to operating hour record.',
        { verification_id: hour.verification_id }
      );
    }

    // Day of week range check
    if (hour.day_of_week < 0 || hour.day_of_week > 6) {
      const place = placeById.get(hour.place_id);
      pushAnomaly(
        'OPERATING_HOURS_FORMAT',
        'CRITICAL',
        'DAY_OF_WEEK_RANGE',
        'operating_hour',
        hour.id,
        place?.name ?? null,
        place?.lgu_city ?? null,
        `day_of_week ${hour.day_of_week} is outside allowed range 0 (Sunday) to 6 (Saturday).`,
        'Correct day_of_week to integer between 0 and 6.',
        { day_of_week: hour.day_of_week }
      );
    }

    const list = hoursByPlace.get(hour.place_id) ?? [];
    list.push(hour);
    hoursByPlace.set(hour.place_id, list);
  }

  // Evaluate schedules for each place
  for (const place of dataset.places) {
    const hours = hoursByPlace.get(place.id) ?? [];

    if (hours.length === 0) {
      pushAnomaly(
        'OPERATING_HOURS_INCOMPLETE',
        'MEDIUM',
        'SCHEDULE_MISSING',
        'place',
        place.id,
        place.name,
        place.lgu_city,
        'Facility has zero operating_hours records defined.',
        'Add weekly 7-day schedule records with either opening hours or explicit is_closed flags.'
      );
      continue;
    }

    // Group hours by day of week for this place
    const hoursByDay = new Map<number, NormalizedOperatingHour[]>();
    for (const h of hours) {
      const dayList = hoursByDay.get(h.day_of_week) ?? [];
      dayList.push(h);
      hoursByDay.set(h.day_of_week, dayList);
    }

    // Check completeness: check if any of the 7 days (0..6) are missing
    const missingDays: number[] = [];
    for (let d = 0; d <= 6; d++) {
      if (!hoursByDay.has(d)) {
        missingDays.push(d);
      }
    }
    if (missingDays.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      pushAnomaly(
        'OPERATING_HOURS_INCOMPLETE',
        'LOW',
        'SCHEDULE_GAPS',
        'place',
        place.id,
        place.name,
        place.lgu_city,
        `Facility schedule is missing entries for ${missingDays.length} day(s): ${missingDays.map((d) => dayNames[d]).join(', ')}.`,
        'Populate complete 7-day schedule to provide unambiguous open/closed status for all calendar days.',
        { missingDays }
      );
    }

    // Check each day's entries for conflicts, time inversions, and overlaps
    for (const [day, dayHours] of hoursByDay.entries()) {
      // 1. Check individual record validity
      for (const h of dayHours) {
        if (h.is_closed) {
          if (h.open_time !== null || h.close_time !== null) {
            pushAnomaly(
              'OPERATING_HOURS_STATE',
              'MEDIUM',
              'CLOSED_STATE_CONTRADICTION',
              'operating_hour',
              h.id,
              place.name,
              place.lgu_city,
              `Schedule on day ${day} marked is_closed=true but has non-null open_time (${h.open_time}) or close_time (${h.close_time}).`,
              'Set open_time and close_time to null when is_closed is true.',
              { day, open_time: h.open_time, close_time: h.close_time }
            );
          }
        } else {
          // is_closed = false
          if (!h.open_time || !h.close_time) {
            pushAnomaly(
              'OPERATING_HOURS_STATE',
              'HIGH',
              'OPEN_HOURS_MISSING',
              'operating_hour',
              h.id,
              place.name,
              place.lgu_city,
              `Schedule on day ${day} marked is_closed=false but open_time or close_time is null/empty.`,
              'Provide valid opening and closing times or mark record as is_closed=true.',
              { day, open_time: h.open_time, close_time: h.close_time }
            );
          } else {
            const openSec = parseTimeToSeconds(h.open_time);
            const closeSec = parseTimeToSeconds(h.close_time);

            if (openSec === null || closeSec === null) {
              pushAnomaly(
                'OPERATING_HOURS_FORMAT',
                'HIGH',
                'TIME_FORMAT_INVALID',
                'operating_hour',
                h.id,
                place.name,
                place.lgu_city,
                `Invalid time format on day ${day}: open_time="${h.open_time}", close_time="${h.close_time}". Must match HH:MM or HH:MM:SS.`,
                'Reformat operating hours to standard 24-hour time notation (HH:MM:SS).',
                { day, open_time: h.open_time, close_time: h.close_time }
              );
            } else if (closeSec <= openSec) {
              pushAnomaly(
                'OPERATING_HOURS_INVERSION',
                'HIGH',
                'TIME_INVERSION',
                'operating_hour',
                h.id,
                place.name,
                place.lgu_city,
                `Time inversion on day ${day}: close_time (${h.close_time}) is earlier than or equal to open_time (${h.open_time}).`,
                'Verify operating shifts and adjust close_time to follow open_time.',
                { day, open_time: h.open_time, close_time: h.close_time }
              );
            }
          }
        }
      }

      // 2. Multiple records on the same day: Check for contradictory states or overlaps
      if (dayHours.length > 1) {
        const hasClosed = dayHours.some((h) => h.is_closed);
        const hasOpen = dayHours.some((h) => !h.is_closed);

        if (hasClosed && hasOpen) {
          pushAnomaly(
            'OPERATING_HOURS_OVERLAP',
            'HIGH',
            'CONTRADICTORY_DAY_STATE',
            'place',
            place.id,
            place.name,
            place.lgu_city,
            `Facility has contradictory schedules on day ${day}: one record marks it closed while another marks it open.`,
            'Resolve conflicting schedule entries for the same day of week.',
            { day, scheduleCount: dayHours.length }
          );
        }

        // Check for overlapping open intervals
        const openIntervals: Array<{ id: string; open: number; close: number; openStr: string; closeStr: string }> = [];
        for (const h of dayHours) {
          if (!h.is_closed && h.open_time && h.close_time) {
            const o = parseTimeToSeconds(h.open_time);
            const c = parseTimeToSeconds(h.close_time);
            if (o !== null && c !== null && c > o) {
              openIntervals.push({ id: h.id, open: o, close: c, openStr: h.open_time, closeStr: h.close_time });
            }
          }
        }

        for (let a = 0; a < openIntervals.length; a++) {
          for (let b = a + 1; b < openIntervals.length; b++) {
            const intA = openIntervals[a];
            const intB = openIntervals[b];
            const overlap = Math.max(intA.open, intB.open) < Math.min(intA.close, intB.close);
            if (overlap) {
              pushAnomaly(
                'OPERATING_HOURS_OVERLAP',
                'HIGH',
                'SCHEDULE_TIME_OVERLAP',
                'place',
                place.id,
                place.name,
                place.lgu_city,
                `Overlapping operating hour intervals on day ${day}: (${intA.openStr} - ${intA.closeStr}) conflicts with (${intB.openStr} - ${intB.closeStr}).`,
                'Adjust operating shifts so morning/afternoon schedules do not overlap.',
                { day, intervalA: intA, intervalB: intB }
              );
            }
          }
        }
      }
    }
  }

  // 5. Library Details Relational and Integrity Checks
  for (const detail of dataset.library_details) {
    referencedPlaceIdsInDetails.add(detail.place_id);
    if (detail.verification_id) {
      referencedMetaIds.add(detail.verification_id);
    }

    if (!placeById.has(detail.place_id)) {
      pushAnomaly(
        'RELATIONAL_INTEGRITY',
        'CRITICAL',
        'FK_PLACE',
        'library_detail',
        detail.place_id,
        null,
        null,
        `Library detail references non-existent place_id "${detail.place_id}".`,
        'Remove orphaned library_detail record or link to valid place entity.',
        { place_id: detail.place_id }
      );
    }

    if (!detail.verification_id || !metaById.has(detail.verification_id)) {
      pushAnomaly(
        'RELATIONAL_INTEGRITY',
        'HIGH',
        'FK_VERIFICATION_META',
        'library_detail',
        detail.place_id,
        null,
        null,
        `Library detail references missing or non-existent verification_id "${detail.verification_id}".`,
        'Link library detail to valid verification_meta entry.',
        { verification_id: detail.verification_id }
      );
    }
  }

  // 6. Verification Metadata Completeness and AI Guardrails (INV-001, BR-001, NV-001..004)
  for (const meta of dataset.verification_meta) {
    const isReferenced = referencedMetaIds.has(meta.id);

    // AI Guardrail: Check forbidden AI signatures in verified_by and derivation_note (NV-001)
    if (meta.verified_by) {
      for (const pattern of FORBIDDEN_AI_SIGNATURES) {
        if (pattern.test(meta.verified_by)) {
          pushAnomaly(
            'METADATA_AI_FORBIDDEN',
            'CRITICAL',
            'NV-001',
            'verification_meta',
            meta.id,
            null,
            null,
            `Forbidden AI bot signature detected in verified_by ("${meta.verified_by}"). Violates NV-001 prohibition against synthetic verification.`,
            'Re-assign record to human civic auditor or data steward.',
            { verified_by: meta.verified_by, matchedPattern: pattern.source }
          );
          break;
        }
      }
    }

    if (meta.derivation_note) {
      for (const pattern of FORBIDDEN_AI_SIGNATURES) {
        if (pattern.test(meta.derivation_note)) {
          pushAnomaly(
            'METADATA_AI_FORBIDDEN',
            'CRITICAL',
            'NV-001',
            'verification_meta',
            meta.id,
            null,
            null,
            `Forbidden AI bot signature detected in derivation_note ("${meta.derivation_note}"). Violates NV-001.`,
            'Replace synthetic derivation note with authentic human methodology explanation.',
            { derivation_note: meta.derivation_note, matchedPattern: pattern.source }
          );
          break;
        }
      }
    }

    // Tri-State Status Invariants (BR-001, NV-002, NV-004)
    if (meta.status === 'VERIFIED') {
      // Must have official source name
      if (!meta.official_source_name || meta.official_source_name.trim().length === 0) {
        pushAnomaly(
          'METADATA_MISSING',
          'HIGH',
          'NV-002',
          'verification_meta',
          meta.id,
          null,
          null,
          'Record marked VERIFIED lacks mandatory official_source_name.',
          'Specify official municipal portal, NLP directory, or agency source name.',
          { status: meta.status }
        );
      }

      // Must have valid official source URL
      if (!meta.official_source_url || !isValidHttpUrl(meta.official_source_url)) {
        pushAnomaly(
          'METADATA_INVALID_URL',
          'HIGH',
          'NV-002',
          'verification_meta',
          meta.id,
          null,
          null,
          `Record marked VERIFIED has invalid or missing official_source_url ("${meta.official_source_url}").`,
          'Provide valid http/https URL pointing to authoritative government source.',
          { official_source_url: meta.official_source_url }
        );
      }

      // Must have last_verified_at timestamp
      if (!meta.last_verified_at || isNaN(Date.parse(meta.last_verified_at))) {
        pushAnomaly(
          'METADATA_INVALID_DATE',
          'HIGH',
          'NV-002',
          'verification_meta',
          meta.id,
          null,
          null,
          `Record marked VERIFIED has missing or invalid last_verified_at timestamp ("${meta.last_verified_at}").`,
          'Record ISO-8601 audit timestamp documenting when verification took place.',
          { last_verified_at: meta.last_verified_at }
        );
      }

      // Must have verified_by
      if (!meta.verified_by || meta.verified_by.trim().length === 0) {
        pushAnomaly(
          'METADATA_MISSING',
          'HIGH',
          'NV-002',
          'verification_meta',
          meta.id,
          null,
          null,
          'Record marked VERIFIED lacks mandatory human verified_by attribution.',
          'Record name or designation of human auditor who validated the facility.',
          { status: meta.status }
        );
      }
    } else if (meta.status === 'ESTIMATE') {
      // Must have derivation_note (NV-004, chk_verification_derivation)
      if (!meta.derivation_note || meta.derivation_note.trim().length === 0) {
        pushAnomaly(
          'METADATA_MISSING',
          'HIGH',
          'NV-004',
          'verification_meta',
          meta.id,
          null,
          null,
          'Record marked ESTIMATE lacks mandatory derivation_note explaining calculation methodology.',
          'Provide transparent derivation rationale in compliance with rule NV-004.',
          { status: meta.status }
        );
      }
    } else if (meta.status === 'NOT_AVAILABLE') {
      // Should not claim verified attributes
      if (meta.official_source_name && meta.verified_by) {
        pushAnomaly(
          'METADATA_MISSING',
          'LOW',
          'BR-001',
          'verification_meta',
          meta.id,
          null,
          null,
          'Record marked NOT_AVAILABLE contains source and auditor details; status may need promotion to VERIFIED.',
          'Review record; upgrade status to VERIFIED if data meets verification rubric standards.',
          { status: meta.status, source: meta.official_source_name }
        );
      }
    }

    // Orphaned verification_meta record
    if (!isReferenced) {
      pushAnomaly(
        'RELATIONAL_INTEGRITY',
        'LOW',
        'ORPHAN_META',
        'verification_meta',
        meta.id,
        null,
        null,
        'verification_meta record is not referenced by any place, library_detail, or operating_hour.',
        'Prune unused verification metadata record or re-link to appropriate entity.',
        { meta_id: meta.id }
      );
    }
  }

  // 7. Calculate Aggregates, Severity Counts, and Integrity Score
  const countsBySeverity = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  const countsByCategory: Record<AnomalyCategory, number> = {
    COORDINATES_BOUNDS: 0,
    COORDINATES_GEOMETRY: 0,
    SPATIAL_DUPLICATE: 0,
    OPERATING_HOURS_INVERSION: 0,
    OPERATING_HOURS_OVERLAP: 0,
    OPERATING_HOURS_STATE: 0,
    OPERATING_HOURS_FORMAT: 0,
    OPERATING_HOURS_INCOMPLETE: 0,
    METADATA_MISSING: 0,
    METADATA_AI_FORBIDDEN: 0,
    METADATA_INVALID_URL: 0,
    METADATA_INVALID_DATE: 0,
    RELATIONAL_INTEGRITY: 0,
  };

  for (const anom of anomalies) {
    countsBySeverity[anom.severity]++;
    countsByCategory[anom.category]++;
  }

  // Penalty weights: Critical = 25, High = 10, Medium = 3, Low = 1
  const penalty =
    countsBySeverity.CRITICAL * 25 +
    countsBySeverity.HIGH * 10 +
    countsBySeverity.MEDIUM * 3 +
    countsBySeverity.LOW * 1;
  const integrityScore = Math.max(0, Math.min(100, 100 - penalty));
  const validationPassed = countsBySeverity.CRITICAL === 0 && countsBySeverity.HIGH === 0;

  return {
    generatedAt: new Date().toISOString(),
    datasetStats: {
      totalPlaces: dataset.places.length,
      totalLibraryDetails: dataset.library_details.length,
      totalOperatingHours: dataset.operating_hours.length,
      totalVerificationMeta: dataset.verification_meta.length,
    },
    proximityThresholdMeters: proximityThreshold,
    integrityScore,
    validationPassed,
    anomaliesSummary: {
      total: anomalies.length,
      critical: countsBySeverity.CRITICAL,
      high: countsBySeverity.HIGH,
      medium: countsBySeverity.MEDIUM,
      low: countsBySeverity.LOW,
      byCategory: countsByCategory,
    },
    anomalies,
  };
}

/**
 * Formats AnomalyReportData into a publication-grade Markdown report for docs/anomaly-report.md
 */
export function generateAnomalyMarkdownReport(report: AnomalyReportData): string {
  const lines: string[] = [];

  lines.push(
    '# Data Quality & Geographic Anomaly Report — Lunhaw',
    '',
    `> **Audit Timestamp:** ${report.generatedAt}  `,
    `> **Proximity Threshold:** ${report.proximityThresholdMeters} meters (\`B-M3-01\`)  `,
    '> **Enforces Invariants:** `INV-001` (Data Honesty), `BR-001` (Tri-State Integrity), `NV-001` (AI Prohibition), `NV-002` (Provenance), `NV-004` (Estimate Traceability)  ',
    '> **Governing Decisions:** [ADR-002: LGU Civic Data Licensing & Update Cadence](decisions/ADR-002-lgu-data-licensing.md)  ',
    '',
    '---',
    '',
    '## 1. Executive Summary & Integrity Scorecard',
    '',
    'This automated anomaly detection pipeline continuously audits the Lunhaw civic dataset to ensure that zero hallucinated facilities, conflicting operating hours, out-of-boundary coordinates, or duplicate records degrade the civic discovery experience for Metro Manila commuters and students.',
    '',
    '| Metric | Value | Status | Target |',
    '|---|---|---|---|',
    `| **Dataset Integrity Score** | **${report.integrityScore}/100** | ${report.validationPassed ? '`PASSED (Clean)`' : '`ACTION REQUIRED`'} | 100 / 100 |`,
    `| **Total Facilities Audited** | \`${report.datasetStats.totalPlaces}\` | Complete | 100% of Seed Records |`,
    `| **Total Operating Schedules Audited** | \`${report.datasetStats.totalOperatingHours}\` | Complete | Full 7-Day Matrix |`,
    `| **Total Library Detail Records** | \`${report.datasetStats.totalLibraryDetails}\` | Complete | 1:1 Place Mapping |`,
    `| **Verification Meta Records** | \`${report.datasetStats.totalVerificationMeta}\` | Complete | Complete Provenance |`,
    `| **Total Anomalies Detected** | **${report.anomaliesSummary.total}** | ${report.validationPassed ? '`Zero Defects`' : '`Review Required`'} | 0 |`,
    `| **Critical Severity Anomalies** | \`${report.anomaliesSummary.critical}\` | ${report.anomaliesSummary.critical === 0 ? '`None`' : '`CRITICAL BLOCKER`'} | 0 |`,
    `| **High Severity Anomalies** | \`${report.anomaliesSummary.high}\` | ${report.anomaliesSummary.high === 0 ? '`None`' : '`HIGH PRIORITY`'} | 0 |`,
    `| **Medium Severity Anomalies** | \`${report.anomaliesSummary.medium}\` | \`${report.anomaliesSummary.medium} Advisory\` | 0 |`,
    `| **Low Severity Anomalies** | \`${report.anomaliesSummary.low}\` | \`${report.anomaliesSummary.low} Minor\` | 0 |`,
    '',
    '---',
    '',
    '## 2. Anomaly Breakdown by Category',
    '',
    '| Category | Description | Detected Count | Rule Code |',
    '|---|---|---|---|',
    `| **Geographic Bounds (NCR)** | Facilities located outside Metro Manila bounding box | \`${report.anomaliesSummary.byCategory.COORDINATES_BOUNDS}\` | \`NCR_BOUNDING_BOX\` |`,
    `| **Coordinate Geometry** | Invalid numbers, non-finite values, or GeoJSON coordinate mismatches | \`${report.anomaliesSummary.byCategory.COORDINATES_GEOMETRY}\` | \`INV-001\` |`,
    `| **Spatial Proximity Duplicates** | Facilities within < 50m radius indicating duplicate records or co-location | \`${report.anomaliesSummary.byCategory.SPATIAL_DUPLICATE}\` | \`PROXIMITY_50M\` |`,
    `| **Operating Hours Inversion** | Close time earlier than or equal to open time | \`${report.anomaliesSummary.byCategory.OPERATING_HOURS_INVERSION}\` | \`INV-001\` |`,
    `| **Schedule Overlaps / State** | Overlapping shifts or contradictory open/closed flags on same day | \`${report.anomaliesSummary.byCategory.OPERATING_HOURS_OVERLAP + report.anomaliesSummary.byCategory.OPERATING_HOURS_STATE}\` | \`BR-001\` |`,
    `| **Schedule Completeness** | Missing calendar days or malformed time strings | \`${report.anomaliesSummary.byCategory.OPERATING_HOURS_INCOMPLETE + report.anomaliesSummary.byCategory.OPERATING_HOURS_FORMAT}\` | \`B-M3-01\` |`,
    `| **Verification Metadata** | Missing verifiers, invalid source URLs, or missing derivation notes | \`${report.anomaliesSummary.byCategory.METADATA_MISSING + report.anomaliesSummary.byCategory.METADATA_INVALID_URL + report.anomaliesSummary.byCategory.METADATA_INVALID_DATE}\` | \`NV-002, NV-004\` |`,
    `| **AI Signature Prohibition** | Detection of synthetic or AI bot signatures in verifier fields | \`${report.anomaliesSummary.byCategory.METADATA_AI_FORBIDDEN}\` | \`NV-001\` |`,
    `| **Relational Integrity** | Broken foreign keys between places, details, hours, and metadata | \`${report.anomaliesSummary.byCategory.RELATIONAL_INTEGRITY}\` | \`INV-001\` |`,
    ''
  );

  if (report.anomalies.length === 0) {
    lines.push(
      '---',
      '',
      '## 3. Detailed Anomaly Queue',
      '',
      '> **No anomalies detected.** All civic facility records, coordinates, operating hours, and verification metadata satisfy all Lunhaw data guardrails and spatial constraints.',
      ''
    );
  } else {
    lines.push(
      '---',
      '',
      '## 3. Detailed Anomaly Queue',
      '',
      'The following anomalies require data steward remediation prior to production publication:',
      '',
      '| Anomaly ID | Severity | Category | Rule | Entity Type | Facility Name & LGU | Issue Description | Recommended Remediation |',
      '|---|---|---|---|---|---|---|---|'
    );

    for (const anom of report.anomalies) {
      const facilityLabel = anom.facilityName
        ? `**${anom.facilityName}** (${anom.lguCity ?? 'NCR'})`
        : `\`${anom.entityId.slice(0, 8)}...\``;

      lines.push(
        `| \`${anom.id}\` | \`${anom.severity}\` | \`${anom.category}\` | \`${anom.ruleCode}\` | \`${anom.entityType}\` | ${facilityLabel} | ${anom.description} | ${anom.remediationAction} |`
      );
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## 4. Remediation Workflow & Data Governance (ADR-002)',
    '',
    'Data stewards encountering flagged anomalies should adhere to the following remediation protocols:',
    '',
    '1. **Geographic Outliers (`COORDINATES_BOUNDS`):** Cross-reference cadastral records with barangay boundary shapefiles and pin the entrance centroid.',
    '2. **Duplicate Candidates (`SPATIAL_DUPLICATE`):** If two records represent the same library branch, consolidate under the NLP-registered facility ID.',
    '3. **Operating Hours Inversions / Conflicts (`OPERATING_HOURS_*`):** Consult the official LGU executive order or public reading center notice board; verify lunch breaks or double shifts.',
    '4. **AI-Generated Metadata Violations (`NV-001`):** Completely discard synthetic data; mandate human on-site survey or official FOI disclosure receipt.',
    '',
    `*Report automatically generated by \`scripts/data/anomaly-detector.ts\` on ${report.generatedAt.slice(0, 10)}.*`,
    ''
  );

  return lines.join('\n');
}

/**
 * CLI execution entry point
 */
export function main(): void {
  const args = process.argv.slice(2);
  let inputPath = path.resolve('data/normalized-libraries.json');
  let reportPath = path.resolve('docs/anomaly-report.md');
  let jsonPath: string | null = null;
  let proximityMeters = DEFAULT_PROXIMITY_THRESHOLD_METERS;
  let failOnCritical = false;

  const inIndex = args.indexOf('--input');
  if (inIndex !== -1 && args[inIndex + 1]) {
    inputPath = path.resolve(args[inIndex + 1]);
  }

  const repIndex = args.indexOf('--report');
  if (repIndex !== -1 && args[repIndex + 1]) {
    reportPath = path.resolve(args[repIndex + 1]);
  }

  const jsonIndex = args.indexOf('--json');
  if (jsonIndex !== -1 && args[jsonIndex + 1]) {
    jsonPath = path.resolve(args[jsonIndex + 1]);
  }

  const proxIndex = args.indexOf('--proximity');
  if (proxIndex !== -1 && args[proxIndex + 1]) {
    proximityMeters = parseFloat(args[proxIndex + 1]);
  }

  if (args.includes('--fail-on-critical') || args.includes('--fail-on-anomaly')) {
    failOnCritical = true;
  }

  let dataset: NormalizedCivicDataset;
  if (fs.existsSync(inputPath)) {
    dataset = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  } else {
    const raw = ingestLibraries();
    dataset = normalizeCivicRecords(raw).normalized;
  }

  const report = detectAnomalies(dataset, { proximityThresholdMeters: proximityMeters });
  const markdownReport = generateAnomalyMarkdownReport(report);

  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, markdownReport, 'utf-8');

  if (jsonPath) {
    const jsonDir = path.dirname(jsonPath);
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`JSON anomaly report saved:   ${jsonPath}`);
  }

  console.log('=== Data Quality & Geographic Anomaly Detector (B-M3-01) ===');
  console.log(`Audit Date:                 ${report.generatedAt}`);
  console.log(`Proximity Radius:           ${report.proximityThresholdMeters} meters`);
  console.log(`Total Facilities Audited:   ${report.datasetStats.totalPlaces}`);
  console.log(`Total Operating Hours:      ${report.datasetStats.totalOperatingHours}`);
  console.log(`Dataset Integrity Score:    ${report.integrityScore}/100`);
  console.log(`Validation Passed:          ${report.validationPassed ? 'YES (Clean)' : 'NO (Anomalies Found)'}`);
  console.log(`Total Anomalies Detected:   ${report.anomaliesSummary.total}`);
  console.log(`  - Critical:               ${report.anomaliesSummary.critical}`);
  console.log(`  - High:                   ${report.anomaliesSummary.high}`);
  console.log(`  - Medium:                 ${report.anomaliesSummary.medium}`);
  console.log(`  - Low:                    ${report.anomaliesSummary.low}`);
  console.log(`Report successfully saved:  ${reportPath}`);

  if (failOnCritical && !report.validationPassed) {
    process.exitCode = 1;
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
