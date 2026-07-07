# Booking TTL Deletion & Webhook Validation

This validation audit evaluates the high-risk finding identified in the **Booking Status Verification Audit** regarding Mongoose TTL index deletion races. It documents the technical timeline, code-level execution steps, existing recoveries (or lack thereof), and verifies whether this constitutes a practical production defect.

---

## 1. Technical Investigations

### 1. Booking TTL Configuration
- **File Reference**: [booking.schema.ts](../../../apps/server/src/models/booking.schema.ts#L109)
- **Code Block**:
  ```typescript
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }, // TTL for pending bookings
  ```
- **Behavior**: This is a native MongoDB Time-To-Live (TTL) index. MongoDB's background thread (which runs every 60 seconds) compares the current system time to the date in the `expiresAt` field. If `now >= expiresAt`, the entire `Booking` document is **physically and permanently deleted** from the collection.

### 2. Exact TTL Duration
- **File Reference**: [booking.service.ts](../../../apps/server/src/services/public/booking.service.ts#L202-L203)
- **Code Block**:
  ```typescript
  // Expiry in 10 minutes (matching the TTL index on expiresAt)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  ```
- **Duration**: Exactly **10 minutes (600 seconds)** from the moment the user clicks "Book Now" and reserves their tickets.

---

## 2. End-to-End Execution Trace

### 1. Booking Creation
The user selects tickets and initiates a booking:
1. `Booking` is created in Mongoose with `status: BookingStatus.AWAITING_PAYMENT` and `expiresAt` set to exactly `T + 10m`.
2. Seats are locked and mapped in Redis/MongoDB with matching expirations.

### 2. Payment Intent & Authorization
The user inputs checkout details and clicks "Pay Now":
1. `POST /payments/create-intent` is fired.
2. An order is created on Razorpay or a PaymentIntent on Stripe.
3. A `Payment` record is created in MongoDB with `status: PaymentStatus.PENDING` linking to the `Booking` ID, and the booking's `paymentId` is updated.
4. The user is redirected to the payment gateway's 3D-Secure page or bank OTP page.

### 3. Deletion & Verification Race
If the user takes slightly too long (e.g. Bank OTP delay, card authentication issues, network disruption) or if the asynchronous webhook is delayed in the provider's delivery queue:

```
Timeline (T = minutes:seconds)
──────────────────────────────────────────────────────────────────────────────────────
T = 00:00  | Booking created. expiresAt = T + 10:00 (10 minutes).
T = 09:50  | User successfully completes payment on gateway (funds captured).
T = 10:00  | MongoDB TTL background thread wakes up.
           | MongoDB physically deletes the Booking document (bookingId is removed).
T = 10:05  | Webhook arrives: POST /webhook/razorpay (payment.captured event).
           | confirmFromWebhook() tries to query:
           |    const booking = await Booking.findById(payment.bookingId);
           | Returns null. Webhook skips, logs a data integrity error, and exits.
──────────────────────────────────────────────────────────────────────────────────────
```

---

## 3. Detailed Audit Questions & Answers

### 1. Can a valid paid booking be deleted before confirmation?
**Yes.**
If a user completes a payment successfully, but the frontend verification redirect is closed/interrupted, the backend relies entirely on the webhook fallback. If that webhook takes longer than the remaining TTL window to arrive, the `Booking` document is permanently deleted from MongoDB.

### 2. What is the worst-case timeline?
A user initiates checkout and pays successfully at **9 minutes and 50 seconds** (10 seconds before expiration). If the webhook takes more than 10 seconds to deliver, the booking document is deleted. The webhook then arrives at **10 minutes and 5 seconds**, finds no booking, logs a warning, and skips confirmation.

### 3. Is the risk theoretical or practical?
**Highly Practical.**
In real-world e-commerce and ticketing pipelines:
- Bank 3D Secure verification loops frequently take 2 to 5 minutes to complete due to SMS OTP network delays.
- Gateway webhook delivery queues can experience sudden congestion, leading to delays ranging from 1 minute to several hours.
- Customers frequently get distracted or experience slow mobile internet connections mid-checkout.
A strict 10-minute hard physical deletion TTL on MongoDB will guarantee a significant percentage of failed booking completions for paid transactions.

### 4. Is there already a recovery path?
**No.**
- **Webhook confirmation** does not check for missing bookings or try to recreate them; it logs `'associated Booking is missing — data integrity issue'` and skips.
- **Frontend verification** (`verifyPayment`) throws a generic `404 Booking not found` error, giving the customer no guidance or recourse.
- **Reconciliation scripts**: There are no background cron jobs or reconciliation workers in the codebase designed to scan orphaned `Payment` records in the `PAID` state and recreate their corresponding `Booking` and `Ticket` entries.
- **Admin recovery**: The admin control panel contains no features to manually reconstruct bookings from gateway transaction logs.

### 5. Is customer-impact possible?
**Yes, severe.**
Paid attendees will arrive at the venue entry scanner, try to load their tickets on the retrieval portal, and find absolutely nothing in the database. The system has collected their funds, but the physical deletion left no ticket record, no seat maps, and no validation QR codes. This leads directly to customer complaints, support escalations, and payment chargeback disputes.

---

## 4. Conclusion & Technical Verdict

**C. Production-impacting defect requiring fix.**

The combination of a short 10-minute native MongoDB TTL physical deletion index with a fallback webhook architecture is a critical engineering defect. It guarantees that any delayed webhook or slow user payment results in permanent data loss (orphaned PAID transaction records and zero ticket generation).

### Recommendations
1. **Remove Physical Deletion**: Remove `{ expireAfterSeconds: 0 }` from `Booking.schema.ts`.
2. **Implement Logical Expiry**: Transition bookings to `EXPIRED` status via a background cron task instead of physical deletion.
3. **Webhook Recovery Path**: Allow the webhook confirmation flow to recover `EXPIRED` bookings if a successful payment is captured, transitioning them safely to `CONFIRMED` and generating the appropriate entry tickets.
