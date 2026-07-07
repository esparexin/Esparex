# Ticket Retrieval & Booking Verification Audit Report

This report presents the findings of a comprehensive static analysis and verification audit of the ticket ownership, booking retrieval, and account linking systems for MAD Entertrainment.

Our objective is to verify that these mechanisms work securely and correctly across all customer journeys, ensuring no cross-account ticket leakage, accurate hydration, and a seamless portal user experience.

---

## Executive Summary

| Journey | Description | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Journey 1** | Guest Purchase → Login → Tickets | **PASS** | Guest bookings are linked successfully on OTP login and displayed correctly in the wallet. |
| **Journey 2** | Multiple Bookings | **PASS** | Multiple bookings under the same email link correctly without duplicates or missing items. |
| **Journey 3** | Google Login | **PASS** | Google SSO resolves user accounts and triggers the same secure linkage & hydration as OTP. |
| **Journey 4** | Email Matching | **PASS** | Mongoose schemas and services normalize emails to lower-case, ensuring case-insensitivity. |
| **Journey 5** | Booking Status Verification | **FINDINGS** | Discrepancy identified in database status mapping for refunded bookings. |
| **Journey 6** | Portal UX Review | **FINDINGS** | Confusing and unresponsive client-side states discovered on the Tickets page. |
| **Journey 7** | Ownership Safety | **PASS** | Email acts as the sole source of truth; shared mobile numbers do not leak bookings. |

---

## Detailed Findings

### Finding 1: Booking Status Inconsistency Post-Refund Approval
* **Severity**: Low (Functional & UX Consistency Discrepancy)
* **Reproduction**:
  1. An administrator approves a pending refund request using the administrative API (`PATCH /api/admin/refunds/:id/process` with action `'approve'`).
  2. The database updates the `Payment` document status to `'refunded'`.
  3. The `Booking` status is changed.
  4. Querying the booking on the client side or checking the database reveals the booking status is `'cancelled'` instead of `'refunded'`. The UI displays *"This booking was cancelled"* rather than *"Payment has been refunded."*
* **Root Cause**:
  In [refund.service.ts](../../../apps/server/src/services/admin/refund.service.ts#L79), the approval flow calls the administrative helper `cancelBooking` to handle event capacity release and seat unlocked states:
  ```typescript
  await cancelBooking(updated.bookingId.toString(), adminNotes || 'Admin Refund Processed', session);
  ```
  Inside [booking.service.ts](../../../apps/server/src/services/admin/booking.service.ts#L214), `cancelBooking` sets the booking status unconditionally to `BookingStatus.CANCELLED`:
  ```typescript
  booking.status = BookingStatus.CANCELLED;
  ```
  Consequently, although `BookingStatus.REFUNDED` exists in the shared enum, it is never assigned to bookings in the database during refund processing.
* **Recommended Fix**:
  Refactor `cancelBooking` or create a status transition helper that allows passing the target status. When resolving a refund, pass `BookingStatus.REFUNDED` instead of `BookingStatus.CANCELLED` to ensure status consistency between payments and bookings.

---

### Finding 2: Unresponsive "Lookup" Button on Tickets Page when Not Logged In
* **Severity**: Medium (Broken User Experience)
* **Reproduction**:
  1. Open a new incognito window or clear all cookies and `sessionStorage`.
  2. Navigate directly to `/tickets`.
  3. Under the **Find a missing booking** section, type a valid booking reference ID (e.g. `MAD-2026-ABCDE`).
  4. Click the **Lookup** button.
  5. **Observation**: Nothing happens. No API request is dispatched, no spinner appears, and no error message is displayed. The page remains completely static and unresponsive.
* **Root Cause**:
  In [page.tsx](../../../apps/web/src/app/tickets/page.tsx#L156), the React Query definition for the single booking lookup has the following query enablement guard:
  ```typescript
  enabled: !!queryRef && (isAuthenticated || !!singleBookingSessionToken),
  ```
  If the visitor is not authenticated and has no active guest session token stored in their browser's `sessionStorage` (which occurs when clicking an email link or accessing the portal in a fresh session), `isAuthenticated` is `false` and `singleBookingSessionToken` is `null`/`undefined`. Thus, even when `queryRef` is populated on submit, the query remains disabled and the lookup operation fails to execute.
* **Recommended Fix**:
  Modify the query enablement check to `enabled: !!queryRef`. This allows the query to run when a search reference is submitted. The server API will then return a `403 Forbidden` response with the error code `'BOOKING_VERIFICATION_REQUIRED'`, which the frontend successfully intercepts to display the OTP/Email login form, prompting users to verify their identity.

---

### Finding 3: Onboarding Gate UX Regression for Authenticated Users
* **Severity**: Medium (Confusing User Experience)
* **Reproduction**:
  1. Authenticate with a new account that has not completed onboarding (e.g. missing `firstName` or `lastName` profile fields).
  2. Navigate directly to `/tickets`.
  3. **Observation**: Instead of being greeted with the **Complete Your Profile** form, the user is presented with the generic email input screen asking them to request an OTP code, even though they are already logged in.
* **Root Cause**:
  In [page.tsx](../../../apps/web/src/app/tickets/page.tsx#L142-L145), the redirection effect only transitions the user to the portal if they do not require onboarding:
  ```typescript
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && !onboardingRequired) {
      setStep('portal');
    }
  }, [isAuthenticated, isAuthLoading, onboardingRequired]);
  ```
  Since `onboardingRequired` is `true`, `step` remains `'email'` and `shouldShowAuthForm` becomes `true`, displaying the `AuthForm`. 
  Inside [AuthForm.tsx](../../../apps/web/src/components/auth/AuthForm.tsx#L142), the initial state of the form's active step is hardcoded to `'request'`:
  ```typescript
  const [step, setStep] = useState<'request' | 'verify' | 'onboard'>('request');
  ```
  There is no effect inside `AuthForm.tsx` to detect if the user is already authenticated and shift the step directly to `'onboard'`, forcing logged-in users to re-request a passcode.
* **Recommended Fix**:
  Add a `useEffect` inside `AuthForm.tsx` to automatically set the step to `'onboard'` if the user is authenticated and onboarding is required, or pass down the onboarding state as a prop to initialize the component step correctly.

---

## Verification and Safety Analysis

### 1. Case-Insensitive Email Matching Verification
We confirmed that case insensitivity is enforced at multiple layers:
* **Database Schema**: The `guestEmail` field in [booking.schema.ts](../../../apps/server/src/models/booking.schema.ts#L66) and the `email` field in [user.schema.ts](../../../apps/server/src/models/user.schema.ts#L19) use the Mongoose `lowercase: true` option. Any values saved are converted to lower-case.
* **Authentication Services**: Email arguments in [auth.service.ts](../../../apps/server/src/services/public/auth.service.ts#L39) are systematically normalized using `.trim().toLowerCase()`.
* **Account Linking**: The query in `linkBookingsToUser` uses the normalized lower-case email address to link guest bookings to user accounts, ensuring cases such as `JOHN@GMAIL.COM` and `john@gmail.com` resolve to the same user.

### 2. Multi-booking Retrieval Verification
* Guest bookings are linked using the email. Because the server uses `Booking.updateMany` during verification, all guest bookings containing the user's email are resolved and associated with their account in a single atomic update.
* When retrieving bookings, `/bookings/me` fetches all matching records sequentially from the database without filtering out older entries, ensuring multiple events are listed correctly.

### 3. Ownership and Multi-user Safety
* Booking retrieval by reference ID checks:
  1. Authenticated user ID matches `booking.userId`.
  2. Guest session ID matches `booking.sessionId`.
* If neither check matches, access is denied. Because the mobile number is not used as a lookup index or primary key to query user bookings, family members sharing a phone number but booking with separate email addresses have no risk of leaking tickets to other accounts.

---

## Conclusion
Apart from the minor status inconsistency and the client-side UX/redirect regressions listed in the Findings, the backend authentication, ticket linkage, and ownership validation models are structurally secure, robust, and correctly implemented.
