/**
 * scripts/data/freshness-audit.ts
 *
 * Automated 180-day verification freshness audit and stale-record detector.
 * Scans facility verification records, identifies records exceeding the 180-day
 * validity window (BR-002), and emits a Markdown report at docs/freshness-audit-report.md.
 *
 * Traces back to: B-M1-03, BR-002, INV-001, ADR-002.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ingestLibraries,
  NCR_LGUS,
  type IngestedRelationalDataset,
  type NcrLgu,
  type VerificationStatus,
} from './ingest-libraries.ts';
import {
  normalizeCivicRecords,
  calculateRecordAgeDays,
  type NormalizedCivicDataset,
  type NormalizedPlace,
  type NormalizedVerificationMeta,
} from './normalize-records.ts';

export const FRESHNESS_THRESHOLD_DAYS = 180;

export type FreshnessCategory = 'FRESH' | 'STALE' | 'PENDING_SURVEY';

export interface FacilityAuditItem {
  placeId: string;
  name: string;
  category: 'library' | 'reading_center';
  lguCity: string;
  barangay: string;
  address: string | null;
  status: VerificationStatus;
  officialSourceName: string | null;
  officialSourceUrl: string | null;
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
  ageDays: number | null;
  freshnessCategory: FreshnessCategory;
  recommendedAction: string;
}

export interface LguFreshnessMetrics {
  city: string;
  totalFacilities: number;
  freshCount: number;
  staleCount: number;
  pendingCount: number;
  complianceRate: number; // Percentage 0 - 100
  healthStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
}

export interface FreshnessAuditReportData {
  auditDate: string;
  thresholdDays: number;
  totalAudited: number;
  freshCount: number;
  staleCount: number;
  pendingCount: number;
  overallComplianceRate: number;
  lguMetrics: LguFreshnessMetrics[];
  staleFacilities: FacilityAuditItem[];
  pendingFacilities: FacilityAuditItem[];
  freshFacilities: FacilityAuditItem[];
}

/**
 * Determines the recommended remediation action based on LGU tier and status (ADR-002)
 */
function determineRemediationAction(lguCity: string, status: VerificationStatus, ageDays: number | null): string {
  if (status === 'NOT_AVAILABLE' || ageDays === null) {
    return 'Conduct baseline field survey and establish initial barangay reading center contact point.';
  }

  // Tier A LGUs: Automated harvest & API sync
  if (lguCity === 'Quezon City' || lguCity === 'Pasig' || lguCity === 'Manila' || lguCity === 'Makati') {
    return 'Execute automated scraper / API sync against official municipal open data portal.';
  }

  // Tier B LGUs: eFOI request & structured gazette review
  if (
    lguCity === 'Marikina' ||
    lguCity === 'Taguig' ||
    lguCity === 'Mandaluyong' ||
    lguCity === 'Valenzuela' ||
    lguCity === 'Muntinlupa' ||
    lguCity === 'Parañaque'
  ) {
    return 'Submit semi-annual eFOI inventory update request to LGU Public Information Office (ADR-002 Tier B).';
  }

  // Tier C LGUs: Barangay liaison & community auditor dispatch
  return 'Dispatch volunteer community auditor or contact Barangay Council Secretary for hours confirmation (ADR-002 Tier C).';
}

/**
 * Executes verification freshness audit across a normalized civic dataset
 */
export function auditVerificationFreshness(
  dataset: NormalizedCivicDataset,
  options?: {
    referenceDate?: Date;
    thresholdDays?: number;
  }
): FreshnessAuditReportData {
  const refDate = options?.referenceDate ?? new Date('2026-11-03T00:00:00Z');
  const threshold = options?.thresholdDays ?? FRESHNESS_THRESHOLD_DAYS;

  // Build meta lookup
  const metaById: Record<string, NormalizedVerificationMeta> = {};
  for (const meta of dataset.verification_meta) {
    metaById[meta.id] = meta;
  }

  const allItems: FacilityAuditItem[] = [];
  const staleItems: FacilityAuditItem[] = [];
  const pendingItems: FacilityAuditItem[] = [];
  const freshItems: FacilityAuditItem[] = [];

  // Group by LGU
  const lguBuckets: Record<
    string,
    { total: number; fresh: number; stale: number; pending: number }
  > = {};

  for (const city of NCR_LGUS) {
    lguBuckets[city] = { total: 0, fresh: 0, stale: 0, pending: 0 };
  }

  for (const place of dataset.places) {
    const meta = metaById[place.verification_id];
    const ageDays = meta ? calculateRecordAgeDays(meta.last_verified_at, refDate) : null;
    const status: VerificationStatus = meta ? meta.status : 'NOT_AVAILABLE';

    let category: FreshnessCategory = 'PENDING_SURVEY';
    if (status === 'VERIFIED') {
      if (ageDays !== null && ageDays <= threshold) {
        category = 'FRESH';
      } else {
        category = 'STALE';
      }
    } else if (status === 'ESTIMATE') {
      if (ageDays !== null && ageDays > threshold) {
        category = 'STALE';
      } else {
        category = 'FRESH';
      }
    } else {
      category = 'PENDING_SURVEY';
    }

    const action = determineRemediationAction(place.lgu_city, status, ageDays);

    const auditItem: FacilityAuditItem = {
      placeId: place.id,
      name: place.name,
      category: place.category,
      lguCity: place.lgu_city,
      barangay: place.barangay,
      address: place.address,
      status,
      officialSourceName: meta?.official_source_name ?? null,
      officialSourceUrl: meta?.official_source_url ?? null,
      lastVerifiedAt: meta?.last_verified_at ?? null,
      verifiedBy: meta?.verified_by ?? null,
      ageDays,
      freshnessCategory: category,
      recommendedAction: action,
    };

    allItems.push(auditItem);

    const bucket = lguBuckets[place.lgu_city] ?? { total: 0, fresh: 0, stale: 0, pending: 0 };
    bucket.total++;

    if (category === 'FRESH') {
      freshItems.push(auditItem);
      bucket.fresh++;
    } else if (category === 'STALE') {
      staleItems.push(auditItem);
      bucket.stale++;
    } else {
      pendingItems.push(auditItem);
      bucket.pending++;
    }
  }

  // Calculate LGU metrics
  const lguMetrics: LguFreshnessMetrics[] = Object.keys(lguBuckets)
    .sort()
    .map((city) => {
      const b = lguBuckets[city];
      const rate = b.total > 0 ? Math.round((b.fresh / b.total) * 1000) / 10 : 0;
      let health: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'HEALTHY';
      if (b.stale > 0 && b.fresh > 0) {
        health = 'NEEDS_ATTENTION';
      } else if (b.stale > 0 && b.fresh === 0) {
        health = 'CRITICAL';
      } else if (b.pending > 0 && b.fresh === 0) {
        health = 'NEEDS_ATTENTION';
      }
      return {
        city,
        totalFacilities: b.total,
        freshCount: b.fresh,
        staleCount: b.stale,
        pendingCount: b.pending,
        complianceRate: rate,
        healthStatus: health,
      };
    });

  const total = allItems.length;
  const overallRate = total > 0 ? Math.round((freshItems.length / total) * 1000) / 10 : 0;

  return {
    auditDate: refDate.toISOString().slice(0, 10),
    thresholdDays: threshold,
    totalAudited: total,
    freshCount: freshItems.length,
    staleCount: staleItems.length,
    pendingCount: pendingItems.length,
    overallComplianceRate: overallRate,
    lguMetrics,
    staleFacilities: staleItems,
    pendingFacilities: pendingItems,
    freshFacilities: freshItems,
  };
}

/**
 * Formats freshness audit results into Markdown report adhering to documentation standards
 */
export function generateFreshnessMarkdownReport(audit: FreshnessAuditReportData): string {
  const lines: string[] = [
    '# Verification Freshness Audit Report — Lunhaw',
    '',
    `> **Audit Date:** ${audit.auditDate}  `,
    `> **Freshness Policy Window:** ${audit.thresholdDays} Days (\`BR-002\`)  `,
    `> **Enforces Invariants:** \`INV-001\` (Data Honesty), \`BR-001\` (Tri-State Integrity), \`BR-002\` (Verification Freshness)  `,
    `> **Governing Decision:** [ADR-002: LGU Civic Data Licensing & Update Cadence](decisions/ADR-002-lgu-data-licensing.md)  `,
    '',
    '---',
    '',
    '## 1. Executive Summary',
    '',
    'This automated audit scans all civic libraries, branch collections, and barangay reading centers registered in the Lunhaw relational database. Under business rule **`BR-002`**, any facility record whose `last_verified_at` timestamp exceeds **180 days** is flagged in the administrative audit queue to prevent students and commuters from acting on obsolete operating hours or study amenities.',
    '',
    '| Metric | Value | Target | Status |',
    '|---|---|---|---|',
    `| **Total Facilities Audited** | \`${audit.totalAudited}\` | — | Complete |`,
    `| **Fresh Records (<= 180 Days)** | \`${audit.freshCount}\` (${audit.overallComplianceRate}%) | >= 80.0% | ${audit.overallComplianceRate >= 80 ? 'PASSED' : 'NEEDS ACTION'} |`,
    `| **Stale Records (> 180 Days)** | \`${audit.staleCount}\` (${Math.round((audit.staleCount / audit.totalAudited) * 1000) / 10}%) | 0 | **FLAGGED FOR AUDIT** |`,
    `| **Pending / Field Survey Needed** | \`${audit.pendingCount}\` (${Math.round((audit.pendingCount / audit.totalAudited) * 1000) / 10}%) | < 10.0% | MONITORING |`,
    `| **Coverage across 17 NCR LGUs** | \`${audit.lguMetrics.filter((m) => m.totalFacilities > 0).length} / ${NCR_LGUS.length}\` | 17 / 17 | 100% Monitored |`,
    '',
    '---',
    '',
    '## 2. NCR Local Government Unit (LGU) Freshness Breakdown',
    '',
    'The table below audits compliance across all 17 Metro Manila LGUs in accordance with the data intake tiers defined in `ADR-002`:',
    '',
    '| LGU City / Municipality | Total Facilities | Fresh (<= 180d) | Stale (> 180d) | Pending Survey | Freshness Compliance | Audit Health |',
    '|---|---|---|---|---|---|---|',
  ];

  for (const m of audit.lguMetrics) {
    const healthBadge =
      m.healthStatus === 'HEALTHY'
        ? 'OK Healthy'
        : m.healthStatus === 'NEEDS_ATTENTION'
          ? 'ACTION REQUIRED'
          : 'CRITICAL';
    lines.push(
      `| **${m.city}** | ${m.totalFacilities} | ${m.freshCount} | ${m.staleCount} | ${m.pendingCount} | ${m.complianceRate}% | \`${healthBadge}\` |`
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## 3. Stale Facilities Queue (> 180 Days — Action Required)',
    '',
    `The following **${audit.staleFacilities.length} facilities** have exceeded the 180-day verification validity threshold and require immediate re-verification before the 360-day deprecation deadline:`,
    '',
    '| Place ID | Facility Name | Category | LGU & Barangay | Last Verified | Age (Days) | Status | Recommended Action (ADR-002) |',
    '|---|---|---|---|---|---|---|---|'
  );

  for (const item of audit.staleFacilities) {
    const verifiedDate = item.lastVerifiedAt ? item.lastVerifiedAt.slice(0, 10) : 'None';
    lines.push(
      `| \`${item.placeId.slice(0, 8)}...\` | **${item.name}** | \`${item.category}\` | ${item.lguCity} (${item.barangay}) | \`${verifiedDate}\` | **${item.ageDays}d** | \`${item.status}\` | ${item.recommendedAction} |`
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## 4. Pending Initial Field Survey Queue (`NOT_AVAILABLE`)',
    '',
    `The following **${audit.pendingFacilities.length} facilities** are registered with \`status = 'NOT_AVAILABLE'\` or null timestamps, indicating baseline community entries awaiting formal verification:`,
    '',
    '| Place ID | Facility Name | Category | LGU & Barangay | Recommended Action |',
    '|---|---|---|---|---|'
  );

  for (const item of audit.pendingFacilities) {
    lines.push(
      `| \`${item.placeId.slice(0, 8)}...\` | **${item.name}** | \`${item.category}\` | ${item.lguCity} (${item.barangay}) | ${item.recommendedAction} |`
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## 5. Remediation & Operational Next Steps',
    '',
    'In accordance with `ADR-002` (LGU Civic Data Licensing & Update Cadence):',
    '',
    '1. **Tier A Sync (Quezon City, Pasig, Manila, Makati):** Re-run automated scrapers against updated municipal library portals. Target completion: 7 business days.',
    '2. **Tier B FOI Submission (Marikina, Taguig, Mandaluyong, Valenzuela, Muntinlupa, Parañaque):** File standard eFOI request via `foi.gov.ph` requesting 2026/2027 reading center operating hours schedules.',
    '3. **Tier C Barangay Outreach (Caloocan, Malabon, Navotas, Pasay, Las Piñas, San Juan, Pateros):** Coordinate with local volunteer network to phone or visit barangay halls.',
    '4. **360-Day Auto-Downgrade Warning:** Any record that reaches 360 days without verification will automatically transition to `NOT_AVAILABLE` status in accordance with Invariant `INV-001`.',
    '',
    '---',
    '',
    `*Report automatically generated by \`scripts/data/freshness-audit.ts\` on ${audit.auditDate}.*`
  );

  return lines.join('\n') + '\n';
}

// CLI entry point
export function main(): void {
  const args = process.argv.slice(2);
  let inputPath = path.resolve('data/normalized-libraries.json');
  let reportPath = path.resolve('docs/freshness-audit-report.md');
  let threshold = FRESHNESS_THRESHOLD_DAYS;

  const inIndex = args.indexOf('--input');
  if (inIndex !== -1 && args[inIndex + 1]) {
    inputPath = path.resolve(args[inIndex + 1]);
  }

  const repIndex = args.indexOf('--report');
  if (repIndex !== -1 && args[repIndex + 1]) {
    reportPath = path.resolve(args[repIndex + 1]);
  }

  const thIndex = args.indexOf('--threshold');
  if (thIndex !== -1 && args[thIndex + 1]) {
    threshold = parseInt(args[thIndex + 1], 10);
  }

  let dataset: NormalizedCivicDataset;
  if (fs.existsSync(inputPath)) {
    dataset = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  } else {
    const raw = ingestLibraries();
    dataset = normalizeCivicRecords(raw).normalized;
  }

  const audit = auditVerificationFreshness(dataset, { thresholdDays: threshold });
  const markdownReport = generateFreshnessMarkdownReport(audit);

  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, markdownReport, 'utf-8');

  console.log('=== Verification Freshness Audit Summary (B-M1-03) ===');
  console.log(`Audit Reference Date:       ${audit.auditDate}`);
  console.log(`Freshness Window:           ${audit.thresholdDays} Days`);
  console.log(`Total Facilities Audited:   ${audit.totalAudited}`);
  console.log(`Fresh Facilities (<= 180d): ${audit.freshCount} (${audit.overallComplianceRate}%)`);
  console.log(`Stale Facilities (> 180d):  ${audit.staleCount}`);
  console.log(`Pending / Field Survey:     ${audit.pendingCount}`);
  console.log(`Report successfully saved:  ${reportPath}`);
}

// Auto-run when executed directly
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
