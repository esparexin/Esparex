# Staged Remediation Plan

This document outlines the step-by-step staged remediation plan to stabilize production authentication, email delivery, session refresh, and Google login while strictly adhering to the Stafford Engineer guidelines: **No large rewrites, backward compatibility, and small reviewable changes.**

---

## PR 1: Environment-Isolated queues

### Branch Name
`fix/queue-isolation-production`

### Purpose
Isolate BullMQ queues across environments (`local`, `staging`, `production`) to prevent local development environments from consuming production queues. When running locally or in development, a unique environment prefix (derived from `NODE_ENV` or `APP_ENV`) will be prepended to the queue names. This ensures local workers only process local jobs, completely eliminating queue collisions.

### Files Changed
* [apps/server/src/config/queue.config.ts](../apps/server/src/config/queue.config.ts) (Export a helper to get environment-specific queue names)
* [apps/server/src/services/queue.service.ts](../apps/server/src/services/queue.service.ts) (Incorporate prefix into enqueuing logic)
* [apps/server/src/workers/email.worker.ts](../apps/server/src/workers/email.worker.ts) (Prefix worker registration)
* [apps/server/src/workers/pdf.worker.ts](../apps/server/src/workers/pdf.worker.ts) (Prefix worker registration)
* [apps/server/src/workers/booking.worker.ts](../apps/server/src/workers/booking.worker.ts) (Prefix worker registration)

### Risk Level
**LOW**

### Rollback Plan
Revert the git commit to restore standard queue name literals. No database changes or schema migrations are involved.

---

## PR 2: Single Google SDK Initialization Guard

### Branch Name
`fix/google-gsi-initialization`

### Purpose
Establish a global browser-level initialization guard on the window object (e.g., `window.__googleSdkInitialized`) to prevent multiple subsequent or parallel calls to `google.accounts.id.initialize()`. When the Login page or the Checkout Auth Card requests initialization, the library checks the guard first, completely eliminating the duplicate initialization crash.

### Files Changed
* [apps/web/src/app/(auth)/login/page.tsx](../apps/web/src/app/(auth)/login/page.tsx) (Incorporate initialization guard)
* [apps/web/src/components/auth/AuthForm.tsx](../apps/web/src/components/auth/AuthForm.tsx) (Incorporate initialization guard)

### Risk Level
**LOW**

### Rollback Plan
Revert client-side changes in the components to restore the original render behavior.

---

## PR 3: Session Refresh Stability

### Branch Name
`fix/session-refresh-stability`

### Purpose
Enhance silent session refresh stability.
1. Reinforce the Axios response interceptor in `apiClient` to ensure concurrent requests failing with `401` wait on the active refresh request promise, preventing multiple parallel invocations of `POST /auth/refresh` that cause race conditions.
2. In the backend `AuthService.refreshSession`, introduce a short grace period (e.g., 5-10 seconds) during which a recently rotated refresh token is still accepted for rotation rather than immediately triggering a full replay attack lockout. This protects users from parallel request races.
3. Allow the client to store the refresh token in local storage as a fallback in production, passing it in the request body to `/auth/refresh` if the HttpOnly cookie is blocked by Safari ITP.

### Files Changed
* [apps/web/src/lib/api/client.ts](../apps/web/src/lib/api/client.ts) (Axios locking lock)
* [apps/server/src/services/public/auth.service.ts](../apps/server/src/services/public/auth.service.ts) (Grace period for recently rotated tokens)
* [apps/server/src/controllers/public/auth.controller.ts](../apps/server/src/controllers/public/auth.controller.ts) (Accept refresh token from body fallback)

### Risk Level
**LOW-MEDIUM**

### Rollback Plan
Revert backend changes to restore the strict RTR replay attack logic and frontend interceptor locking.

---

## PR 4: Navbar Authentication State Integration

### Branch Name
`feat/navbar-auth-state`

### Purpose
Integrate the global header `Navbar` with the React `useAuth` hook. If the user session is authenticated, display their profile dashboard access link and a global Sign Out CTA. If unauthenticated, display a Sign In button next to the standard CTAs.

### Files Changed
* [apps/web/src/components/layout/Navbar.tsx](../apps/web/src/components/layout/Navbar.tsx)

### Risk Level
**LOW**

### Rollback Plan
Revert changes in `Navbar.tsx` to restore the static layout.
