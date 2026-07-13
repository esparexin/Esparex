# Testing Stack Conventions

This document maps the testing frameworks and guidelines for the monorepo workspaces.

---

## 1. Approved Testing Tools

We use specific testing tools per package:

- **Core Layer (`core`)**: Jest + `ts-jest`.
- **Backend API (`backend/api`)**: Jest + `ts-jest` + `light-my-request`.
- **Web App (`apps/web`)**: Vitest (unit tests) + Playwright (E2E tests).
- **Admin App (`apps/admin`)**: Playwright (regression and E2E tests).

---

## 2. Test Execution Commands

- **Run all unit/integration tests**:
  ```bash
  npm run test
  ```
- **Run frontend E2E regression tests**:
  ```bash
  npm run e2e
  ```
- **Run code coverage checks**:
  ```bash
  npm run test:coverage
  ```

---

## 3. Test Invariants
- **No Skips in CI**: Skip blocks (`describe.skip`, `it.skip`) must not be committed to integration test suites.
- **Coverage Boundaries**: New logic additions must satisfy the workspace-specific coverage minimum threshold (measured by Jest/Vitest reports).
