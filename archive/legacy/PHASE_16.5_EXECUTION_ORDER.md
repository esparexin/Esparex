# Phase 16.5: Cleanup Execution Order Playbook

This document serves as the step-by-step operational playbook for executing the approved cleanups in structured, reviewable pull requests. Each PR must be followed by full verification checks before merging.

---

## 📅 PR Execution Sequence

### PR 1: Safe Deletions & Git Hygiene (Risk: Low)
Goal: Remove dead files, stubs, and committed testing logs to clean the git index.

1. **Delete Empty Stubs and Dead Files**:
   - Delete `apps/web/src/hooks/useImageDomainSync.ts`
   - Delete `backend/user/src/controllers/admin/adminCatalogSyncController.ts`
   - Delete `core/src/services/ChatService.ts`
   - Delete top-level empty stub directory `shared/constants/`
2. **Remove Committed Testing Artifacts**:
   - Run `git rm` on `apps/admin/test.png`
   - Run `git rm` on `apps/web/playwright-account-profile.png`
   - Run `git rm` on `apps/web/playwright-account-settings.png`
   - Run `git rm` on `apps/web/test-output.txt`
   - Run `git rm` on `apps/web/test-output-debug.txt`
3. **Stop Tracking Cache Files**:
   - Run `git rm --cached` on any remaining `tsconfig.tsbuildinfo` files.
   - Run `git rm --cached -r` on `.eslintcache` folders.
4. **Fix Navigation Index Paths**:
   - Edit `docs/00-index.md` to replace absolute paths (`file:///Users/admin/...`) with relative links.
5. **Add Prettier Config**:
   - Create a root `.prettierrc` configuration file.

*PR 1 Verification*:
```bash
git status # Ensure no untracked/modified screenshot files remain
npm run lint
npm run build
```

---

### PR 2: Duplicate Removals & De-duplication (Risk: Low-Medium)
Goal: Eliminate redundant file paths, enums, route definitions, and payment reconciliation codes.

1. **Retire Redundant Status Enums**:
   - Delete `shared/src/enums/adStatus.ts` and `shared/src/enums/listingStatus.ts`.
   - Update all backend and frontend imports to use `LIFECYCLE_STATUS` from `shared/src/enums/lifecycle.ts` directly.
2. **Consolidate Duplicate Payment Jobs**:
   - Remove duplicate `core/src/jobs/reconcilePayments.ts` (keeping the job wrapper `reconcilePayments.job.ts` or vice versa depending on imports).
3. **Prune Duplicate Route Verbs**:
   - Edit `backend/user/src/routes/adminRoutes.ts` to remove duplicate `POST` registrations for listing moderation endpoints, leaving only the canonical `PATCH` methods.

*PR 2 Verification*:
```bash
npm run type-check
npm test
npm run build
```

---

### PR 3: Folder Structure Moves & Scripts Organization (Risk: Medium)
Goal: Restructure flat scripts and isolate database migrations.

1. **Re-organize `scripts/`**:
   - Move all `enforce-*` and `guard-*` scripts to `scripts/governance/`.
   - Move database migrations (`migrate-roles.ts`, `migrate-user-type.ts`, etc.) to `scripts/migrations/`.
   - Move e2e execution scripts to `scripts/testing/`.
   - Move cleanup and tech debt analyzers to `scripts/utils/`.
2. **Archive Run-Once Catalog Remediation Scripts**:
   - Move one-off catalog stabilization scripts (`catalog-null-canonical-remediation.js`, `catalog-status-remediation.js`, `catalog-strict-collision-remediation.js`) to `archive/legacy/`.
3. **Update Package Scripts**:
   - Refactor root and workspace `package.json` script declarations to reflect new script paths.

*PR 3 Verification*:
```bash
npm run governance:all
```

---

### PR 4: Package Boundary & Config Parity Fixes (Risk: Medium)
Goal: Correct boundary violations and compile mismatches.

1. **Decouple React Hooks from Shared Workspace**:
   - Relocate `usePopupQueue.ts` hook out of `@esparex/shared` into `@esparex/apps-web` hooks directory and prune shared barrel index exports.
2. **Consolidate Admin Route Ingress Gates**:
   - Mount `adminCatalogRoutes` and `adminCatalogRequestRoutes` inside `adminRoutes.ts` directly.
   - Mount `adminRoutes` at `/api/v1/admin` in `app.ts` as a unified administrator endpoint gateway.
3. **Align TS compiler configurations**:
   - Set `"composite": true` in `core/tsconfig.json` to match root project references.
4. **Synchronize TS & Sentry Versions**:
   - Align package.json dependencies for Sentry and TypeScript.

*PR 4 Verification*:
```bash
npm run type-check
npm run build
```

---

### PR 5: Domain Refactoring & Database Index Optimization (Risk: High)
Goal: Restructure location engine paths, group ad services, and prune index sprawl.

1. **Group Classified Listings (Ad) Services**:
   - Move the 9 flat services in `core/src/services/` (e.g. `AdCreationService.ts`) into `core/src/services/ad/` subdirectory and update imports.
2. **Unify Geolocation (Location) Logic**:
   - Relocate geolocation algorithms and primitives from duplicate utility files into a single, clean module: `shared/src/location/`.
3. **Classified Ads Index Optimization**:
   - Audit the `AdSchema` class in `Ad.ts` to prune redundant and overlapping indexes (reducing the index footprint to optimize write speed).
4. **Establish Collection Name Alignment**:
   - Add `{ collection: 'listings' }` in `AdSchema` configuration to align runtime collections with SSOT documentation, or update SSOT mappings.

*PR 5 Verification*:
```bash
npm run type-check
npm test
npm run build
```

---

## 🧪 Post-PR Verification Protocol

For **every** PR, developers and CI engines must execute the following sequence:

1. **Clean Installation**:
   ```bash
   npm install --no-engine-strict
   ```
2. **Type Safety & Lint check**:
   ```bash
   npm run type-check
   npm run lint:ci
   ```
3. **Test Suites**:
   ```bash
   npm run test
   ```
4. **Build Compilation**:
   ```bash
   npm run build
   ```
