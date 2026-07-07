# Booking TTL Remediation Design

This document details the architectural design to resolve the **Booking TTL Deletion & Webhook Race Condition** defect. This defect occurs when the physical deletion of a pending booking by MongoDB's native TTL index races with a successful payment verification redirect or a delayed webhook arrival, resulting in orphaned payments and missing tickets.

---

## 1. Option Evaluations

### Option A: Remove MongoDB TTL Deletion & Use Logical EXPIRED Status
*Description: Retain booking documents in the database after their checkout window closes, transitioning their status logically to `EXPIRED` instead of deleting them. A background task or logical check releases the held inventory (seats and capacity) exactly at the 10-minute threshold. Physical cleanup is deferred by 30 days.*

- **Complexity**: **Low-Medium**. Requires updating the booking status enumeration, modifying the checkout check to recognize `EXPIRED` status, and configuring a background consistency task to release locked seats at the 10-minute mark while extending `expiresAt` to 30 days.
- **Risk**: **Low**. High safety profile. Booking documents are guaranteed to remain in the database for late-arriving payment webhooks to recover.
- **Data Integrity Impact**: **Excellent**. Ensures perfect auditability. Orphaned payments are eliminated, as any late webhook can easily resolve the matching booking record.
- **Backward Compatibility**: **Excellent**. Existing collections, schemas, and indexing parameters remain fully compatible.
- **Operational Impact**: **Very Low**. The database grows slightly faster, but the 30-day deferred TTL automatically prunes stale documents.

---

### Option B: Increase TTL Duration Significantly
*Description: Increase the hard-coded TTL window in the booking creation service from 10 minutes to a much larger threshold (e.g. 2 hours or 24 hours).*

- **Complexity**: **Extremely Low**. A single-line constant change.
- **Risk**: **Critical**. Severe threat of **inventory starvation**. Locked seats and event capacity for abandoned checkouts remain blocked, preventing other active attendees from booking tickets and directly impacting revenue.
- **Data Integrity Impact**: **Poor**. Late webhooks arriving past the increased window will still suffer from data loss.
- **Backward Compatibility**: **Excellent**.
- **Operational Impact**: **High**. Massive customer friction on high-demand, fast-selling events.

---

### Option C: Retain TTL & Implement Complex Recovery/Reconciliation Logic
*Description: Retain the strict 10-minute physical deletion index, but implement complex backend logic inside the webhook handler to dynamically reconstruct a deleted booking from the raw gateway payload and payment logs if it is not resolved.*

- **Complexity**: **High**. Reconstructing nested customer details, specific seating coordinates, and multi-tier ticket reservations is structurally complex because gateway payloads do not store rich, nested Mongoose schemas.
- **Risk**: **High**. Heavy dependency on client metadata. Prone to data mismatch errors and state desynchronizations.
- **Data Integrity Impact**: **Moderate**. High probability of restoring bookings with incorrect seat allocations or corrupted attendee logs.
- **Backward Compatibility**: **Fragile**.
- **Operational Impact**: **High**. Creates significant engineering support overhead to manually troubleshoot failed recovery runs.

---

## 2. Recommendation

We highly recommend **Option A (Logical EXPIRED Status with Deferred 30-day TTL)**.

### Recommended Execution Plan (The Smallest Safe Fix)
To implement Option A without needing database index rebuilds or complex schema migrations, we can leverage the existing `{ expireAfterSeconds: 0 }` TTL index by dynamically moving `expiresAt` forward:

1. **Keep TTL Index**: Keep the `{ expireAfterSeconds: 0 }` TTL index on `expiresAt` exactly as configured in [booking.schema.ts](../../../apps/server/src/models/booking.schema.ts#L109).
2. **Initial Booking Creation**:
   - Set the booking `status` to `AWAITING_PAYMENT`.
   - Set a new field, `logicalExpiresAt = now + 10 minutes` to represent the checkout window.
   - Set the database `expiresAt = now + 30 days`. This ensures MongoDB will not physically delete the document for 30 days, giving ample time for webhook processing and recovery.
3. **Inventory Release**:
   - A background job or consistency check (e.g., `ConsistencyService`) identifies bookings where `now >= logicalExpiresAt` and `status === AWAITING_PAYMENT`.
   - It transitions the booking status logically to `EXPIRED` (or `FAILED`) and immediately releases the locked seats in MongoDB and Redis locks.
4. **Webhook Recovery Path**:
   - In `confirmFromWebhook` and `verifyPayment`, if a successful payment event is validated, allow the handler to process the booking if its status is `AWAITING_PAYMENT` **OR** `EXPIRED`.
   - If the status is `EXPIRED`, transition it to `CONFIRMED`, allocate tickets, and unset the `expiresAt` field entirely. This recovers the seat reservation (or alerts the admin if the specific seats were already booked by another transaction, prompting a manual upgrade/re-allocation).

This represents the absolute **cleanest, safest, and most resilient** production solution.

---

## 3. Exact Files Requiring Modification

### 1. [booking.schema.ts](../../../apps/server/src/models/booking.schema.ts)
- Add `logicalExpiresAt?: Date` to the schema and interface to track the exact checkout window separate from physical deletion.

### 2. [booking.service.ts](../../../apps/server/src/services/public/booking.service.ts)
- Set `logicalExpiresAt = new Date(Date.now() + 10 * 60 * 1000)` and `expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)` (30 days) during initial booking creation.

### 3. [payment.service.ts](../../../apps/server/src/services/public/payment.service.ts)
- Refactor the atomic confirmation status filter inside `confirmBooking` to allow transitions from `AWAITING_PAYMENT` OR `EXPIRED` statuses to `CONFIRMED`:
  ```typescript
  const confirmedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: [BookingStatus.AWAITING_PAYMENT, BookingStatus.EXPIRED] } },
    { $set: { status: BookingStatus.CONFIRMED }, $unset: { expiresAt: 1, logicalExpiresAt: 1 }, $inc: { bookingVersion: 1 } },
    { new: true }
  );
  ```
- Implement seat-conflict check during recovery: if specific locked seats were already taken, log a high-priority admin alert to prompt manual ticket re-seating while confirming the booking.

### 4. [consistency.service.ts](../../../apps/server/src/services/consistency.service.ts)
- Add a query to scan for bookings where `status === AWAITING_PAYMENT` and `logicalExpiresAt <= now`.
- Transition these stale bookings to `EXPIRED` status and release their locked seats and capacity.
