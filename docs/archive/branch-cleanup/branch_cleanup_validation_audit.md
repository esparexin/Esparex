# MAD Entertainment – Repository Cleanup & Asset Preservation Protocol

**Role:** Lead Staff Engineer (Repository Governance)
**Date:** June 16, 2026
**Status:** VALIDATION REPORT COMPLETE (Assessment Only)

---

## Phase 1 — Branch Discovery

We analyzed the commits, file modifications, and activity levels of the 8 manual review candidate branches.

| Branch Name | Author | Last Commit Date | Days Since Activity | Unique Commits | Modified Files | Divergence Class |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `chore/admin-eslint-hardening` | `adminmadusa` | May 28, 2026 | 19 days | 2 | 35 | **Obsolete** |
| `chore/production-hardening-and-qa` | `adminmadusa` | May 28, 2026 | 19 days | 1 | 17 | **Obsolete** |
| `feat/booking-quantity-ux` | `adminmadusa` | May 28, 2026 | 19 days | 16 | 443 | **Obsolete** |
| `feat/production-pdf-ticket-system` | `adminmadusa` | May 28, 2026 | 19 days | 42 | 463 | **Historical** |
| `fix/admin-accessibility-audit` | `adminmadusa` | May 28, 2026 | 19 days | 13 | 443 | **Obsolete** |
| `fix/admin-animation-consistency` | `adminmadusa` | May 28, 2026 | 19 days | 13 | 443 | **Obsolete** |
| `fix/mobile-checkout-accessibility` | `adminmadusa` | May 31, 2026 | 16 days | 3 | 16 | **Obsolete** |
| `fix/payment-success-feedback` | `adminmadusa` | May 28, 2026 | 19 days | 27 | 448 | **Historical** |

---

## Phase 2 — Asset Discovery

Each branch was scanned to identify unique, recoverable assets.

### 1. `feat/production-pdf-ticket-system`
* **Asset 1: Staging & Production Runbook**
  * **File Path:** `RUNBOOK.md`
  * **Business Value:** Extremely high. Documents pnpm monorepo compliance, Render environment configuration, backup & restore procedures, and deployment verification steps.
  * **Reusability Score:** 🚨 **Critical**
* **Asset 2: Modular PDF Layout System**
  * **File Paths:** `apps/server/src/lib/pdf/ticket/generate-ticket-pdf.ts`, `apps/server/src/lib/pdf/ticket/layout/*`, `apps/server/src/lib/pdf/ticket/utils/*`
  * **Business Value:** High. Implements structured, modular layout builders (header, footer, details, QR section) to replace a monolithic PDF compiler.
  * **Reusability Score:** **High**
* **Asset 3: React Email Templates**
  * **File Paths:** `apps/server/src/lib/email/templates/ticket-delivery.tsx`, `booking-confirmation.tsx`
  * **Business Value:** High. Implements premium, responsive html email templates for booking confirmations and ticket delivery.
  * **Reusability Score:** **High**
* **Asset 4: SMTP Retry Backoff Handlers**
  * **File Paths:** `apps/server/src/workers/email.worker.ts`, `apps/server/src/services/queue.service.ts`
  * **Business Value:** Medium. Implements BullMQ-level retry and idempotency logic for email sends.
  * **Reusability Score:** **Medium**

### 2. `fix/payment-success-feedback`
* **Asset 1: Staging & Production Runbook**
  * **File Path:** `RUNBOOK.md`
  * **Business Value:** Identical to the runbook found in the PDF system branch.
  * **Reusability Score:** 🚨 **Critical**
* **Asset 2: Payment Success UX Screen**
  * **File Paths:** `apps/web/src/components/booking/checkout/CheckoutForm.tsx` (success modal overrides), session clearing logic
  * **Business Value:** Medium. Clears booking session storage upon payment verification.
  * **Reusability Score:** **Medium**

### 3. All Other Branches (`eslint-hardening`, `production-hardening`, `booking-quantity-ux`, `admin-accessibility`, `admin-animation`, `mobile-checkout-accessibility`)
* **Assets Found:** None.
* **Reusability Score:** **Low**.

---

## Phase 3 — Supersession Validation

We checked `develop` for equivalent features and implementations.

* **`chore/admin-eslint-hardening`**: **Fully Merged** (equivalent). ESLint type-safety and tsconfig path setups have been fully integrated on `develop` via PR #47 (commit `e6bcdad`) and commit `8612ed6`.
* **`chore/production-hardening-and-qa`**: **Fully Merged** (equivalent). Wrapped log utilities and console checks are covered by commit `ebefdb1`.
* **`feat/booking-quantity-ux`**: **Partially Merged**. The quantity ceiling of 10 is enforced at the state level (`Math.min(10, ...)` inside `TicketSelectionContent.tsx`), but the visual warning banners and disabled '+' selectors are missing on `develop`.
* **`feat/production-pdf-ticket-system`**: **Partially Merged**. Nodemailer SMTP is merged on `develop`. However, the modular PDF ticket layout (`src/lib/pdf/ticket`) is **not** on `develop` (which still uses `src/utils/pdf.ts` monolithic compiler).
* **`fix/admin-accessibility-audit`**: **Fully Merged** (equivalent). The reports `PRODUCTION_ARCHITECTURE_COMPLIANCE.md` and `SLIDER_CAROUSEL_ARIA_AUDIT.md` are archived on `develop` under `docs/archive/reports/`.
* **`fix/admin-animation-consistency`**: **Fully Merged** (equivalent). Duplicate of accessibility audit.
* **`fix/mobile-checkout-accessibility`**: **Fully Merged** (equivalent). The carousel deferrals and navigation adjustments are superseded by formatting updates and the removal of the `MarqueeBanner` on `develop`.
* **`fix/payment-success-feedback`**: **Partially Merged**. The runbook is missing on `develop`.

---

## Phase 4 — Design Value Review

We evaluated whether the branches contain reusable design patterns.

* **`feat/production-pdf-ticket-system`**: **Yes**. The modular layout of the PDF (separated draw helpers) is a reusable visual architecture. We recommend a future integration review to merge this layout system into the monolithic `pdf.ts` file on `develop`.
* **`fix/payment-success-feedback`**: **Yes**. Contains session cleanup and success modal design references. Recommend future integration review.
* **All Other Branches**: **No** (obsolete layout files or stale type casting only).

---

## Phase 5 — Conflict Analysis

We assessed the severity of merge conflicts if merged directly to `develop`.

* **`chore/admin-eslint-hardening`**: 🚨 **High**. References deleted admin modules `artists` and `venues`.
* **`chore/production-hardening-and-qa`**: **Medium**. References checkout interfaces that have since evolved.
* **`feat/booking-quantity-ux`**: 🚨 **High**. Modifies old version of `TicketSelectionContent.tsx` which has had major coupon updates.
* **`feat/production-pdf-ticket-system`**: 🚨 **High**. Heavy drift on PDF generators and email templates.
* **`fix/admin-accessibility-audit`**: 🚨 **High**. Targets deleted admin pages (`artists`, `venues`).
* **`fix/admin-animation-consistency`**: 🚨 **High**. Identical duplicate of accessibility audit.
* **`fix/mobile-checkout-accessibility`**: **Medium**. References removed layout configurations.
* **`fix/payment-success-feedback`**: 🚨 **High**. High drift on booking confirmation components.

---

## Phase 6 — Extraction Plan

For branches with unique value, here are the paths of assets to extract:

### 1. Files To Preserve
* `RUNBOOK.md` (present in root of `feat/production-pdf-ticket-system`)

### 2. Files To Cherry Pick
* `apps/server/src/lib/pdf/ticket/generate-ticket-pdf.ts`
* `apps/server/src/lib/pdf/ticket/layout/draw-attendee-details.ts`
* `apps/server/src/lib/pdf/ticket/layout/draw-event-details.ts`
* `apps/server/src/lib/pdf/ticket/layout/draw-footer.ts`
* `apps/server/src/lib/pdf/ticket/layout/draw-header.ts`
* `apps/server/src/lib/pdf/ticket/layout/draw-qr-section.ts`
* `apps/server/src/lib/pdf/ticket/layout/draw-ticket-card.ts`
* `apps/server/src/lib/pdf/ticket/utils/colors.ts`
* `apps/server/src/lib/pdf/ticket/utils/spacing.ts`
* `apps/server/src/lib/pdf/ticket/utils/typography.ts`
* `apps/server/src/lib/email/templates/ticket-delivery.tsx`
* `apps/server/src/lib/email/templates/booking-confirmation.tsx`

### 3. Files To Archive
* The entire branches `origin/feat/production-pdf-ticket-system` and `origin/fix/payment-success-feedback` must be kept in the remote registry as archives.

### 4. Files To Move Into Backlog
* Backlog item: Merge/Integrate modular ticket PDF layout drawers into the main branch.

---

## Phase 7 — Archival Review

* **Archive Justification:** `feat/production-pdf-ticket-system` and `fix/payment-success-feedback` contain unmerged operational knowledge (`RUNBOOK.md`), a modular PDF drawer system, and transactional React Email templates. Deleting them would permanently destroy these assets.
* **Retention Recommendation:** **Permanent** (to protect runbooks and layout visual designs).

---

## Phase 8 — Final Decision

* **`feat/production-pdf-ticket-system`**: **Archive** (deletion prohibited due to unmerged runbook and layout code).
* **`fix/payment-success-feedback`**: **Archive** (deletion prohibited due to unmerged runbook and session recovery).
* **All Other Branches**: **Delete** (fully superseded, no unique assets, no historical/runbook value).

---

## Required Output Summary Table

| Branch | Assets Found | Superseded | Design Value | Archive | Cherry Pick | Delete | Confidence |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `feat/production-pdf-ticket-system` | Staging Runbook, Modular PDF Drawer, React Email templates | Partial | Yes | **Yes** | Yes | **No** | High |
| `fix/payment-success-feedback` | Staging Runbook, Success modal feedback | Partial | Yes | **Yes** | Yes | **No** | High |
| `chore/admin-eslint-hardening` | None | Yes | No | No | No | **Yes** | High |
| `chore/production-hardening-and-qa` | None | Yes | No | No | No | **Yes** | High |
| `feat/booking-quantity-ux` | None | Yes | No | No | No | **Yes** | High |
| `fix/admin-accessibility-audit` | None (Audit reports are on develop) | Yes | No | No | No | **Yes** | High |
| `fix/admin-animation-consistency` | None (Duplicate) | Yes | No | No | No | **Yes** | High |
| `fix/mobile-checkout-accessibility` | None | Yes | No | No | No | **Yes** | High |
