# Esparex Engineering Governance & Audit Manual (`ENTERPRISE-AUDIT-MANUAL.md`)

> **Status:** Living standard — the single authoritative engineering governance document
> **Owner:** Engineering Governance (CODEOWNERS `docs/`) · **Last review:** 2026-08-09
> Volumes 1–5 (`audit-reports/enterprise-*`) are evidence-based certification records produced *by applying* this manual.
> Companion standing docs (do not duplicate here): `ENFORCEMENT_HIERARCHY.md` (repo:gate 5-tier),
> `quality-gates.md` (GATE-001), `risk-register.md` (RISK-001), `requirements-traceability.md`,
> `sprint-execution-prompt.md`, `DELETION_GATE.md`, `PROJECT_PRINCIPLES.md`, AGENTS.md.

### Contents

| § | Section | § | Section |
| --- | --- | --- | --- |
| 1 | Purpose & scope | 11 | Definition of Done |
| 2 | Non-negotiable principles | 12 | Change Impact Analysis |
| 3 | Phase index (60 phases) | 13 | Risk Register Standard |
| 4 | Evidence standards | 14 | Architecture Review Board |
| 5 | Severity & scoring model | 15 | Version Governance |
| 6 | Certification checklists C-1…C-8 | 16 | Release Governance |
| 7 | Scoring contract & certification ladder | 17 | Repository Standards |
| 8 | Governance cadence | 18 | Dependency Governance |
| 9 | Reporting contract | 19 | Audit Exception Process |
| 10 | Engineering Decision Governance (ADR) | 20 | Governance Appendices |
| 10 | Engineering Decision Governance (ADR) | 20 | Governance Appendices |

---

## 1. Purpose & Scope

Define the repeatable, evidence-based method for auditing the Esparex platform across five levels:

| Level | Name | Concern | Source |
| --- | --- | --- | --- |
| L1 | Diagnostic | Modules, code quality, structure | Vol 1–2 (Phases 1–30) |
| L2 | Enterprise | Journeys, APIs, queues, architecture | Vol 3 (Phases 31–40) |
| L3 | Certification | Compliance, infra, AI, production | Vol 4 (Phases 41–50) |
| L4 | Governance | Data, integrations, DR, ops excellence | Vol 5 (Phases 51–60) |
| L5 | *Continuous* | Recurring gates (see Manual §7 + Pipeline) | This manual |

**Scope applies to:** `apps/web`, `apps/admin`, `apps/mobile`, `backend/api`, `core`, `packages/*`, tooling, workflows, and governance artifacts.

---

## 2. Non-negotiable audit principles

1. **Read-only evidence.** No code changes during an audit; findings reference exact file:line + runnable command.
2. **SSOT-first.** Any duplication finding must name the canonical owner per the Ownership Matrix (AGENTS.md).
3. **No aggregate claims.** Every score = table of measured numbers (counts, commands, dates).
4. **Certification after remediation.** Only implement after the audit is signed off and wave approved.
5. **Reproducible commands** — the exact command must live in the finding (`npm run guard:…`, `grep …`, `git …`).
6. **F-Number register.** Every new finding gets an `F-nn`; corrections get a `Corrigendum` entry in the affected volume.

---

## 3. Phase index (60 phases, 5 volumes)

| Vol | Phases | Coverage |
| --- | --- | --- |
| V1 | 1–15 | Modules (shims, dead/orphan code), SSOT register |
| V2 | 16–30 | API flows, frontend connection, business logic, repo structure, TS, React, Next.js, DB integrity, UI/UX, performance, security, testing, deployment, SSO register |
| V3 | 31–40 | User journeys (J01–J22), dependency graph, queues/events, data lifecycle, error envelope, observability, config, compliance, ownership, release readiness |
| V4 | 41–50 | Architecture compliance, repo health, API certification, DB certification, infra, AI, business rules, production simulation (plan), tech-debt register, production certification |
| V5 | 51–60 | Data governance, integrations, feature flags, DR, runbooks, scalability, standards (57), observability maturity, org governance, board certification |

**Phase execution rules:** each phase must open with verdict (🟢/🟡/🔴/❌) + evidence table + open items with `F##`.

---

## 4. Evidence standards

| Evidence class | Rule | Example |
| --- | --- | --- |
| Code evidence | exact path:line + snippet | `core/src/models/AlertDeliveryLog.ts:20` |
| Command evidence | reproduce command + output | `grep -rc "math" core/src --include='*.ts'` |
| Config evidence | file + key + value | `render.yaml` → `OTP_PROVIDER=test` |
| Repo evidence | git cmd + output | `git log --oneline -3` |
| Tool evidence | script name + result | `npm run guard:dead-code` → 0 failures |
| **Never**: hearsay — every claim must link to one of the above. | | |

---

## 5. Severity & scoring model

### Severity

| Severity | Criteria | Example (F#) |
| --- | --- | --- |
| 🔴 CRITICAL | Breaks prod, data loss, auth bypass, money movement | F51 (OTP test provider) |
| 🟠 HIGH | Blocks major flow / GA-certifiable surface | F42 (DLQ write-only) |
| 🟡 MED | Degrades correctness/ops, no immediate blocker | F55 (no tenant config) |
| ⚪ LOW | Hygiene / docs / polish | F54 (ADR index) |

### Scoring contracts (0–100)

| Index | Model |
| --- | --- |
| **Code Health Score** | weighted: strict-ts pass (30), zero critical findings (25), dead/dup (guard output) (15), test green ratio (20), deps clean (10) |
| **Design System Compliance** | `packages/design-tokens` + `guard:typography-ssot` + color-token usage vs literal hex (+suppression count) |
| **Test Coverage** | lines/statements from unit+integration e2e `scripts` (web/backend/mobile), out of 100% per package |
| **Observability Maturity** | 9 checksmap (§58: logs✅, corr-id✅, traces, metrics, dashboards, SLIs, SLOs, budgets) |
| **Production Readiness** | weighted per Vol-4 §50.1 (compliance weights) |
| **Certification levels** | `Development Only` → `Beta Only` → `Soft Launch Only` → `Certified with Conditions` → `Certified for Production` |

---

## 6. The 10 certification checklists (framework add-ons)

Run these checklists at Certification level or before release candidates.

### C‑1 Static Code Analysis Certification
| Check | Tool/Command | Gate |
| --- | --- | --- |
| TS strict | `npm run type-check` | green required |
| Dead code / orphans | `npm run guard:knip`, `guard:dead-code` | 0 new |
| Duplication | `npm run guard:duplicate-code` (jscpd ≤0.15%) | ≤ 0.15% |
| Circular deps | `npm run guard:circular` | 0 circles |
| Type casts | `guard:type-casts` (as Record… <352) | ≤352 cores |
| Dependencies | `guard:dependencies` + `repo:lockfile` | 0 new |
| Secrets | `repo:secret` + CodeQL | 0 hits |
| License | `guard:license` | pass |
| Lint | `npm run lint:ci` (all packages) | 0 errors |

### 6-2 Playwright/E2E Application Certification
- Module-wise coverage: web critical journeys (J01–J19 of audit), admin workflows (plans, geofence detail), mobile responsive (375/1024/1440 viewports), **a11y (WCAG 2.2 AA via axe-core)** on the 5 module templates, visual regression (baseline screenshots in CI artifact dir), performance pass within budget.
- Coverage matrix is maintained in `audit-reports/page-scorecard.csv`.

### 6-3 MongoDB Data Quality Audit
Per collection run: duplicate detection (ObjectId or unique-neutral), orphan refs (referential scan), invalid ObejectId (`mrow(_id)`), missing required fields (vs schema + Mongoose validation), soft-delete consistency (one `isDeleted/deletedAt` per entity), index usage (`$indexStats()`). **Flag duplicates Jira to depart MongoDB.**

### 6-4 API Contract Regression
Auto-diff contracts via `packages/contracts` — for every endpoint list: request/response schema compat, backward compat (compare JSON schema on bump), breaking-change detector (rename/remove field), migration impact matrix. Block PRs on breaking changes unless `ADR-approved`. Gate: `npm run guard:api-surface`.

### 6-5 UI Design System Certification
Gather via `packages/design-tokens` (typography, spacing, colors, radius, dark mode). Compliance check = token usage audit (lint plug + `guard:typography-ssot`) + suppression count zero. Score displayed per app. **Dark mode**: verify all 12 screen templates contrast ≥ 4.5:1.

### 6-6 Performance Benchmark Certification
Backtest baselines against `docs/performance/baseline-report.md` every quarter:
- Web Vitals: TTFB, FCP, LCP, CLS, INP (LCP < 2.5 s, CLS < 0.1)
- API latency P50/P95/P99 (per core route — from prom expiration)
- DB query time (mtop ≥ 30 = FAIL → index review)
- Queue processing (job duration per queue)
- Bundle size budget (web main ≤ 220 KB gzip, admin ≤ 150 KB)
- Memory (node heap RSS dashboard)

### 6-7 Marketplace Domain Validation
Release gate: ad lifecycle (`guard:no-ad-hard-delete`), moderation namespaces (`guard:moderation-namespace`), category hierarchy (contract), business verification (runtime test), wallet ledger integrity (reconciliation query per week), promotion/ranking (behavioral governance flag), smart alerts (delivery-log persist — F43 fix), chat lifecycle, invoice generation, refund (F06 — until implemented, gate **RED**).

### 6-8 Documentation completeness audit
Coverage % = measured for each of std: modules, API, architecture, ADRs, env vars, deployment, runbooks, testing, business rules (via `docs/*` + `ENVIRONMENT_VARIABLES.md`). Target ≥ 90%. Run at every sprint-end.

---

## 7. Scoring contract

| A gate-level score | = | mean of its checklist scores |
| --- | --- | --- |
| **Code Health Score** | SAST (70%) + unit passes (20%) + docs (10%) |
| **Release Certification** | table in §6 with weights from Vol-4 §50 |

Certification levels (must be serialized, no skips):
1. `Development Only` — dev/staging, no prod traffic
2. `Beta Only` — limited cohort, all gates amber-free
3. `Soft Launch Only` — web-only, gates 6-1..6-8 green, F51-class resolved
4. `Certified - Conditions` — mobile BETA etc.
5. `Certified for Production` — GA full certification

---

## 8. Governance cadence (continuous)

| Frequency | Activity | Owner |
| --- | --- | --- |
| Daily | lint:changed, type-check, secret scan on PR | CI |
| Weekly | nightly full suite (unit + e2e + perf), knip, jscpd, npm audit | CI/QA |
| Sprint-end | demo + risk-register update + `repo:governance-report` | Eng/QA |
| Release RC | full §6 certification (all 8 checks) | Release Mgr |
| Quarterly | DR drill, data-quality audit, full audit run (all levels) | Governance |
| Annual | enterprise re-certification (90-day manual) | CTO/Exec |

---

## 9. Reporting contract

Every report must include:
1. Phase verdict + evidence
2. F-item register (new + open-remaining)
3. Scores/tables + commands
4. Certification card (level + conditions)
5. Next PDCA cycle (owners/dates)

Templates live in `audit-reports/` (Volumes 1–5).

---

*Owner: Engineering Governance. Governing doc: AGENTS.md — all scopes.*

---

# PART II — ENGINEERING GOVERNANCE STANDARDS

## 10. Engineering Decision Governance (ADR)

### 10.1 When an ADR is mandatory

| Trigger | Example | Vol evidence |
| --- | --- | --- |
| New architecture / platform change | New package, module boundary change | PADR §5 |
| Database schema changes | New collection, index policy, migration | V4 §44 |
| Breaking API changes | Rename/remove DTO field; new version | V4 §43 |
| Authentication changes | OTP provider, session management | F51/F02 |
| Payment changes | Refund flow, capture policy, provider switch | V2-F06 |
| Infrastructure changes | New service, env separation, DR topology | V4 §45 |
| External integrations | New vendor (SMS, maps, AI) | V5 §52 |
| Shared package creation | `packages/*` addition | AGENTS §ADR |
| Design-system modifications | Tokens, primitives, dark-mode policy | ADR-004/005 trace |

### 10.2 ADR template (aligns with existing `docs/architecture/adr/`)

Every ADR file (`ADR-0NN-slug.md`) must contain: `ID · Date · Status · Decision Reference · Author` + the five mandated sections:

1. **Context** — problem, constraints, current behavior (evidence refs required)
2. **Decision** — the chosen option (explicit)
3. **Alternatives** — ≥2 rejected options with why
4. **Consequences** — trade-offs, migration impact, breakage list
5. **Rollback strategy** — revert mirror to wave design (R1/R2/R3)
6. **Approval** — ARB quorum record (§14); status flips `Draft → Proposed → Approved/Rejected`

Files live in `docs/architecture/adr/`; the repo must maintain an ADR **index** (today: ADR-004/005 only — index + 001–003 backlog tracked as F54).

### 10.3 Enforcement
`guard:pr-impact-analysis` on PRs touching core/contracts/platform; missing ADR = RED gate.

---

## 11. Definition of Done (mandatory per feature/release)

Every feature PR must prove, in its description:

| Step | Gate | Automated |
| --- | --- | --- |
| Build passes | `npm run build` | ✅ |
| Type check passes | `npm run type-check` | ✅ |
| Unit + integration pass | `npm test` (all suites incl. web — V2-1) | ✅ |
| Playwright passes | e2e suite (Wave 5; RC mandatory) | ⚠️ pending suite |
| Docs updated | `docs/**` + manual §6-8 coverage check | 🟡 |
| API contract updated | `@esparex/contracts` + `guard:api-surface` | ✅ |
| ADR completed (if §10.1 applies) | ADR file + index row | 🟡 |
| Security review complete | `repo:secret` + ARB/Security owner sign-off | ✅ (auto) + manual |
| Performance verified | budgets per `baseline-report.md` (LCP<2.5s, CLS<0.1) | 🟡 |
| Accessibility verified | WCAG 2.2 AA — axe + focus-ring + keyboard (AGENTS) | 🟡 |
| Reviewer approval | CODEOWNERS reviewer + ARB when triggered | ✅ (manual) |

Cross-reference: GATE-001 (`quality-gates.md`), `ENFORCEMENT_HIERARCHY.md` ("one repo → one `repo:gate`"), PR checklist in `.github/PULL_REQUEST_TEMPLATE.md`.

**Supplement rules:** zero new suppressions; release evidence bundle per REV-001 (`docs/releases/release-v1.x.x/`).

---

## 12. Change Impact Analysis (every change)

Mandatory section in PR descriptions for any PR touching **core, contracts, backend, or platform**:

| Field | Required output |
| --- | --- |
| Affected modules | list of domains/packages |
| Affected APIs | route + contract diff |
| Database changes | model/index/migration plan |
| UI changes | screens + design-token impact |
| Mobile impact | parity changes (web/mobile drift risk) |
| Admin impact | admin surfaces + guards |
| Third-party integrations | vendors touched (§52-listed?) |
| Migration requirements | data migration plan or "none" |
| Rollback plan | R1/R2/R3 (revert / flag / migration-back) |

Gate: `npm run guard:pr-impact-analysis` — fail if CIA block absent on qualifying PRs.

---

## 13. Risk Register Standard

Operational register: `docs/governance/risk-register.md` (RISK-001). Standard entry card:

| Field | Spec |
| --- | --- |
| Risk ID | `R-NNN` (finding-linked: `R-00n` ← `F##`) |
| Probability | Low <20% · Med 20–50% · High >50% |
| Impact | Low/Med/High (criteria in register) |
| Severity | derived = P×I matrix (med/high/critical) |
| Mitigation | concrete action + owner |
| Owner | named (team/person) |
| Target completion | date |
| Status | Open → In Progress → Mitigated/Closed |

**Audit link rule:** every open 🔴/🟠 audit finding MUST have a matching R-nnn row; Risk Register review is a sprint-end cadence item (§8) and Release RC item.

---

## 14. Architecture Review Board (ARB)

**Membership (by role):** Core Lead · Backend Lead · Mobile Lead · Web Lead · SRE/DevOps · Security · Docs Owner. Server representative: CODEOWNERS area leads.

**Approvals scope** (quorum 3 incl. security for security-flagged):

| Change class | Approver |
| --- | --- |
| New modules / new packages | ARB |
| Shared-package changes (contracts/ui/shared/core exports) | ARB + CODEOWNERS |
| Database schema changes | ARB + backend lead |
| API versioning / breaking changes | ARB + contracts owner |
| Infrastructure changes | ARB + SRE |
| Auth/payment/security changes | ARB + Security owner |

**Process:** decision record → ADR (if mandatory) → vote in 48h timebox → minuted in `decision-register.md` → scored gate.

---

## 15. Version Governance

Semver applied consistently; breaking bumps require ADR + ARB:

| Artifact | Scheme | Notes |
| --- | --- | --- |
| APIs | path version (`/api/v{n}`) + semver contract | no silent breaking changes |
| `@esparex/contracts` | semver MAJOR on any break; MINOR/PATCH additive | SSOT owner |
| core / shared / ui / mobile-ui | semver (package.json) | — |
| Packages (`packages/*`) | semver + changelog per package | — |
| Mobile app | app-version `x.y.z` + build number | store parity |
| Web / Admin | tag `vX.Y.Z` per release (repo tags exist: v2.9.0…) | CI cut |
| Database | migration version (progressive, backward-safe) | ir-revocable rule |
| Documentation | dated, changelog-per-doc | |

Release-tag evidence: git tags `v2.9.0` pattern — keep; branches empty on tags.

---

## 16. Release Governance

### 16.1 Environments & promotion ladder

| Env | Deploys from | Gate to promote | Owner |
| --- | --- | --- | --- |
| Local | feature branch | — | dev |
| Development | develop (CI) | guard set | ENG |

| QA | RC candidate | QA suite + gate §6 | QA |
| Staging | RC (full cert suite) | cert §6 green + SLO smoke | Release mgr |
| UAT | staging snapshot | UAT sign-off | PM/Product |
| Production | prod branch / tag vX.Y.Z | RC card + ARB + rollback plan | Release mgr + CTO |

### 16.2 Promotion rules
- No skip of levels (except hotfix, with ARB + revert-window).
- Each promote must show evidence: guard-logs, test report, RC card (`docs/releases/release-v1.x.x/` per REV-001), and current certification level.
- Feature flags = promote-deny switch: any flag-false feature is not available in prod rollout.

---

## 17. Repository Standards

| Concern | Standard |
| --- | --- |
| Branch naming | `main` (protected) · `develop` · `feat/<issue>-<slug>` · `fix/<slug>` · `chore/<slug>` · `archive/*` |
| Commit messages | Conventional Commits `<type>(<scope>): <summary>` |
| PR naming | `<type>(<scope>): <issue?summary>` |
| Labels | required: `feature|fix|chore|security|refactor` + severity + `wave-N` |
| Milestones | wave milestones with gate dates |
| Release tags | `vMAJOR.MINOR.PATCH` (+ rc/n for candidates) |
| CODEOWNERS | 38 lines; reviewers respond ≤48h; no silence-merge without approval; exceptions auto-flag |

Enforced by `repo:branch-protection` + `repo:lockfile` + `guard:pr-quality`; hygiene audit = §42 cadence.

---

## 18. Dependency Governance

| Policy | Rule |
| --- | --- |
| Upgrade cadence | dependabot weekly (npm + actions); review within 7d |
| Security patch windows | CRITICAL ≤ 48h, HIGH ≤ 7d, MEDIUM ≤ 30d |
| Deprecated package removal | flagged → removal plan → removed within 1 quarter |
| License review | `npm run guard:license` (allowlist) |
| Vendor risk assessment | required for NEW integrations (V5 §52 attrib; ARB + Security) |

Enforced: `guard:dependencies`, `repo:lockfile`, `repo:secret` nightly + release candidate.

---

## 19. Audit Exception (Waiver) Process

| Rule | Text |
| --- | --- |
| No permanent exceptions | every exception has an expiration (auto-expire) |
| Exception fields | EX-ID · Reason · Business justification · Expiration · Approval (ARB + Release mgr) · Review date |
| Location | `.governance/waivers/*` (mirror in risk register) |
| Lifecycle | Open → Active → Expired → Retired (retired = remediation issue) |
| Gate | an active exception on a release-critical item blocks certification level |

**Current state (2026-08-09):** WAIVER-001/002 active, **expire 2026-08-15** — must be retired or renewed with review before expiry (Vol 3 §39).

---

## 20. Governance Appendices

### A. Document index (authoritative)
| Doc | Role |
| --- | --- |
| AGENTS.md | Architecture & governance rules (SSOT) |
| This manual | methodology + standards (§1–19) |
| `quality-gates.md` (GATE-001) | mandatory gate list |
| `risk-register.md` (RISK-001) | operational risk |
| `ENFORCEMENT_HIERARCHY.md` | 5-tier repo:gate |
| PLATFORM_ARCHITECTURE.md (PADR §5) | architecture decisions |
| ARCHITECTURE_CHECKLIST.md | review checklist |
| Volumes 1–5 `audit-reports/` | certification record |

### B. Glossary
SSOT · guard (`npm run guard:*`) · gate (repo:gate) · wave (remediation program) · RC (release candidate) · ARB (Architecture Review Board) · CIA (change impact analysis) · SLI/SLO · DoD (Definition of Done) · EX (exception).

### C. Templates (created by this standard)
ADR (`docs/architecture/adr/`) · PR CIA block · risk register rows · exception card · RC certification card.

---

*Owner: Engineering Governance · This manual is the single governing standard; Volumes 1–5 remain the evidence records of the 2026-08 certification cycle.*