# Testing Governance Manual (`TESTING-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** QA lead · Evidence: Vol-2 §27, Vol-4 §40B (coverage), Registration Coverage Matrix Vol-3 C15

---

## 1. Testing pyramid & per-layer standards

| Layer | Tool | Standard |
| --- | --- | --- |
| Unit | vitest/jest | per-package; async/mocks; **web suite MUST run in CI (V2-1 Wave 4)** |
| Integration (core/backend) | supertest/mongodb-memory | per domain contract |
| E2E | Playwright (restored Wave 5) | module journeys J01–J19 + admin |
| A11y | axe-core + keyboard smoke | every release (AGENTS) |
| Visual | Playwright screenshots / visual QA matrix (23 viewports) | `docs/audits/visual-qa-report.md` |
| Performance | Lighthouse CI + k6 (Wave 5) | budgets: LCP<2.5s, CLS<0.1, INP<200ms |

> **Gap status**: `apps/web` tests exist but excluded from `npm test`/CI (V2-1 — Wave 4, Small); admin currently 0 unit tests; contracts/ui/shared 0 tests (Wave 4 adds minimum).

## 2. Coverage thresholds

| Package | Threshold |
| --- | --- |
| backend/api | enforced via CI (≥ current) |
| core | enforced (core highest bar) |
| apps/web | Wave 4: ≥50% statement, ≥40% branch, then raise |
| apps/admin | Wave 4: ≥30% (new logic only) |
| mobile | enforced |
| contracts/ui/shared | Wave 5: ≥20% schema + smoke |

## 3. Acceptance criteria (feature-level)

Every user story/feature defines acceptance as **Given/When/Then** in the PR + a named Journey-Coverage cell:

| Journey | Unit | Integration | E2E |
| --- | --- | --- | --- |
| OTP web / listing web / payments | ✅ | ✅ | Wave 5 |
| Mobile auth (J2) | Wave 0 | Wave 0 | Wave 5 |
| Media upload (J4) | Wave 0 | Wave 0 | Wave 5 |
| Admin plan/geofence (J11) | Wave 0 | Wave 0 | Wave 5 |

## 4. Test hygiene

- Deterministic: no sleeps, no network in unit; mock third-party with contract fixtures.
- Naming: `describe(unit) → it(behavior)` sentence format; assertions over watches.
- No skipped tests (except explicit data-gen windows with reason) — skip = finding.
- Sizing: unit <1s each; integration <10s; e2e <60s per spec.

## 5. Quality gates integration

- GATE-001: unit gate mandatory; e2e mandatory-一旦Wave 5 restored; a11y & visual QA already required (GATE-001 Visual QA, Accessibility rows).
- PR check: `lint:changed` + type-check + affected-package tests; RC: full §suite.

## 6. Coverage tracking

- `npm test` coverage generations to `audit-reports/coverage-*.json` quarterly → entries into `ENGINEERING-METRICS.md`.

---

*Owner: QA; evidenced by Vol-3 C15 matrix; Wave 5 restores Playwright, Wave 4 wires web suite.*