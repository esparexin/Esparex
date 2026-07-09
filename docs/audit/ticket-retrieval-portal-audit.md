# Ticket Retrieval Portal Audit

This audit evaluates the current state of booking lookup, verification, ticketing, and OTP services within the **MAD Entertainment** codebase. The goal is to design a ticket-centric retrieval experience that allows guests to access their tickets without requiring a traditional account dashboard flow.

---

## Current State

### 1. Existing APIs & Endpoints

#### Public Booking Routes (`apps/server/src/routes/public/booking.routes.ts`)
- `GET /bookings/session`: Issues a short-lived guest session token (JSON Web Token containing a random UUID).
- `POST /bookings`: Creates a pending booking with optional authentication or session token.
- `PUT /bookings/:bookingId/checkout-details`: Saves attendee details (name, email, phone) on the pending booking.
- `GET /bookings/:bookingId` (Supports `optionalAuth` + `x-session-id` header): Retrieves booking details and QR codes for a single booking. Restricts access to either the authenticated user who owns the booking OR the guest whose session UUID matches the booking.
- `GET /bookings/me` (Requires `requireAuth` JWT session): Retrieves all bookings and ticket lists associated with the logged-in user ID.

#### Authentication Routes (`apps/server/src/routes/public/auth.routes.ts`)
- `POST /auth/magic-link`: Accepts an email address, generates a secure random token and a 6-digit OTP passcode, hashes the passcode in the database, and dispatches the OTP email.
- `POST /auth/verify`: Accepts an email and a 6-digit OTP passcode. Verifies the passcode against the database hash. If valid:
  1. Finds or creates the user associated with that email.
  2. Automatically links historical guest bookings (queried by `guestEmail`) to this newly logged-in user profile.
  3. Issues JWT session tokens (access token and rotatable refresh token).

---

### 2. Existing Authentication Flow
- **Unified Passwordless Architecture**: The platform operates entirely on a passwordless mechanism.
- **Automatic Linking**: Since `AuthService.verifyMagicLinkOrOTP` runs an automatic database query (`Booking.updateMany({ guestEmail: email, userId: { $exists: false } }, { $set: { userId: user._id } })`) during passcode verification, the user registration and booking consolidation are seamlessly unified.
- **Verification Reuse**: Any guest who inputs their email on the "My Tickets" search page can trigger the `/auth/magic-link` endpoint to receive a passcode. When they verify this passcode via `/auth/verify`, they are logged in. Calling `GET /bookings/me` will immediately return **all** historical and active bookings linked to that email.

---

### 3. Existing Ticket & PDF Infrastructure
- **QR Code Rendering**: QR codes are generated dynamically during payment verification using the public API `https://api.qrserver.com/v1/create-qr-code/` and are saved directly as strings (`qrCodeImage`) on the `Ticket` schema in MongoDB. They are already successfully queried and rendered on the client.
- **PDF Generation**: Located in `apps/server/src/utils/pdf.ts` under `generateTicketPDF(booking, event)`. It utilizes `pdfkit` to compile booking data, event schedules, and guest names directly into a binary PDF Buffer.
- **Email PDF Dispatch**: Managed asynchronously via BullMQ on the `pdf-queue`. The `pdf.worker.ts` processes `pdf:generate` jobs by generating the PDF buffer, building a Nodemailer attachment, and sending it via SMTP.
- **PDF Download Endpoint**: **Missing.** There is currently no backend endpoint to download the compiled PDF directly from the web browser.
- **Resend Action Endpoint**: **Missing.** No public-facing route exists to manually trigger email dispatches for an active booking.

---

### 4. Existing Booking Retrieval Mechanisms
- **Direct Link**: `/my-booking?ref=MAD-2026-ABCDE` pulls the booking details if the current browser's `sessionStorage` holds the active guest checkout session key (`mad_checkout_session_${STORAGE_VERSION}`).
- **User Dashboard**: Users who log in can view a listing of their historical bookings via the `GET /bookings/me` endpoint.

---

## Gap Analysis

What is missing for the target experience:
```txt
My Tickets → Enter Email → Receive OTP → Verify OTP → View Bookings → Download Ticket PDF → View QR Code → Resend Ticket Email
```

| Required Step | Existing Infrastructure | What is Missing (Gaps) |
| :--- | :--- | :--- |
| **1. Enter Email & Receive OTP** | `POST /auth/magic-link` handles email intake, passcode generation, and queue dispatch. | A clean frontend landing page (e.g., `/tickets/retrieve` or `/my-booking` refactor) to collect the email address. |
| **2. Verify OTP** | `POST /auth/verify` validates the 6-digit passcode, registers/finds the user, and consolidates guest bookings. | A frontend passcode input screen that handles the mutation and stores the returned JWT session token in cookies/localStorage. |
| **3. View Bookings** | `GET /bookings/me` retrieves the consolidated bookings array. | A frontend dashboard view that renders the active bookings list. (Currently, the `/my-booking` page only shows a single booking via reference search, and the traditional user dashboard is built under `/dashboard`). |
| **4. Download Ticket PDF** | `generateTicketPDF` compiles the binary PDF buffer on the server. | 1. **Backend Route**: `GET /bookings/:bookingId/download` that authenticates the user, generates the PDF, and streams it back to the client as an attachment.<br>2. **Frontend UI**: A "Download PDF" button that triggers the endpoint. |
| **5. View QR Code** | `qrCodeImage` field exists on the `Ticket` schema and is rendered on the client. | Frontend integration within the new tickets page. |
| **6. Resend Ticket Email** | `pdf-queue` and `pdf.worker.ts` handle asynchronous generation and SMTP dispatch. | 1. **Backend Route**: `POST /bookings/:bookingId/resend` that verifies ownership and enqueues a `pdf:generate` job on `pdf-queue`.<br>2. **Frontend UI**: A "Resend Email" button. |

---

## Recommendation & Phased Implementation Plan

### Phase 1: Core Portal & Essential Ticket Controls (Smallest PR)
*Goal: Enable secure login-free ticket lookup, QR views, PDF downloads, and email triggers with minimal new code.*

1. **Backend Additions**:
   - **Download Endpoint**: Create `GET /bookings/:bookingId/download` in `booking.routes.ts`.
     - Validates authentication (`optionalAuth` or `requireAuth`).
     - Generates the ticket PDF buffer via `generateTicketPDF`.
     - Sets headers (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="MAD_Ticket_[Ref].pdf"`) and streams the buffer back.
   - **Resend Endpoint**: Create `POST /bookings/:bookingId/resend` in `booking.routes.ts`.
     - Verifies ownership (user ID or session UUID).
     - Enqueues `pdf:generate` to the BullMQ `pdf-queue` with recipient details.
2. **Frontend Portal Page (`apps/web/src/app/tickets/page.tsx`)**:
   - Create a clean portal that integrates our simplified passcode auth.
   - **Screen 1**: Email collection form (triggers `publicRequestMagicLink`).
   - **Screen 2**: Monospaced 6-digit passcode verification form (triggers `publicVerifyMagicLinkOrOTP` via TanStack useMutation).
   - **Screen 3**: Consolidated Bookings List.
     - Displays all confirmed events with visual cards.
     - Embeds the ticket QR codes directly.
     - Adds a "Download PDF" button pointing to `GET /bookings/:bookingId/download`.
     - Adds a "Resend Email" button that triggers `POST /bookings/:bookingId/resend`.

---

### Phase 2: Navigation Integration & UX Polish
*Goal: Ensure discoverability and polish visual fidelity.*

1. **Header/Footer Navigation**:
   - Add a "My Tickets" or "Track Bookings" link in the standard `Navbar` and `Footer` components.
2. **Session Persistence**:
   - If a user has an active JWT, skip the email/passcode intake screen entirely and route them directly to their bookings lists.
3. **Pristine Toast Feedback**:
   - Add smooth micro-animations and status toasts when a user triggers "Resend Email" or completes download compiles.

---

### Phase 3: Dashboard Consolidation & Sunset Opportunities
*Goal: Retire legacy entry points and simplify codebase.*

1. **Conflate `/my-booking` and `/dashboard`**:
   - Consolidate `/dashboard` and `/my-booking` into a unified `/tickets` space, removing redundant layouts.
2. **Obsolete Route cleanup**:
   - Add redirects from the legacy endpoints to `/tickets` to ensure backward compatibility.

---

## Validation & Risk Assessment

### Reusable Components Found
- **Backend Auth Logic**: `AuthService.verifyMagicLinkOrOTP` (fully reusable, performs all registration and account consolidation).
- **Backend Email Jobs**: `QueueService.enqueue` + `pdf-queue` worker (fully reusable for SMTP dispatches).
- **Backend PDF Compile**: `generateTicketPDF` in `utils/pdf.ts` (reusable).
- **Frontend QR Render**: Current ticket QR layout elements in `my-booking/page.tsx` (reusable).

### Missing Components (To Be Built)
- **Backend Endpoint**: `GET /bookings/:bookingId/download` (to stream PDF).
- **Backend Endpoint**: `POST /bookings/:bookingId/resend` (to queue resend job).
- **Frontend Web Page**: `apps/web/src/app/tickets/page.tsx` (unified retrieving portal).
- **Frontend API Adapters**: `publicDownloadTicketPDF` and `publicResendTicketEmail` in `public.service.ts`.

### Risk Assessment
- **Risk Level**: **LOW**
- **Security Check**: The new download and resend endpoints must check that the requesting user's `userId` matches the booking's `userId` (or their `sessionId` matches `booking.sessionId`) to prevent unauthorized access.
- **RTR / JWT Integrity**: The system continues to use standard session cookies and authorization headers, keeping session rotation perfectly safe.
- **Email Spam Mitigation**: The `POST /bookings/:bookingId/resend` endpoint should be protected by the `authLimiter` rate-limiting middleware to prevent malicious click spamming.
