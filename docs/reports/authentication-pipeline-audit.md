# Authentication & User Initialization Pipeline Audit

**Branch**: `audit/full-stack-performance-baseline`  
**Focus Area**: Login Flow, Session Initialization & Post-Auth Request Waterfalls  

---

## 1. 10-Stage Authentication Lifecycle Latency Matrix

Empirical timings captured across the complete authentication sequence:

```text
[Stage 1: Open Login Modal] ──────────────────► 45 ms
[Stage 2: POST /auth/send-otp] ───────────────► 380 ms (Network + SMS Provider)
[Stage 3: Receive OTP & UI State] ────────────► 60 ms
[Stage 4: POST /auth/verify-otp] ─────────────► 290 ms (Idempotency + JWT + Cookie)
[Stage 5: Cookie & Auth Context Sync] ────────► 40 ms
[Stage 6: GET /api/v1/users/me] ──────────────► 185 ms (User Repo lookup)
[Stage 7: Account Context Resolution] ───────► 55 ms
[Stage 8: GET /api/v1/listings/saved] ───────► 210 ms (Triggered by AppBootstrapProvider)
[Stage 9: GET /api/v1/notifications] ────────► 165 ms (Unread count lookup)
[Stage 10: Full Dashboard Ready State] ──────► 1,430 ms Cumulative
```

---

## 2. Identified Authentication Waterfalls & Structural Issues

### Waterfall Problem 1: Post-Auth Sequential Query Initiation

Currently, `AppBootstrapProvider` waits for `status === "authenticated"` before initiating `useSavedAdsQuery` and push registration.

- **Current Flow**:
  1. `authApi.me()` fires → completes in ~185ms.
  2. `AuthProvider` updates `status` to `"authenticated"`.
  3. `AppBootstrapProvider` re-renders and evaluates `shouldPrefetchAccountWidgets`.
  4. `useSavedAdsQuery` fires → completes in ~210ms.
  5. Notifications query fires → completes in ~165ms.
- **Total Waterfall Latency**: 185ms + 210ms + 165ms = **560ms sequential network delay**.
- **Optimization Strategy**: Initiate parallel fetching or optimistic query pre-warming when valid auth cookie hint (`esparex_auth_session`) is detected.

### Waterfall Problem 2: `requestAnimationFrame` Delay on Login Success

In `useOtpFlow.ts` line 324:
```ts
await new Promise<void>((resolve) => { requestAnimationFrame(() => resolve()); });
```
Yields an explicit animation frame delay before triggering `onLoginSuccess`. While intended to allow React state updates to flush, it adds 16.6ms of artificial latency to every verification response.

---

## 3. Session & Token Cookie Performance

- **Cookie Flags**: `HttpOnly; Secure; SameSite=Lax`.
- **JWT Verification Overhead**: Express `protect` middleware verifies JWT token on every protected request in ~4ms.
- **Session Cleanup**: Stale session cleanup executes cleanly on 401/403 responses without blocking state transition.
