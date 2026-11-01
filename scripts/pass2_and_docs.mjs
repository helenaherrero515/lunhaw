import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const REPO = 'helenaherrero515/lunhaw';
const PROJECT_NUMBER = 3;
const PROJECT_OWNER = 'helenaherrero515';

function runGh(cmd) {
  try {
    return execSync(`gh ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    throw new Error(`Command "gh ${cmd}" failed:\n${err.stderr || err.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Step 1: Parsing ISSUE_PLAN.md ===');
  const planContent = fs.readFileSync('ISSUE_PLAN.md', 'utf8');

  // Summary table regex
  const tableRegex = /\|\s*\*\*\[([A-Z]-[A-Z0-9]+-[0-9]{2})\]\*\*\s*\|\s*([^|]+)\|\s*([A-F])\s*\|\s*([A-Z0-9]+)\s*\|\s*([^|]+)\|\s*(P[0-2])\s*\|\s*([SML])\s*\|\s*([^|]+)\|/g;
  const tableMap = new Map();
  let tableMatch;
  while ((tableMatch = tableRegex.exec(planContent)) !== null) {
    tableMap.set(tableMatch[1], {
      code: tableMatch[1],
      title: tableMatch[2].trim(),
      track: tableMatch[3].trim(),
      milestone: tableMatch[4].trim(),
      featureRefs: tableMatch[5].trim(),
      priority: tableMatch[6].trim(),
      estimate: tableMatch[7].trim(),
      dependenciesRaw: tableMatch[8].trim()
    });
  }

  // Issue specifications regex
  const specRegex = /#### `\[([A-Z]-[A-Z0-9]+-[0-9]{2})\]` ([^\r\n]+)\r?\n([\s\S]*?)(?=(?:#### `|\n---|\n## 5|$))/g;
  let specMatch;
  const issues = [];
  while ((specMatch = specRegex.exec(planContent)) !== null) {
    const code = specMatch[1];
    const title = specMatch[2].trim();
    const rawBody = specMatch[3].trim();
    const tableData = tableMap.get(code) || {};

    issues.push({
      code,
      title,
      rawBody,
      ...tableData
    });
  }
  console.log(`Parsed ${issues.length} issues.`);

  console.log('\n=== Step 2: Fetching GitHub Issues mapping ===');
  const existingIssuesRaw = runGh(`issue list --limit 300 --json number,title,url`);
  const existingIssues = JSON.parse(existingIssuesRaw);
  const codeToIssueMap = new Map();

  for (const ex of existingIssues) {
    const m = ex.title.match(/^\[([A-Z]-[A-Z0-9]+-[0-9]{2})\]/);
    if (m) {
      codeToIssueMap.set(m[1], ex);
    }
  }
  console.log(`Mapped ${codeToIssueMap.size} GitHub issues.`);

  console.log('\n=== Step 3: Executing Pass 2 (Updating dependencies to #<n>) ===');
  const tempDir = path.resolve('scripts', 'temp_bodies');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const ghIssue = codeToIssueMap.get(issue.code);
    if (!ghIssue) {
      console.warn(`Warning: Issue ${issue.code} not found on GitHub.`);
      continue;
    }

    issue.number = ghIssue.number;
    issue.url = ghIssue.url;

    let realDepString = 'None';
    if (issue.dependenciesRaw && issue.dependenciesRaw !== 'None') {
      const depCodes = issue.dependenciesRaw.match(/[A-Z]-[A-Z0-9]+-[0-9]{2}/g) || [];
      const realNums = depCodes.map(c => {
        const target = codeToIssueMap.get(c);
        return target ? `#${target.number}` : c;
      });
      if (realNums.length > 0) {
        realDepString = realNums.join(', ');
      }
    }

    // Replace the Dependencies line in the rawBody
    const updatedBody = issue.rawBody.replace(
      /- \*\*Dependencies:\*\*.*/g,
      `- **Dependencies:** Blocked by ${realDepString}`
    );

    const updatePath = path.join(tempDir, `${issue.code}_updated.md`);
    fs.writeFileSync(updatePath, updatedBody, 'utf8');

    runGh(`issue edit ${issue.number} --body-file "${updatePath}"`);
    if ((i + 1) % 10 === 0 || i === issues.length - 1) {
      console.log(`Progress: ${i + 1}/${issues.length} issue bodies updated with real dependencies.`);
    }
    await sleep(150);
  }

  console.log('\n=== Step 4: Generating docs/ISSUE_CODES.md ===');
  let docContent = `# Lunhaw — Issue Code Directory & Traceability Ledger

> **Canonical Source:** Reflects all created issues in \`helenaherrero515/lunhaw\` and GitHub Project 3.  
> **Naming Format:** \`[<TRACK>-<MILESTONE>-<NN>] <Feature refs if any> <Imperative task title>\`  
> **Kanban Board:** [GitHub Project 3 (Lunhaw)](https://github.com/users/${PROJECT_OWNER}/projects/${PROJECT_NUMBER})  
> **Last Synchronized:** ${new Date().toISOString()}

---

## 1. Scheme Architecture

### Tracks
- **A — Backend & API:** Platform-neutral REST endpoints, Cloudflare Workers, OpenAPI contract, routing proxy, caching.
- **B — AI & Data Intelligence:** Satellite canopy/NDVI processing, Green Index glass-box formula, transit network graph, data audit.
- **C — Frontend:** Vite + React 18, MapLibre GL, OpenFreeMap, design tokens, verification badges, route planner, saved places.
- **D — Cloud & Infrastructure:** Cloudflare Pages/Workers/R2, Docker Compose, GitHub Actions CI/CD, Supabase keep-alive, cost monitoring ($0/mo).
- **E — QA & Release:** Vitest integration tests, Playwright E2E suites, negative invariant guardrail tests (TC-N01..03), a11y audits, release rehearsal.
- **F — Database & Data Model:** PostGIS spatial schema, verification metadata, operating hours, transit topology, RLS policies, seeds, size budgeting.

### Milestones
- **M0 — Foundation:** Tooling, schema skeleton, design primitives, CI, environments.
- **M1 — Explore, Libraries & Manual Area:** Features F-001, F-002, F-006; geolocation fallback, integrity badges, disclaimer.
- **M2 — Routing & Green Index:** Features F-003, F-004; Rust/Wasm A* routing in Web Worker, canopy and shade calculations.
- **M3 — Saved, Accounts & Hardening:** Feature F-005; local storage bookmarks, optional Supabase Auth, security audit, WCAG 2.1 AA a11y, 180-day audit.
- **MR — Release:** Staging rehearsal across UJ-001/002/003, docs, cost limit verification, production cutover.
- **M4 — Phase 2 Backlog:** Features F-101, F-102, F-103 (Native mobile app, community verification, offline map caching) — unscheduled.

---

## 2. Master Directory of Issues (88 Total)

| Code | Issue | Title | Track | Milestone | Priority | Est. | Dependencies |
|---|:---:|---|:---:|:---:|:---:|:---:|---|
`;

  for (const issue of issues) {
    let depDisplay = 'None';
    if (issue.dependenciesRaw && issue.dependenciesRaw !== 'None') {
      const depCodes = issue.dependenciesRaw.match(/[A-Z]-[A-Z0-9]+-[0-9]{2}/g) || [];
      const links = depCodes.map(c => {
        const target = codeToIssueMap.get(c);
        return target ? `[#${target.number}](https://github.com/${REPO}/issues/${target.number})` : c;
      });
      if (links.length > 0) depDisplay = links.join(', ');
    }

    const issueLink = `[#${issue.number}](https://github.com/${REPO}/issues/${issue.number})`;
    docContent += `| \`${issue.code}\` | ${issueLink} | ${issue.title} | ${issue.track} | ${issue.milestone} | ${issue.priority} | ${issue.estimate} | ${depDisplay} |\n`;
  }

  docContent += `\n---\n\n## 3. GitHub Project Integration\n\nAll issues are tracked in GitHub Project **[Lunhaw](https://github.com/users/${PROJECT_OWNER}/projects/${PROJECT_NUMBER})** in the **Kanban Board** layout with custom fields for \`Track\`, \`Priority\`, \`Estimate\`, and \`Status: Todo\`.\n`;

  fs.writeFileSync(path.resolve('docs', 'ISSUE_CODES.md'), docContent, 'utf8');
  console.log('docs/ISSUE_CODES.md generated successfully.');
}

main().catch(err => {
  console.error('Error in pass2_and_docs:', err);
  process.exit(1);
});
