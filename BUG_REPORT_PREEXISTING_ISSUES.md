# 🐛 Bug Report: Pre-Existing TypeScript Build Issues

**Date:** April 9, 2026  
**Severity:** Medium  
**Scope:** Backend build only (non-blocking for error handler fixes)  
**Related to:** Error Handler Audit (indirectly)  

---

## Executive Summary

During validation of the error handler audit fixes, 6 pre-existing TypeScript compilation errors were discovered. These are **NOT** caused by the error handler work and existed in the codebase prior to this audit.

**Status:** Blocking full build, but isolated to unrelated modules → **should be addressed in separate PR**

---

## Issue Details

### Group 1: Schema Property Name Mismatches (2 errors)

#### Error #1: catalogBrandModelController.ts, Line 677
```
error TS2769: No overload matches this call.
Object literal may only specify known properties, but 'categoryId' does not exist
```

**File:** [backend/src/controllers/catalog/catalogBrandModelController.ts](backend/src/controllers/catalog/catalogBrandModelController.ts#L677)

**Code:**
```typescript
// Line 677
if (!validation.isValid) return sendCatalogError(req, res, 'Brand slug is required', 400);
// ... later ...
{ categoryId: brandId }  // ❌ Should be categoryIds (plural)
```

**Root Cause:** Model schema expects `categoryIds` (array) but code uses `categoryId` (singular)

**Fix:**
```typescript
// Change from:
{ categoryId: brandId }

// To:
{ categoryIds: [brandId] }
```

**Recommended Action:** Audit all catalog model creations for consistent field naming

---

#### Error #2: CatalogHierarchyService.ts, Lines 213
```
error TS2551: Property 'categoryId' does not exist on type 'IModel'
```

**File:** [backend/src/services/catalog/CatalogHierarchyService.ts](backend/src/services/catalog/CatalogHierarchyService.ts#L213)

**Code:**
```typescript
// Lines 213
const breadcrumbs = model.categoryId.map(...)  // ❌ Should be categoryIds
```

**Root Cause:** Same schema mismatch - plural form variance

**Fix:**
```typescript
// Change from:
const breadcrumbs = model.categoryId.map(...)

// To:
const breadcrumbs = model.categoryIds.map(...)
```

---

### Group 2: Mongoose Query Type Augmentation Issues (4 errors)

#### Error #3-4: safeSoftDeleteQuery.ts, Lines 25 & 39
```
error TS2339: Property 'active' does not exist on type '{}'
error TS2339: Property 'includeDeleted' does not exist on type '{}'
```

#### Error #5: safeSoftDeleteQuery.ts, Line 69
```
error TS2428: All declarations of 'Query' must have identical type parameters.
```

**File:** [backend/src/utils/safeSoftDeleteQuery.ts](backend/src/utils/safeSoftDeleteQuery.ts#L69-L100)

**Root Cause:** Module augmentation for Mongoose Query interface has type parameter mismatches

**Current Code (line 68-75):**
```typescript
declare module 'mongoose' {
    interface Query<
        ResultType,
        DocType,
        THelpers = {},
        RawDocType = DocType
    > {
        // ✓ Type parameters now correct (fixed in error handler work)
```

**Issue:** The type augmentation declares `active()` and `includeDeleted()` methods but TypeScript can't find them because of interface declaration conflicts

**Investigation Needed:**
1. Verify all Query type parameter declarations are consistent
2. Check if module augmentation is being applied across all files
3. Validate that safeSoftDeleteQuery.ts is actually being executed

**Recommended Fix Strategy:**
1. Export the augmented Query type from a single file
2. Import this type in all files that use `active()` or `includeDeleted()`
3. Add test to verify custom query methods are available

---

## Impact Analysis

| Category | Impact |
|----------|--------|
| **Error Handler Audit Fixes** | ✅ NOT affected |
| **Production Deployment** | ⚠️ Blocked (can't build) |
| **Error Handling** | ✅ All working |
| **Catalog Operations** | ⚠️ Fails at runtime for affected scenarios |

---

## Recommendations

### Priority: Medium-High
- **Severity:** Medium (not error handling, but blocks build)
- **Effort:** 2-3 hours to investigate and fix
- **Timeline:** Next bug fix sprint or before next release

### Recommended Approach

#### Option A: Quick Fix (1-2 hours)
1. Fix categoryId → categoryIds typos (30 min)
2. Add `.ts` imports to safeSoftDeleteQuery consumers (30 min)
3. Add type guards to Query interface (30 min)
4. Test with small integration test

#### Option B: Thorough Fix (2-3 hours)
1. Audit ALL schema field naming (1 hour)
2. Create schema type validation utilities (1 hour)
3. Refactor Mongoose type augmentation (1 hour)
4. Add comprehensive tests

---

## Next Steps

### Immediate (This Week)
- [ ] File this as separate JIRA/GitHub issue
- [ ] Add to backlog for next sprint
- [ ] Assign to team member with Mongoose expertise

### Investigation Phase
- [ ] Search codebase for all `categoryId` vs `categoryIds` usage
- [ ] Review Mongoose type augmentation patterns in repo
- [ ] Check TypeScript/Mongoose version compatibility

### Resolution Phase
- [ ] Create PR with fixes
- [ ] Add unit tests for schema field validation
- [ ] Update documentation with field naming conventions

---

## Code References

**Files Involved:**
1. [catalogBrandModelController.ts](backend/src/controllers/catalog/catalogBrandModelController.ts#L677) - categoryId/categoryIds
2. [CatalogHierarchyService.ts](backend/src/services/catalog/CatalogHierarchyService.ts#L213) - categoryId/categoryIds
3. [safeSoftDeleteQuery.ts](backend/src/utils/safeSoftDeleteQuery.ts) - Type augmentation
4. [Model.ts](backend/src/models/Model.ts) - Schema definition
5. [Category.ts](backend/src/models/Category.ts) - Schema definition

**Related Documentation:**
- Mongoose type augmentation: https://mongoosejs.com/docs/typescript.html
- TypeScript module augmentation: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

---

## Appendix: Detailed Error Messages

```
src/controllers/catalog/catalogBrandModelController.ts(677,17): error TS2769: 
No overload matches this call.
  The last overload gave the following error.
    Object literal may only specify known properties, but 'categoryId' does not 
    exist in type '{ name?: StringQueryTypeCasting | undefined; brandId?: 
    ObjectId | ... 65 more ...; validateSync?: { ...; } | ... 1 more ... | 
    undefined; }'. Did you mean to write 'categoryIds'?

src/services/catalog/CatalogHierarchyService.ts(213,52): error TS2551: 
Property 'categoryId' does not exist on type 'IModel & Required<{ _id: ObjectId; 
}> & { __v: number; }'. Did you mean 'categoryIds'?

src/utils/safeSoftDeleteQuery.ts(25,18): error TS2339: 
Property 'active' does not exist on type '{}'.

src/utils/safeSoftDeleteQuery.ts(39,18): error TS2339: 
Property 'includeDeleted' does not exist on type '{}'.

src/utils/safeSoftDeleteQuery.ts(69,15): error TS2428: 
All declarations of 'Query' must have identical type parameters.
```

---

## Sign-Off

**Discovered During:** Error Handler Audit Validation (April 9, 2026)  
**Severity to Project:** Medium (blocks builds, not functional logic)  
**Status:** Documented and ready for triage  
**Action:** File as separate bug - do not block error handler audit

---

**Report Generated:** April 9, 2026  
**Investigated by:** GitHub Copilot  
**Recommended for:** Next sprint bug fix round
