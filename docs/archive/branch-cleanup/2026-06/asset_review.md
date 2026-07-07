# Phase 2026-06 — Asset Review

This report documents all unique, recoverable assets found during the June 2026 branch discovery.

---

## Asset Inventory

### 1. Staging & Production Runbook
* **Branch:** `feat/production-pdf-ticket-system` (and `fix/payment-success-feedback`)
* **File Path:** `RUNBOOK.md` (root directory)
* **Business Value:** Critical operations, monorepo compliance, deployment checklists, and sandbox testing steps.
* **Reusability Score:** 🚨 **Critical**

### 2. Modular Ticket PDF System
* **Branch:** `feat/production-pdf-ticket-system`
* **File Paths:**
  * `apps/server/src/lib/pdf/ticket/generate-ticket-pdf.ts`
  * `apps/server/src/lib/pdf/ticket/layout/*`
  * `apps/server/src/lib/pdf/ticket/utils/*`
* **Business Value:** High. Implements cleaner, modular visual blocks to replace the monolithic PDF kit generator.
* **Reusability Score:** **High**

### 3. Transactional React Email Templates
* **Branch:** `feat/production-pdf-ticket-system`
* **File Paths:**
  * `apps/server/src/lib/email/templates/ticket-delivery.tsx`
  * `apps/server/src/lib/email/templates/booking-confirmation.tsx`
* **Business Value:** High. Responsive HTML email layouts replacing legacy plain-text fallback templates.
* **Reusability Score:** **High**

### 4. Queue retry and SMTP Infrastructure
* **Branch:** `feat/production-pdf-ticket-system`
* **File Paths:**
  * `apps/server/src/workers/email.worker.ts`
  * `apps/server/src/services/queue.service.ts`
* **Business Value:** Medium. Idempotency hooks and retry logic.
* **Reusability Score:** **Medium**
