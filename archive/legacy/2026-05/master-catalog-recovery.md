# Master Catalog Recovery & Schema Hardening Migration

**Migration Identifier:** `20260513000100-restore-master-catalog-after-cleanup.js`  
**Execution Date:** May 13, 2026  
**Status:** APPLIED / FULLY VERIFIED

---

## 1. Overview & Context

This migration was authored to remediate the mass-soft-deletion of 72 brands and models that occurred on May 12, 2026. The incident was caused by a schema-unaware taxonomy cleanup script that searched for the `categoryIds` (plural array) field, which had been previously dropped in favor of `categoryId` (singular) in March 2026.

This migration reverses that accidental archiving event, approves top active brands (Apple, Samsung, BlackBerry), synchronizes singular and plural fields, ensures model visibility, and validates all catalog associations.

---

## 2. Recovery Migration Specifications

### 2.1 Applied Actions (`up`)
1. **Restored 63 Brands:** Replaced `isDeleted: true` with `isDeleted: false` and set `isActive: true`, `approvalStatus: "approved"`, and removed `deletedAt` for all brands that had `archivedInCleanup: true`.
2. **Approved Brand Lifecycle:** Re-approved and activated Apple, Samsung, and BlackBerry (removing `rejectionReason`).
3. **Synchronized Category Mappings:**
   - On **Brands:** Added `categoryIds` array with single element if only `categoryId` was present. Added `categoryId` matching the first element if only `categoryIds` array was present.
   - On **Models:** Added `categoryIds` array with single element if only `categoryId` was present. Added `categoryId` matching the first element if only `categoryIds` array was present.
4. **Activated Models:** Re-activated and approved all models matching restored parent brand IDs.
5. **Logged Metrics:** Counted categories, brands, and models before and after.

### 2.2 Rollback Actions (`down`)
1. **Archived Restored Brands:** Automatically identifies and archives brands matching `{ restoredByRecovery: true }` back to `isDeleted: true, archivedInCleanup: true`.
2. **Archived Restored Categories:** Soft-deletes any categories that were automatically restored during recovery.
3. **Preserved Core Brands:** Retains active/approved states for Apple, Samsung, and BlackBerry to avoid breaking active user ads.

---

## 3. Hardened Cleanup Infrastructure

To permanently prevent regression or accidental deletion, `backend/user/taxonomy-cleanup-execution.js` has been hardened with the following enterprise guardrails:

* **Bidirectional Schema Validation:** Evaluates both `categoryId` (singular) and `categoryIds` (plural array). Brands with either field populated are preserved.
* **Dry-Run by Default:** Requires the explicit `--execute` command-line flag to write modifications to MongoDB.
* **Safety Threshold Protection:** Automatically calculates the percentage of active records targeted for deletion. If the value exceeds 10% of active records, the cleanup aborts immediately unless `--force` is supplied.
* **Audit Logging:** Appends all analytical and structural events to `logs/taxonomy-cleanup-audit.log`.

---

## 4. How to Execute Verification Scripts

### 4.1 Master Catalog Health Check
Run the automated data health check from the root directory:
```bash
npm run validate:master-catalog-health -w @esparex/backend-user
```

### 4.2 Run Specific Jest Unit Tests
Validate Mongoose validate hook bidirectional field synchronizations:
```bash
npm run test:unit -w @esparex/backend-user -- src/__tests__/utils/taxonomyRecoveryAndHardening.spec.ts
```

---

## 5. Summary of Restored Database Stats

| Metric | Before Recovery | After Recovery | Status |
| :--- | :---: | :---: | :--- |
| **Active Categories** | 4 | 4 | Healthy (Mobiles, Tablets, Laptops, LED TVs) |
| **Active Brands** | 0 | 63 | Fully Restored (Apple, Samsung, BlackBerry, etc.) |
| **Active Models** | 190 | 190 | Visible and Cascading |
| **Redis Cache Status** | Stale | Purged | Purged `catalog:*` and `master:*` keys |
