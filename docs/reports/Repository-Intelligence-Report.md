# Repository Intelligence Report

**Initiative:** Kernel Audit & Refinement  
**Phase:** 1 — Repository Intelligence Audit  
**Date:** 2026-07-20  
**Branch:** `chore/kernel-audit-refinement`

---

## 1. Repository Structure

### 1.1 Workspace Inventory

| Layer | Packages | Status |
|-------|----------|--------|
| **Applications** | `apps/admin`, `apps/web` | Active |
| **Mobile** | `apps/mobile` (Capacitor, not an npm workspace) | Active |
| **API Gateway** | `backend/api` | Active |
| **Core Domain** | `core` (Hexagonal + DDD, 87 services, 60 models) | Active |
| **Shared Contracts** | `shared`, `packages/contracts` | Active |
| **UI** | `packages/ui` | Active |
| **Stub Packages (empty)** | `packages/config`, `packages/feature-flags`, `packages/logger`, `packages/observability`, `packages/platform`, `packages/sdk`, `packages/testing`, `packages/validation`, `packages/kernel` | **9 packages, all `index.ts` only** |
| **Domain Stubs (empty)** | `packages/domain/admin`, `packages/domain/ai`, `packages/domain/analytics`, `packages/domain/audit`, `packages/domain/authentication`, `packages/domain/authorization`, `packages/domain/businesses`, `packages/domain/catalog`, `packages/domain/chat`, `packages/domain/identity`, `packages/domain/listings`, `packages/domain/media`, `packages/domain/notifications`, `packages/domain/payments`, `packages/domain/reports`, `packages/domain/search`, `packages/domain/smart-alerts`, `packages/domain/users`, `packages/domain/workflow` | **19 packages, all `index.ts` only** |

### 1.2 Internal Dependency Graph

```
@esparex/apps-web     → contracts, shared, ui
@esparex/apps-admin   → contracts, shared, ui
@esparex/backend-api  → contracts, shared, core
@esparex/core         → contracts, shared
@esparex/shared       → contracts
@esparex/ui           → shared
```

**28 internal packages are never imported by any consumer** — all domain stubs + 9 stub packages.

---

## 2. Large Files & Hotspots

### 2.1 Largest Source Files (>500 lines)

| Lines | File | Concern |
|-------|------|---------|
| 1,380 | `apps/web/src/styles/chat.css` | Very large static CSS — could benefit from modularization |
| 580 | `core/src/config/db.ts` | Database configuration sprawl |
| 555 | `apps/web/src/components/user/ListingDetail.tsx` | Largest React component — consider decomposition |
| 547 | `apps/web/src/context/AuthContext.tsx` | Large context — consider splitting |
| 543 | `apps/admin/src/app/(protected)/(catalog)/locations/page.tsx` | Large admin page |
| 530 | `apps/web/src/lib/api/client.ts` | Large API client |
| 529 | `apps/web/src/lib/location/locationService.ts` | — |
| 529 | `apps/web/src/components/user/SavedAds.tsx` | — |
| 529 | `apps/web/src/components/location/LocationSelector.tsx` | — |
| 519 | `core/src/models/Ad.ts` | Largest model |
| 516 | `apps/admin/src/app/(protected)/ads/AdsView.tsx` | — |
| 512 | `tooling/architecture/lib/reporter.ts` | — |
| 512 | `apps/web/src/lib/validation.ts` | — |
| 505 | `apps/web/src/context/LocationContext.tsx` | — |
| 501 | `core/src/services/SmartAlertService.ts` | — |

### 2.2 Build Artifacts (can be gitignored)

| File | Size | Action |
|------|------|--------|
| `graphify-out/graph.json` | 15 MB | Consider gitignoring |
| `graphify-out/.graphify_detect.json` | 405 KB | Consider gitignoring |
| `graphify-out/cache/stat-index.json` | 390 KB | Consider gitignoring |
| `graphify-out/manifest.json` | 349 KB | Consider gitignoring |
| `eslint-baseline.json` | 1.0 MB | **Keep** — used for CI enforcement |
| `ci-lint-results.json` | 1.4 MB | Consider gitignoring |
| `apps/admin/tsconfig.tsbuildinfo` | 342 KB | Should be gitignored |
| `apps/web/tsconfig.tsbuildinfo` | 376 KB | Should be gitignored |
| `.eslintcache/{web,core}` | ~500 KB combined | Already partially gitignored |

**Note:** `tsconfig.tsbuildinfo` files are already in `.gitignore` but still present in the working tree (previously committed). They will stop being tracked after one more commit.

---

## 3. Code Quality Signals

### 3.1 Technical Debt Markers

| Category | Count | Details |
|----------|-------|---------|
| `TODO` | 1 | `core/src/services/ListingSubmissionPolicy.ts:53` |
| `FIXME` | 0 | Clean |
| `HACK` | 0 | Clean |
| `XXX` | 0 | Clean |
| `@deprecated` | 18 | 8 files, mostly in shared contracts + location |
| `@ts-ignore`/`@ts-expect-error` | 0 | Clean (ignoring generated `.next` files) |
| `console.log` (production) | ~50 | ~8 files: kernel/Result.ts, validateEnv.ts, tooling/*, logger.ts, verify-architecture.ts |
| Commented-out code | 16 | 8 files |

### 3.2 `console.log` in Production Code

| File | Lines | Priority |
|------|-------|----------|
| `packages/kernel/src/domain/Result.ts:25` | 1 | Low — Result pattern debug log |
| `core/src/config/validateEnv.ts:171-180` | 10 | **Medium** — diagnostic logs in production path |
| `shared/src/observability/logger.ts:114` | 1 | Low — HTTP log formatter |
| `tooling/architecture/report.ts:80` | 1 | Low — CLI tool output |
| `tooling/architecture/verify-architecture.ts` | ~10 | Low — CLI tool output |
| `tooling/architecture/generate-domain.ts` | ~10 | Low — CLI tool output |
| `tooling/architecture/registry.ts:121` | 1 | Low — CLI tool output |
| `tooling/architecture/index.ts` | ~16 | Low — CLI tool output |

---

## 4. Dependencies

### 4.1 Version Conflicts

| Package | Version 1 | Workspace | Version 2 | Workspace |
|---------|-----------|-----------|-----------|-----------|
| `@bull-board/api` | `^7.0.0` | core | `^6.20.3` | backend/api |
| `@bull-board/express` | `^7.0.0` | core | `^6.20.3` | backend/api |
| `@sentry/node` | `^8.26.0` | shared | `^10.51.0` | core, backend/api |
| `uuid` | `^9.0.0` | shared/observability | `^13.0.0` | core, backend/api |
| `lucide-react` | `^0.473.0` | packages/ui | `^0.562.0` | apps/web, apps/admin |
| `slugify` | `^1.6.9` | shared | `^1.6.6` | core, backend/api |
| `zod` | `^3.22.4` | packages/contracts | `^3.25.76` | shared, core, backend, apps |
| `react-hook-form` | `^7.72.1` | apps/admin | `^7.69.0` | apps/web |
| `recharts` | `^3.7.0` | apps/admin | `^3.5.1` | apps/web |

**Critical:** `@bull-board` version mismatch (v6 vs v7) between backend/api and core likely causes runtime errors if both are loaded.

### 4.2 Outdated / Legacy Dependencies

| Package | Version | Issue |
|---------|---------|-------|
| `speakeasy` | `^2.0.0` | Unmaintained since 2017 — replace with `otplib` |
| `heic2any` | `^0.0.4` | Pre-1.0, no stable release |
| `crypto-js` | `^4.2.0` | Not actively maintained, security concerns |
| `tsconfig-paths` | `^3.15.0` | Major version behind (v4 available) |
| `@types/nanoid` | `^2.1.0` | Incompatible with nanoid v3 API |

### 4.3 Unused / Suspicious Dependencies

| Package | In Workspace | Issue |
|---------|-------------|-------|
| `@types/validator` | root | Not imported anywhere |
| `@types/js-yaml` | root | Not imported anywhere |
| `@emnapi/runtime` | root (optional) | Leftover? |
| `pm2` | root | No script or config references it |
| `semantic-release` | root | No `.releaserc` found |
| `@types/ioredis` | backend/api | ioredis v5 ships own types |
| `csv-parser` | backend/api | Verify if still used |

### 4.4 Missing `@types/*`

| Missing | For Package | In Workspace |
|---------|-------------|-------------|
| `@types/bcryptjs` | bcryptjs | core, backend/api |
| `@types/dotenv` | dotenv | core, backend/api, apps/web |
| `@types/sanitize-html` | sanitize-html | core (present in backend/api) |

### 4.5 Misclassified Dependencies

| Package | Workspace | Should Be |
|---------|-----------|-----------|
| `ts-node` | backend/api devDeps | `dependencies` (used in runtime scripts) |
| `tsconfig-paths` | backend/api devDeps | `dependencies` (runtime registration) |
| `nodemon` | backend/api devDeps | Correct (dev only) |

---

## 5. TypeScript Configuration

### 5.1 Module System Fragmentation

| Module System | Packages | Count |
|--------------|----------|-------|
| `NodeNext` | root, packages/contracts, packages/ui, all stubs, all domain stubs | ~30 |
| `Node16` | shared | 1 |
| `commonjs` | core, backend/api, tooling/architecture | 3 |
| `bundler` + `esnext` | apps/web, apps/admin | 2 |

### 5.2 Strict Mode Gaps

| Flag | Enabled In | Missing From |
|------|-----------|-------------|
| `noUncheckedIndexedAccess` | apps/web, apps/admin | core, backend/api, shared |
| `noImplicitOverride` | apps/web, apps/admin | core, backend/api, shared |
| `noUnusedLocals`/`noUnusedParameters` | apps/web | Everyone else |
| `exactOptionalPropertyTypes` | apps/web (strict tsconfig) | Everyone else |
| `forceConsistentCasingInFileNames` | apps/web, apps/admin | core, backend/api |

### 5.3 Other Issues

| Issue | Detail |
|-------|--------|
| `DOM` lib in backend | `backend/api/tsconfig.json` includes `"DOM"` — unnecessary for Node.js |
| `composite: false` in core | Prevents project reference graph from core → contracts |
| Duplicated `paths` | Same aliases defined in 6 tsconfigs with different resolutions |
| `skipLibCheck: true` everywhere | Hides `.d.ts` type issues |

---

## 6. Security

### 🔴 CRITICAL: Hardcoded Credentials in `.env`

`core/.env` and `backend/api/.env` contain:

| Secret | Value Pattern |
|--------|---------------|
| `MONGODB_URI` | Connection string with user/password |
| `ADMIN_MONGODB_URI` | Connection string with user/password |
| `REDIS_URL` | URL with password |
| `AWS_ACCESS_KEY_ID` | Plaintext key |
| `AWS_SECRET_ACCESS_KEY` | Plaintext secret |
| `JWT_SECRET` | Base64-encoded secret |
| `REFRESH_TOKEN_SECRET` | Base64-encoded secret |
| `CSRF_SECRET` | Base64-encoded secret |

These files are **version-controlled** (not in `.gitignore`). While likely development-only credentials, they represent a significant security risk.

---

## 7. Configuration

| Issue | Detail | Severity |
|-------|--------|----------|
| `knip.json` schema mismatch | Config targets `knip@5` but installed `knip@^6.26.0` | 🟡 HIGH |
| `.npmrc` conflict | `engine-strict=true` followed by `engine-strict=false` on adjacent lines | 🔵 LOW |
| `NEXT_PUBLIC_HMAC_SECRET` | Used in API client but not documented in any `.env.example` | 🔵 LOW |
| `BACKEND_INTERNAL_URL` | Used in sitemap.ts + playwright config but no `.env.example` entry | 🔵 LOW |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Used in webPush.ts but no `.env.example` | 🔵 LOW |

---

## 8. Unused/Orphaned Files

| Path | Reason |
|------|--------|
| `.scratch/` | Temp fix scripts, likely post-migration cleanup |
| `scratch/` | Same |
| `git-mcp/` | Empty directory |
| `audit-reports/` | Historical JSCPD/Knip reports — static artifacts |
| `graphify-out/` | Knowledge graph output — generated artifact |
| `build.log` | Build output log |
| `tests.log` | Test output log |
| `type_check.log` | Type check output log |
| `ci-lint-results.json` | CI artifact |

---

## 9. Summary of Actionable Findings

### 🔴 Critical (must fix)

| # | Finding | Location |
|---|---------|----------|
| 1 | Hardcoded DB/Redis/AWS credentials in version control | `core/.env`, `backend/api/.env` |
| 2 | `@bull-board` major version mismatch (v6 vs v7) | `backend/api` vs `core` |

### 🟡 High Priority

| # | Finding | Recommendation |
|---|---------|---------------|
| 3 | 28 empty stub packages registered in workspace | Archive or populate |
| 4 | 3 different module systems — risk of build breaks | Harmonize to unified strategy |
| 5 | `knip.json` targeting v5 but v6 installed | Regenerate config |
| 6 | `ts-node`/`tsconfig-paths` in devDeps but used at runtime | Move to `dependencies` |
| 7 | `console.log` in production validation path | Replace with proper logger |
| 8 | `speakeasy` unmaintained since 2017 | Replace with `otplib` |

### 🟡 Medium Priority

| # | Finding | Recommendation |
|---|---------|---------------|
| 9 | 19 version conflicts across workspaces | Reconcile to single versions |
| 10 | Missing `@types` for bcryptjs, dotenv, sanitize-html | Add type packages |
| 11 | `DOM` lib in backend tsconfig | Remove from `backend/api` |
| 12 | `composite: false` in core | Enable for project references |
| 13 | Strict mode gaps in backend packages | Enable `noUncheckedIndexedAccess` + `noImplicitOverride` |
| 14 | `slugify`, `uuid` version drift | Unify across workspaces |

### 🔵 Low Priority

| # | Finding | Recommendation |
|---|---------|---------------|
| 15 | Build artifacts tracked in git: `tsbuildinfo`, `graphify-out/`, logs | Add to `.gitignore`, clean with `git rm` |
| 16 | 1 TODO and 18 @deprecated markers | Address at convenience |
| 17 | Missing `.env.example` entries for 3 env vars | Document |
| 18 | `.npmrc` engine-strict conflict | Fix |
| 19 | 900+ line chat.css | Consider modularization |
| 20 | DOM lib in backend, minor tsconfig inconsistencies | Incremental fixes |

---

*End of Repository Intelligence Report — generated 2026-07-20*
