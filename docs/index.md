# Documentation Index — Lunhaw

**Maintained by:** Helena / Lunhaw Core Team  
**Last updated:** 2026-11-01  
**FMD version:** 1.1.0  

## 0. Source-of-truth map (one fact, one home)

To stop drift and context-poisoning, **each concern has exactly one canonical owner.** Every other doc *links* to it — it never restates it. **When two docs disagree, the canonical owner wins** until the loser is reconciled.

| Concern | Canonical Owner | Note |
|---|---|---|
| Project Context & Sizing Intake | [Context](context.md) | Initial problem intake, platforms, brand seed, and known unknowns |
| Decisions/pivots · rejected choices · names/immutable IDs · decision assumptions | [Decision Ledger](decision-ledger.md) | Append-only decision history and invariant identifier definitions |
| Vision · problem · who it's for · invariant spine (`INV-###`) | [Idea Brief](idea.md) | Seed brief, four tests, and root cause analysis |
| What we build (features `F-###`, journeys `UJ-###`, business rules `BR-###`, invariants `INV-###`) | [PRD](prd.md) | Stable feature IDs, user journeys, and EARS acceptance criteria |
| How it's built (architecture, components, trade-offs, deployment) | [System Design](system-design.md) | Platform-neutral architecture serving both Web and Mobile |
| Data schema · entities · relational constraints · privacy classification | [Data Model](data-model.md) | PostGIS spatial entities, verification metadata, and retention |
| Every computed number (equations `EQ-###` + inputs `DS-###` + confidence rubric) | [Methods](methods.md) | Glass-box ledger for Green Index, shade scores, and fare models |
| UI · components · tokens · voice & banned-copy rules · accessibility | [Design System](design-system.md) | Grounded in brand colors (`#98D746`, `#245C43`, `#B7F9ED`, `#F7F7F0`) and fonts (`MedievalSharp`, `Kufam`) |
| Platform-neutral API contracts (`API-###`) | [API Specification](api-spec.md) | Standard REST/JSON and GeoJSON schemas for Web and Mobile clients |
| Security · threat model (`T-###`) · location privacy · compliance | [Security & Compliance](security-compliance.md) | STRIDE analysis, PH Data Privacy Act (RA 10173), pre-milestone gates |
| Tests · traceability matrix (`F-###` &rarr; `TC-###`) · invariant negative tests (`INV-###` &rarr; `TC-N##`) | [QA Test Plan](qa-test-plan.md) | Automated proving layer, Playwright E2E journeys, and exit criteria |

**The rule:** A fact lives in its canonical doc; everything else links to it. Do not restate a fact owned elsewhere — restating causes drift and hallucinated merges.

---

## 1. Document suite (what exists, what's stale)

| Document | File | Status | Last Updated |
|---|---|---|---|
| Project Context | [context.md](context.md) | Active | 2026-11-01 |
| Idea & Vision Brief | [idea.md](idea.md) | Active | 2026-11-01 |
| Decision Ledger | [decision-ledger.md](decision-ledger.md) | Active | 2026-11-01 |
| Product Requirements (PRD) | [prd.md](prd.md) | Active | 2026-11-01 |
| System Design (HLD) | [system-design.md](system-design.md) | Active | 2026-11-01 |
| Data Model & Schema | [data-model.md](data-model.md) | Active | 2026-11-01 |
| Methods & Glass-Box Ledger | [methods.md](methods.md) | Active | 2026-11-01 |
| Design System & UX Spec | [design-system.md](design-system.md) | Active | 2026-11-01 |
| API Specification | [api-spec.md](api-spec.md) | Active | 2026-11-01 |
| Security & Compliance | [security-compliance.md](security-compliance.md) | Active | 2026-11-01 |
| QA Test Plan & Traceability | [qa-test-plan.md](qa-test-plan.md) | Active | 2026-11-01 |

---

## 2. Health check (verification checklist)

- [x] Every `F-###` in the PRD has &ge;1 test in the QA plan (consistency check: `F-001`&rarr;`TC-001`, `F-002`&rarr;`TC-002`, `F-003`&rarr;`TC-003`, `F-004`&rarr;`TC-004`, `F-005`&rarr;`TC-005`, `F-006`&rarr;`TC-006`).
- [x] Every hard invariant (`INV-###`) has a corresponding negative test (`INV-001`&rarr;`TC-N01`, `INV-002`&rarr;`TC-N02`, `INV-003`&rarr;`TC-N03`).
- [x] No doc restates a fact owned by another (§0 respected).
- [x] Every network-exposed surface declares auth/authz ([security-compliance.md](security-compliance.md) and [api-spec.md](api-spec.md)).
- [x] Every computed number cites an `EQ-###` from Methods ([methods.md](methods.md)).
- [x] Data-integrity principle strictly enforced: `VERIFIED`, `ESTIMATE`, or `NOT_AVAILABLE`.
- [x] Platform neutrality verified across data models, architecture, and API endpoints.
