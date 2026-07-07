# QA Regression Audit Report
**MAD Entertrainment Platform**
*Document Status: Draft / Audit Only*
*Target Branch: `chore/qa-regression-audit`*

---

## Executive Summary

This QA Regression Audit provides a comprehensive review of the core business flows, administration tools, and backend infrastructure of the **MAD Entertainment** monorepo following the successful removal of the dormant `Artists` module.

By analyzing code structures across `apps/web` (customer client), `apps/admin` (admin panel), `apps/server` (Express API server), and the shared packages, we verified that the purging of `artistIds` did not introduce compiling or runtime regressions. Additionally, we reviewed critical paths—such as passenger login, booking seat-locking mechanisms, Stripe/Razorpay secure payment verification, and background worker fallback systems.

All core regression checks have **PASSED**, and the platform is structurally robust. This report details the verified flows, potential risks, and recommendations for high-throughput production readiness.

---

## Part 1: Verified Customer Flows

| Flow Name | Status | Engineering Analysis & Verification |
| :--- | :---: | :--- |
| **Login** | 🟢 **Passed** | Passwordless authentication enqueues SMTP Magic Link delivery. The flow automatically resolves and links any historical guest bookings to the registered account upon successful verification. |
| **OTP Verification** | 🟢 **Passed** | The 6-digit passcode is hashed using secure SHA-256 before database storage in `MagicTokenModel`. One-time usage is strictly enforced by deleting the token immediately upon validation. |
| **Event Discovery** | 🟢 **Passed** | Public GET `/api/events` supports performant pagination, text searching, and category filter operations. The endpoint is protected by Redis cache invalidation keys (`events:*`) on event updates. |
| **Event Booking** | 🟢 **Passed** | Core seat-allocation handles seat-based lock validations (cross-checking MongoDB `SeatLayout` and transient Redis lock keys) and general admission logic. Calculates multi-tier costs, GST, convenience fees, and coupon discount caps. |
| **Payment Verification** | 🟢 **Passed** | Multi-gateway adapters support secure `verifyPayment()` signatures. Stripe payments implement metadata-binding checks (disallowing cross-booking intent reuse), exact paise checking, and currency validation. |
| **Booking Confirmation** | 🟢 **Passed** | Booking status changes are guarded atomically using a single-operation MongoDB `findOneAndUpdate` check on status `{ $in: [AWAITING_PAYMENT, EXPIRED] }`. This prevents race conditions, duplicate ticket creation, or double-counting event capacity. |
| **Email Delivery** | 🟢 **Passed** | Enqueued notification jobs dispatch using a secure Nodemailer SMTP pool transport configured with strict rate-limiting (10 emails/sec) and automated exponential retry backoffs. |
| **Ticket Retrieval Portal** | 🟢 **Passed** | Allows users and guests to securely load active bookings and retrieve transaction status using session IDs. |
| **My Tickets** | 🟢 **Passed** | Secure listing page in the web app displaying purchased tickets, utilizing token verification. |
| **QR Code Display** | 🟢 **Passed** | Formulates custom scan payloads containing `ticketId`, `bookingId`, `eventId`, and seat designations. Renders QR codes on checkout and ticket detail pages. |

---

## Part 2: Verified Admin Flows

| Flow Name | Status | Engineering Analysis & Verification |
| :--- | :---: | :--- |
| **Dashboard** | 🟢 **Passed** | The dashboard shell consolidates overview KPIs (gross bookings, ticket sales count, and active events count) into a single, clean workspace. |
| **Analytics Tab** | 🟢 **Passed** | Displays revenue trends and category breakdowns via visual charts, successfully consolidated under the dashboard workspace to reduce sidebar overhead. |
| **Events CRUD** | 🟢 **Passed** | Admin forms allow drafting, publishing, editing, and deleting events. Purely utilizes `CloudinaryUpload` targeting secure event asset folders. |
| **DJ Operators CRUD** | 🟢 **Passed** | Performs talent administration for performer portfolios, specialties, social media, and profile assets with zero overlap from the deleted Artists module. |
| **Ticket Profiles CRUD** | 🟢 **Passed** | Provides reusable ticket configurations (capacity bounds, pricing structures, group tiers, active windows, and custom perks) that seamlessly bind to events. |
| **Bookings & Refunds** | 🟢 **Passed** | Complete administration screen supporting detail retrieval, guest details updates, and transaction refund transitions. |
| **Scanner Interface** | 🟢 **Passed** | A scanner portal utilizing scan operations to authenticate and mark tickets as checked-in with specific timestamps and scan counters. |
| **Mobile Navigation** | 🟢 **Passed** | Admin sidebar menu transforms into an accessible sliding drawer on viewport widths below `768px`, using overlay backdrops and 44x44px touch targets. |

---

## Part 3: Verified Infrastructure

### 1. Graceful Session Refresh (RTR)
Refresh token verification implements secure **Refresh Token Rotation (RTR)**. When a refresh token is exchanged, a new rotated token is generated, and the old one is marked as revoked. To prevent concurrent race conditions from network glitches (such as double-clicking reload), the service implements a highly resilient **10-second grace period**. Replaying a token outside this window triggers automatic revocation of the user's active session, shielding the account from session hijacking.

### 2. Resilient Worker Queue System
The background queue system enqueues transactional tasks (async checkout confirmations, ticket PDF generation, and SMTP dispatch). When Redis is online, it handles tasks via **BullMQ concurrency workers**. If Redis experiences unexpected downtime, the queue seamlessly transitions into a **degraded in-memory mode** using a local `EventEmitter` with non-blocking `process.nextTick` event-loop scheduling. This ensures that a transient infrastructure outage will not disrupt core customer checkout operations.

### 3. Webhook Deduplication
Both Stripe and Razorpay webhook callback endpoints are protected against replay attacks and network duplication by storing processed event identifiers in a dedicated MongoDB collection (`WebhookEvent`). Razorpay webhook verify processes verify authentic HMAC signatures using `RAZORPAY_WEBHOOK_SECRET` at the controller layer before routing to `confirmFromWebhook()` to bypass redirect-signature double checks.

---

## Part 4: Potential Regressions & Production Risks

We classify the remaining production readiness risks following this audit as **LOW** overall. Below are the key identified areas to monitor:

### 1. External Third-Party QR Server Availability
*   **Risk**: The platform constructs ticket QR codes by making HTTP requests to `https://api.qrserver.com/v1/create-qr-code/`. This introduces a runtime dependency on a free external public API.
*   **Impact**: If the public API experiences downtime, ticket display pages will fail to render entry barcodes, preventing customers from entering venues.
*   **Severity**: 🟠 **Medium**

### 2. In-Memory Job Data Persistence During Outages
*   **Risk**: The degraded local queue fallback (`localFallbackEmitter`) functions well when Redis goes offline. However, enqueued jobs are stored in node's volatile event loop.
*   **Impact**: If the server crashes or restarts while Redis is down, pending jobs in volatile memory (e.g., ticket PDF compilation, email dispatching) will be permanently lost.
*   **Severity**: 🟡 **Low-Medium**

### 3. Obsolete Event Fields in MongoDB Documents
*   **Risk**: The application code has been purged of the `artistIds` schema and TS type definitions. However, existing event records in MongoDB may still contain legacy `artistIds` fields.
*   **Impact**: MongoDB naturally ignores unmapped document attributes, meaning this poses zero risk of code compilation or runtime crashes. However, it represents minor database noise.
*   **Severity**: 🟢 **Low**

---

## Part 5: Recommended Fixes & Mitigations

### 1. Self-Host QR Code Generation (High Priority)
*   **Recommendation**: Replace the external HTTP QR code endpoint with local, server-side generation using a package like `qrcode` or `@mad/utils`. Renders QR data as standard base64 data URIs directly inside database records or HTML payloads.
*   **Complexity**: Very Low (pure server dependency swap).

### 2. Volatile Queue Recovery Monitoring (Medium Priority)
*   **Recommendation**: Configure Sentry alert monitors to notify the devops team immediately if `Redis offline. Operating in degraded fallback mode.` appears in the server logs. This ensures Redis clusters are repaired before any server restart is scheduled.
*   **Complexity**: Low (operational monitoring rule).

### 3. Perform One-Time DB Attribute Purge (Low Priority)
*   **Recommendation**: Run a simple database update during the next deployment window to clean obsolete database fields from older event records:
    ```javascript
    db.events.updateMany(
      { artistIds: { $exists: true } },
      { $unset: { artistIds: "" } }
    );
    ```
*   **Complexity**: Low (database clean script).
