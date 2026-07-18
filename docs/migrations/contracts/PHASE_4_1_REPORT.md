# Phase 4.1 – Zero-Reference Verification Report

> Generated: 2026-07-18T06:10 UTC

---

## Summary

| Check | Result |
|---|---|
| Direct path imports → `shared/src/contracts` | ✅ 0 references |
| Direct path imports → `shared/src/schemas` | ✅ 0 references |
| Direct path imports → `shared/src/types` | ✅ 0 references |
| Direct path imports → `shared/src/enums` | ✅ 0 references |
| `packages/` uses `@esparex/shared` barrel | ✅ 0 references |
| **Barrel (`@esparex/shared`) still re-exports legacy dirs** | ❌ **BLOCKED** |

---

## Finding: Barrel Transitivity Is The Blocker

No consumer directly imports `shared/src/contracts`, `shared/src/schemas`, `shared/src/types`, or `shared/src/enums` by path.

**However, `shared/src/index.ts` re-exports all four legacy directories**, and many consumers across `apps/`, `backend/`, `core/` import from the `@esparex/shared` barrel. Deleting the legacy directories now would break the barrel build.

### Barrel Re-Exports That Reference Legacy Dirs (shared/src/index.ts)

```
Lines 5–15:   export * from './schemas/*'      ← 11 files from shared/src/schemas/
Lines 18–42:  export * from './enums/*'         ← 25 files from shared/src/enums/
Lines 85–89:  export * from './contracts/*'     ← 5 files from shared/src/contracts/
Lines 92–107: export * from './types/*'         ← 10 files from shared/src/types/
```

### Active Consumers of Those Barrel Re-Exports

| Consumer | Symbol | Legacy Origin |
|---|---|---|
| `core/src/services/AuthService.ts` | `Role`, `USER_STATUS` | `enums/roles`, `enums/userStatus` |
| `core/src/services/ContactRevealService.ts` | `MOBILE_VISIBILITY`, `REQUEST_STATUS` | `enums/mobileVisibility`, `enums/requestStatus` |
| `core/src/validators/ad.validator.ts` | schema validators | `schemas/common.schemas` |
| `core/src/services/SavedSearchService.ts` | `SavedSearchCreatePayload` | `schemas/savedSearch.schema` |
| `backend/api/src/controllers/listing/getListings.controller.ts` | `Ad` | `schemas/ad.schema` |
| `backend/api/src/scripts/ensure-listing-smoke-fixtures.ts` | `LISTING_STATUS`, `LISTING_TYPE` | `enums/listingStatus`, `enums/listingType` |
| `apps/web/src/types/location.ts` | `Location` | `types/location` |
| `apps/web/src/types/home.ts` | `Ad`, `Category` | `schemas/ad.schema`, `types/catalogHierarchy` |
| `apps/web/src/types/User.ts` | `export * from "@esparex/shared"` | All legacy dirs |

---

## Root Cause

The migration moved the **source files** to `@esparex/contracts` but left the `@esparex/shared` barrel pointing at the original files. The barrel is the transitional compatibility layer — it was intentionally kept. Now that all packages build cleanly against `@esparex/contracts`, the barrel's legacy re-exports must be **redirected** before the legacy directories can be deleted.

---

## Required Action Before Deletion

The barrel (`shared/src/index.ts`) must be updated in two steps:

### Step A — Re-point legacy re-exports to `@esparex/contracts`

Replace direct re-exports from `./schemas/*`, `./enums/*`, `./types/*`, `./contracts/*` with re-exports from `@esparex/contracts`. This keeps the barrel API intact — consumers of `@esparex/shared` continue to work without changes.

```ts
// BEFORE (current)
export * from './enums/roles';
export * from './schemas/ad.schema';

// AFTER (redirected)
export { Role, ROLE_VALUES } from '@esparex/contracts';
export type { Ad } from '@esparex/contracts';
```

### Step B — Verify build after barrel redirect

After redirecting the barrel:
1. `npx tsc --noEmit -p shared/tsconfig.json`
2. `npx tsc --noEmit -p backend/api/tsconfig.json`
3. `npx tsc --noEmit -p core/tsconfig.json`
4. `npx tsc --noEmit -p apps/web/tsconfig.json`
5. `npx tsc --noEmit -p apps/admin/tsconfig.json`
6. `npm run guard:dependencies`

Only after Step B passes are the legacy directories unreachable and safe to delete.

---

## Contracts Coverage Check

Before redirecting the barrel, I need to confirm every symbol currently re-exported from the legacy dirs is present in `@esparex/contracts`:

| Legacy Symbol | In `@esparex/contracts`? |
|---|---|
| `Role`, `ROLE_VALUES` | ✅ (identity/enums/roles) |
| `USER_STATUS`, `UserStatusValue` | ✅ (identity/enums/userStatus) |
| `LISTING_STATUS`, `ListingStatusValue` | ✅ (listings/enums/listingStatus) |
| `LISTING_TYPE`, `ListingTypeValue` | ✅ (listings/enums/listingType) |
| `MOBILE_VISIBILITY`, `MobileVisibilityValue` | ⚠️ Needs verification |
| `REQUEST_STATUS`, `RequestStatusValue` | ⚠️ Needs verification |
| `Ad` (schema inferred type) | ✅ (listings/schema/ad.schema) |
| `SavedSearchCreatePayload` | ✅ (search/schema) |
| `Location`, `GeoJSONPoint` | ✅ (common/schema) |
| `basePaths`, `userRoutes`, `adminRoutes` | ❌ Not in contracts (API route constants) |
| `chat.contracts` | ❌ Not in contracts (chat domain) |

> [!NOTE]
> `contracts/api/*` and `chat.contracts` are **not** wire contract types — they are API path strings and chat state contracts. They likely belong in `@esparex/shared` permanently (not migration targets).

---

## Revised Phase 4 Execution Plan

### Commit 0 (Pre-requisite) — Redirect the barrel

Update `shared/src/index.ts` to re-export from `@esparex/contracts` instead of local legacy dirs.

Verify all builds pass. The legacy dirs become unreferenced at this point.

---

### Commit 1 — Remove `shared/src/enums/`

**Condition:** Barrel redirect complete + builds passing.

Files to delete (25 files):
`actor.ts`, `adStatus.ts`, `apiKeyStatus.ts`, `businessStatus.ts`, `catalogApprovalStatus.ts`, `catalogStatus.ts`, `chatStatus.ts`, `idProofType.ts`, `inventoryStatus.ts`, `lifecycle.ts`, `listingStatus.ts`, `listingType.ts`, `locationStatus.ts`, `moderationStatus.ts`, `notificationType.ts`, `paymentStatus.ts`, `physicalStatus.ts`, `planStatus.ts`, `reportReason.ts`, `reportStatus.ts`, `requestStatus.ts`, `roles.ts`, `serviceStatus.ts`, `serviceType.ts`, `userStatus.ts`

Post-delete verification: full build matrix.

---

### Commit 2 — Remove `shared/src/schemas/`

**Condition:** Commit 1 verified clean.

Files to delete (12 files):
`ad.schema.ts`, `adPayload.schema.ts`, `catalog.schema.ts`, `common.schemas.ts`, `coordinates.schema.ts`, `location.schema.ts`, `planPayload.schema.ts`, `savedSearch.schema.ts`, `servicePayload.schema.ts`, `smartAlert.schema.ts`, `sparePartPayload.schema.ts`, `text.schema.ts`

Post-delete verification: full build matrix.

---

### Commit 3 — Remove `shared/src/types/`

**Condition:** Commit 2 verified clean.

Files to delete (11 files):
`ad.ts`, `admin.ts`, `api.ts`, `business.ts`, `catalogHierarchy.ts`, `common.ts`, `index.ts`, `location.ts`, `plan.ts`, `service.ts`, `user.ts`

> [!WARNING]
> `HomeFeedResponse` in `types/api.ts` — verify it exists in `@esparex/contracts` before removing.

Post-delete verification: full build matrix.

---

### Commit 4 — Remove `shared/src/contracts/` (partial)

**Condition:** Commit 3 verified clean.

Candidates for deletion (if confirmed not needed):
- `contracts/api/basePaths.ts`
- `contracts/api/userRoutes.ts`
- `contracts/api/adminRoutes.ts`
- `contracts/api/resourceNames.ts`
- `contracts/chat.contracts.ts`

> [!IMPORTANT]
> These are API path string constants and chat state — **not** wire types. They may need to remain in `@esparex/shared` permanently or be moved to a dedicated `@esparex/api-routes` package. Require explicit decision before deleting.

---

## Phase 4.1 Verdict

| Category | Status |
|---|---|
| Direct path imports | ✅ ZERO — confirmed by ripgrep |
| Barrel transitivity | ❌ BLOCKED — barrel re-exports legacy dirs |
| **Deletion gate** | ⛔ **DO NOT DELETE YET** |
| **Next action** | Commit 0: Redirect barrel → `@esparex/contracts` |
