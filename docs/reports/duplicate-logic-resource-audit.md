# Duplicate Logic & Resource Hygiene Audit Report

**Branch**: `audit/full-stack-performance-baseline`  
**Scope**: Code Duplication, Dead Code Inventory, Duplicate Providers & Fetching Patterns  

---

## 1. Code & Hook Duplication Inventory

Search results across `@esparex/apps-web`, `@esparex/core`, and `@esparex/backend-api`:

1. **OTP Rate Limit & Countdown Logic**:
   - `useOtpFlow.ts` and `useOtpTimers.ts` contain overlapping countdown calculation functions (`parseEpochMs`, `appendRateLimitCountdown`).
   - *Recommendation*: Centralize rate limit time parsing into `@esparex/shared` or `@/lib/otpHelpers`.
2. **Mobile Phone Formatting & Validation**:
   - Phone sanitization (`replace(/\D/g, '')`) and validation (`validateIndianMobile`) exist in `useOtpFlow.ts`, `authRoutes.ts`, and `auth.validator.ts`.
   - *Recommendation*: Reuse SSOT validators from `@esparex/core/validators/auth.validator`.

---

## 2. Duplicate Providers & Fetching Patterns

1. **User Identity Dual Fetching**:
   - `AuthProvider` fetches `/me` via `authApi.me()` upon initial page load.
   - `AppBootstrapProvider` subsequently sets React Query cache data via `queryClient.setQueryData(queryKeys.user.me(), user)`.
   - *Analysis*: While not making duplicate network requests, the synchronization between AuthContext state and React Query state triggers 2 separate context updates.
2. **Push Registration Duplicate Handlers**:
   - `AppBootstrapProvider` checks `syncBrowserPushRegistration` on every `status === "authenticated"` change.
   - Local storage keys (`esparex_fcm_registration_v1`) prevent redundant server syncs, but execution enters the hook on every route transition.

---

## 3. Dead Code & Unused Dependencies Inventory

Audit using `knip` static analysis:

1. **Pruned Heavy Dependencies** (Verified in Phase 4):
   - `heic2any` removed from static package.json imports (~180 KB saved).
   - `recharts` pruned from web app (~150 KB saved).
2. **Unused Imports & Types**:
   - 0 unused imports detected under `npm run guard:unused-imports`.
   - All TypeScript compilation targets clean across all monorepo packages.
