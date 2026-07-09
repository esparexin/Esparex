# Security & Permission Audit Report

## Executive Summary

As a Principal Security Engineer, Application Security Architect, and Payment Security Reviewer, I have performed a comprehensive runtime integrity and authorization audit of the MAD Entertainment server. By tracing the execution flow from the Express routes, through authorization middleware, controllers, and services, we mapped out the backend privilege matrix.

### Endpoints Audited

1.  **Admin RBAC Layer:** All `/api/admin/*` routers, role-guards (`requireRole`, `requireSuperAdmin`), and associated middleware.
2.  **Booking Ownership Layer:** Public booking endpoints (`GET /api/bookings/:bookingId`, `GET /api/bookings/:bookingId/download`, `POST /api/bookings/:bookingId/resend`, `PUT /api/bookings/:bookingId/checkout-details`).
3.  **Refund Authorization Layer:** Create refund (`POST /api/admin/refunds`), process refund (`PATCH /api/admin/refunds/:id/process`), and underlying refund state machine services.
4.  **Webhook Verification Layer:** Stripe webhook (`POST /api/payments/webhook/stripe`) and Razorpay webhook (`POST /api/payments/webhook/razorpay`).
5.  **Queue & Worker Idempotency:** Booking worker (`booking.worker.ts`), PDF worker (`pdf.worker.ts`), and email worker (`email.worker.ts`).
6.  **Session Isolation & Auth Hardening:** Refresh token rotation (RTR) logic, logout invalidation, session token separation, and profile hydration hooks.
7.  **Rate Limiting & Abuse Protection:** Global rate limiter, auth limiter, payment/webhook limiters, and sensitive route configurations.

---

### Critical Findings

*   **VULN-01: Admin Privilege Escalation on Coupons, Categories, Tiers, & Popups (CRITICAL):**
    *   **Finding:** The administrative controllers for Coupons (`/api/admin/coupons`), Categories (`/api/admin/categories`), Tiers (`/api/admin/tiers`), and Popups (`/api/admin/popups`) are protected only by the general `requireAdmin` middleware. They **lack any role-guards**.
    *   **Impact:** A standard gate check `SCANNER` or `SUPPORT` operator can create `100% off` coupon codes, delete critical ticket categories, modify ticket pricing tiers, or create/delete customer-facing marketing popups.
*   **VULN-02: Severe Payment Integrity & Refund Logic Loophole (CRITICAL):**
    *   **Finding:** The refund creation controller (`createRefundSchema`) accepts **any positive number** for `amount`. Furthermore, the refund processing service (`refund.service.ts` line 59) **does not check if the refund amount exceeds the original payment capture amount**, nor does it check if the payment has **already been refunded** (double-refunding).
    *   **Impact:** An administrative or support user can request and process arbitrary refund amounts (e.g. ₹9,999,999 on a ₹500 order) or execute multiple refund requests against the same payment, draining funds without validation loops.

---

### Warnings

*   **WARN-01: Denial of Inventory (DoI) Checkout Attack vector (WARNING):**
    *   **Finding:** There is **no route-specific rate limiter** attached to the ticket reservation endpoint (`POST /api/bookings/`). It only inherits the global `generalLimiter` (100 requests per 15 minutes per IP).
    *   **Impact:** A bot can make 100 booking requests sequentially, locking hundreds of event seats or general capacities in MongoDB/Redis for 10 minutes, completely blocking real customers from checking out.
*   **WARN-02: Over-Exposure of Gate Scanners & Support Users (WARNING):**
    *   **Finding:** A standard gate `SCANNER` user has the lowest admin tier, yet they are allowed to fetch all system bookings (`/admin/bookings`), bookings summary (`/admin/bookings/summary`), specific booking details (`/admin/bookings/:id`), get all event data, all coupons data, all notifications log history, and see diagnostics consistency/reservation lists under `requireAdmin`. This violates the security principle of *least privilege*.
*   **WARN-03: Stateless JWT Logout Limitation (WARNING):**
    *   **Finding:** Access tokens are stateless JWTs. When a user logs out (`POST /auth/logout`), only the refresh token is revoked in MongoDB. The short-lived access token survives and remains valid in the wild until its expiration (standard stateless JWT trade-off).

---

### Passed Areas

*   **PASS-01: Booking & Guest Session Ownership Validation (IDOR/BOLA Guard):**
    *   **Status:** **SECURE.** Customer-facing controllers strictly validate that either the authenticated `userId` or guest `sessionId` matches the booking record. Non-sequential references (`MAD-YYYY-XXXXX`) prevent BOLA enumeration attacks.
*   **PASS-02: Cryptographic Session Isolation:**
    *   **Status:** **SECURE.** The app uses three entirely separate JWT signing secrets: `JWT_SECRET` (users), `JWT_ADMIN_SECRET` (admins), and `JWT_SESSION_SECRET` (guests). This completely prevents token privilege escalation.
*   **PASS-03: Webhook Verification & Replay Protection:**
    *   **Status:** **SECURE.** Webhooks utilize cryptographic signature verification (Stripe's native SDK and Razorpay's HMAC SHA-256). Duplicate/replay attacks are blocked atomically via a unique index on `WebhookEvent.eventId`.
*   **PASS-04: Worker & Queue Idempotency:**
    *   **Status:** **SECURE.** The booking worker enforces a pre-execution `Ticket.countDocuments({ bookingId })` check, preventing double-ticketing. The BullMQ queue enforces unique job IDs to prevent duplicate execution.
*   **PASS-05: Refresh Token Rotation (RTR):**
    *   **Status:** **SECURE.** A revoked token reuse triggers immediate revocation of all associated user refresh tokens, securing compromised sessions with a 10s network grace period.

---

## Critical Findings Details

| Area | Issue | Severity | Code Location |
| :--- | :--- | :--- | :--- |
| **RBAC** | **Coupons Endpoint Privilege Escalation:** Any `requireAdmin` user (including `SCANNER` or `SUPPORT`) can create, modify, or delete promotional coupon codes. | **CRITICAL** | `coupon.routes.ts` |
| **RBAC** | **Categories, Tiers, & Popups Privilege Escalation:** No role-guards prevent lower-privileged admin accounts from altering core metadata or marketing popups. | **CRITICAL** | `category.routes.ts`<br>`tier.routes.ts`<br>`popup.routes.ts` |
| **Refunds** | **Over-Refunding & Double-Refunding Gaps:** Zero database state validation matches the refund `amount` against the original payment value or checks for prior refunds. | **CRITICAL** | `refund.service.ts` (lines 13-27 & 59-83) |

---

## RBAC Findings

| Route | Required Role | Actual Enforcement | Risk | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/admin/refunds` | `SUPER_ADMIN`, `ADMIN` (write) | Strictly enforced on POST/PATCH. | Safe write. | **PASS** |
| `/api/admin/refunds` | `SUPER_ADMIN`, `ADMIN` | Only `requireAdmin` on GET (`getRefunds`). | Standard operators can view all transaction history. | **WARNING** |
| `/api/admin/bookings` | `SUPER_ADMIN`, `ADMIN`, `SUPPORT` (write) | Strictly enforced on PATCH/POST. | Safe write. | **PASS** |
| `/api/admin/bookings` | `SUPER_ADMIN`, `ADMIN`, `SUPPORT` | Only `requireAdmin` on GET. | `SCANNER` users can view all customer bookings and summaries. | **WARNING** |
| `/api/admin/coupons` | `SUPER_ADMIN`, `ADMIN`, `MANAGER` (implied) | Only `requireAdmin` on all endpoints. | **Privilege Escalation:** Standard scanners can create `100% off` coupons. | **CRITICAL** |
| `/api/admin/categories` | `SUPER_ADMIN`, `ADMIN`, `MANAGER` (implied) | Only `requireAdmin` on all endpoints. | Scanners can delete categories. | **CRITICAL** |
| `/api/admin/tiers` | `SUPER_ADMIN`, `ADMIN`, `MANAGER` (implied) | Only `requireAdmin` on all endpoints. | Scanners can delete or modify ticket pricing tiers. | **CRITICAL** |
| `/api/admin/popups` | `SUPER_ADMIN`, `ADMIN`, `MANAGER` (implied) | Only `requireAdmin` on all endpoints. | Scanners can manipulate customer marketing popups. | **CRITICAL** |
| `/api/admin/team` | `SUPER_ADMIN` | `requireSuperAdmin` on all endpoints. | Safe management of admin users. | **PASS** |
| `/api/admin/scanner` | `SCANNER`, `SUPPORT`, `ADMIN` (implied) | Only `requireAdmin` on scan/lookup. | Anyone with admin access can scan tickets at the gate. | **PASS** |

---

## Ownership Findings

| Endpoint | Ownership Check | Risk | Status |
| :--- | :--- | :--- | :--- |
| `GET /api/bookings/:bookingId` | Match user JWT sub OR session JWT UUID against DB. | None. Access strictly verified. | **PASS** |
| `GET /api/bookings/:bookingId/download` | Match user JWT sub OR session JWT UUID against DB. | None. | **PASS** |
| `POST /api/bookings/:bookingId/resend` | Match user JWT sub OR session JWT UUID against DB. | None. Rate-limited to 3/hour to prevent spamming. | **PASS** |
| `PUT /api/bookings/:bookingId/checkout-details` | Match user JWT sub OR session JWT UUID against DB. | None. | **PASS** |

---

## Refund Findings

| Action | Authorized Roles | Risk | Status |
| :--- | :--- | :--- | :--- |
| **Request Refund** | `SUPER_ADMIN`, `ADMIN` | **No Database Validation:** Can be created for any positive amount (including greater than order total) and for unpaid/failed bookings. | **CRITICAL** |
| **Process Refund** | `SUPER_ADMIN`, `ADMIN` | **Double-Refunding / Over-Refunding:** Zero checks verify prior completed refunds on the payment, or enforce that the total refund is less than or equal to the captured amount. | **CRITICAL** |

---

## Webhook Findings

| Webhook | Verification | Risk | Status |
| :--- | :--- | :--- | :--- |
| `POST /webhook/stripe` | Cryptographic signature validation via Stripe SDK. | None. Concurrent duplicate runs blocked atomically via unique index on `WebhookEvent.eventId`. | **PASS** |
| `POST /webhook/razorpay` | Cryptographic signature verification via HMAC SHA-256 raw body. | None. Duplicate events blocked via unique event ID index. | **PASS** |

---

## Queue Findings

| Worker | Idempotent? | Risk | Status |
| :--- | :--- | :--- | :--- |
| `booking.worker.ts` | **YES.** Pre-execution check: `Ticket.countDocuments({ bookingId }) > 0` returns immediately. | None. Prevents duplicate ticket generation. | **PASS** |
| `pdf.worker.ts` | **YES.** Deduplicated at the BullMQ level using a deterministic `pdf:generate:${bookingId}` job ID. | None. Prevents duplicate PDF generation. | **PASS** |
| `email.worker.ts` | **YES.** Deduplicated using a deterministic `email:dispatch:${bookingId}` job ID and updates Notification state atomically. | None. | **PASS** |

---

## Session Findings

| Area | Finding | Risk | Status |
| :--- | :--- | :--- | :--- |
| **Token Secrets** | Uses distinct signing secrets for admin JWTs, user JWTs, and guest session JWTs. | None. Safe against token-spoofing privilege escalations. | **PASS** |
| **Refresh Rotation** | Revokes entire session chains immediately upon revoked token reuse. | None. Secure session compromise response. | **PASS** |
| **Session Isolation** | Refuses user session refreshes for token chains belonging to admin IDs. | None. Enforces strict boundary isolation. | **PASS** |
| **Logout** | Stateless JWT access tokens cannot be server-revoked. | Access token remains valid until expiration (short window). | **WARNING** |

---

## Rate Limiting Findings

| Endpoint | Protected | Risk | Status |
| :--- | :--- | :--- | :--- |
| `/api/auth/*` | **YES** (`authLimiter` — default 10 / 15m) | None. High protection against OTP brute-forcing and email spam. | **PASS** |
| `/api/payments/*` | **YES** (`paymentLimiter` — default 20 / 15m) | None. | **PASS** |
| `/api/bookings/` (Reservation) | **NO** (only inherits global `100 / 15m`) | **Denial of Inventory:** A single IP can reserve 100 booking items, locking up seat layout inventory and blocking checkouts. | **WARNING** |
| `/api/bookings/:bookingId/resend` | **YES** (`resendLimiter` — 3 / hour) | None. Safe against SMTP mail-server spam. | **PASS** |
| Global `/api/*` | **YES** (`generalLimiter` — default 100 / 15m) | None. Baseline DDoS/scraping guard. | **PASS** |

---

## Priority Remediation Plan

### P0: Immediate Production Risks (Refund & RBAC Hardening)
1.  **Enforce Zod & Mongoose State Checks on Refund Request:**
    *   Inject business rules during `createRefund` inside `refund.service.ts`:
        *   Validate booking status is `confirmed` and payment status is `paid`.
        *   Retrieve the total amount of already-completed refunds for this payment: `const existingRefundsSum = await Refund.aggregate(...)`.
        *   Block creation if `requestedAmount + existingRefundsSum > payment.amount`.
2.  **Attach Role-Guards on Coupons, Categories, Tiers, and Popups:**
    *   Open `coupon.routes.ts`, `category.routes.ts`, `tier.routes.ts`, and `popup.routes.ts`.
    *   Attach `requireRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)` or appropriate role scopes to all write actions (POST, PUT, DELETE, PATCH).

### P1: Authorization Hardening
1.  **Checkout-Specific Rate Limiting:**
    *   Create a dedicated `checkoutLimiter` in `rate.middleware.ts` (e.g. 5 checkout attempts per 15 minutes per IP/Session).
    *   Attach the `checkoutLimiter` directly to the reservation route `POST /api/bookings/` in `public/booking.routes.ts`.
2.  **Least Privilege Enforcement on Admin Views:**
    *   Restructure administrative view routes so that lowest-tier roles (like `SCANNER` users) are strictly restricted from listing all bookings or viewing diagnostics.

### P2: Operational Security Improvements
1.  **Enforce Strict Double-Refund Checks:**
    *   Prevent `processRefund` from completing if a concurrent thread has already changed the payment state or if the cumulative refund sum has hit the payment cap.

### P3: Defense-in-Depth Enhancements
1.  **Access Token Revocation / Blacklist:**
    *   Maintain a Redis-based blacklist for revoked access tokens upon user logout to immediately kill active JWTs during their short TTL window.

---

## Final Verdict

Production Security Posture: **WARNING**

The core customer-facing checkout flow, session tokens, and webhook cryptographic sign loops are **exceptionally secure (PASS)**. However, the administrative backend contains **CRITICAL privilege escalation and refund logic holes** that could expose the business to financial loss or promo abuse by low-tier admin accounts.

Highest Risk Area: **Administrative Role Enforcement & Refund Integrity Gaps**

Recommended Next Branch:

```bash
git checkout -b audit/security-permission-review
```

Confidence: **HIGH**
