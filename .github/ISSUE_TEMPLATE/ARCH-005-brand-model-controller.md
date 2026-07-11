---
name: ARCH-005 Split catalogBrandModelController.ts
about: Decompose the 899-line admin brand & model controller into 3 modules
title: "ARCH-005: Split catalogBrandModelController"
labels: refactor, arch, backend
assignees: ""
---

## Scope

Only this file:
```
backend/api/src/controllers/admin/catalog/catalogBrandModelController.ts
```

## Current State

- **899 lines**
- **Maintainability: 31/100**
- **12 `any` annotations** (most in the codebase)
- Handles both brands and models CRUD: 18 route handlers total
- Heavy cache logic (catalogCacheKey, normalizeCacheValue, applyCacheWriteThrough)
- Duplicate candidate logging, hierarchy mutation calls
- Triple semicolons (`;;;`) on import lines

## Target Architecture

New files in: `backend/api/src/controllers/admin/catalog/`

| Module | Contents | Est. Lines |
|--------|----------|------------|
| `adminCatalogShared.ts` | Cache helpers, validation helpers, CATALOG_CACHE_TTL | ~200 |
| `adminBrandController.ts` | All brand handlers (9 handlers) | ~350 |
| `adminModelController.ts` | All model handlers (9 handlers) | ~350 |

Original file becomes barrel.

## API Compatibility

Zero import changes — route file `adminRoutes.ts` imports from the same path which will now be a barrel.

## Note

Must also clean the triple semicolon lines (`import ...;;;;`) as part of this change since they're in the extracted lines.

## Acceptance Criteria

Same as ARCH-001.

## Pre-Implementation Verification

- [ ] Verify no duplicate brand/model controller logic in `shared.ts` (same directory)
- [ ] Verify route file import path in `adminRoutes.ts`
- [ ] Check that `inputCoercion.ts` doesn't duplicate helper functions
- [ ] Confirm git working tree is clean
