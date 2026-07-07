# REFUND-003: Admin Refund Validation Audit

This audit evaluates all validation rules, constraints, error handling, and runtime guards currently implemented across both the frontend and backend for the Admin Refund domain.

---

## 1. Validation Inventory & Locations

We analyzed all validation checks participating in the admin refund flow:

### Backend Schemas (`apps/server/src/validations/admin-content.validation.ts`)
1. **`createRefundSchema`**:
   - `bookingId` must be a valid MongoDB ObjectId.
   - `paymentId` must be a valid MongoDB ObjectId.
   - `amount` must be a positive number (> 0).
   - `reason` is optional, trimmed, max 1000 characters.
   - `idempotencyKey` is optional, trimmed, max 100 characters.
   - `cancelTickets` is optional, boolean.
2. **`processRefundSchema`**:
   - `id` (refund ID) must be a valid MongoDB ObjectId.
   - `action` must be either `'approve'` or `'reject'`.
   - `adminNotes` is optional, trimmed, max 2000 characters.
   - `gatewayRefundId` is optional, trimmed, max 100 characters.
   - `manualOverride` is optional, boolean.
   - `overrideReason` is optional, trimmed, max 1000 characters.
   - **Super Refinement Constraint**: If `manualOverride` is `true`, `overrideReason` must be provided and must be at least 10 characters long.

### Backend Service Creation Rules (`apps/server/src/services/admin/refund.service.ts#createRefund`)
1. **Positive Amount Check**: Asserts `amount > 0` (defense in depth).
2. **Payment Existence**: Asserts `Payment` record exists in DB.
3. **Refund Integrity Assertion**: Calls `assertProductionRefundIntegrity` to block mock payment indicators (`pi_mock_`, `pay_mock_`, etc.) and `MOCK_PAYMENTS === true` configuration in production.
4. **Relationship Check**: Asserts `payment.bookingId === bookingId`.
5. **Payment Status Check**: Asserts payment status is either `PAID` or `PARTIALLY_REFUNDED`.
6. **Booking Status Check**: Asserts booking status is `CONFIRMED`.
7. **Individual Balance Check**: Asserts `refundAmount <= payment.amount`.
8. **Idempotency Check**: Checks if a refund record with the same `idempotencyKey` already exists in `requested`, `processing`, or `completed` status to avoid duplicates.
9. **Cumulative Balance Check**: Sums all existing refunds for the payment in `processing` or `completed` status, asserting `existingSum + newAmount <= payment.amount`.

### Backend Service Processing Rules (`apps/server/src/services/admin/refund.service.ts#processRefund`)
1. **Refund Claim Lock**: Asserts the refund is currently in `REQUESTED` status and atomically sets it to `PROCESSING` via `findOneAndUpdate`.
2. **Payment Lock**: Locks the parent `Payment` document by modifying `updatedAt` under a transaction session.
3. **Check-In Ticket Protection**: Sums scanned tickets for the booking. If `scannedCount > 0`:
   - Checks if `manualOverride === true`. If not, blocks refund.
   - Checks if actor role is `super_admin`. If not, blocks refund.
   - (Auto-recovery origin paths are exempt from check-in protection).
4. **Auto-Recovery Constraints**: If `origin === 'auto_recovery'`:
   - Asserts `recoveryReason` is specified.
   - Asserts payment status is `PAID`, `PARTIALLY_REFUNDED`, or `FAILED`.
   - Asserts booking status is `CONFIRMED`, `CANCELLED`, `FAILED`, or `EXPIRED`.
5. **Regular Process Constraints**: If `origin !== 'auto_recovery'`:
   - Asserts payment status is not `REFUNDED`.
   - Asserts payment status is `PAID` or `PARTIALLY_REFUNDED`.
   - Asserts booking status is `CONFIRMED` or `CANCELLED`.
6. **Cumulative Balance Cap**: Sums existing `processing` and `completed` refunds (excluding the current refund record), asserting `existingSum + refund.amount <= payment.amount`.

### Frontend Validation (`apps/admin/src/app/refunds/page.tsx`)
1. **RBAC Visibility Check**: Exposes the "Process" action only if the logged-in administrator has either `SUPER_ADMIN` or `ADMIN` role.
2. **State Eligibility Check**: Exposes the "Process" button only if the refund request status is exactly `'requested'`.
3. **Gateway Input Requirement**: Dynamically renders the `Gateway Refund ID` input field only when the approval action is selected.
4. **Form Submission State**: Disables the submit/confirm buttons while the React Query processing mutation is pending.

---

## 2. Responsibility Matrix

| Validation Rule | Frontend | Backend Route / Schema | Backend Service | Shared / Local | Candidate Refactored Location |
| :--- | :---: | :---: | :---: | :---: | :--- |
| Positive Amount Check | ❌ | ✅ (`createRefundSchema`) | ✅ (`createRefund`) | Shared | `RefundValidationService` |
| Text field length validation | ❌ | ✅ (`processRefundSchema`) | ❌ | Route Schema | Schema Validations |
| Production Integrity Check | ❌ | ❌ | ✅ (`createRefund` / `processRefund`) | Service | `RefundValidationService` |
| Booking Check-In Protection | ❌ | ❌ | ✅ (`processRefund`) | Service | `RefundValidationService` |
| Auto-Recovery State Guards | ❌ | ❌ | ✅ (`processRefund`) | Service | `RefundValidationService` |
| Cumulative Balance Protection | ❌ | ❌ | ✅ (`createRefund` / `processRefund`) | Service | `RefundValidationService` |
| RBAC Role Permission Check | ✅ | ✅ (`requireRole`) | ✅ (`processRefund` super_admin lock) | Shared | `RefundValidationService` & Middleware |
| State transition validity | ✅ | ❌ | ✅ (`processRefund` requested check) | Shared | `RefundValidationService` |

---

## 3. Business Rule Inventory

1. **Only Confirmed Bookings Refundable**: Manual refunds are blocked if the booking is not `CONFIRMED`.
2. **Scanned Ticket Block**: If even one ticket in a booking is scanned, the booking is ineligible for refunds unless a super_admin explicitly overrides it.
3. **No Over-Refunds**: The sum of all completed and currently processing refunds associated with a payment must not exceed the captured payment amount.
4. **Auto-Recovery Exemption**: Automated refund recovery paths triggered by webhook/payment validation anomalies are exempt from ticket scanned checks and booking state locks.
5. **No Production Mocks**: Production payments/refunds must not refer to mock payment references, and `MOCK_PAYMENTS` env is hard-blocked.

---

## 4. Validation Gap Analysis

1. **Scanned Ticket Frontend Gap**: The admin frontend lacks any visual indicators for scanned tickets, nor does it expose the `manualOverride` and `overrideReason` input fields. If an administrator tries to approve a refund for a booking with scanned tickets, the operation fails silently or shows a raw API error toast, with no way to enter the super-admin override.
2. **Missing Frontend Balance Summary**: The admin frontend displays the refund request amount, but it does **not** show the original payment amount, total refunds processed so far, or remaining refundable balance, making manual calculations necessary.
3. **Unused Frontend API Definitions**: The frontend defines `adminCreateRefund` in `apps/admin/src/lib/api/admin/booking.service.ts` but has no UI components calling it. Refund requests can only be created via raw API requests or automatic backend transitions.
4. **No Schema Limit Checks on Notes**: `adminNotes` has a schema limit of 2000 characters, but the frontend form input lacks `maxLength` or helper text warnings, creating potential validation rejection issues at the API level.

---

## 5. Refactoring Readiness Assessment

### Conclusion: **READY WITH CONSTRAINTS**

The Admin Refund Service is ready for validation extraction, but we must adhere to these rules:
1. **Preserve the signature of `cancelBooking`**: The check-in validation relies on passing the `actor` to `cancelBooking`. We must keep passing `actor` across the refactored boundaries.
2. **Strictly isolate validation**: The new `RefundValidationService` must remain stateless, accepting the loaded booking, payment, refund, and ticket count parameters rather than performing database lookups directly. This ensures pure testability.
