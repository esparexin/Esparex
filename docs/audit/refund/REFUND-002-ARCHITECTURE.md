# REFUND-002 Architecture Review (Revised)

This document evaluates concurrency protection options to resolve duplicate refund approval race conditions (Finding RFND-F02).

---

## 1. Concurrency Protection Options Evaluation

### Option A — Payment Document Lock
* **Strategy**: Acquire an exclusive write lock on the parent `Payment` document inside a transaction session before validation and gateway calls (e.g. by updating a dummy version counter on the `Payment`).
* **Pros**: Simple, relies on database-level locking.
* **Cons**: Since gateway API calls take 1–2 seconds, keeping the transaction open during the network call holds the payment lock, clogging database connections and risking transaction timeouts.

### Option B — Refund Reservation System
* **Strategy**: Transition the specific refund status to `'processing'` atomically. Query and sum all refunds for the payment with status in `['processing', 'completed']`. If the sum exceeds the payment amount, revert the status and abort. If not, proceed to the gateway.
* **Pros**: Avoids holding long-lived database locks during slow gateway API calls.
* **Cons**: Relies on read verification without a lock on the parent `Payment` document, which could theoretically allow concurrent threads to check balances and proceed if they run checks before the Mongoose writes are fully indexed.

### Option C — Transactional Cumulative Balance Enforcement
* **Strategy**: Run the entire approval flow (validation, balance check, gateway call, database updates) inside a single database transaction.
* **Pros**: Strict ACID compliance.
* **Cons**: Highly risky. Invoking external HTTP APIs inside a database transaction is an anti-pattern. If the gateway is slow or times out, database locks remain open, leading to lock contention and connection pool exhaustion.

### Option D — Hybrid Approach (Recommended & Approved)
* **Strategy**: A two-phase commit process combining the **Refund Reservation System** with a serialized **Payment Version write-lock** in Phase 1:
  1. **Phase 1 (Atomic Claim & Reservation)**: Start a database transaction session.
     - Atomically transition the specific Refund status from `'requested'` to `'processing'`.
     - Acquire a write lock on the parent `Payment` document by updating its `updatedAt` field. This acts as a serialization aid so concurrent transactions on the same payment write-conflict and retry.
     - Within the transaction session, query all refunds with status `['processing', 'completed']` (excluding the current refund).
     - Calculate the total reserved + settled amount and validate against the payment balance.
     - Commit the transaction, leaving the refund status as `'processing'` (reserving the capacity).
  2. **Phase 2 (Gateway Call)**: Call Stripe/Razorpay APIs outside of any transaction session. No database locks are held.
  3. **Phase 3 (Finalization)**: Start a second transaction. Transition the refund status from `'processing'` to `'completed'`, update the payment's status, and commit.
  4. **Phase 4 (Recovery)**: If Phase 2 or 3 fails, transition the refund status conditionally:
     ```typescript
     await Refund.updateOne(
       { _id: id, status: 'processing' },
       { $set: { status: 'requested' } }
     );
     ```
     This safely releases the reserved capacity.

---

## 2. Success Criteria Answers

1. **Can two admins approve refunds simultaneously?**
   **NO**. The Claim & Reservation phase updates the parent `Payment` document, causing concurrent approvals against the same payment to write-conflict, abort, and retry sequentially.
2. **Can two different refunds overdraw a payment?**
   **NO**. The reservation phase validates the sum of all `processing` and `completed` refunds against the total payment amount.
3. **Do processing refunds reserve capacity?**
   **YES**. The validation logic queries `status: { $in: ['processing', 'completed'] }`.
4. **Can gateway failures release reservations?**
   **YES**. Outer catch block reverts status from `processing` to `requested` conditionally.
5. **Are gateway calls outside transactions?**
   **YES**. The database transaction is committed in Phase 1 before calling the gateway, and Phase 3 uses a separate transaction after the gateway completes.
