# Backend Token Cleanup Audit

**Date:** 2026-05-30
**Status:** Audit & Implementation Plan Only (No code changes implemented)
**Branch:** `feat/backend-token-cleanup`

---

## Executive Summary
Following the successful completion of the frontend token cleanup (PR B) and standardizing on the **OTP-only email template** (PR A), this audit outlines the remaining backend dependencies on legacy magic-link URL tokens before complete deletion.

The goal of this audit is to identify routes, controllers, services, database schemas, and API contracts that contain magic-link token logic, and to supply a zero-risk backend implementation plan to safely remove them while preserving 6-digit OTP passcode authentication and Google OAuth.

---

## PART 1 — ROUTES AUDIT
* **File Path:** [auth.routes.ts](../../../apps/server/src/routes/public/auth.routes.ts)

### 1. Route Analysis
* **GET /verify (GET Redirect):**
  Mounted on Line 18:
  ```typescript
  router.get('/verify', AuthController.redirectMagicLink);
  ```
  Exposes the legacy endpoint target triggered when clicking a magic link in a user's inbox.

* **Token-specific routes:**
  `GET /verify` is the single legacy, token-specific route registered on the public authentication router. (Note: `POST /verify` is shared between OTP and token verification).

* **Redirect Handlers:**
  The `router.get('/verify', ...)` route is the only active redirect handler. It intercepts link clicks, parses the URL parameters, and redirects the browser session to the web frontend's login page.

### 2. Removal Impact
* **Current Behavior:** Decodes query `token` from `GET /verify?token=XYZ` and redirects to `${frontendUrl}/login?token=XYZ`.
* **Dependencies:** Relies on `AuthController.redirectMagicLink` controller implementation.
* **Removal Impact:** Safe. Removing this route eliminates the legacy redirect endpoint from the Express router stack. Clicking a stale magic link in an inbox will lead to a standard `404 Not Found` response.

---

## PART 2 — CONTROLLERS AUDIT
* **File Path:** [auth.controller.ts](../../../apps/server/src/controllers/public/auth.controller.ts)

### 1. Controller Method Analysis
* **redirectMagicLink (Lines 46-60):**
  Extracts the `token` search parameter from `req.query`, validates its string presence, extracts the primary web origin from `ALLOWED_ORIGINS`, and redirects the client browser to the frontend path.

* **Token Verification Handlers:**
  Embedded inside `verifyMagicLinkOrOTP` (Lines 65-96):
  ```typescript
  const { token, otp, email } = req.body;
  const tokenOrOtp = token || otp;
  ```
  Permits authentication if *either* `token` or `otp` is passed in the request body parameters.

* **Shared OTP/Token Handlers:**
  `AuthController.verifyMagicLinkOrOTP` handles both validation mechanisms concurrently, forwarding parameters to `AuthService.verifyMagicLinkOrOTP(tokenOrOtp, email)`.

### 2. Removal Impact
* **Current Behavior:** Directs query link parameters to the web client, and parses either `token` or `otp` in the POST request body.
* **Dependencies:** Depends on `AuthService.verifyMagicLinkOrOTP` service.
* **Removal Impact:** Restricting `verifyMagicLinkOrOTP` strictly to `{ otp, email }` payload validation will cause the controller to return a `400 Bad Request` when client requests omit `otp` or `email`, eliminating token input handling.

---

## PART 3 — SERVICES AUDIT
* **File Path:** [auth.service.ts](../../../apps/server/src/services/public/auth.service.ts)

### 1. Service Logic Separation

#### A. Magic-link-only logic (To be removed)
* **Token Generation:** Creating a secure 32-byte random hexadecimal token:
  ```typescript
  const token = crypto.randomBytes(32).toString('hex');
  ```
* **Token Verification & Lookup:** Direct token database search branch if `email` is absent:
  ```typescript
  magicRecord = await MagicTokenModel.findOne({ token: tokenOrOtp });
  ```
* **Link Construction:** Formulating the frontend URL: `const magicLinkUrl = `${origin}/login?token=${token}`;`

#### B. Shared Logic (To be retained)
* **Database Upsert:** Evicting old active codes via `MagicTokenModel.findOneAndDelete({ email })` and writing new login criteria with `expiresAt`, `firstName`, `lastName`, and `mobileNumber`.
* **Registration & Active Check:** Creating `UserModel` profiles on-the-fly for new users, checking account active state boundaries, and updating `lastLogin` indicators.
* **Guest Booking Merger:** Linking historical reservation records using `await this.linkBookingsToUser(userEmail, user._id.toString())`.
* **Session Issue:** Dispatching access/refresh token structures using `await this.issueTokens(...)` and evicting the consumed token doc.

#### C. OTP-only logic (To be retained)
* **OTP Generation:** Creating a 6-digit random numeric passcode:
  ```typescript
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  ```
* **OTP Encryption:** Enforcing SHA-256 OTP passcode hashing before saving to Mongoose.
* **OTP Lookup:** Querying database using email and hashed OTP credentials:
  ```typescript
  magicRecord = await MagicTokenModel.findOne({ email: trimmedEmail, otp: otpHash });
  ```

### 2. Responsibilities Summary
* `AuthService.checkEmailExists`: Performs database user discovery checks.
* `AuthService.requestMagicLink`: Simplified to strictly generate/store the OTP passcode hash, without generating a legacy link or token.
* `AuthService.verifyMagicLinkOrOTP`: Re-written to strictly enforce `{ otp, email }` credentials matching, removing the `token` lookup branch.

---

## PART 4 — API CONTRACTS

### 1. POST /auth/verify
* **Expected Payload Change:**
  * Current: `{ token?: string, otp?: string, email?: string }` (either `token` OR `otp` + `email`).
  * Target: `{ otp: string, email: string }` (both parameters mandatory).
* **Active Clients:** The Next.js client (`apps/web`) has already been migrated in PR B to strictly call it with `{ otp, email }`. There are no external mobile clients or third-party consumers.
* **Transition Strategy:** Direct removal. Because the single consumer has already been fully decoupled, the backend can safely tighten payload schemas instantly.

### 2. GET /auth/verify
* **Active Clients:** None. The email templates no longer distribute magic links, meaning no incoming redirect traffic is generated.
* **Transition Strategy:** Direct deletion of `GET /verify` route and the corresponding `AuthController.redirectMagicLink` controller implementation.

---

## PART 5 — RISKS

### 1. What breaks if backend token support is removed?
* **Stale Links:** Clicking legacy login links sent in older emails will completely fail, returning an HTTP `404` or failing frontend parsing.
* **Risk Assessment:** **ZERO.** Magic-link tokens contain a strict **15-minute TTL** and are auto-evicted from MongoDB. Any link sent before the cleanup PR is deployed has already expired and is completely unusable, eliminating operational impact.

### 2. Are legacy clients active?
* No. Web client is fully migrated; admin dashboard uses separate sessions; no third-party desktop, mobile, or webhook clients consume this route.

### 3. Is rollback possible?
* **Yes.** Restoring `GET /verify` route and reverting the controller/service parameter logic back to the git baseline completely restores legacy token support with zero database migrations or modifications.

---

## PART 6 — IMPLEMENTATION PLAN

### 1. Exact Files and Changes

#### A. Routes Simplification
*File: [auth.routes.ts](../../../apps/server/src/routes/public/auth.routes.ts)*
* Remove legacy `GET /verify` redirect route.
* **Line-by-line Diff:**
  ```diff
   // Request Magic Link / OTP Email (protected by auth-specific rate limiter)
   router.post('/magic-link', authLimiter, AuthController.requestMagicLink);

  -// Verify Magic Link Click (GET redirect to web frontend)
  -router.get('/verify', AuthController.redirectMagicLink);
  -
   // Verify Magic Link token or OTP input (protected by auth-specific rate limiter)
   router.post('/verify', authLimiter, AuthController.verifyMagicLinkOrOTP);
  ```

#### B. Controller Cleanup
*File: [auth.controller.ts](../../../apps/server/src/controllers/public/auth.controller.ts)*
* Remove the static method `redirectMagicLink` completely.
* Simplify parameter schema check inside `verifyMagicLinkOrOTP` to require only `otp` and `email`.
* **Line-by-line Diff:**
  ```diff
  -  /**
  -   * Handles GET /auth/verify by redirecting client clicks to the frontend verification flow.
  -   */
  -  static async redirectMagicLink(req: Request, res: Response): Promise<void> {
  -    const { token } = req.query;
  -    if (!token || typeof token !== 'string') {
  -      throw AppError.badRequest('Verification token is required');
  -    }
  -
  -    const env = getEnv();
  -    const frontendUrl = env.ALLOWED_ORIGINS.split(',')[0].trim();
  -
  -    // Redirect user directly to the frontend's verification landing page
  -    res.redirect(`${frontendUrl}/login?token=${token}`);
  -  }
  -
     /**
      * Handles POST /auth/verify for verifying magic link tokens or OTP codes.
      */
     static async verifyMagicLinkOrOTP(req: Request, res: Response): Promise<void> {
  -    const { token, otp, email } = req.body;
  -
  -    const tokenOrOtp = token || otp;
  -    if (!tokenOrOtp) {
  -      throw AppError.badRequest('Verification token or passcode is required');
  -    }
  -
  -    const result = await AuthService.verifyMagicLinkOrOTP(tokenOrOtp, email);
  +    const { otp, email } = req.body;
  +
  +    if (!otp || !email) {
  +      throw AppError.badRequest('Email and verification passcode are required');
  +    }
  +
  +    const result = await AuthService.verifyMagicLinkOrOTP(otp, email);
  ```

#### C. Service Refactoring
*File: [auth.service.ts](../../../apps/server/src/services/public/auth.service.ts)*
* Remove random `token` generation and link URL constructs in `requestMagicLink`.
* Simplify `verifyMagicLinkOrOTP` to strictly parse OTP hashes without token checks.
* **Line-by-line Diff:**
  ```diff
     static async requestMagicLink(
       email: string,
       origin: string,
       registrationData?: { firstName?: string; lastName?: string; mobileNumber?: string }
     ): Promise<void> {
       ...
       // 1. Generate unique 6-digit OTP
       const otp = Math.floor(100000 + Math.random() * 900000).toString();
  -    const token = crypto.randomBytes(32).toString('hex');
       const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

       // 2. Hash the OTP for secure database storage
       const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

       // 3. Save MagicToken (upsert for the email to prevent spamming records)
       await MagicTokenModel.findOneAndDelete({ email: trimmedEmail });
       await MagicTokenModel.create({
         email: trimmedEmail,
  -      token,
         otp: otpHash, // Plaintext OTP is NEVER stored in the database!
         firstName: registrationData?.firstName,
         lastName: registrationData?.lastName,
         mobileNumber: registrationData?.mobileNumber,
         expiresAt,
       });
  -    logger.info({ email: trimmedEmail, tokenId: token }, "Magic token created");
  -
  -    // 4. Construct Verification Link
  -    const magicLinkUrl = `${origin}/login?token=${token}`;
  +    logger.info({ email: trimmedEmail }, "OTP login session created");

       // 5. Compile HTML Template
       const html = await magicLinkHtml({
         email: trimmedEmail,
  -      magicLinkUrl,
         otpCode: otp, // Plaintext OTP is sent securely ONLY in the email!
       });
       ...
     }

     /**
  -   * Verifies the Magic Link token or OTP code, logs the user in, and sets up session.
  +   * Verifies the OTP code, logs the user in, and sets up session.
      */
     static async verifyMagicLinkOrOTP(
  -    tokenOrOtp: string,
  -    email?: string
  +    otp: string,
  +    email: string
     ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  -    if (!tokenOrOtp) {
  -      throw AppError.badRequest('Verification code or link token is required');
  +    if (!otp || !email) {
  +      throw AppError.badRequest('Verification code and email are required');
       }

  -    let magicRecord = null;
  -
  -    if (email) {
  -      // OTP Verification Mode
  -      const trimmedEmail = email.trim().toLowerCase();
  -      const cleanOtp = tokenOrOtp.trim().replace(/\s/g, '');
  -      const otpHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
  -
  -      magicRecord = await MagicTokenModel.findOne({
  -        email: trimmedEmail,
  -        otp: otpHash, // Match using the secure SHA-256 hash
  -      });
  -    } else {
  -      // Magic Link Verification Mode
  -      magicRecord = await MagicTokenModel.findOne({ token: tokenOrOtp });
  -    }
  +    // OTP Verification Mode
  +    const trimmedEmail = email.trim().toLowerCase();
  +    const cleanOtp = otp.trim().replace(/\s/g, '');
  +    const otpHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
  +
  +    const magicRecord = await MagicTokenModel.findOne({
  +      email: trimmedEmail,
  +      otp: otpHash, // Match using the secure SHA-256 hash
  +    });

       if (!magicRecord || magicRecord.expiresAt < new Date()) {
         throw AppError.unauthorized('Invalid or expired login link/passcode');
       }
  ```

#### D. Schema Cleanliness
*File: [magic-token.schema.ts](../../../apps/server/src/models/magic-token.schema.ts)*
* Remove `token` field from interface and schema.
* **Line-by-line Diff:**
  ```diff
   export interface IMagicToken extends Document {
     email: string;
  -  token: string;
     otp: string;
     ...
   }

   const magicTokenSchema = new Schema<IMagicToken>(
     {
       email: {
         type: String,
         required: true,
         trim: true,
         lowercase: true,
         index: true,
       },
  -    token: {
  -      type: String,
  -      required: true,
  -      unique: true,
  -      index: true,
  -    },
       otp: {
         type: String,
         required: true,
         index: true,
       },
  ```

---

### 2. Validation Plan
1. **Type Checking:**
   Verify no compiler issues remain in the backend project:
   ```bash
   pnpm --filter @mad/server type-check
   ```
2. **Backend Tests:**
   Ensure existing auth integration and unit tests pass successfully:
   ```bash
   pnpm --filter @mad/server test
   ```
3. **Smoke Test API checks:**
   * Send `POST /api/auth/magic-link` -> verify OTP generates and queues.
   * Send `POST /api/auth/verify` with valid `{ email, otp }` -> verify successful session tokens returned.
   * Send `GET /api/auth/verify?token=XYZ` -> confirm returns `404 Not Found`.

---

### 3. Rollback Plan
To completely revert the changes, restore the four files:
```bash
git restore apps/server/src/routes/public/auth.routes.ts apps/server/src/controllers/public/auth.controller.ts apps/server/src/services/public/auth.service.ts apps/server/src/models/magic-token.schema.ts
```
This instantly reinstates the token schema property, the query redirect path, and standard split verification handlers on the backend.
