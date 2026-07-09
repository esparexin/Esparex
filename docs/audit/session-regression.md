# Session Refresh Regression Audit

## 1. Issue Overview
Users experience sudden unexpected logouts. The browser network inspect panel records:
- `POST /auth/refresh 401`
- `GET /auth/me 401`

---

## 2. Root Cause & Detailed Investigation

### Cross-Domain Cookie Restrictions & Safari Compatibility (ITP)
* **Root Cause**: The frontend is hosted at `https://mad.esparex.in` and the backend is hosted at `https://apm.esparex.in`. Since these are cross-origin requests, HTTP-only cookie-based authentication relies on the `sameSite: 'none'` and `secure: true` attributes.
  Safari's Intelligent Tracking Prevention (ITP) blocks third-party (cross-site) cookies by default. When the browser blocks third-party cookies, the `refreshToken` cookie set by `apm.esparex.in` is **never sent** in the request header to `/auth/refresh` or `/auth/me`.
* **Evidence**:
  * In `AuthController.ts` (Lines 61, 95, 129), cookies are configured as:
    ```ts
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    ```
  * In `apiClient` (`apps/web/src/lib/api/client.ts` line 97), the silent refresh request passes an empty body:
    ```ts
    const refreshResponse = await axios.post<{ data: { token: string } }>(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    ```
  * When cookies are blocked by Safari ITP, `req.cookies.refreshToken` evaluates to `undefined`. Because the client doesn't send the token in the request body, the backend immediately throws a `401 Refresh token is required` error.

### Concurrency Race Conditions & Replay Attack Invalidation
* **Root Cause**: The backend uses Refresh Token Rotation (RTR) to detect replay attacks. If a refresh token is used once, it is marked as revoked (`isRevoked: true`). If a revoked refresh token is presented again, **all** active tokens associated with that user are instantly invalidated to prevent compromised session hijackings.
  However, on a standard page refresh, the frontend may spawn multiple concurrent API calls (e.g., fetching profile details, active popups, historical bookings) before the fresh access token is retrieved. If multiple parallel requests fail with `401`, they all independently trigger the Axios interceptor's silent refresh logic.
  Although the Axios interceptor implements a queue, a slight synchronization lag or parallel interceptor instances can cause the client to transmit the same original `refreshToken` in quick succession. The first request successfully rotates the token; the second concurrent request presents the now-revoked token, causing the backend to flag a replay attack and immediately log the user out of all active devices.
* **Evidence**:
  * Backend Replay Attack Detection (`apps/server/src/services/public/auth.service.ts` lines 230-238):
    ```ts
    if (tokenRecord.isRevoked) {
      if (tokenRecord.userId) {
        await RefreshTokenModel.updateMany({ userId: tokenRecord.userId }, { isRevoked: true });
        logger.warn({ userId: tokenRecord.userId }, 'Replay attack detected! Revoked all active user refresh tokens.');
      }
      throw AppError.unauthorized('Session compromised. Please log in again.');
    }
    ```
  * Active TTL Indexing:
    * In `apps/server/src/models/refresh-token.schema.ts` (Line 35), the database configuration is `expiresAt: { type: Date, required: true, index: { expires: 0 } }`. If the token expires, Mongoose automatically removes the document from MongoDB, making future lookups fail with 401.

---

## 3. Affected Files
* **Frontend**:
  * [apps/web/src/lib/api/client.ts](../../apps/web/src/lib/api/client.ts)
  * [apps/web/src/providers/AuthProvider.tsx](../../apps/web/src/providers/AuthProvider.tsx)
* **Backend**:
  * [apps/server/src/services/public/auth.service.ts](../../apps/server/src/services/public/auth.service.ts)
  * [apps/server/src/controllers/public/auth.controller.ts](../../apps/server/src/controllers/public/auth.controller.ts)
  * [apps/server/src/models/refresh-token.schema.ts](../../apps/server/src/models/refresh-token.schema.ts)

---

## 4. Impact & Risk Assessment
* **Impact**: **CRITICAL**. Users on Safari or users with strict cookie settings are completely unable to remain logged in. Even on other browsers, rapid parallel requests trigger false-positive replay attacks, logging out legitimate users.
* **Risk Level**: **HIGH** (Breaks session retention and creates extremely bad user experience).

---

## 5. Recommended Fix & Action Plan
1. **Frontend Fallback (Token in Body)**:
   * Although HttpOnly cookies are preferred, we can allow the client to store the refresh token in `localStorage` in addition to cookies in production, and send it as a fallback in the body of `POST /auth/refresh` (`{ refreshToken: ... }`).
   * Update the backend to prioritize the body token if the cookie header is blocked or empty.
2. **Axios Request Lock (Interceptors)**:
   * Reinforce the request synchronization queue in `apps/web/src/lib/api/client.ts`. Ensure that if a token refresh is in progress, any subsequent request is strictly locked and queued, preventing multiple parallel invocations of `/auth/refresh`.
3. **Backend Concurrency Grace Period (RTR)**:
   * To prevent rapid concurrent requests from triggering replay invalidations, implement a short "grace period" (e.g., 5-10 seconds) during which a recently rotated/revoked refresh token is still accepted as valid for rotation.
