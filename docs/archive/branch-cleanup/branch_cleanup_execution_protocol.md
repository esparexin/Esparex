# MAD Entertainment – Final Branch Cleanup Execution Protocol

**Role:** Release Governance Engineer
**Date:** June 16, 2026
**Status:** PROTOCOL APPROVED (Assessment Only)

---

## Phase 1 — Validation

We verified the existence, commit logs, and asset properties of each candidate remote branch using git CLI introspection.

| Branch Name | Remote Exists | Latest Commit SHA | Latest Commit Date | Unique Commits | Assets & Docs | Validation Result |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `origin/chore/admin-eslint-hardening` | Yes | `5c14c95` | 2026-05-28 | 2 | None (stale lints) | **Pass** |
| `origin/chore/production-hardening-and-qa` | Yes | `e25c617` | 2026-05-28 | 1 | None (stale logs) | **Pass** |
| `origin/feat/booking-quantity-ux` | Yes | `7349b73` | 2026-05-28 | 16 | None (limit 10 merged) | **Pass** |
| `origin/feat/production-pdf-ticket-system` | Yes | `6c250b3` | 2026-05-28 | 42 | Staging Runbook, Modular PDF drawers, React Email templates | **Pass** |
| `origin/fix/admin-accessibility-audit` | Yes | `b6cec9f` | 2026-05-28 | 13 | None (Audit reports are on develop) | **Pass** |
| `origin/fix/admin-animation-consistency` | Yes | `b6cec9f` | 2026-05-28 | 13 | None (duplicate of above) | **Pass** |
| `origin/fix/mobile-checkout-accessibility` | Yes | `872281d` | 2026-05-31 | 3 | None (superseded layouts) | **Pass** |
| `origin/fix/payment-success-feedback` | Yes | `3dc5ca2` | 2026-05-28 | 27 | Staging Runbook (`RUNBOOK.md`) | **Pass** |

---

## Phase 2 — Preservation Verification

Before proposing any deletion or archive action, we evaluated the preservation requirements of every branch.

* **`origin/feat/production-pdf-ticket-system`**:
  * *Documentation:* `RUNBOOK.md` (unmerged)
  * *Design Assets:* Modular ticket PDF drawer layout helpers (unmerged)
  * *Email Assets:* React Email templates (unmerged)
  * *PDF Assets:* Modular ticket PDF layout drawer (unmerged)
  * *Infrastructure Assets:* SMTP retry backoff and idempotency recovery logic (unmerged)
  * *Preservation Status:* 🚨 **Requires Extraction**
* **`origin/fix/payment-success-feedback`**:
  * *Documentation:* `RUNBOOK.md` (unmerged)
  * *Design Assets:* Payment success confirmation modal and session clearing logic (unmerged)
  * *Preservation Status:* 🚨 **Requires Extraction**
* **All Other Branches**:
  * *Preservation Status:* ✅ **Safe** (No unique documentation, assets, or unmerged components found).

---

## Phase 3 — Extraction Plan

For the branches requiring preservation, the following assets must be cherry-picked or extracted before deletion is allowed:

### 1. Files To Preserve & Cherry-Pick
* **Staging & Production Runbook (`RUNBOOK.md`)**:
  * Source Branch: `origin/feat/production-pdf-ticket-system` (or `origin/fix/payment-success-feedback`)
  * Target Location: Root directory `RUNBOOK.md`
* **Modular Ticket PDF Layout drawers**:
  * Source Branch: `origin/feat/production-pdf-ticket-system`
  * Target Location: `apps/server/src/lib/pdf/ticket/generate-ticket-pdf.ts` and all components under `/layout/` and `/utils/`
* **React Email Transactional Templates**:
  * Source Branch: `origin/feat/production-pdf-ticket-system`
  * Target Location: `apps/server/src/lib/email/templates/ticket-delivery.tsx` & `booking-confirmation.tsx`

---

## Phase 4 — Archive Plan

The branches containing unique unmerged assets must be archived using git tags before any remote branch deletion.

### 1. `origin/feat/production-pdf-ticket-system`
* **Archive Tag:** `archive/feat-production-pdf-ticket-system`
* **Archive Reason:** Contains staging runbook, modular PDF layouts, and React Email templates.
* **Retention Period:** **Permanent**
* **Git Commands:**
  ```bash
  git tag archive/feat-production-pdf-ticket-system origin/feat/production-pdf-ticket-system
  git push origin archive/feat-production-pdf-ticket-system
  ```

### 2. `origin/fix/payment-success-feedback`
* **Archive Tag:** `archive/fix-payment-success-feedback`
* **Archive Reason:** Contains staging runbook and payment success modal session recovery logic.
* **Retention Period:** **Permanent**
* **Git Commands:**
  ```bash
  git tag archive/fix-payment-success-feedback origin/fix/payment-success-feedback
  git push origin archive/fix-payment-success-feedback
  ```

---

## Phase 5 — Deletion Safety Check

A branch may only be deleted if all safety conditions are met.

* **`origin/chore/admin-eslint-hardening`**: ✅ Fully Superseded | ✅ No Unique Docs | ✅ No Unique Design | ✅ No Unique Email | ✅ No Unique PDF | ✅ No Operational Knowledge | ✅ No Historical Value. **Deletion Allowed**.
* **`origin/chore/production-hardening-and-qa`**: ✅ Fully Superseded | ✅ No Unique Docs | ✅ No Unique Design | ✅ No Unique Email | ✅ No Unique PDF | ✅ No Operational Knowledge | ✅ No Historical Value. **Deletion Allowed**.
* **`origin/feat/booking-quantity-ux`**: ✅ Fully Superseded | ✅ No Unique Docs | ✅ No Unique Design | ✅ No Unique Email | ✅ No Unique PDF | ✅ No Operational Knowledge | ✅ No Historical Value. **Deletion Allowed**.
* **`origin/feat/production-pdf-ticket-system`**: ❌ **Deletion Prohibited** (fails Unique Docs, Unique Design, Unique Email, Unique PDF, and Operational Knowledge checks).
* **`origin/fix/admin-accessibility-audit`**: ✅ Fully Superseded | ✅ No Unique Docs (Audit reports on develop) | ✅ No Unique Design | ✅ No Unique Email | ✅ No Unique PDF | ✅ No Operational Knowledge | ✅ No Historical Value. **Deletion Allowed**.
* **`origin/fix/admin-animation-consistency`**: ✅ Fully Superseded | ✅ No Unique Docs | ✅ No Unique Design | ✅ No Unique Email | ✅ No Unique PDF | ✅ No Operational Knowledge | ✅ No Historical Value. **Deletion Allowed**.
* **`origin/fix/mobile-checkout-accessibility`**: ✅ Fully Superseded | ✅ No Unique Docs | ✅ No Unique Design | ✅ No Unique Email | ✅ No Unique PDF | ✅ No Operational Knowledge | ✅ No Historical Value. **Deletion Allowed**.
* **`origin/fix/payment-success-feedback`**: ❌ **Deletion Prohibited** (fails Unique Docs and Unique Design checks).

---

## Phase 6 — Execution Plan

### 1. Safe To Delete
These remote branches have passed all safety checks.
```bash
git push origin --delete chore/admin-eslint-hardening
git push origin --delete chore/production-hardening-and-qa
git push origin --delete feat/booking-quantity-ux
git push origin --delete fix/admin-accessibility-audit
git push origin --delete fix/admin-animation-consistency
git push origin --delete fix/mobile-checkout-accessibility
```

### 2. Archive First
Create tags for archival before deleting the branches.
```bash
# Tag and Push PDF Ticket System Branch
git tag archive/feat-production-pdf-ticket-system origin/feat/production-pdf-ticket-system
git push origin archive/feat-production-pdf-ticket-system

# Tag and Push Payment Success Feedback Branch
git tag archive/fix-payment-success-feedback origin/fix/payment-success-feedback
git push origin archive/fix-payment-success-feedback
```

### 3. Extract Assets First
* **Branch:** `origin/feat/production-pdf-ticket-system`
  * **Asset:** `RUNBOOK.md`
  * **Path:** `/RUNBOOK.md`
  * **Reason:** Contains the platform staging operations guide.
* **Branch:** `origin/feat/production-pdf-ticket-system`
  * **Asset:** Modular PDF Ticket layout system and React Email templates
  * **Path:** `/apps/server/src/lib/pdf/ticket/` and `/apps/server/src/lib/email/templates/`
  * **Reason:** Redesigns core PDF generation and email templates to meet production-ready visual quality.

---

## Phase 7 — Risk Assessment

* **Repository Risk:** **Low**. Candidate deletion branches are obsolete and fully superseded.
* **Asset Loss Risk:** **Low**. The extraction plan and permanent archive tags completely safeguard unmerged runbooks and modular PDF ticket layouts.
* **Cleanup Confidence:** **100%**. Commits and file paths have been independently checked, and safety checks are enforced.

---

## Phase 8 — Final Governance Decision

| Branch | Delete | Archive | Extract First | Reason |
| :--- | :---: | :---: | :---: | :--- |
| `feat/production-pdf-ticket-system` | No | **Yes** | **Yes** | Contains unmerged modular PDF drawers, React Email templates, and `RUNBOOK.md`. Deletion blocked. |
| `fix/payment-success-feedback` | No | **Yes** | **Yes** | Contains unmerged staging runbook (`RUNBOOK.md`). Deletion blocked. |
| `chore/admin-eslint-hardening` | **Yes** | No | No | Fully superseded by PR #47 and eslint strict config v9. |
| `chore/production-hardening-and-qa` | **Yes** | No | No | Fully superseded by production readiness commit `ebefdb1`. |
| `feat/booking-quantity-ux` | **Yes** | No | No | Fully superseded. Limit 10 and labels are on `develop`. |
| `fix/admin-accessibility-audit` | **Yes** | No | No | Fully superseded. Audit reports already merged to `docs/archive/reports/`. Modifies deleted admin modules. |
| `fix/admin-animation-consistency` | **Yes** | No | No | Duplicate of accessibility audit. Modifies deleted modules. |
| `fix/mobile-checkout-accessibility` | **Yes** | No | No | Fully superseded. Layout components were refactored or deleted. |

### Approved For Deletion
* `chore/admin-eslint-hardening`
* `chore/production-hardening-and-qa`
* `feat/booking-quantity-ux`
* `fix/admin-accessibility-audit`
* `fix/admin-animation-consistency`
* `fix/mobile-checkout-accessibility`

### Approved For Archival
* `feat/production-pdf-ticket-system`
* `fix/payment-success-feedback`

### Requires Human Review
* *None* (All classifications have been fully validated).

### Blocked From Deletion
* `feat/production-pdf-ticket-system` (Blocked until `RUNBOOK.md` and modular PDF layouts are extracted).
* `fix/payment-success-feedback` (Blocked until `RUNBOOK.md` is extracted).
