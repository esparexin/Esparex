# Phase 14: Testing Audit Report

## 1. Executive Summary
A testing audit was conducted on unit, integration, regression, and E2E test suites across the Esparex workspaces. The audit identified critical testing decay where major workspace validation suites are skipped. Specifically, the admin portal's UI and regression tests are completely bypassed in CI/CD, and the user web application's Vitest suite is un-executed by root governance commands.

---

## 2. Scope
This audit evaluated:
- Root test configuration scripts in `package.json`
- Workspace test scripts (`apps/web`, `apps/admin`, `backend/user`, `core`)
- CI/CD workflow mappings (`.github/workflows/ci.yml`)
- Playwright E2E configurations and execution setups

---

## 3. Inventory
- **Unit & Integration Frameworks**: Jest (used in `@esparex/core` and `@esparex/backend-user`), Vitest (used in `@esparex/apps-web`).
- **E2E & UI Smoke Frameworks**: Playwright (used in `@esparex/apps-web` and `@esparex/apps-admin`).
- **Admin Regressions**: Custom script checkers (`guard:admin`, `guard:ui`, `test:settings-regression`, `test:moderation-regression`).

---

## 4. Findings

### Critical Severity Findings
1. **Admin Guardrails and Regression Tests Bypassed in CI/CD Pipeline**
   - **Finding**: The admin portal workspace defines `ci:guardrails` which performs type checking, layout validation, moderation regressions, and settings regressions. However, the root `ci:strict` script (the target executed in `.github/workflows/ci.yml`) only calls `lint:ci`, `type-check`, and `test` (running Jest unit tests on core and backend).
   - **Impact**: Any structural regressions breaking back-office moderation forms or layout elements will bypass the pull request pipelines, posing an operational risk.

---

### High Severity Findings
2. **Frontend Unit Tests (`vitest`) Skipped in All Governance Checks**
   - **Finding**: The customer portal (`apps/web`) contains unit tests mapping hooks and utilities executed via `vitest`. However, the root `npm run test` configuration only invokes `npm test -w @esparex/backend-user && npm test -w @esparex/core`.
   - **Impact**: Client-side logic tests are never executed during pre-commit checks or CI/CD pipelines, leading to quiet test decay.

---

### Medium Severity Findings
3. **Flaky Local Playwright E2E Worker Spawning**
   - **Finding**: `apps/web/package.json` configures local E2E runs via `--workers=4`. However, because the database lacks sandboxing isolates for parallel instances, local executions encounter timing and database state collisions.
   - **Impact**: Generates flaky test failures on local developer runs, which leads to developers disabling or ignoring test output reports.

---

## 5. Evidence

### Bypassed Admin Suite
In [apps/admin/package.json:L18](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/package.json#L18):
```json
"ci:guardrails": "npm run type-check && npm run guard:admin && npm run guard:ui && npm run test:moderation-regression && npm run test:settings-regression",
```
But in [package.json:L60](file:///c:/Users/Administrator/Documents/GitHub/Esparex/package.json#L60):
```json
"ci:strict": "npm run lint:ci && npm run type-check && npm run test",
```
*(No invocation of `ci:admin-guardrails` is included in `ci:strict` or `.github/workflows/ci.yml`)*

### Root Test Script Exclusions
In [package.json:L56](file:///c:/Users/Administrator/Documents/GitHub/Esparex/package.json#L56):
```json
"test": "npm test -w @esparex/backend-user && npm test -w @esparex/core",
```
*(Next.js `apps/web` vitest target is completely omitted).*

---

## 6. Risk Level
- **Overall Testing Risk**: **High**
- Missing automated verification of admin workflows and client-side hooks increases the risk of production deployment regressions.

---

## 7. Recommendations
1. **Unify CI Scripts**: Update the root `ci:strict` script to run admin guardrails and web unit tests alongside backend tests:
   ```json
   "ci:strict": "npm run lint:ci && npm run type-check && npm run test && npm run test -w @esparex/apps-web && npm run ci:admin-guardrails"
   ```
2. **Correct Root Test Target**: Modify the root `test` script to trigger tests in `@esparex/apps-web` as well.
3. **Stabilize E2E Worker Count**: Update local E2E test commands to use sequential execution (`--workers=1`) or implement programmatic database tenant seeding.

---

## 8. Out-of-Scope Items
- Detailed verification of mock database seeding helper integrity.

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 15 — Production Infrastructure & Readiness Audit**.
