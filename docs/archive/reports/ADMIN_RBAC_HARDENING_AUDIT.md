# Admin RBAC Hardening Audit Report

**Date:** June 2, 2026  
**Auditor:** Senior Security Engineer & Backend Architect  
**Workspace:** MAD Entertainment Platform  
**Target Branch:** `fix/admin-rbac-hardening`  

---

## 1. Executive Summary

This production-grade security audit provides a comprehensive analysis of the Role-Based Access Control (RBAC) mechanisms within the MAD Entertainment administration panel. By tracing every API route from Express mounting down to database operations, we have verified major, actionable vulnerability gaps and design-level privilege flaws.

### Critical Status Summary
* **Current Posture:** ⚠️ **WARNING / HIGH RISK**
* **Primary Defect:** Complete absence of role-specific middleware (least-privilege enforcement) on all content and operational endpoints (Coupons, Categories, Tiers, Popups, DJ Operators). Any user with a valid admin JWT, including lowest-tier `SCANNER` users, inherits full write/mutation privileges.
* **Secondary Defect:** Severe schema mismatch between Mongoose model validations and application constants. This mismatch fundamentally breaks multi-role administration in production, rendering all protected endpoints inaccessible to seeded Super Admins.

No code modifications have been made during this audit phase. All findings are strictly backed by file-specific evidence and complete execution path traces.

---

## 2. Platform Admin Roles Defined

We verified the official platform roles defined in `packages/shared/src/constants/index.ts` (lines 206–212):

```typescript
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPPORT = 'support',
  SCANNER = 'scanner',
}
```

However, the database model `apps/server/src/models/admin.schema.ts` (line 33) defines a mismatched set of uppercase roles:
`enum: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR']`.

---

## 3. Verified Authorization Findings (Deliverable 2)

Each finding represents a verified privilege gap proved by tracing the execution flow:  
`Route` ➔ `Middleware` ➔ `Controller` ➔ `Service` ➔ `Database Mutation`.

| Finding ID | Title / Vulnerability | File | Route & Method | Evidence Trace | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VULN-01** | **Missing Role Guards on Coupons (Priority)** | `coupon.routes.ts` | `POST, PUT, DELETE, PATCH /api/admin/coupons` | Route only applies `requireAdmin` (line 10). Downstream `couponController` and `couponService` directly write to MongoDB without role verification. | **CRITICAL** |
| **VULN-02** | **Missing Role Guards on Categories (Priority)** | `category.routes.ts` | `POST, PUT, DELETE /api/admin/categories` | Only uses general `requireAdmin` (line 10). `categoryService` lacks downstream role checks. Any role can delete categories. | **CRITICAL** |
| **VULN-03** | **Missing Role Guards on Tiers (Priority)** | `tier.routes.ts` | `POST, PATCH, DELETE /api/admin/tiers` | Only uses general `requireAdmin` (line 10). `tierService` directly mutates prices/tiers. Scanners can alter event pricing. | **CRITICAL** |
| **VULN-04** | **Missing Role Guards on Popups (Priority)** | `popup.routes.ts` | `POST, PUT, DELETE, PATCH /api/admin/popups` | Only uses general `requireAdmin` (line 10). `popupService` allows anyone to manage user-facing popups. | **CRITICAL** |
| **VULN-05** | **Seeded Super Admin Lockout Mismatch** | `admin.schema.ts` vs `jwt.ts` | All role-guarded routes | Mongoose validates `['SUPER_ADMIN', 'ADMIN', 'MODERATOR']` while JWT expects `AdminRole` (lowercase). This breaks token matches in `requireSuperAdmin` and `requireRole` checks. | **CRITICAL** |
| **VULN-06** | **Missing Role Guards on DJ Operators** | `dj-operator.routes.ts` | `POST, PUT, DELETE /api/admin/dj-operators` | Protected only by `requireAdmin` (line 10). Low-privilege accounts can delete artists and DJs. | **CRITICAL** |
| **VULN-07** | **Over-Privileged Notification Retry** | `notification.routes.ts` | `POST /api/admin/notifications/:id/retry` | Protected by `requireAdmin` instead of `SUPPORT` or `ADMIN`. Scanners can trigger notification loops. | **CRITICAL** |
| **VULN-08** | **Diagnostics Over-Exposure** | `diagnostics.routes.ts` | `GET /api/admin/diagnostics/*` | Standard `SCANNER` users can inspect system DLQ consistency, system statistics, and pending reservations. | **HIGH** |
| **VULN-09** | **Financial Refund Log Exposure** | `refund.routes.ts` | `GET /api/admin/refunds` | Scanners can fetch all administrative refund lists and transaction history because `GET` lacks role checking. | **HIGH** |
| **VULN-10** | **Analytics & Revenue Log Leak** | `analytics.routes.ts` | `GET /api/admin/analytics/*` | Scanners and support operators can view full platform revenue summaries and attendee rankings. | **HIGH** |
| **VULN-11** | **Customer Booking PII Exposure** | `booking.routes.ts` | `GET /api/admin/bookings/*` | Allows lowest-tier `SCANNER` to list and view all bookings, exposing customer names and emails. | **HIGH** |
| **VULN-12** | **Webhook Inspection Log Leak** | `webhook.routes.ts` | `GET /api/admin/webhooks` | `GET /` is open to all roles, allowing standard operators to inspect Stripe/Razorpay signature payload logs. | **MEDIUM** |

---

## 4. Endpoint-by-Endpoint RBAC Trace (Required Output)

Below is the complete trace of all CREATE, UPDATE, and DELETE endpoints within the audited modules:

| Module | Route | Method | Current Middleware | Actual Allowed Roles (Current) | Database Mutation | Risk / Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Coupons** | `/api/admin/coupons` | `POST` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Creates a coupon document in MongoDB | **CRITICAL** (Low-tier role can generate 100% off codes) |
| **Coupons** | `/api/admin/coupons/:id` | `PUT` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Updates coupon attributes | **CRITICAL** (Low-tier role can modify coupon value) |
| **Coupons** | `/api/admin/coupons/:id` | `DELETE` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Deletes coupon document | **CRITICAL** (Unauthorized deletion) |
| **Coupons** | `/api/admin/coupons/:id/toggle` | `PATCH` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Toggles `isActive` flag | **CRITICAL** (Deactivates valid promo campaigns) |
| **Categories** | `/api/admin/categories` | `POST` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Creates category document | **CRITICAL** (Arbitrary category creation) |
| **Categories** | `/api/admin/categories/:id` | `PUT` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Updates category metadata | **CRITICAL** |
| **Categories** | `/api/admin/categories/:id` | `DELETE` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Deletes category document | **CRITICAL** (Breaks associated events) |
| **Tiers** | `/api/admin/tiers` | `POST` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Creates pricing tier document | **CRITICAL** |
| **Tiers** | `/api/admin/tiers/:id` | `PATCH` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Modifies pricing tier properties | **CRITICAL** (Allows altering price invariants) |
| **Tiers** | `/api/admin/tiers/:id` | `DELETE` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Deletes pricing tier document | **CRITICAL** (Breaks ticket checkouts) |
| **Popups** | `/api/admin/popups` | `POST` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Creates popup campaign | **CRITICAL** (Allows defacement or redirect setup) |
| **Popups** | `/api/admin/popups/:id` | `PUT` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Updates popup attributes | **CRITICAL** |
| **Popups** | `/api/admin/popups/:id` | `DELETE` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Deletes popup campaign | **CRITICAL** |
| **Popups** | `/api/admin/popups/:id/toggle` | `PATCH` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Toggles popup active status | **CRITICAL** |
| **Refunds** | `/api/admin/refunds` | `POST` | `requireRole(SUPER_ADMIN, ADMIN)` | SUPER_ADMIN, ADMIN (Mismatched in Prod) | Creates a refund request in `requested` state | **SAFE** (Protected, but blocked in Prod) |
| **Refunds** | `/api/admin/refunds/:id/process` | `PATCH` | `requireRole(SUPER_ADMIN, ADMIN)` | SUPER_ADMIN, ADMIN (Mismatched in Prod) | Approves/Processes refund in Mongo/Stripe | **SAFE** (Protected, but blocked in Prod) |
| **Bookings** | `/api/admin/bookings/:id/cancel` | `PATCH` | `requireRole(SUPER_ADMIN, ADMIN, SUPPORT)` | SUPER_ADMIN, ADMIN, SUPPORT (Mismatched in Prod) | Cancels booking & releases inventory | **SAFE** (Expected behavior) |
| **Bookings** | `/api/admin/bookings/:id/correct-email` | `PATCH` | `requireRole(SUPER_ADMIN, ADMIN, SUPPORT)` | SUPER_ADMIN, ADMIN, SUPPORT (Mismatched in Prod) | Updates guest ticket email | **SAFE** (Expected behavior) |
| **Bookings** | `/api/admin/bookings/:id/resend` | `POST` | `requireRole(SUPER_ADMIN, ADMIN, SUPPORT)` | SUPER_ADMIN, ADMIN, SUPPORT (Mismatched in Prod) | Triggers email dispatch task | **SAFE** (Expected behavior) |
| **DJ Operators** | `/api/admin/dj-operators` | `POST` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Creates a DJ profile | **CRITICAL** |
| **DJ Operators** | `/api/admin/dj-operators/:id` | `PUT` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Updates a DJ profile | **CRITICAL** |
| **DJ Operators** | `/api/admin/dj-operators/:id` | `DELETE` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Deletes a DJ profile | **CRITICAL** |
| **Events** | `/api/admin/events` | `POST` | `requireRole(SUPER_ADMIN, ADMIN, MANAGER)` | SUPER_ADMIN, ADMIN, MANAGER (Mismatched in Prod) | Creates a new event | **SAFE** (Protected) |
| **Events** | `/api/admin/events/:id` | `PUT` | `requireRole(SUPER_ADMIN, ADMIN, MANAGER)` | SUPER_ADMIN, ADMIN, MANAGER (Mismatched in Prod) | Updates event attributes | **SAFE** (Protected) |
| **Events** | `/api/admin/events/:id` | `DELETE` | `requireRole(SUPER_ADMIN, ADMIN, MANAGER)` | SUPER_ADMIN, ADMIN, MANAGER (Mismatched in Prod) | Deletes event document | **SAFE** (Protected) |
| **Team** | `/api/admin/team` | `POST` | `requireSuperAdmin` | SUPER_ADMIN (Mismatched in Prod) | Creates new admin account | **SAFE** (Protected) |
| **Team** | `/api/admin/team/:id/toggle` | `PATCH` | `requireSuperAdmin` | SUPER_ADMIN (Mismatched in Prod) | Toggles active status of admins | **SAFE** (Protected) |
| **Diagnostics** | `/api/admin/diagnostics/consistency/repair` | `POST` | `requireSuperAdmin` | SUPER_ADMIN (Mismatched in Prod) | Triggers consistency correction tasks | **SAFE** (Protected) |
| **Diagnostics** | `/api/admin/diagnostics/dlq/:id/retry` | `POST` | `requireSuperAdmin` | SUPER_ADMIN (Mismatched in Prod) | Moves job from DLQ to active queue | **SAFE** (Protected) |
| **Diagnostics** | `/api/admin/diagnostics/dlq/retry-all` | `POST` | `requireSuperAdmin` | SUPER_ADMIN (Mismatched in Prod) | Enqueues all failed jobs | **SAFE** (Protected) |
| **Notifications** | `/api/admin/notifications/:id/retry` | `POST` | `requireAdmin` | SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER | Enqueues a notification task | **CRITICAL** (Low-tier can trigger SMTP spam loops) |

---

## 5. Verified Verification Questions

### Coupons
* **Who can create coupons?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can edit coupons?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can delete coupons?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.

### Categories
* **Who can create categories?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can edit categories?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can delete categories?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.

### Tiers
* **Who can create pricing tiers?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can edit pricing tiers?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can delete pricing tiers?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.

### Popups
* **Who can create popups?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can edit popups?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.
* **Who can delete popups?** Currently: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`.

### Refunds
* **Who can create refund requests?** Protected by `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)`. In production, because of the uppercase schema role mismatch, the request will return `403 Forbidden` for a standard uppercase database admin.
* **Who can approve refunds?** Same as above, restricted to SUPER_ADMIN/ADMIN route level, but locked out in production.
* **Who can reject refunds?** Same as above.
* **Who can process refunds?** Same as above.

### Scanner
* **Can scanner users access bookings?** **YES** (via `GET /api/admin/bookings`).
* **Can scanner users access refunds?** **YES** (via `GET /api/admin/refunds`).
* **Can scanner users access analytics?** **YES** (via `GET /api/admin/analytics/*`).
* **Can scanner users access event management?** **YES** (read-only for events `/api/admin/events/*`, but they inherit write/create access to categories, pricing tiers, coupons, and popups).

### Support
* **Can support users issue refunds?** **NO** (restricted to `SUPER_ADMIN` and `ADMIN` roles).
* **Can support users edit categories?** **YES** (inherits this via missing role-guards on `/api/admin/categories`).
* **Can support users edit pricing?** **YES** (inherits this via missing role-guards on `/api/admin/tiers`).
* **Can support users modify events?** **NO** (restricted to `SUPER_ADMIN`, `ADMIN`, `MANAGER` roles).

---

## 6. Expected vs. Recommended Business Policy (Deliverable 1)

Below is the verified role permission matrix recommended to establish least-privilege boundaries:

| Module / Scope | View | Create | Edit | Delete | Current Allowed Roles | Recommended Allowed Roles |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Coupons** | Yes | Yes | Yes | Yes | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | View: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT`<br>Mutate: `SUPER_ADMIN, ADMIN, MANAGER` |
| **Categories** | Yes | Yes | Yes | Yes | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | View: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`<br>Mutate: `SUPER_ADMIN, ADMIN, MANAGER` |
| **Tiers** | Yes | Yes | Yes | Yes | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | View: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`<br>Mutate: `SUPER_ADMIN, ADMIN, MANAGER` |
| **Popups** | Yes | Yes | Yes | Yes | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | View: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT`<br>Mutate: `SUPER_ADMIN, ADMIN, MANAGER` |
| **Refunds (Write)** | — | Yes | Yes | — | `SUPER_ADMIN, ADMIN` (Mismatched) | `SUPER_ADMIN, ADMIN` (Sync roles) |
| **Refunds (Read)** | Yes | — | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | `SUPER_ADMIN, ADMIN, SUPPORT` |
| **Bookings (Write)** | — | — | Yes | — | `SUPER_ADMIN, ADMIN, SUPPORT` | `SUPER_ADMIN, ADMIN, SUPPORT` |
| **Bookings (Read)** | Yes | — | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT` |
| **Analytics** | Yes | — | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | `SUPER_ADMIN, ADMIN, MANAGER` |
| **Scanner** | Yes | Yes | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` |
| **Events (Write)** | — | Yes | Yes | Yes | `SUPER_ADMIN, ADMIN, MANAGER` | `SUPER_ADMIN, ADMIN, MANAGER` |
| **Events (Read)** | Yes | — | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` |
| **Team** | Yes | Yes | Yes | Yes | `SUPER_ADMIN` (Mismatched) | `SUPER_ADMIN` (Sync roles) |
| **Diagnostics (Write)**| — | Yes | — | — | `SUPER_ADMIN` (Mismatched) | `SUPER_ADMIN` (Sync roles) |
| **Diagnostics (Read)** | Yes | — | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | `SUPER_ADMIN, ADMIN` |
| **Notifications** | Yes | Yes | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | View: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT`<br>Retry: `SUPER_ADMIN, ADMIN, SUPPORT` |
| **Webhooks** | Yes | — | — | — | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | `SUPER_ADMIN, ADMIN` |
| **DJ Operators** | Yes | Yes | Yes | Yes | `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER` | View: `SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, SCANNER`<br>Mutate: `SUPER_ADMIN, ADMIN, MANAGER` |

---

## 7. Deliverable 3: Remediation Plan

To address these vulnerabilities without breaking the production build or changing the API contracts, the following specific files will require changes in the next phase:

### Phase 1: Database Model Enum Reconciliation
* **Target File:** `apps/server/src/models/admin.schema.ts`
  * Modify `role.enum` to support lowercase strings matching `AdminRole` from `@mad/shared`:
    `['super_admin', 'admin', 'manager', 'support', 'scanner']`.
  * Support existing uppercase records by using a getter or normalizing during token generation.
* **Target File:** `apps/server/src/utils/seed-admin.ts`
  * Modify seeded administrative user role to `AdminRole.SUPER_ADMIN` (`'super_admin'`).

### Phase 2: Priority Routing Hardening
* **Target File:** `apps/server/src/routes/admin/coupon.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)` on POST (`/`), PUT (`/:id`), DELETE (`/:id`), and PATCH (`/:id/toggle`).
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER, AdminRole.SUPPORT)` on GET (`/`, `/:id`).
* **Target File:** `apps/server/src/routes/admin/category.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)` on POST (`/`), PUT (`/:id`), and DELETE (`/:id`).
* **Target File:** `apps/server/src/routes/admin/tier.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)` on POST (`/`), PATCH (`/:id`), and DELETE (`/:id`).
* **Target File:** `apps/server/src/routes/admin/popup.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)` on POST (`/`), PUT (`/:id`), DELETE (`/:id`), and PATCH (`/:id/toggle`).
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER, AdminRole.SUPPORT)` on GET (`/`, `/:id`).

### Phase 3: Secondary Routing Hardening
* **Target File:** `apps/server/src/routes/admin/dj-operator.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)` on POST (`/`), PUT (`/:id`), and DELETE (`/:id`).
* **Target File:** `apps/server/src/routes/admin/analytics.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)` on all summary, revenue, and attendance analytics endpoints.
* **Target File:** `apps/server/src/routes/admin/refund.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.SUPPORT)` on `GET /`.
* **Target File:** `apps/server/src/routes/admin/booking.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER, AdminRole.SUPPORT)` on `GET /`, `GET /summary`, and `GET /:id`.
* **Target File:** `apps/server/src/routes/admin/diagnostics.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)` on `GET /consistency`, `GET /reservations`, and `GET /system`.
* **Target File:** `apps/server/src/routes/admin/notification.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.SUPPORT)` on POST `/:id/retry`.
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER, AdminRole.SUPPORT)` on `GET /`.
* **Target File:** `apps/server/src/routes/admin/webhook.routes.ts`
  * Apply `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)` on `GET /`.

---

## 8. Summary of Findings

* **Verified Issues:** 12 severe authorization gaps/privilege escalations, including the major database enum mismatch that completely locks out administrative personnel in production.
* **False Positives:** 0. (Every single endpoint trace has been validated against active Express middleware and controller definitions).
* **Recommended Fixes:** Complete synchronization of Mongoose enum roles with shared constants, accompanied by explicit `requireRole` guards injected at the Express router level for all operational modules.
* **Estimated Effort:** **Medium** (~2 days of development and exhaustive automated operational-rbac test updates).
