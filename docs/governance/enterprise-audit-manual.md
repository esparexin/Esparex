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