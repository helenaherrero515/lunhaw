/**
 * scripts/data/normalize-records.ts
 *
 * Normalization pipeline applying tri-state integrity tags (VERIFIED, ESTIMATE, NOT_AVAILABLE)
 * and enforcing data guardrails across all civic facility records before database ingestion.
 *
 * Traces back to: B-M1-02, BR-001, INV-001, NV-001, NV-002, NV-004, chk_verification_derivation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ingestLibraries,
  NCR_BOUNDING_BOX,
  type IngestedRelationalDataset,
  type PlaceRecord,
  type LibraryDetailRecord,
  type OperatingHourRecord,
  type VerificationMetaRecord,
  type VerificationStatus,
} from './ingest-libraries.ts';

// Static set of allowed place categories
export const ALLOWED_CATEGORIES: Record<string, true> = {
  library: true,
  reading_center: true,
  park: true,
  garden: true,
  civic_space: true,
};

// Static set of valid tri-state statuses
export const VALID_STATUSES: Record<VerificationStatus, true> = {
  VERIFIED: true,
  ESTIMATE: true,
  NOT_AVAILABLE: true,
};

// Forbidden AI signatures for NV-001
export const FORBIDDEN_AI_SIGNATURES = [
  /ai-assistant/i,
  /gpt(?:-[a-z0-9]+)?/i,
  /claude(?:-[a-z0-9]+)?/i,
  /gemini(?:-[a-z0-9]+)?/i,
  /synthetic-bot/i,
  /copilot/i,
  /llm-generated/i,
  /chatgpt/i,
] as const;

export interface NormalizedPlace extends PlaceRecord {
  tri_state_status: VerificationStatus;
}

export interface NormalizedLibraryDetail extends LibraryDetailRecord {
  tri_state_status: VerificationStatus;
}

export interface NormalizedOperatingHour extends OperatingHourRecord {
  tri_state_status: VerificationStatus;
}

export interface NormalizedVerificationMeta extends VerificationMetaRecord {
  is_stale_flag: boolean;
  age_in_days: number | null;
}

export interface NormalizedCivicDataset {
  places: NormalizedPlace[];
  library_details: NormalizedLibraryDetail[];
  operating_hours: NormalizedOperatingHour[];
  verification_meta: NormalizedVerificationMeta[];
  summary: {
    totalPlaces: number;
    totalLibraryDetails: number;
    totalOperatingHours: number;
    totalVerificationMeta: number;
    statusBreakdown: {
      VERIFIED: number;
      ESTIMATE: number;
      NOT_AVAILABLE: number;
    };
    staleRecordsCount: number;
    freshRecordsCount: number;
    validationPassed: boolean;
    normalizedAt: string;
  };
}

export interface ValidationError {
  recordId: string;
  field: string;
  rule: string;
  message: string;
}
/**
 * Checks whether a URL is a valid http(s) URL
 */
export function isValidHttpUrl(urlString: string | null): boolean {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Calculates record age in days from a given reference date
 */
export function calculateRecordAgeDays(
  lastVerifiedAt: string | null,
  referenceDate: Date = new Date('2026-11-03T00:00:00Z')
): number | null {
  if (!lastVerifiedAt) return null;
  const verifiedTime = new Date(lastVerifiedAt).getTime();
  if (isNaN(verifiedTime)) return null;

  const diffMs = referenceDate.getTime() - verifiedTime;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Normalizes and validates a verification_meta record according to BR-001, INV-001, and NV rules
 */
export function normalizeVerificationMetaRecord(
  rawMeta: VerificationMetaRecord,
  referenceDate: Date = new Date('2026-11-03T00:00:00Z')
): { record: NormalizedVerificationMeta; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let status: VerificationStatus = rawMeta.status;

  // Assert status is valid tri-state
  if (!VALID_STATUSES[status]) {
    errors.push({
      recordId: rawMeta.id,
      field: 'status',
      rule: 'BR-001',
      message: `Invalid status "${status}". Must be exactly one of: VERIFIED, ESTIMATE, NOT_AVAILABLE.`,
    });
    status = 'NOT_AVAILABLE';
  }

  // NV-001: AI Self-Attestation Prohibition
  const isAiAuditor = Boolean(
    rawMeta.verified_by && FORBIDDEN_AI_SIGNATURES.some((pattern) => pattern.test(rawMeta.verified_by!))
  );
  if (status === 'VERIFIED' && isAiAuditor) {
    errors.push({
      recordId: rawMeta.id,
      field: 'verified_by',
      rule: 'NV-001',
      message: `AI/LLM auditor signature "${rawMeta.verified_by}" cannot assign status 'VERIFIED'.`,
    });
    // Downgrade to ESTIMATE with note
    status = 'ESTIMATE';
  }

  // NV-002: Missing Primary Source URL on Verified Status
  if (status === 'VERIFIED') {
    if (!rawMeta.official_source_url || !isValidHttpUrl(rawMeta.official_source_url)) {
      errors.push({
        recordId: rawMeta.id,
        field: 'official_source_url',
        rule: 'NV-002',
        message: `VERIFIED record must possess a valid http(s):// official_source_url. Received: "${rawMeta.official_source_url}".`,
      });
    }

    if (!rawMeta.official_source_name || rawMeta.official_source_name.trim().length === 0) {
      errors.push({
        recordId: rawMeta.id,
        field: 'official_source_name',
        rule: 'NV-002',
        message: 'VERIFIED record must possess a non-empty official_source_name.',
      });
    }

    if (!rawMeta.last_verified_at) {
      errors.push({
        recordId: rawMeta.id,
        field: 'last_verified_at',
        rule: 'NV-002',
        message: 'VERIFIED record must carry a valid last_verified_at timestamp.',
      });
    }
  }

  // NV-004 & chk_verification_derivation: Missing Derivation Note on ESTIMATE
  if (status === 'ESTIMATE') {
    if (!rawMeta.derivation_note || rawMeta.derivation_note.trim().length === 0) {
      errors.push({
        recordId: rawMeta.id,
        field: 'derivation_note',
        rule: 'NV-004/chk_verification_derivation',
        message: 'ESTIMATE record must possess a non-empty derivation_note explaining assumptions.',
      });
    }
  }

  // Calculate age and 180-day freshness status (BR-002)
  const ageDays = calculateRecordAgeDays(rawMeta.last_verified_at, referenceDate);
  const isStale = ageDays !== null && ageDays > 180;

  const normalized: NormalizedVerificationMeta = {
    id: rawMeta.id,
    status,
    official_source_name: status === 'NOT_AVAILABLE' ? null : rawMeta.official_source_name,
    official_source_url: status === 'NOT_AVAILABLE' ? null : rawMeta.official_source_url,
    derivation_note: status === 'ESTIMATE' ? rawMeta.derivation_note : null,
    last_verified_at: rawMeta.last_verified_at,
    verified_by: rawMeta.verified_by,
    is_stale_flag: isStale,
    age_in_days: ageDays,
  };

  return { record: normalized, errors };
}

/**
 * Validates spatial coordinates and bounds
 */
export function validateSpatialCoordinates(
  recordId: string,
  lat: number,
  lng: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (
    lat < NCR_BOUNDING_BOX.MIN_LAT ||
    lat > NCR_BOUNDING_BOX.MAX_LAT ||
    lng < NCR_BOUNDING_BOX.MIN_LNG ||
    lng > NCR_BOUNDING_BOX.MAX_LNG
  ) {
    errors.push({
      recordId,
      field: 'coordinates',
      rule: 'BOUNDS_NCR',
      message: `Coordinates (${lat}, ${lng}) fall outside canonical NCR bounding box [${NCR_BOUNDING_BOX.MIN_LAT}, ${NCR_BOUNDING_BOX.MAX_LAT}], [${NCR_BOUNDING_BOX.MIN_LNG}, ${NCR_BOUNDING_BOX.MAX_LNG}].`,
    });
  }
  return errors;
}

/**
 * Normalizes raw/ingested relational civic records applying tri-state integrity tags (BR-001)
 */
export function normalizeCivicRecords(
  dataset: IngestedRelationalDataset,
  referenceDate: Date = new Date('2026-11-03T00:00:00Z')
): { normalized: NormalizedCivicDataset; validation: ValidationReport } {
  const errors: ValidationError[] = [];

  // 1. Normalize verification_meta first to establish canonical tri-state status lookup
  const metaById: Record<string, NormalizedVerificationMeta> = {};
  const normalizedMeta: NormalizedVerificationMeta[] = [];
  let staleCount = 0;
  let freshCount = 0;
  const statusCounts = {
    VERIFIED: 0,
    ESTIMATE: 0,
    NOT_AVAILABLE: 0,
  };

  for (const rawMeta of dataset.verification_meta) {
    const { record, errors: metaErrors } = normalizeVerificationMetaRecord(rawMeta, referenceDate);
    errors.push(...metaErrors);
    metaById[record.id] = record;
    normalizedMeta.push(record);

    statusCounts[record.status]++;
    if (record.is_stale_flag) {
      staleCount++;
    } else if (record.last_verified_at) {
      freshCount++;
    }
  }

  // 2. Normalize places
  const normalizedPlaces: NormalizedPlace[] = [];
  for (const place of dataset.places) {
    const meta = metaById[place.verification_id];
    if (!meta) {
      errors.push({
        recordId: place.id,
        field: 'verification_id',
        rule: 'FK_VERIFICATION_META',
        message: `Place references non-existent verification_id "${place.verification_id}".`,
      });
    }

    if (!ALLOWED_CATEGORIES[place.category]) {
      errors.push({
        recordId: place.id,
        field: 'category',
        rule: 'ENUM_CATEGORY',
        message: `Place has invalid category "${place.category}". Allowed: ${Object.keys(ALLOWED_CATEGORIES).join(', ')}.`,
      });
    }

    const coordErrors = validateSpatialCoordinates(place.id, place.coordinates.lat, place.coordinates.lng);
    errors.push(...coordErrors);

    const placeStatus = meta ? meta.status : 'NOT_AVAILABLE';
    normalizedPlaces.push({
      ...place,
      tri_state_status: placeStatus,
    });
  }

  // 3. Normalize library_details
  const normalizedDetails: NormalizedLibraryDetail[] = [];
  for (const detail of dataset.library_details) {
    const meta = metaById[detail.verification_id];
    if (!meta) {
      errors.push({
        recordId: detail.place_id,
        field: 'verification_id',
        rule: 'FK_VERIFICATION_META',
        message: `Library detail references non-existent verification_id "${detail.verification_id}".`,
      });
    }

    const detailStatus = meta ? meta.status : 'NOT_AVAILABLE';
    normalizedDetails.push({
      ...detail,
      tri_state_status: detailStatus,
    });
  }

  // 4. Normalize operating_hours
  const normalizedHours: NormalizedOperatingHour[] = [];
  for (const hour of dataset.operating_hours) {
    const meta = metaById[hour.verification_id];
    if (!meta) {
      errors.push({
        recordId: hour.id,
        field: 'verification_id',
        rule: 'FK_VERIFICATION_META',
        message: `Operating hour references non-existent verification_id "${hour.verification_id}".`,
      });
    }

    if (hour.day_of_week < 0 || hour.day_of_week > 6) {
      errors.push({
        recordId: hour.id,
        field: 'day_of_week',
        rule: 'chk_day_of_week_range',
        message: `day_of_week ${hour.day_of_week} is outside allowed range 0 (Sun) to 6 (Sat).`,
      });
    }

    const hourStatus = meta ? meta.status : 'NOT_AVAILABLE';
    normalizedHours.push({
      ...hour,
      tri_state_status: hourStatus,
    });
  }

  const totalEntities =
    normalizedPlaces.length + normalizedDetails.length + normalizedHours.length + normalizedMeta.length;

  const isValid = errors.length === 0;

  const validation: ValidationReport = {
    isValid,
    totalRecordsChecked: totalEntities,
    passedCount: totalEntities - errors.length,
    errorCount: errors.length,
    errors,
  };

  const normalized: NormalizedCivicDataset = {
    places: normalizedPlaces,
    library_details: normalizedDetails,
    operating_hours: normalizedHours,
    verification_meta: normalizedMeta,
    summary: {
      totalPlaces: normalizedPlaces.length,
      totalLibraryDetails: normalizedDetails.length,
      totalOperatingHours: normalizedHours.length,
      totalVerificationMeta: normalizedMeta.length,
      statusBreakdown: statusCounts,
      staleRecordsCount: staleCount,
      freshRecordsCount: freshCount,
      validationPassed: isValid,
      normalizedAt: new Date().toISOString(),
    },
  };

  return { normalized, validation };
}

/**
 * Validates an already normalized dataset and confirms 100% compliance with BR-001 tri-state rule
 */
export function validateTriStateIntegrity(dataset: NormalizedCivicDataset): ValidationReport {
  const errors: ValidationError[] = [];
  let checked = 0;

  for (const place of dataset.places) {
    checked++;
    if (!VALID_STATUSES[place.tri_state_status]) {
      errors.push({
        recordId: place.id,
        field: 'tri_state_status',
        rule: 'BR-001',
        message: `Place "${place.name}" lacks a valid tri-state status.`,
      });
    }
  }

  for (const meta of dataset.verification_meta) {
    checked++;
    if (!VALID_STATUSES[meta.status]) {
      errors.push({
        recordId: meta.id,
        field: 'status',
        rule: 'BR-001',
        message: `VerificationMeta "${meta.id}" lacks a valid tri-state status.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    totalRecordsChecked: checked,
    passedCount: checked - errors.length,
    errorCount: errors.length,
    errors,
  };
}

// CLI entry point
export function main(): void {
  const args = process.argv.slice(2);
  let inputPath = path.resolve('data/seed-libraries.json');
  let outputPath = path.resolve('data/normalized-libraries.json');

  const inIndex = args.indexOf('--input');
  if (inIndex !== -1 && args[inIndex + 1]) {
    inputPath = path.resolve(args[inIndex + 1]);
  }

  const outIndex = args.indexOf('--output');
  if (outIndex !== -1 && args[outIndex + 1]) {
    outputPath = path.resolve(args[outIndex + 1]);
  }

  let rawDataset: IngestedRelationalDataset;
  if (fs.existsSync(inputPath)) {
    rawDataset = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  } else {
    rawDataset = ingestLibraries();
  }

  const { normalized, validation } = normalizeCivicRecords(rawDataset);

  if (!validation.isValid) {
    console.error('Validation failed with errors:');
    console.error(JSON.stringify(validation.errors, null, 2));
    process.exit(1);
  }

  const triStateValidation = validateTriStateIntegrity(normalized);
  if (!triStateValidation.isValid) {
    console.error('Tri-state integrity check failed:');
    console.error(JSON.stringify(triStateValidation.errors, null, 2));
    process.exit(1);
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2), 'utf-8');

  console.log('=== Normalization & Tri-State Integrity Summary (B-M1-02) ===');
  console.log(`Total Places:              ${normalized.summary.totalPlaces}`);
  console.log(`Tri-State VERIFIED:        ${normalized.summary.statusBreakdown.VERIFIED}`);
  console.log(`Tri-State ESTIMATE:        ${normalized.summary.statusBreakdown.ESTIMATE}`);
  console.log(`Tri-State NOT_AVAILABLE:   ${normalized.summary.statusBreakdown.NOT_AVAILABLE}`);
  console.log(`Fresh Records (< 180d):    ${normalized.summary.freshRecordsCount}`);
  console.log(`Stale Records (> 180d):    ${normalized.summary.staleRecordsCount}`);
  console.log(`Tri-State Check Passed:    100% (${triStateValidation.passedCount} / ${triStateValidation.totalRecordsChecked})`);
  console.log(`Saved normalized JSON to:  ${outputPath}`);
}

// Auto-run when executed directly
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
