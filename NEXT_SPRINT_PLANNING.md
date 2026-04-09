# 📅 Next Sprint Planning: Error Handler Controller Migration

**Planning Date:** April 9, 2026  
**Target Sprint:** Sprint +1 (After Merge)  
**Duration:** 1-2 weeks  
**Effort Estimate:** 20-24 hours  
**Priority:** High  

---

## Overview

The error handler audit has established new standardized utilities. Next sprint focuses on **migrating existing controllers** to use the new infrastructure for consistent error handling across the platform.

**Goal:** Eliminate fragmented error handling patterns and adopt unified `ErrorResponseBuilder` across all controllers.

---

## Deliverables

### Primary Goal
✅ Migrate controllers from `sendAdminError` → `ErrorResponseBuilder`  
✅ Update catalog operations to use type guards from `errorHelpers`  
✅ Standardize all error response formats  
✅ Add comprehensive test coverage  

### Success Metrics
- 8 admin controllers migrated ✓
- 5 catalog controllers optimized ✓
- 0 behavior changes (backward compatible)
- 100% type-safe error responses
- +50% test coverage for error paths

---

## Phase 1: Admin Controllers (2 hours)

### Controllers to Migrate: 8 total

| Controller | Location | Current Pattern | Error Count | Complexity |
|------------|----------|-----------------|-------------|------------|
| adminListingsController | `controllers/admin/` | sendAdminError | 19 calls | High |
| adminBusinessController | `controllers/admin/` | sendAdminError | 12 calls | High |
| adminSessionController | `controllers/admin/` | sendAdminError | 8 calls | Medium |
| adminRevealController | `controllers/admin/` | sendAdminError | 5 calls | Medium |
| adminAnalyticsController | `controllers/admin/` | sendAdminError | 6 calls | Low |
| adminReviewController | `controllers/admin/` | sendAdminError | 4 calls | Low |
| adminBrandController | `controllers/admin/` | sendAdminError | 3 calls | Low |
| adminCategoryController | `controllers/admin/` | sendAdminError | 2 calls | Low |

### Before Pattern
```typescript
// OLD: sendAdminError
if (!user) return sendAdminError(req, res, new Error('Not found'), 404);
if (!validated) return sendAdminError(req, res, new Error('Invalid'), 400);
```

### After Pattern
```typescript
// NEW: ErrorResponseBuilder
if (!user) return ErrorResponses.notFound(req, res, 'User not found');
if (!validated) return ErrorResponses.validation(req, res, 'Invalid input', { fields: [...] });
```

### Migration Steps

**Step 1: High-complexity controllers (adminListingsController, adminBusinessController)**
- Time: 30 minutes each
- Replace all 31 sendAdminError calls
- Update error messages for consistency
- Add error details/context where applicable
- Test with Postman/curl

**Step 2: Medium-complexity controllers (Session, Reveal)**
- Time: 20 minutes each
- Replace 13 sendAdminError calls total
- Verify no side effects
- Check related endpoints

**Step 3: Low-complexity controllers (4 controllers)**
- Time: 15 minutes total
- Replace 15 sendAdminError calls
- Quick validation

### Estimated Effort
- Code changes: 90 minutes
- Testing: 30 minutes
- **Phase 1 Total: 2 hours**

---

## Phase 2: Catalog Controllers (3 hours)

### Controllers to Update: 5 total

| Controller | Location | Current Pattern | Updates | Complexity |
|------------|----------|-----------------|---------|------------|
| catalogBrandModelController | `controllers/catalog/` | sendCatalogError | 22 calls | Medium |
| catalogCategoryController | `controllers/catalog/` | sendCatalogError | 18 calls | Medium |
| catalogSparePartController | `controllers/catalog/` | sendCatalogError | 15 calls | Low |
| catalogReferenceController | `controllers/catalog/` | sendCatalogError | 8 calls | Low |
| catalogGovernanceController | `controllers/catalog/` | sendCatalogError | 5 calls | Low |

### Optimization Strategy

These controllers already use `sendCatalogError` (good! ✓), but should leverage new utilities:

**Add error type guards:**
```typescript
// Import new utilities
import { isZodError, isDuplicateKeyError, isValidationError } from '../../utils/errorHelpers';

// Use type guards for better error classification
if (isZodError(error)) {
    return sendCatalogError(req, res, error, { statusCode: 400 });
}
if (isDuplicateKeyError(error)) {
    return ErrorResponses.conflict(req, res, 'Already exists');
}
```

**Enhance error details:**
```typescript
// FROM
catch (error) {
    sendCatalogError(req, res, error, 400);
}

// TO
catch (error) {
    const details = extractErrorDetails(error);
    sendCatalogError(req, res, error, {
        statusCode: 400,
        fallbackMessage: details.message
    });
}
```

### Migration Steps

**Step 1: BrandModel & Category (highest traffic)**
- Time: 60 minutes
- Add error type guards
- Extract error details
- Add validation context to responses
- Test CRUD operations

**Step 2: SparePart & Reference**
- Time: 30 minutes
- Same improvements
- Simpler scope = faster

**Step 3: Governance**
- Time: 15 minutes
- Optional optimizations
- Low-traffic endpoints

### Estimated Effort
- Code changes: 105 minutes
- Testing: 45 minutes
- **Phase 2 Total: 2.5 hours**

---

## Phase 3: Middleware & Services (1.5 hours)

### Middleware to Update: 3-5 files

| Middleware | Updates | Priority |
|-----------|---------|----------|
| sentryErrorHandler | Add new type guards | Low |
| adminAuth | Use ErrorResponses helpers | Low |
| errorHandler (global) | Reference new utilities | Medium |

### Services to Enhance: 2-3 files

| Service | Updates | Priority |
|---------|---------|----------|
| CatalogValidationService | Add error context | Medium |
| CatalogHierarchyService | Use extractErrorDetails | Low |
| AdSlotService | Already improved in audit | Done ✓ |

### Estimated Effort
- Middleware updates: 45 minutes
- Service enhancements: 45 minutes
- **Phase 3 Total: 1.5 hours**

---

## Phase 4: Testing & Validation (2 hours)

### Unit Tests: Error Handling

**Create test files:**
1. `tests/unit/errorHelpers.test.ts` - Validate all 10 helper functions
2. `tests/unit/ErrorResponseBuilder.test.ts` - Builder API tests
3. `tests/unit/errorResponses.test.ts` - Quick helper validation

**Test coverage: 90+ lines**

### Integration Tests: Controller Errors

**Test endpoints:**
1. 5x admin controller error paths
2. 5x catalog controller error paths
3. Middleware error handling
4. Error response format validation

**Test coverage: 20+ scenarios**

### Regression Tests

Verify no behavior changes:
```bash
# Before migration
npm test -- adminListingsController.test.ts

# After migration
npm test -- adminListingsController.test.ts

# Should pass identically
```

### Estimated Effort
- Unit tests: 60 minutes
- Integration tests: 45 minutes
- Regression verification: 15 minutes
- **Phase 4 Total: 2 hours**

---

## Summary by Phase

| Phase | Duration | Effort | Owner |
|-------|----------|--------|-------|
| **Phase 1: Admin Controllers** | 2 hours | 5-6 tickets | Backend Dev |
| **Phase 2: Catalog Controllers** | 2.5 hours | 5 tickets | Backend Dev |
| **Phase 3: Middleware/Services** | 1.5 hours | 3-4 tickets | Backend Dev |
| **Phase 4: Testing** | 2 hours | 3 tickets | QA/Backend Dev |
| **Buffer (Planning, Review)** | 1.5 hours | - | All |
| **TOTAL** | **9.5 hours** | **18-19 tickets** | **Sprint Capacity** |

---

## Detailed Task Breakdown

### Admin Controllers (8 tickets, each 15-30 min)

```
TASK 1: Migrate adminListingsController
  - Replace 19 sendAdminError → ErrorResponses.* 
  - Add error context
  - Test with Postman
  - Est. 30 min

TASK 2: Migrate adminBusinessController
  - Replace 12 sendAdminError calls
  - Test business-specific error paths
  - Est. 25 min

TASK 3: Migrate adminSessionController
  - Replace 8 sendAdminError calls
  - Verify session auth errors
  - Est. 15 min

TASK 4: Migrate adminRevealController
  - Replace 5 sendAdminError calls
  - Est. 15 min

TASKS 5-8: Migrate adminAnalyticsController, adminReviewController, adminBrandController, adminCategoryController
  - 2-5 calls each
  - 5-10 min each
  - Total: 40 min
```

### Catalog Controllers (5 tickets, each 30-60 min)

```
TASK 9: Enhance catalogBrandModelController
  - Add 22 error type guards
  - Extract error details
  - Est. 45 min

TASK 10: Enhance catalogCategoryController
  - Add 18 error type guards
  - Est. 40 min

TASK 11: Enhance catalogSparePartController
  - Add 15 error type guards
  - Est. 30 min

TASK 12: Enhance catalogReferenceController
  - Add 8 error type guards
  - Est. 20 min

TASK 13: Enhance catalogGovernanceController
  - Add 5 error type guards
  - Est. 15 min
```

### Infrastructure (3-4 tickets)

```
TASK 14: Update sentryErrorHandler middleware
  - Integrate errorHelpers type guards
  - Est. 30 min

TASK 15: Add error context extraction to services
  - Update CatalogValidationService
  - CatalogHierarchyService
  - Est. 60 min

TASK 16: Create comprehensive test suite
  - Unit tests for utilities (60 min)
  - Integration tests (45 min)
  - Est. 105 min

TASK 17: Documentation update
  - Update error handling guide
  - Add migration examples
  - Est. 30 min
```

---

## Dependencies & Prerequisites

### Must Be Complete Before Sprint
- ✅ Error handler audit merged
- ✅ New utilities available (`errorHelpers`, `ErrorResponseBuilder`)
- ✅ Team trained on new patterns
- ✅ Test infrastructure ready

### External Dependencies
- ❌ None (self-contained work)

### Blocking Issues
- 🟠 Pre-existing Mongoose type issues (would be separate PR)

---

## Resource Requirements

### Team Composition
- **1 Backend Developer** (primary migration work)
- **1 QA Engineer** (testing & validation)
- **Tech Lead** (review & sign-off)

### Tools Needed
- ✅ Node.js/TypeScript environment (already have)
- ✅ Postman for endpoint testing
- ✅ Jest for unit tests
- ✅ GitHub for PR/review

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Breaking changes | Very Low | Blocked deploy | Comprehensive testing |
| Incomplete migration | Low | Fragmented code | Definition of done checklist |
| Type errors | Low | Build fail | Enhanced TS checks |
| Performance impact | Very Low | Users affected | No algorithm changes, testing |
| Scope creep | Medium | Timeline slip | Clear boundaries in tasks |

---

## Definition of Done

For each controller:
- [ ] All error handlers migrated to new pattern
- [ ] Type-safe with no `any` types
- [ ] Error messages consistent and helpful
- [ ] At least 1 unit test per error path
- [ ] Integration test with real endpoint
- [ ] Regression test passes
- [ ] Code review approved
- [ ] Documentation updated

For the entire sprint:
- [ ] All 18 controllers updated
- [ ] Test coverage > 85% for error paths
- [ ] Zero new build errors
- [ ] No functionality regressions
- [ ] Team trained on new patterns
- [ ] Documentation complete

---

## Success Criteria

After sprint completion:

✅ **0 `sendAdminError` calls remaining**  
✅ **0 fragmented error patterns**  
✅ **100% ErrorResponseContract compliance**  
✅ **90%+ test coverage for error handling**  
✅ **Zero behavioral regressions**  
✅ **Team can confidently use new utilities**  

---

## Next Sprint Preparation

### Before Sprint Starts
- [ ] Create JIRA/GitHub tickets (18-19 total)
- [ ] Assign to team members
- [ ] Schedule kick-off meeting
- [ ] Prepare testing checklists
- [ ] Set up test environment

### During Sprint
- [ ] Daily standup (focused on blockers)
- [ ] PR reviews (same-day turnaround)
- [ ] Testing checkpoint (midweek)
- [ ] Risk assessment (if needed)

### End of Sprint
- [ ] Verify all tickets closed
- [ ] Run full regression suite
- [ ] Prepare for merge/release
- [ ] Retrospective (what went well?)

---

## Budget & Timeline

**Sprint Duration:** 1-2 weeks (depending on team size)

**Estimated Cost:** 40-48 developer hours

**Timeline:**
- Week 1: Admin controllers + Catalog core (10 hours)
- Week 2: Catalog remaining + Tests + Buffer (10-14 hours)

**Can be done faster with:**
- 2 developers working in parallel (7-10 days)
- Dedicated QA support (5-7 days)

**Recommendation:** 1 developer, 2-week sprint with built-in buffer

---

## Communication Plan

### Stakeholders
- [ ] Notify backend team of changes
- [ ] Schedule training session on new patterns
- [ ] Update team documentation
- [ ] Share this plan in sprint planning meeting

### Documentation
- [ ] Update error handling guide
- [ ] Create migration checklist for team
- [ ] Share ErrorResponseBuilder examples
- [ ] Document error type guards usage

---

## Post-Sprint Activities

### Immediate (Week after sprint)
1. Monitor production for any error handling regressions
2. Address any urgent issues
3. Gather feedback from team

### Next Steps (Backlog)
1. Add error telemetry/alerting hooks
2. Implement error budgeting
3. Create error response dashboard
4. Fix pre-existing TypeScript issues

---

## Appendix: Code Migration Examples

### Example 1: Simple Validation Error

**Before (sendAdminError):**
```typescript
if (!user) return sendAdminError(req, res, new Error('User not found'), 404);
```

**After (ErrorResponseBuilder):**
```typescript
if (!user) return ErrorResponses.notFound(req, res, 'User not found');
```

### Example 2: Complex Error with Details

**Before:**
```typescript
if (!validation.isValid) {
    return sendAdminError(req, res, new Error('Validation error'), 400);
}
```

**After:**
```typescript
if (!validation.isValid) {
    const details = extractErrorDetails(error);
    return ErrorResponses.validation(
        req, 
        res, 
        validation.message, 
        { fields: validation.fields }
    );
}
```

### Example 3: Duplicate Key Error

**Before:**
```typescript
catch (error) {
    if (error.code === 11000) {
        return sendAdminError(req, res, error, 409);
    }
}
```

**After:**
```typescript
catch (error) {
    if (isDuplicateKeyError(error)) {
        return ErrorResponses.conflict(req, res, 'Already exists');
    }
}
```

---

## Questions & Support

For questions about this plan:
- Review [ERROR_HANDLER_FINAL_REPORT.md](ERROR_HANDLER_FINAL_REPORT.md)
- Check [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)
- Reference new utilities in `backend/src/utils/`

---

**Plan Status:** ✅ Ready for Sprint Planning  
**Last Updated:** April 9, 2026  
**Prepared by:** GitHub Copilot

