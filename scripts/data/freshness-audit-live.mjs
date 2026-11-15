#!/usr/bin/env node
/**
 * BR-002 freshness audit against the live database, via the production API.
 *
 * Calls GET /v1/admin/freshness-audit with the X-Admin-Key header and writes the two files the
 * freshness-audit workflow publishes:
 *   --json    summary { totalAudited, staleCount, pendingCount, overallComplianceRate, ... }
 *   --report  Markdown report (used as the GitHub issue body when records are stale)
 *
 * Env: API_URL, ADMIN_API_KEY
 * Usage: node scripts/data/freshness-audit-live.mjs --threshold 180 --json out.json --report out.md
 */
import { writeFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), [])
);
const threshold = Number(args.threshold ?? 180);
const apiUrl = (process.env.API_URL ?? "").replace(/\/+$/, "");
const key = process.env.ADMIN_API_KEY ?? "";

if (!apiUrl || !key) {
  console.error("API_URL and ADMIN_API_KEY must be set (GitHub variable API_URL, secret ADMIN_API_KEY).");
  process.exit(1);
}

const res = await fetch(`${apiUrl}/v1/admin/freshness-audit?threshold_days=${threshold}`, {
  headers: { "X-Admin-Key": key, Accept: "application/json" },
});
if (!res.ok) {
  console.error(`Audit request failed: HTTP ${res.status}\n${(await res.text()).slice(0, 500)}`);
  process.exit(1);
}
const { data } = await res.json();

// The API's stale_facilities also contains never-verified places (PENDING_SURVEY), and stale_count
// adds those up. BR-002 "stale" means verified more than the threshold ago, so split the two here:
// stale places need re-verifying; never-verified places are waiting for their first check.
const stale = data.stale_facilities.filter((f) => f.freshness_category === "STALE");
const neverVerified = data.stale_facilities.filter((f) => f.freshness_category === "PENDING_SURVEY");
const staleSchedules = data.stale_schedules.filter((s) => s.last_verified_at);
const staleByCity = Object.fromEntries(data.lgu_metrics.map((m) => [m.city, stale.filter((f) => f.city === m.city).length]));

const summary = {
  auditDate: data.audit_date,
  thresholdDays: data.threshold_days,
  totalAudited: data.total_facilities,
  staleCount: stale.length + staleSchedules.length, // drives the GitHub issue: only real staleness
  pendingCount: neverVerified.length,
  freshCount: data.fresh_count,
  overallComplianceRate: data.overall_compliance_rate,
};

const row = (cells) => `| ${cells.map((c) => String(c ?? "—").replace(/\|/g, "\\|")).join(" | ")} |`;
const table = (head, rows) => [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");
const report = [
  `# Verification freshness audit (BR-002), ${data.audit_date.slice(0, 10)}`,
  "",
  `Source: live database via \`${apiUrl}/v1/admin/freshness-audit\`. Threshold: ${data.threshold_days} days.`,
  "",
  table(
    ["Places audited", "Verified ≤ " + data.threshold_days + " days ago", "Stale (re-verify)", "Never verified (first check)", "Compliance"],
    [[data.total_facilities, data.fresh_count, stale.length, neverVerified.length, `${data.overall_compliance_rate}%`]]
  ),
  "",
  `## Stale: verified more than ${data.threshold_days} days ago`,
  "",
  stale.length === 0 ? "None." : table(["Place", "City", "Status", "Last verified", "Age (days)"], stale.map((f) => [f.name, f.city, f.status, f.last_verified_at?.slice(0, 10), f.age_days])),
  "",
  staleSchedules.length === 0 ? "" : `Plus ${staleSchedules.length} opening-hours entries verified more than ${data.threshold_days} days ago.\n`,
  "## Never verified: waiting for their first check",
  "",
  neverVerified.length === 0 ? "None." : table(["Place", "City", "Status"], neverVerified.map((f) => [f.name, f.city, f.status])),
  "",
  "## By city",
  "",
  table(["City", "Places", "Verified", "Stale", "Never verified"], data.lgu_metrics.map((m) => [m.city, m.total_facilities, m.fresh_count, staleByCity[m.city], m.pending_count])),
  "",
  "To verify or re-verify a place, follow docs/RELEASE.md §5 (verification worksheet).",
  "",
].join("\n");

if (args.json) writeFileSync(args.json, JSON.stringify(summary, null, 2) + "\n");
if (args.report) writeFileSync(args.report, report);
console.log(JSON.stringify(summary));
