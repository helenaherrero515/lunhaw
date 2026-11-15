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

const summary = {
  auditDate: data.audit_date,
  thresholdDays: data.threshold_days,
  totalAudited: data.total_facilities,
  staleCount: data.stale_count,
  pendingCount: data.pending_count,
  freshCount: data.fresh_count,
  overallComplianceRate: data.overall_compliance_rate,
};

const row = (cells) => `| ${cells.map((c) => String(c ?? "—").replace(/\|/g, "\\|")).join(" | ")} |`;
const report = [
  `# Verification freshness audit (BR-002), ${data.audit_date.slice(0, 10)}`,
  "",
  `Source: live database via \`${apiUrl}/v1/admin/freshness-audit\`. Threshold: ${data.threshold_days} days.`,
  "",
  row(["Places audited", "Fresh", "Stale", "Never verified", "Compliance"]),
  row(["---", "---", "---", "---", "---"]),
  row([data.total_facilities, data.fresh_count, data.stale_count, data.pending_count, `${data.overall_compliance_rate}%`]),
  "",
  "## Stale places",
  "",
  data.stale_facilities.length === 0
    ? "None."
    : [
        row(["Place", "City", "Status", "Last verified", "Age (days)"]),
        row(["---", "---", "---", "---", "---"]),
        ...data.stale_facilities.map((f) => row([f.name, f.city, f.status, f.last_verified_at?.slice(0, 10), f.age_days])),
      ].join("\n"),
  "",
  "## By city",
  "",
  row(["City", "Places", "Fresh", "Stale", "Never verified", "Compliance"]),
  row(["---", "---", "---", "---", "---", "---"]),
  ...data.lgu_metrics.map((m) => row([m.city, m.total_facilities, m.fresh_count, m.stale_count, m.pending_count, `${m.compliance_rate}%`])),
  "",
  "To re-verify a place, follow docs/RELEASE.md §5 (verification worksheet).",
  "",
].join("\n");

if (args.json) writeFileSync(args.json, JSON.stringify(summary, null, 2) + "\n");
if (args.report) writeFileSync(args.report, report);
console.log(JSON.stringify(summary));
