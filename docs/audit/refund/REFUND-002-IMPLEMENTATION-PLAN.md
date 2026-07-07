# REFUND-002 Implementation Plan (Revised)

This implementation plan outlines the structural changes to resolve duplicate refund approval race conditions (Finding RFND-F02).

---

## 1. Proposed Changes

### apps/server (Backend Refund Domain)

#### [MODIFY] [refund.service.ts](../../../apps/server/src/services/admin/refund.service.ts)
* **`createRefund`**:
  - Update the cumulative refund check to include `processing` and `completed` status:
    ```typescript
    status: { $in: ['processing', 'completed'] }
    ```
    Requested refunds do not consume capacity.
* **`processRefund`**:
  - Implement the **Two-Phase Reservation/Commit** design:
    1. **Phase 1: Claim and Reserve**:
       - Start a Mongoose transaction session.
       - Atomic claim using `findOneAndUpdate({ _id: id, status: 'requested' }, { $set: { status: 'processing' } }, { session, new: true })`.
       - Acquire an exclusive write lock on the parent `Payment` document:
         ```typescript
         const payment = await Payment.findOneAndUpdate(
           { _id: refund.paymentId },
           { $set: { updatedAt: new Date() } },
           { session, new: true }
         );
         ```
       - Query booking and perform status checks.
       - Calculate cumulative balance including active reservations:
         ```typescript
         const existingRefunds = await Refund.find({
           paymentId: payment._id,
           status: { $in: ['processing', 'completed'] },
           _id: { $ne: refund._id }
         }).session(session);
         ```
       - Verify that `totalRefundedSoFar + refund.amount <= payment.amount`.
       - Commit the reservation transaction.
    2. **Phase 2: Gateway Integration**:
       - Run Stripe/Razorpay API call outside of any database transaction.
    3. **Phase 3: Persistence**:
       - Run a second transaction to update the status to `'completed'` (from `'processing'`), update payment status, and cancel the booking.
    4. **Phase 4: Failure Recovery**:
       - In the `catch` block, if any error occurs (gateway call fails or DB persistence fails), run a conditional update to release reservation:
         ```typescript
         await Refund.updateOne(
           { _id: id, status: 'processing' },
           { $set: { status: 'requested' } }
         );
         ```

---

## 2. Verification Plan

### Automated Tests
- Run existing unit test suites:
  ```bash
  pnpm test
  ```
- Run type check and verify type safety:
  ```bash
  pnpm type-check
  ```
- Run turbo build to guarantee build parity:
  ```bash
  pnpm build
  ```
- Add the following test cases in `refund.service.test.ts`:
  - **Test Case 1**: Concurrent approval of different refunds for same payment (A succeeds, B fails).
  - **Test Case 2**: Concurrent approval of the same refund (only one succeeds).
  - **Test Case 3**: Gateway failure (`processing` -> `requested` conditionally).
  - **Test Case 4**: Partial refunds cap validations.
  - **Test Case 5**: Concurrent Partial Refund Exhaustion (Payment = 100, A=40, B=40, C=40. Approve A and B successfully, C fails).

### Manual Verification
- Review status changes and concurrency boundaries using:
  ```bash
  git diff
  ```

---

## 3. Rollback Strategy
- In case of regressions, discard changes and restore files via Git:
  ```bash
  git restore apps/server/src/services/admin/refund.service.ts
  ```
