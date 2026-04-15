# Esparex Engineering Roadmap

> Single reference for what we are doing, why, and how.  
> Last updated: 2026-04-15

---

## Completed milestones

| # | Work | Outcome |
|---|------|---------|
| M1 | **SSOT Refactor** — 27 controllers moved all DB access to service layer | Zero runtime model imports in `controllers/`; see `SSOT_REFACTOR.md` |
| M2 | **`no-explicit-any` elimination** — 434 violations across ~60 files | 0 violations; `tsc --noEmit` clean |

---

## Active track — Code Quality & Safety

### Track A — Typed linting (`no-unsafe-*`)

**Why:** After removing `any`, many `unknown` casts are used as a shortcut. The `no-unsafe-*` rules
catch places where `unknown` values are silently treated as typed without a narrowing guard — the
next class of runtime crashes. They require TypeScript's type information at lint time.

**What the rules catch:**
| Rule | Catches |
|------|---------|
| `no-unsafe-assignment` | Assigning an `any`-typed expression to a typed variable |
| `no-unsafe-call` | Calling something typed as `any` |
| `no-unsafe-member-access` | Accessing `.prop` on an `any`-typed value |
| `no-unsafe-return` | Returning `any` from a typed function |
| `no-unsafe-argument` | Passing `any` into a typed parameter |

**Status:** Enabled as `warn` in `backend/eslint.config.mjs`. Baseline measured 2026-04-15.

**Baseline counts (source files only, test files excluded):**

| Rule | Count | Fix pattern |
|------|------:|-------------|
| `no-unsafe-member-access` | 346 | Add `as TypedInterface` narrowing before access |
| `no-unsafe-assignment` | 339 | Add type annotation or cast |
| `no-unsafe-argument` | 110 | Cast argument to expected type |
| `no-unsafe-call` | 64 | Type the function reference |
| `no-unsafe-return` | 19 | Add return type annotation |
| **Total** | **878** | |

**Also enabled from `recommendedTypeChecked` (warn, fix alongside):**

| Rule | Count | Fix pattern |
|------|------:|-------------|
| `no-unnecessary-type-assertion` | 90 | Remove redundant `as X` cast (auto-fixable) |
| `require-await` | 34 | Remove `async` keyword where no `await` used |
| `restrict-template-expressions` | 24 | Wrap non-string values in `String()` |
| `no-floating-promises` | 19 | Add `await` or `void` operator |
| `no-misused-promises` | 13 | Use `void fn()` or fix callback signatures |
| `no-unsafe-enum-comparison` | 13 | Cast comparison operand |
| `unbound-method` | 5 | Use arrow function or `.bind(this)` |
| `prefer-promise-reject-errors` | 2 | Wrap rejection with `new Error(...)` |
| **Total** | **200** | |

**Grand total: 1078 warnings, 0 errors.**

**Process:**
1. ✅ Add type-aware parser config to `backend/eslint.config.mjs`
2. ✅ Run to get baseline count per rule
3. Fix `no-unnecessary-type-assertion` first (auto-fixable — `eslint --fix`)
4. Fix remaining rules rule-by-rule, promote each to `"error"` when 0 violations

**File:** `backend/eslint.config.mjs`

---

### Track B — ESLint zero-warnings target

**Why:** Warnings that never get fixed become noise. Every rule should be either `error` (enforced)
or `off` (consciously skipped). The governance phase promoted everything to `warn`; now we graduate
each rule after fixing its violations.

**Current state (2026-04-15):**

```
Total errors:   0
Total warnings: 0
```

Rules currently set to `warn` in `backend/eslint.config.mjs`:

| Rule | Current | Target | Blocker |
|------|---------|--------|---------|
| `@typescript-eslint/no-explicit-any` | `warn` | `error` | Done — 0 violations |
| `@typescript-eslint/no-empty-object-type` | `warn` | `error` | Needs baseline count |
| `@typescript-eslint/no-require-imports` | `warn` | `error` | Needs baseline count |
| `@typescript-eslint/no-unused-expressions` | `warn` | `error` | Needs baseline count |
| `@typescript-eslint/no-namespace` | `warn` | `error` | Needs baseline count |
| `@typescript-eslint/ban-ts-comment` | `warn` | `error` | Needs baseline count |
| `unused-imports/no-unused-imports` | `warn` | `error` | Needs baseline count |
| `unused-imports/no-unused-vars` | `warn` | `error` | Needs baseline count |
| `no-console` | `warn` | `error` | Intentional in logger; needs per-file audit |

**Process:** For each rule — run, count, fix or add justified `// eslint-disable` comment, promote to `error`.

---

### Track C — Circular dependency audit

**Why:** The SSOT refactor created 13 new services and extended 8 others. Service-to-service imports
can create cycles (`ServiceA → ServiceB → ServiceA`) that cause `undefined` at module init time —
silent bugs that only appear under certain import orderings.

**Tool:** `madge` — installed at workspace root.

```bash
node_modules/.bin/madge --circular --extensions ts backend/src
```

**Baseline: 7 cycles found (2026-04-15)**

| # | Cycle | Type | Priority |
|---|-------|------|----------|
| 1 | `models/Location.ts → utils/locationInputNormalizer.ts` | Value | High |
| 2 | `models/Location.ts → utils/locationInputNormalizer.ts → utils/locationHierarchy.ts` | Value | High |
| 3 | `utils/locationInputNormalizer.ts → utils/locationHierarchy.ts` | Value | Medium |
| 4 | `events/index.ts → events/listeners/CatalogPromotionListener.ts` | Value | Medium |
| 5 | `services/location/LocationNormalizer.ts → _shared/locationServiceBase.ts → _shared/hierarchyLoader.ts` | Value | Medium |
| 6 | `services/AdService.ts → services/AdOrchestrator.ts` | **Value — God service** | **Critical** |
| 7 | `services/NotificationService.ts → services/notification/NotificationDispatcher.ts` | Value | Medium |

**Fix strategy:**
- **Cycle 6 (AdService ↔ AdOrchestrator):** `AdService.ts` imports `AdOrchestrator` to re-export
  `createAd`. The fix: remove the re-export from `AdService.ts`; callers should import directly
  from `AdOrchestrator.ts`.
- **Location cycles (1, 2, 3, 5):** Model shouldn't import utils that import other utils in a
  loop. Extract the shared primitive (e.g., `normalizeCoordinates`) to a leaf module with no
  imports from the cycle.
- **Events cycle (4):** `events/index.ts` barrel re-exporting the listener it also triggers.
  Move the listener registration out of the barrel, or have the barrel only export types.
- **Notification cycle (7):** `NotificationService` and `NotificationDispatcher` are in a loop.
  Extract the shared interface/types to a third module both can import.

---

### Track D — Dead code elimination in `AdService.ts`

**Why:** `AdService.ts` was the original God-Service. After SSOT and delegation to specialized
services, many functions in it are now thin wrappers or pure re-exports. Removing dead weight
reduces the surface area for bugs and makes the dependency graph cleaner.

**Current state:** 675 lines, 24 exports.

**Process:**
1. For each export, check if it is still imported anywhere outside `AdService.ts` itself.
2. Re-exports (`export { ... } from './adStatusService'`) that are only used by one consumer
   should be imported directly from the source service.
3. Functions that were migrated to a specialized service and are no longer the canonical path
   can be removed (after confirming no external callers).

**Command to find callers:**
```bash
grep -r "from.*AdService" backend/src --include="*.ts" | grep -v AdService.ts
```

---

### Track E — Test coverage for new services

**Why:** The SSOT refactor created 13 new services and extended 8 others. None of the new services
have test files. The existing test suite covers the original services but not the delegated logic.

**Existing test files** (`backend/src/__tests__/services/`):
- `AdQueryService.spec.ts`, `AdValidationService.spec.ts`, `LifecycleGuard.spec.ts`
- `ListingModerationQueryService.spec.ts`, `LocationService.spec.ts`
- `PaymentProcessingService.spec.ts`, `PlanService.spec.ts`, `UserStatusService.spec.ts`
- ... 15 total

**New services with no tests (priority order):**

| Service | Why it needs tests first |
|---------|--------------------------|
| `SavedAdService.ts` | User-facing, pagination + hydration logic |
| `AdminUsersService.ts` | Security-sensitive (user status, admin creation) |
| `StatusMutationService.ts` | Core lifecycle transitions — high blast radius |
| `AdminDashboardService.ts` | Complex aggregations, caching |
| `catalog/CatalogCategoryService.ts` | Multi-model entity count query |
| `AdminLocationService.ts` | CRUD with geospatial validation |
| `ReportService.ts` | Auto-hide threshold logic |
| `PageContentService.ts` | Editorial CRUD |

**Test stack:** Jest + the existing mock infrastructure in `backend/src/__tests__/mocks/`.

---

## Track F — Frontend feature work

**Why documented here:** Frontend work should align with backend service contracts. Knowing which
backend services are stable vs. in-flux prevents frontend rework.

**Stable backend contracts (safe to build against):**
- Auth, User profile, Business profile
- Ad listing lifecycle (create, update, status transitions)
- Saved ads
- Notifications
- Payments / invoices / wallet

**In-flux (wait or coordinate):**
- `AdService.ts` — dead code removal in progress; export surface may shrink
- Catalog services — may see minor API changes during test coverage phase

**Process for new frontend features:**
1. Confirm the backend service contract is stable (check against this doc).
2. Build against the API contract, not the DB shape.
3. New components follow: 44px touch targets, mobile-first layout (see `memory/project_responsive.md`).

---

## Rule: how a rule graduates from `warn` → `error`

1. Run the rule in isolation, count violations per file.
2. Fix all violations (or add `// eslint-disable-next-line` with a comment explaining why).
3. Confirm `tsc --noEmit` still passes.
4. Change rule from `"warn"` to `"error"` in `backend/eslint.config.mjs`.
5. Commit with message format: `enforce <rule-name> as error (N violations fixed)`.

---

## Execution order (recommended)

```
Track A (no-unsafe-*) → B (zero warnings) → C (circulars) → D (dead code) → E (tests) → F (frontend)
```

Tracks A and B share setup (type-aware ESLint). C is independent and fast (one command).
D depends on C (no point deleting something that closes a cycle). E depends on D (tests should
cover final, stable service APIs). F is parallel to all backend tracks.
