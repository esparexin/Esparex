# REFUND-002 Evidence Discovery

This document details the exact refund approval path, transaction boundaries, locking behaviors, and calculations inside the codebase.

---

## 1. Current Approval Flow
The approval flow is implemented in `processRefund()` ([refund.service.ts:L274](../../../apps/server/src/services/admin/refund.service.ts#L274)). The sequence is:
1. **Document Claim**: Atomically fetch and transition the refund status from `'requested'` to `'processing'` via `Refund.findOneAndUpdate()`.
2. **Context Retrieval**: Retrieve referenced `Payment` and `Booking` documents.
3. **Status Validation**: Check that the payment is in `PAID` or `PARTIALLY_REFUNDED` status, and the booking is in `CONFIRMED` or `CANCELLED` status.
4. **Balance Cap Validation**: Retrieve all `completed` refunds matching the payment ID and verify that the sum of completed refunds + current refund amount does not exceed the payment amount.
5. **Gateway Execution**: If `manualOverride` is false, execute the HTTP request to the payment gateway (Stripe API or Razorpay endpoint).
6. **State Persistence**: On gateway success, execute a database transaction (`runInTransaction`) to save the refund as `'completed'`, cancel the booking if fully refunded, and transition payment status to `'refunded'` or `'partially_refunded'`.
7. **Post-Commit Side Effects**: Fire websockets and queue refund receipt emails.

---

## 2. Current Transaction Boundaries
The approval path segments database operations across distinct boundaries:
* **Segment 1 (Claim)**: Independent atomic Mongoose write operation. Runs outside of any transaction session.
* **Segment 2 (Validation & Balance Check)**: Standalone read operations executed outside of any transaction session.
* **Segment 3 (Gateway Call)**: API call executed over HTTPS outside of database transaction boundaries.
* **Segment 4 (Persistence)**: Multi-document write operation wrapped inside `runInTransaction()` ([refund.service.ts:L454](../../../apps/server/src/services/admin/refund.service.ts#L454)).
* **Segment 5 (Error Revert)**: Standalone write query in the `catch` block (`Refund.updateOne`) executed outside of a transaction session.

---

## 3. Current Locking Behavior
* **No Parent Locking**: No database lock (such as Mongoose versioning, pessimistic locks, or document session locks) is acquired on the parent `Payment` or `Booking` documents.
* **Non-blocking Reads**: Mongoose queries for Payment and Booking use `.session(undefined)` or are unsessioned, meaning concurrent threads do not block each other while checking balances.

---

## 4. Current Cumulative Refund Calculations
* Cumulative balance is calculated using:
  ```typescript
  const completedRefunds = await Refund.find({
    paymentId: payment._id,
    status: 'completed',
    _id: { $ne: refund._id }
  });
  const totalRefundedSoFar = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
  ```
* **Loophole**: This query filters exclusively for `status: 'completed'`. It completely ignores any other refund documents that are currently in `'requested'` or `'processing'` status, allowing concurrent threads to double-refund because neither has reached `completed` status yet.

---

## 5. Current Gateway Execution Order
* **Gateway First**: The gateway call (Stripe or Razorpay API request) is executed *before* any database updates are persisted in the transaction session.
* **Stale Reads**: Since balance validation occurs prior to gateway calls and does not block concurrent checkouts or locks, two threads can concurrently execute gateway refunds.

---

## 6. Current Failure Recovery Path
* If a gateway API call fails (or a database commit fails), execution jumps to the catch block:
  ```typescript
  } catch (err: any) {
    logger.error({ err, refundId: id }, 'Error processing refund. Reverting status to requested.');
    await Refund.updateOne(
      { _id: id, status: 'processing' },
      { $set: { status: 'requested' } }
    ).catch((revertErr) => { ... });
    throw err;
  }
  ```
* **Loophole**: If the gateway call succeeds but the database connection drops or a commit fails, the database status is reverted to `'requested'`, allowing the admin to trigger the gateway call again. This results in duplicate gateway execution.
