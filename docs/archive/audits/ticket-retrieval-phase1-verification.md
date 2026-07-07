# Ticket Retrieval Phase 1 Verification Audit

This document audits the feasibility of shipping **Phase 1** of the Ticket Retrieval Portal using **only existing backend infrastructure**, validating the target user journey, and outlining exact file references.

---

## Target User Journey
```txt
My Tickets (Page)
  ↓
Enter Email
  ↓
OTP Verification
  ↓
GET /bookings/me
  ↓
View Tickets & QR Codes
```

---

## Infrastructure Verification

### 1. Existing OTP Request and Verification Flow
- **OTP Request**: Fully operational on the backend.
  - **Endpoint**: `POST /auth/magic-link`
  - **Controller**: `AuthController.requestMagicLink` in [auth.controller.ts](../../../apps/server/src/controllers/public/auth.controller.ts)
  - **Service**: `AuthService.requestMagicLink` in [auth.service.ts](../../../apps/server/src/services/public/auth.service.ts#L21-L69)
  - **Operation**: Validates email, generates a 6-digit OTP, stores its SHA-256 hash in `MagicTokenModel` with a 15-minute TTL, and enqueues a job on `notification-queue` to send the passcode.
- **OTP Verification**: Fully operational on the backend.
  - **Endpoint**: `POST /auth/verify`
  - **Controller**: `AuthController.verifyMagicLinkOrOTP` in [auth.controller.ts](../../../apps/server/src/controllers/public/auth.controller.ts)
  - **Service**: `AuthService.verifyMagicLinkOrOTP` in [auth.service.ts](../../../apps/server/src/services/public/auth.service.ts#L74-L130)
  - **Operation**: Validates the passcode against the database hash. If valid, it retrieves or creates the `IUser` document and automatically links all guest bookings matching `guestEmail` to the user's `userId`.

---

### 2. Existing Booking Retrieval APIs
- **Endpoint**: `GET /bookings/me`
- **Controller**: `getMyBookings` in [booking.controller.ts](../../../apps/server/src/controllers/public/booking.controller.ts#L79-L101)
- **Service**: `PublicBookingService.getMyBookings` in [booking.service.ts](../../../apps/server/src/services/public/booking.service.ts#L382-L392)
- **Operation**: Queries all bookings populated with event details where `userId` matches the authenticated session (`Booking.find({ userId }).populate('eventId')`), retrieves all associated tickets via `Ticket.find({ bookingId: { $in: bookingIds } })`, and responds with the full payload.

---

### 3. Existing Booking UI Components
- **File Reference**: [my-booking/page.tsx](../../../apps/web/src/app/my-booking/page.tsx) (deleted)
- **Status**: The `MyBookingContent` component contains fully designed, glassmorphic UI elements for displaying booking summaries, including event titles, venues, showtimes, statuses, total tickets count, and booking references. These UI styles and layout patterns are fully reusable.

---

### 4. Existing Ticket QR Rendering
- **File Reference**: [my-booking/page.tsx](../../../apps/web/src/app/my-booking/page.tsx#L184-L190) (deleted)
- **Status**: Dynamic QR codes are generated during checkout via `api.qrserver.com` and stored as a string URL on the `Ticket` schema under `qrCodeImage`. The client renders these QR codes directly using an `<img>` tag. This is completely reusable.

---

### 5. Existing PDF Ticket Generation and Access
- **PDF Generation**: Handled server-side in `apps/server/src/utils/pdf.ts` via `generateTicketPDF`.
- **Public Direct Download Endpoint**: **None.** Direct browser-based PDF downloads are currently not supported.
- **Feasibility Verification**: While a PDF download endpoint is recommended for advanced ticket wallets, it is **not technically required** to ship the core Phase 1 user journey. Displaying active bookings and digital ticket QR codes directly on-screen is fully sufficient for mobile admission scanning at venue gates.

---

### 6. Existing Ticket Resend Functionality
- **Mailer Job**: Handled asynchronously via `QueueService.enqueue` to the `pdf-queue` and processed by `pdf.worker.ts` which generates the PDF and emails it via SMTP.
- **Manual Resend Endpoint**: **None.** No public controller endpoint currently exists.
- **Feasibility Verification**: For Phase 1, manual on-demand triggers are **not required**. The SMTP transaction is already automatically dispatched upon booking confirmation (checkout flow). Users can access their tickets digitally on-screen at any time via the Retrieval Portal.

---

### 7. Existing Ownership Verification Logic
- **File Reference**: [auth.service.ts](../../../apps/server/src/services/public/auth.service.ts#L74-L130)
- **Status**: Extremely secure. Guest bookings are linked to a verified user profile only when the user passes SHA-256 OTP passcode verification. Once verified, the JWT access token is used to query `GET /bookings/me`, guaranteeing that users can only view tickets belonging to their verified email address.

---

## Architectural Feasibility

### Question
**Can the following flow be implemented without new backend endpoints?**
*My Tickets → Enter Email → OTP Verification → GET /bookings/me → View Tickets → View QR Code*

### Answer
**Yes**. The entire Phase 1 user journey can be implemented **entirely using existing backend endpoints** and purely frontend changes.

#### Exact Frontend File and API References:
1. **Email Collection Submission**:
   - Triggers `publicRequestMagicLink(email)` in [public.service.ts](../../../apps/web/src/lib/api/public.service.ts#L340-L343).
   - Maps to backend `POST /auth/magic-link`.
2. **OTP Verification Form**:
   - Triggers `publicVerifyMagicLinkOrOTP({ email, otp })` in [public.service.ts](../../../apps/web/src/lib/api/public.service.ts#L345-L348).
   - Maps to backend `POST /auth/verify`. Returns user profile and authentication session tokens.
3. **Retrieving Bookings**:
   - Triggers `publicGetMyBookings()` in [public.service.ts](../../../apps/web/src/lib/api/public.service.ts#L197-L200).
   - Maps to backend `GET /bookings/me`.
4. **Rendering Tickets & QR Codes**:
   - Iterates over the bookings list returned by `publicGetMyBookings()`.
   - Displays event and tier details.
   - Renders QR codes via standard image tags pointing to `ticket.qrCodeImage` matching [ticket.schema.ts](../../../apps/server/src/models/ticket.schema.ts#L16).

---

## Conclusion

**A. Phase 1 requires no backend changes.**

The existing passwordless OTP system, automated guest booking merge flow, profile query APIs, and dynamic QR storage fields are completely sufficient to power the core Ticket Retrieval Portal. This allows us to implement the entire Phase 1 experience purely within a single low-risk frontend PR.
