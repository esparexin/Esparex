# Refresh Token Rotation Race Condition Audit & Remediation Plan

## 1. Root Cause Analysis
The MAD Entertainment server implements Refresh Token Rotation (RTR) inside `AuthService.refreshSession()`. Under strict RTR rules, any attempt to reuse an already-revoked refresh token is treated as a malicious replay attack, triggering immediate cascading invalidation of all active user sessions to protect the account from compromise.

However, in client applications, page hydration, boot, or concurrent data pre-fetching often initiates several API requests in parallel. If these requests fail with a `401 Unauthorized` status simultaneously (e.g. because the access token has expired), they independently trigger the Axios interceptor's refresh routine.

Due to execution/network latency, two concurrent requests can transmit the same expired refresh token to `/auth/refresh` at nearly the same millisecond.
- **Request A** is processed first, successfully rotating the token and setting the original record to `isRevoked = true`.
- **Request B** arrives milliseconds later with the same token. The server sees the token is already revoked, instantly flags a false-positive replay attack, revokes all other active refresh tokens for that user, and logs the legitimate user out.

---

## 2. Reproduction Scenario
1. A client initiates two parallel backend queries (e.g., `GET /auth/me` and `GET /bookings/me`) after their short-lived access token expires.
2. Both requests fail with a `401 Unauthorized` error.
3. The Axios interceptor triggers concurrent `POST /auth/refresh` calls carrying the identical `refreshToken` cookie.
4. **Request A** lands on the server:
   * Finds the database record (`isRevoked: false`).
   * Rotates the token, sets `isRevoked: true`, and assigns `replacedByToken` to a new string `TOKEN_B`.
   * Returns `TOKEN_B` and a new access token to the client.
5. **Request B** lands on the server 15 milliseconds later:
   * Finds the database record (now `isRevoked: true`).
   * Triggers the replay attack handler.
   * Invalidates all active refresh tokens for the user in MongoDB.
   * Throws `401 Session compromised`.
6. The legitimate user is booted out of the system and redirected to `/login`.

---

## 3. Security Assessment
Allowing a brief, restricted **grace period** for recently rotated tokens maintains the full security properties of Refresh Token Rotation while completely eliminating legitimate race conditions.

* **Replay Attacks**: If an attacker intercepts a revoked token and attempts to replay it minutes, hours, or days later, it will fall outside the secure 10-second grace period. The replay attack detection will execute correctly, revoking all active sessions and protecting the user.
* **Concurrent Requests**: Within the 10-second window, duplicate requests are securely served the successor token (`replacedByToken`), ensuring they receive the active access credentials without triggering replay alerts.
* **Atomic Protection**: Adding an atomic database-level check (`findOneAndUpdate` on `{ isRevoked: false }`) guarantees that only one request can perform the mutation, preventing race conditions from updating records concurrently.

---

## 4. Chosen Remediation Strategy
We will implement a hybrid of **Option A (Atomic Update)** and **Option B (Grace-Period Handling)**:

1. **Grace Period Verification**: If a refresh request presents a revoked token (`isRevoked === true`), we check if a `replacedByToken` successor exists and if the rotation occurred recently (within `10,000ms`). If so, we safely retrieve the active successor token and return it.
2. **Atomic Token Revocation**: We transition the mutation inside `refreshSession` to an atomic `findOneAndUpdate` matching `isRevoked: false`. If the update fails (returns `null`), it indicates another concurrent request won the rotation race. We then re-fetch the successor token and return it.

---

## 5. Rollback Plan
If any session issue is detected, the changes in `apps/server/src/services/public/auth.service.ts` can be reverted to the original version. This instantly restores the strict, immediate replay invalidation logic with zero database migrations or schema modifications.
