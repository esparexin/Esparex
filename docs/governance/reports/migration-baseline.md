# Monorepo Migration Baseline Report

**Execution Date:** 2026-07-11  
**Target Workspace:** `backend/api` ➔ `@esparex/backend-api`  

---

## 1. Environment & Git Context

* **Git Commit SHA:** `17b6a26e1ccfa5498cbf3579211822ab4770cdff`
* **Active Branch:** `refactor/ae-01-backend-api-migration`
* **Git Working Tree Status:** Clean except for local untracked policy/handbook documents created in previous steps.

---

## 2. Compile Baseline Verification

* **Command Executed:** `npm run type-check`
* **Status:** ❌ **Failed** (Exit Code 2)
* **Observed Failures:**
  * Multiple `Cannot find module '@esparex/core/utils/respond'` or its corresponding type declarations errors across controllers and middlewares.
  * Multiple `Cannot find module '@esparex/core/controllers/admin/...'` or its corresponding type declarations errors in test specs.

---

## 3. Package Parity baseline

* **Command Executed:** `npm run guard:core-export-parity`
* **Status:** ❌ **Failed**
* **Observed Violations:**
  * `backend import "@esparex/core/controllers/admin/adminApiKeyController" has no matching core/dist declaration`
  * `backend import "@esparex/core/controllers/admin/adminBusinessController" has no matching core/dist declaration`
  * `backend import "@esparex/core/controllers/admin/adminNotificationController" has no matching core/dist declaration`
  * `backend import "@esparex/core/controllers/admin/adminUsersController" has no matching core/dist declaration`
  * `backend import "@esparex/core/controllers/admin/listingModerationSerializer" has no matching core/dist declaration`
  * `backend import "@esparex/core/controllers/admin/system/adminAuthController" has no matching core/dist declaration`
  * `backend import "@esparex/core/utils/controllerUtils" has no matching core/dist declaration`
  * `backend import "@esparex/core/utils/deviceFingerprint" has no matching core/dist declaration`
  * `backend import "@esparex/core/utils/errorResponse" has no matching core/dist declaration`
  * `backend import "@esparex/core/utils/requestParams" has no matching core/dist declaration`
  * `backend import "@esparex/core/utils/respond" has no matching core/dist declaration`
