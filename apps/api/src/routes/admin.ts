import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env, ProblemDetails, VerificationStatus } from '../types/index.js';
import { resolveAuth } from '../utils/auth.js';
import { MOCK_PLACES } from './places.js';

export const adminRoute = new Hono<{ Bindings: Env }>();

export const DEFAULT_FRESHNESS_THRESHOLD_DAYS = 180;

export interface FacilityAuditRecord {
  record_type: 'facility';
  place_id: string;
  name: string;
  category: string;
  city: string;
  barangay: string;
  status: VerificationStatus;
  official_source_name: string | null;
  official_source_url: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  age_days: number | null;
  freshness_category: 'FRESH' | 'STALE' | 'PENDING_SURVEY';
  is_stale: boolean;
  recommended_action: string;
}

export interface ScheduleAuditRecord {
  record_type: 'schedule';
  place_id: string;
  place_name: string;
  city: string;
  barangay: string;
  day_of_week: number;
  day_name: string;
  open_time: string | null;
  close_time: string | null;
  status: VerificationStatus;
  last_verified_at: string | null;
  age_days: number | null;
  is_stale: boolean;
  recommended_action: string;
}

export interface LguFreshnessMetric {
  city: string;
  total_facilities: number;
  fresh_count: number;
  stale_count: number;
  pending_count: number;
  compliance_rate: number;
  health_status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
}

/**
 * Determines recommended remediation action based on LGU tier (ADR-002)
 */
function getRemediationAction(
  city: string,
  status: VerificationStatus,
  ageDays: number | null
): string {
  if (status === 'NOT_AVAILABLE' || ageDays === null) {
    return 'Conduct baseline field survey and establish initial barangay reading center contact point.';
  }

  // Tier A LGUs: Automated scraper / API sync
  if (city === 'Quezon City' || city === 'Pasig' || city === 'Manila' || city === 'Makati') {
    return 'Execute automated scraper / API sync against official municipal open data portal.';
  }

  // Tier B LGUs: eFOI request & structured gazette review
  if (
    city === 'Marikina' ||
    city === 'Taguig' ||
    city === 'Mandaluyong' ||
    city === 'Valenzuela' ||
    city === 'Muntinlupa' ||
    city === 'Parañaque'
  ) {
    return 'Submit semi-annual eFOI inventory update request to LGU Public Information Office (ADR-002 Tier B).';
  }

  // Tier C LGUs: Barangay liaison & community auditor dispatch
  return 'Dispatch volunteer community auditor or contact Barangay Council Secretary for hours confirmation (ADR-002 Tier C).';
}

/**
 * Authentication & Authorization guard for administrative endpoints.
 * Requires role: 'admin' | 'moderator' or valid X-Admin-Key header.
 */
function checkAdminAuth(c: Context<{ Bindings: Env }>): {
  authorized: boolean;
  errorResponse?: Response;
} {
  // 1. Check X-Admin-Key header
  const adminKey = c.req.header('x-admin-key');
  const envAdminKey = c.env?.ADMIN_API_KEY || 'lunhaw-admin-secret-2026';
  if (adminKey && adminKey === envAdminKey) {
    return { authorized: true };
  }

  // 2. Check JWT Bearer token
  const auth = resolveAuth(c);
  if (auth.error) {
    return {
      authorized: false,
      errorResponse: c.json(auth.error, 401, {
        'Content-Type': 'application/problem+json'
      })
    };
  }

  if (!auth.user) {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_UNAUTHORIZED',
      title: 'Unauthorized',
      status: 401,
      detail:
        'Authentication bearer token or administrative API key is required to access the admin audit endpoint.',
      instance: c.req.path,
      code: 'ERR_UNAUTHORIZED'
    };
    return {
      authorized: false,
      errorResponse: c.json(problem, 401, {
        'Content-Type': 'application/problem+json'
      })
    };
  }

  const role = auth.user.role?.toLowerCase();
  if (role !== 'admin' && role !== 'moderator') {
    const problem: ProblemDetails = {
      type: 'https://api.lunhaw.ph/errors/ERR_FORBIDDEN',
      title: 'Forbidden',
      status: 403,
      detail:
        'Administrative access requires admin or moderator role. Current role does not have audit permissions.',
      instance: c.req.path,
      code: 'ERR_FORBIDDEN'
    };
    return {
      authorized: false,
      errorResponse: c.json(problem, 403, {
        'Content-Type': 'application/problem+json'
      })
    };
  }

  return { authorized: true };
}

// GET /admin/freshness-audit (A-M3-02, BR-002, T-005)
adminRoute.get('/freshness-audit', (c) => {
  const authCheck = checkAdminAuth(c);
  if (!authCheck.authorized && authCheck.errorResponse) {
    return authCheck.errorResponse;
  }

  // Query parameters
  const thresholdDaysParam = c.req.query('threshold_days');
  const thresholdDays = thresholdDaysParam
    ? parseInt(thresholdDaysParam, 10)
    : DEFAULT_FRESHNESS_THRESHOLD_DAYS;

  const cityFilter = c.req.query('city');
  const categoryFilter = c.req.query('category');
  const statusFilter = c.req.query('status');
  const refDateParam = c.req.query('ref_date');

  const refDate = refDateParam ? new Date(refDateParam) : new Date();
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;

  let placesToAudit = MOCK_PLACES;

  if (cityFilter) {
    placesToAudit = placesToAudit.filter(
      (p) => p.city.toLowerCase() === cityFilter.toLowerCase()
    );
  }

  if (categoryFilter) {
    placesToAudit = placesToAudit.filter(
      (p) => p.category.toLowerCase() === categoryFilter.toLowerCase()
    );
  }

  if (statusFilter) {
    placesToAudit = placesToAudit.filter(
      (p) => p.verification.status.toUpperCase() === statusFilter.toUpperCase()
    );
  }

  const allFacilities: FacilityAuditRecord[] = [];
  const staleFacilities: FacilityAuditRecord[] = [];
  const staleSchedules: ScheduleAuditRecord[] = [];
  let totalSchedules = 0;

  for (const place of placesToAudit) {
    const lastVerified = place.verification.last_verified_at;
    let ageDays: number | null = null;
    let isStale = false;
    let freshnessCategory: 'FRESH' | 'STALE' | 'PENDING_SURVEY' = 'PENDING_SURVEY';

    if (lastVerified) {
      const verifiedTime = Date.parse(lastVerified);
      const ageMs = refDate.getTime() - verifiedTime;
      ageDays = Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
      isStale = ageMs > thresholdMs;
      freshnessCategory = isStale ? 'STALE' : 'FRESH';
    } else {
      isStale = true;
      freshnessCategory = 'PENDING_SURVEY';
    }

    const facilityRecord: FacilityAuditRecord = {
      record_type: 'facility',
      place_id: place.id,
      name: place.name,
      category: place.category,
      city: place.city,
      barangay: place.barangay,
      status: place.verification.status,
      official_source_name: place.verification.official_source_name || null,
      official_source_url: place.verification.official_source_url || null,
      last_verified_at: lastVerified || null,
      verified_by: place.verification.verified_by || null,
      age_days: ageDays,
      freshness_category: freshnessCategory,
      is_stale: isStale,
      recommended_action: getRemediationAction(place.city, place.verification.status, ageDays)
    };

    allFacilities.push(facilityRecord);
    if (isStale) {
      staleFacilities.push(facilityRecord);
    }

    // Audit individual schedules
    for (const schedule of place.schedules || []) {
      totalSchedules++;
      const scheduleVerification = schedule.verification;
      let scheduleVerifiedAt: string | null = null;
      if (
        scheduleVerification &&
        typeof scheduleVerification === 'object' &&
        'last_verified_at' in scheduleVerification &&
        typeof scheduleVerification.last_verified_at === 'string'
      ) {
        scheduleVerifiedAt = scheduleVerification.last_verified_at;
      } else if (lastVerified) {
        scheduleVerifiedAt = lastVerified;
      }

      let schedAgeDays: number | null = null;
      let schedStale = false;

      if (scheduleVerifiedAt) {
        const schedAgeMs = refDate.getTime() - Date.parse(scheduleVerifiedAt);
        schedAgeDays = Math.max(0, Math.floor(schedAgeMs / (24 * 60 * 60 * 1000)));
        schedStale = schedAgeMs > thresholdMs;
      } else {
        schedStale = true;
      }

      if (schedStale) {
        staleSchedules.push({
          record_type: 'schedule',
          place_id: place.id,
          place_name: place.name,
          city: place.city,
          barangay: place.barangay,
          day_of_week: schedule.day_of_week,
          day_name: schedule.day_name,
          open_time: schedule.open_time,
          close_time: schedule.close_time,
          status: schedule.verification?.status || place.verification.status,
          last_verified_at: scheduleVerifiedAt || null,
          age_days: schedAgeDays,
          is_stale: true,
          recommended_action: getRemediationAction(
            place.city,
            schedule.verification?.status || place.verification.status,
            schedAgeDays
          )
        });
      }
    }
  }

  // Aggregate LGU Metrics
  const cityMap = new Map<string, { total: number; fresh: number; stale: number; pending: number }>();

  for (const fac of allFacilities) {
    let entry = cityMap.get(fac.city);
    if (!entry) {
      entry = { total: 0, fresh: 0, stale: 0, pending: 0 };
      cityMap.set(fac.city, entry);
    }
    entry.total++;
    if (fac.freshness_category === 'FRESH') {
      entry.fresh++;
    } else if (fac.freshness_category === 'STALE') {
      entry.stale++;
    } else {
      entry.pending++;
    }
  }

  const lguMetrics: LguFreshnessMetric[] = [];
  for (const [city, data] of cityMap.entries()) {
    const complianceRate =
      data.total > 0 ? Math.round((data.fresh / data.total) * 1000) / 10 : 0;
    let healthStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'HEALTHY';
    if (complianceRate < 50) {
      healthStatus = 'CRITICAL';
    } else if (complianceRate < 80) {
      healthStatus = 'NEEDS_ATTENTION';
    }

    lguMetrics.push({
      city,
      total_facilities: data.total,
      fresh_count: data.fresh,
      stale_count: data.stale,
      pending_count: data.pending,
      compliance_rate: complianceRate,
      health_status: healthStatus
    });
  }

  // Sort LGUs by lowest compliance first
  lguMetrics.sort((a, b) => a.compliance_rate - b.compliance_rate);

  const freshFacilitiesCount = allFacilities.filter(
    (f) => f.freshness_category === 'FRESH'
  ).length;
  const pendingFacilitiesCount = allFacilities.filter(
    (f) => f.freshness_category === 'PENDING_SURVEY'
  ).length;

  const totalAudited = allFacilities.length + totalSchedules;
  const totalStaleRecords = staleFacilities.length + staleSchedules.length;
  const overallComplianceRate =
    allFacilities.length > 0
      ? Math.round((freshFacilitiesCount / allFacilities.length) * 1000) / 10
      : 0;

  return c.json({
    status: 'success',
    data: {
      audit_date: refDate.toISOString(),
      threshold_days: thresholdDays,
      total_facilities: allFacilities.length,
      total_schedules: totalSchedules,
      total_audited: totalAudited,
      fresh_count: freshFacilitiesCount,
      stale_count: totalStaleRecords,
      pending_count: pendingFacilitiesCount,
      overall_compliance_rate: overallComplianceRate,
      stale_records: [...staleFacilities, ...staleSchedules],
      stale_facilities: staleFacilities,
      stale_schedules: staleSchedules,
      lgu_metrics: lguMetrics
    }
  });
});
