# Booking Status Verification Audit Report

This report presents the findings of a comprehensive audit of booking lifecycle states across the MAD Entertainment platform. The objective is to verify status consistency across the database, backend services, public APIs, customer portals, admin portals, refund flows, and analytics.

---

## Executive Summary

| Phase | Description | Status | Key Remarks |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Status Source of Truth | **PASS with Notes** | Allowed values, enums, and terminal state guards are correctly defined, though some enums (`BookingStatus.PENDING`, `RefundStatus.REJECTED`) are redundant and unused in practice. |
| **Phase 2** | Backend Lifecycle Audit | **PASS with Notes** | Transitions are validated and terminal states are enforced, but administrative booking cancellation fails to update the corresponding payment status. |
| **Phase 3** | Customer Portal Audit | **PASS** | Visual representation of booking states is fully mapped. Refunded status shows as *"Refunded"* with a purple badge; failed status shows as *"Payment Failed"* with a red badge. |
| **Phase 4** | Admin Portal Audit | **FINDINGS** | Discrepancies exist in bookings filtering (missing `PENDING` filter) and metrics totals (Dashboard total bookings count only includes `CONFIRMED` whereas Bookings page includes all states). |
| **Phase 5** | API Consistency Audit | **PASS with Notes** | Serialized database models flow consistently to API responses. However, a schema-to-type mismatch was identified for the `Ticket` status field. |
| **Phase 6** | Refund Lifecycle Audit | **PASS** | The refund lifecycle resolves correctly: bookings and reservations transition to `REFUNDED`, payments transition to `refunded`, and customer/admin portals show appropriate status. |

---

## Phase-by-Phase Auditing Answers

### Phase 1 — Status Source of Truth
We audited the enums defined in [packages/shared/src/constants/index.ts](../../../packages/shared/src/constants/index.ts#L39-L157) and TypeScript types in [packages/types/src/index.ts](../../../packages/types/src/index.ts#L175-L261):

* **Can a booking move from CONFIRMED → REFUNDED?**
  **Yes**. In [refund.service.ts](../../../apps/server/src/services/admin/refund.service.ts#L80), the approved refund flow invokes `cancelBooking` with a target status of `BookingStatus.REFUNDED`.
* **Can a booking move from PENDING → FAILED?**
  **No**. In [payment.service.ts](../../../apps/server/src/services/public/payment.service.ts#L960), the payment failure flow includes a guard: `if (booking.status !== BookingStatus.AWAITING_PAYMENT) return;`. Since `PENDING` is not `AWAITING_PAYMENT`, the transition is skipped. (Furthermore, bookings are never initialized in the `PENDING` status; they are created as `AWAITING_PAYMENT`).
* **Can a booking move from REFUNDED → CONFIRMED?**
  **No**. The confirmation flow [payment.service.ts](../../../apps/server/src/services/public/payment.service.ts#L1043) includes a strict guard: `if (![BookingStatus.AWAITING_PAYMENT, BookingStatus.EXPIRED, BookingStatus.EXPIRING].includes(previousStatus)) return booking;`. This blocks confirmation of any bookings already in terminal states like `REFUNDED`.
* **Are terminal states enforced?**
  **Yes**. In [booking.service.ts](../../../apps/server/src/services/admin/booking.service.ts#L212-L218), `cancelBooking` enforces that bookings already in `CANCELLED`, `FAILED`, or `REFUNDED` states throw `AppError.badRequest` if further cancellation is attempted.

---

### Phase 2 — Backend Lifecycle Audit
Below is the status source and transition mapping:

| Status | Created By | Updated By | Terminal |
| :--- | :--- | :--- | :---: |
| **Pending** (`PENDING`) | Never created (redundant enum) | Never updated | **No** |
| **Confirmed** (`CONFIRMED`) | Never created directly | `PaymentService.confirmBooking` (on payment success / late recovery) | **No** (can transition to `CANCELLED` or `REFUNDED`) |
| **Cancelled** (`CANCELLED`) | Never created directly | `bookingService.cancelBooking` (called on manual/admin cancellation) | **Yes** |
| **Refunded** (`REFUNDED`) | Never created directly | `bookingService.cancelBooking` (called with target status `REFUNDED` via `processRefund`) | **Yes** |
| **Failed** (`FAILED`) | Never created directly | `PaymentService.failPaymentAndReleaseInventory` (on payment intent / signature / webhook fail) or `PublicBookingService.createBooking` (if reservation allocation fails) | **Yes** |

*Note on non-terminal intermediate states:*
* **Awaiting Payment** (`AWAITING_PAYMENT`): Initialized at booking creation in [booking.service.ts](../../../apps/server/src/services/public/booking.service.ts#L227). Can transition to `CONFIRMED`, `FAILED`, or `EXPIRING`.
* **Expiring** (`EXPIRING`): Intermediate locking status assigned in [consistency.service.ts](../../../apps/server/src/services/consistency.service.ts#L229) to prevent race conditions during expiration processing.
* **Expired** (`EXPIRED`): Set in [consistency.service.ts](../../../apps/server/src/services/consistency.service.ts#L282) once logical timeout is processed. It remains non-terminal as a late recovery check can transition it back to `CONFIRMED`.

---

### Phase 3 — Customer Portal Audit
We audited the display logic inside [apps/web/src/app/tickets/page.tsx](../../../apps/web/src/app/tickets/page.tsx) and [BookingHeaderCard.tsx](../../../apps/web/src/components/booking/shared/BookingHeaderCard.tsx):

* **Does every backend status have a customer-facing representation?**
  **Yes**. `TicketStatusMessage` handles all statuses. `CONFIRMED` shows ticket barcodes; other statuses show helper text messages.
* **Does REFUNDED show as Refunded?**
  **Yes**. It displays as *"Refunded"* styled with a purple border/badge style (`bg-purple-500/10 text-purple-300 border-purple-500/30`).
* **Does FAILED show as Failed?**
  **No**. The status badge shows `"Payment Failed"` rather than `"Failed"` (styled with the red tone `'danger'`).
* **Does PENDING show as Pending?**
  **Yes**. It displays as `"Pending"` styled with an amber badge style (`bg-amber-500/10 text-amber-400 border-amber-500/30`).

---

### Phase 4 — Admin Portal Audit
We audited page views under `apps/admin/src/app`:

* **Are refunded bookings counted correctly?**
  **Partially**. In the Bookings list page summary widget, refunded bookings are counted under the `"cancelled"` aggregate count. However, they are completely excluded from Dashboard stats.
* **Do all statuses appear in filters?**
  **No**. `BookingStatus.PENDING` is missing from the bookings filter list (`BOOKING_STATUS_FILTERS` in [bookings/page.tsx](../../../apps/admin/src/app/bookings/page.tsx#L33)). On the Refunds page, `RefundStatus.REJECTED` is missing because rejected refunds are database-mapped to `'failed'`.
* **Are dashboard totals consistent with booking status counts?**
  **No**. The Admin Dashboard defines `totalBookings` as only `CONFIRMED` bookings, whereas the Bookings list page widget defines `totalBookings` as the sum of all bookings in the database regardless of status.

---

### Phase 5 — API Consistency Audit
All database models (`Booking`, `Payment`, `Reservation`) store statuses as string fields validated against their respective shared enums. Controllers correctly serialize and forward these models to API responses consistently.
* *Inconsistency Found*: The shared TypeScript `Ticket` definition in [packages/types/src/index.ts](../../../packages/types/src/index.ts#L238) contains a `status: string;` field, but the actual database Mongoose schema in [ticket.schema.ts](../../../apps/server/src/models/ticket.schema.ts) has no `status` field.

---

### Phase 6 — Refund Lifecycle Audit
* **Does booking become REFUNDED?** **Yes**.
* **Does reservation become REFUNDED?** **Yes**.
* **Does customer portal show REFUNDED?** **Yes** (label *"Refunded"*).
* **Does admin portal show REFUNDED?** **Yes** (label *"Refunded"* / *"Completed"*).
* **Do analytics count REFUNDED correctly?** **No**. They are excluded from dashboard summaries and grouped generically with other cancelled items in the bookings summary widget.

---

## Detailed Findings

### Finding 1: Administrative Booking Cancellation Bypasses Payment Status Update
* **Severity**: Medium
* **Reproduction Steps**:
  1. Retrieve a confirmed, paid booking and its corresponding payment document ID.
  2. Perform an administrative cancellation on this booking in the Admin Portal (by clicking "Cancel" and submitting the request, which invokes `cancelBooking`).
  3. Query the database for the booking and payment documents.
  4. **Observation**: The booking status has updated to `'cancelled'`, but the corresponding `Payment` record status remains `'paid'`.
* **Root Cause**:
  In [booking.service.ts](../../../apps/server/src/services/admin/booking.service.ts#L223), the administrative cancellation helper `cancelBooking` updates the booking status, transitions the reservations, updates the event capacity, and releases seats, but never updates the status of the associated `Payment` document.
* **Impact**:
  Creates an inconsistent state where a booking is cancelled but its payment status remains paid/pending, causing discrepancies in financial auditing.
* **Recommended Fix**:
  Add a query inside `cancelBooking` to synchronize the associated payment status:
  ```typescript
  if (booking.paymentId) {
    await Payment.findByIdAndUpdate(
      booking.paymentId,
      { status: targetStatus === BookingStatus.REFUNDED ? PaymentStatus.REFUNDED : PaymentStatus.CANCELLED },
      { session }
    );
  }
  ```

---

### Finding 2: Inconsistent "Total Bookings" Metric Between Admin Dashboard and Bookings Summary Widget
* **Severity**: Low
* **Reproduction Steps**:
  1. Open the Admin Dashboard and note the value in the "Total Bookings" card.
  2. Open the Admin Bookings page and note the value in the "Total Bookings" summary card.
  3. **Observation**: The counts differ (the bookings summary widget displays a higher number).
* **Root Cause**:
  * In [analytics.controller.ts](../../../apps/server/src/controllers/admin/analytics.controller.ts#L17), the Dashboard counts only bookings matching status `BookingStatus.CONFIRMED`.
  * In [booking.service.ts](../../../apps/server/src/services/admin/booking.service.ts#L513), the Bookings page widget counts all bookings in the database matching `{ $sum: 1 }`, regardless of status.
* **Impact**:
  Admin staff will see differing metrics for "Total Bookings" depending on which view they access.
* **Recommended Fix**:
  Align both endpoints to query consistent subsets of bookings, or update the Dashboard card label to read "Confirmed Bookings" / "Active Bookings" to avoid confusion.

---

### Finding 3: Missing Status Filter Option in Admin Bookings Page Dropdown
* **Severity**: Low
* **Reproduction Steps**:
  1. Navigate to the Admin Bookings page (`/bookings`).
  2. Click the status dropdown filter.
  3. **Observation**: The `"Pending"` status does not appear in the dropdown selection.
* **Root Cause**:
  In [bookings/page.tsx](../../../apps/admin/src/app/bookings/page.tsx#L33), the frontend constant array `BOOKING_STATUS_FILTERS` does not include `BookingStatus.PENDING`.
* **Impact**:
  If a booking is saved in the database with `status: 'pending'`, it cannot be filtered out.
* **Recommended Fix**:
  Add `BookingStatus.PENDING` to the `BOOKING_STATUS_FILTERS` array.

---

### Finding 4: Redundant `RefundStatus.REJECTED` in Constant Enums
* **Severity**: Low
* **Reproduction Steps**:
  1. Process an admin refund request with the action `'reject'`.
  2. Query the processed refund record in the database.
  3. **Observation**: The status of the refund is `'failed'` instead of `'rejected'`.
* **Root Cause**:
  In [refund.service.ts](../../../apps/server/src/services/admin/refund.service.ts#L61), rejection maps to the status `'failed'`. The constant `RefundStatus.REJECTED = 'rejected'` in [index.ts](../../../packages/shared/src/constants/index.ts#L219) is never written or set.
* **Impact**:
  Visual grouping of admin-rejected refunds and gateway-failed refunds under the same `'failed'` label makes auditing less precise.
* **Recommended Fix**:
  Modify `processRefund` to transition rejected refunds to `'rejected'` instead of `'failed'`, or remove the redundant enum option from the shared constants.

---

### Finding 5: Inconsistency Between Database Ticket Model and Shared TypeScript Type Definition
* **Severity**: Low
* **Reproduction Steps**:
  1. Open [ticket.schema.ts](../../../apps/server/src/models/ticket.schema.ts) and verify the absence of a `status` field.
  2. Open the shared TypeScript definitions file [index.ts](../../../packages/types/src/index.ts#L238) and observe the presence of `status: string;` in the `Ticket` type definition.
* **Root Cause**:
  The DB schema does not store `status` for individual ticket codes (implicit to booking status), but the shared TypeScript typings declared it, causing compiling mismatch potential.
* **Impact**:
  Developers may write code expecting the database to return or support a status field for individual ticket codes, which would evaluate to `undefined` at runtime.
* **Recommended Fix**:
  Remove `status: string;` from the `Ticket` type definition in `packages/types/src/index.ts`.

---

## Conclusion
The booking lifecycle states are robustly implemented and strictly validated. By resolving the metric counts inconsistency, synchronizing payment records upon administrative cancellation, and cleaning up redundant constants, the status consistency across the MAD Entertainment platform will be fully aligned.
