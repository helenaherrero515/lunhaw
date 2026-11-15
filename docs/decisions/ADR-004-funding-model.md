# ADR-004: Long-Term Hosting, Domain and Funding Model

> **Document ID:** ADR-004 (D-MR-02)
> **Date:** 2026-11-16
> **Status:** Accepted (approved by merging the pull request that adds this file)
> **Traces Back To:** `docs/prd.md` (Open questions; Non-goals), `docs/COSTS.md`, [ADR-001](ADR-001-cloud-architecture.md), [RELEASE.md](../RELEASE.md)
> **Enforces:** $0/month operation with **no personal financial liability**; `INV-001` (Data Honesty); PRD non-goal "no commercial advertisements or sponsored business listings".

---

## 1. Context

Lunhaw 1.0 is live and costs **$0/month**:

| Piece | Service and plan | What happens at the limit |
|---|---|---|
| Website | Cloudflare Pages (free), `lunhaw.pages.dev` | Free domain, nothing to renew |
| API | Cloudflare Workers (free), `*.workers.dev` | Requests over the daily free quota fail; nothing is billed |
| Database, accounts | Supabase (free) | No overage billing; the project pauses after 7 days idle, which the `supabase-keepalive` workflow prevents |
| Backups | Cloudflare R2 (free storage tier) | 30-day retention keeps it small |
| CI, schedules | GitHub Actions | Free for public repositories |
| Base map | OpenFreeMap | Free, community-funded |
| Trip routing (OpenRouteService), AI guide (Anthropic) | **Off.** No keys are set, so `/v1/guide/status` reports both as `false` | The app shows a labelled straight-line walking estimate instead |

The open question (PRD, issue D-MR-02) is how to keep this running for years, renew a domain if one is ever bought, and pay for anything that outgrows the free tiers, **without the maintainer ever being personally liable for a bill**.

## 2. Decision

### 2.1 Stay on free tiers by default
- Every account (Cloudflare, Supabase, GitHub) stays on its **free plan with no payment method attached**. Without a card, an overrun fails or degrades (see `docs/COSTS.md` §3) instead of producing a bill.
- The paid features (AI guide, OpenRouteService routing) stay **off** unless a sponsor covers them in advance (§2.3). The app already works without them.

### 2.2 Domain: keep `lunhaw.pages.dev`
- The public address stays **`https://lunhaw.pages.dev`**. It is free and never expires, so there is nothing to renew.
- A custom domain (e.g. a `.ph` or `.org` name) is bought **only** when a sponsor or partner pays for **at least two years up front** and the domain is registered to a project or organisation account, not a personal one. Then:
  1. turn on auto-renew with the sponsor's payment method;
  2. keep `lunhaw.pages.dev` working, so a lapsed domain never takes the site down;
  3. record the registrar, the account owner and the expiry date in `docs/RELEASE.md` §6.

### 2.3 How outside money or credits may come in
In order of preference:
1. **In-kind credits and programmes** for open-source or public-interest projects (for example Cloudflare's programmes for public-interest organisations, or provider credits for open source). These cost nobody anything and need no money handling.
2. **Civic and academic partners**: universities (hosting, student volunteers for place verification), the National Library of the Philippines or LGUs (official data, verification, sponsored infrastructure; see `docs/COSTS.md` §6).
3. **Transparent donations** through a fiscal host such as Open Collective or GitHub Sponsors, with income and spending published, so no money passes through a personal account.

**Every sponsorship comes with these rules:**
- No ads and no sponsored or paid listings (PRD non-goal).
- Sponsors have **no say** in which places are listed, how they are labelled, or their Green Index (`INV-001`).
- Sponsors may be thanked by name in the README and the site footer.

### 2.4 Stewardship
- The project's own address, **lunhaw.hln@gmail.com**, owns or recovers the service accounts, so the project doesn't depend on one person's personal email.
- **Add a second maintainer** with admin access to GitHub, Cloudflare and Supabase, and keep shared credentials in a password manager, so the project survives if one person steps away.
- `docs/RELEASE.md` stays the single runbook: deploy, roll back, verify places, delete accounts.

## 3. When to revisit this decision
- Any service reaches the **80% soft-warning** level in `docs/COSTS.md` §3.
- Someone wants to switch on the AI guide or routing for the public.
- A sponsor offers to pay for a custom domain or paid plans.
- Lunhaw expands beyond Metro Manila (see the decision ledger), which multiplies data, verification and quota needs.

## 4. Consequences
- **Good:** no bills and no personal financial risk; the site cannot go offline because a domain or card expired; sponsors cannot buy influence over the data.
- **Trade-offs:** the public address stays `lunhaw.pages.dev`; the AI guide and mapped walking routes stay off until sponsored; growth past the free tiers waits until a partner is found.
