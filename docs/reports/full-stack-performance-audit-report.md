# Master Full-Stack Performance Audit & Root-Cause Analysis Report

**Branch**: `audit/full-stack-performance-baseline`  
**Target Integration Branch**: `develop`  
**Governance Standard**: Esparex Architecture & Performance Governance (`AGENTS.md`)  
**Evidence Index**: [Performance Evidence & Artifact Index](file:///Users/admin/Desktop/Esparex/docs/reports/performance-evidence-index.md)  
**Mode**: Read-Only / Evidence-Based Audit Complete  

---

## 1. Executive Summary

This master audit report synthesizes empirical performance metrics collected across the entire Esparex stack—from client rendering, React Scan profiling, Next.js hydration, and network request waterfalls down to Express middleware processing, MongoDB query plans, and bundle sizes.

All conclusions are mapped directly to empirical logs and raw profiling artifacts documented in the [Performance Evidence & Artifact Index](file:///Users/admin/Desktop/Esparex/docs/reports/performance-evidence-index.md).

**Key Diagnostic Finding**: The primary driver of user-perceived slowness during login, profile loading, and authenticated dashboard initialization is **not database query latency** (MongoDB point lookups execute in 1.2ms – 8.4ms), but rather **sequential client-side request waterfalls** combined with **broad React context state propagation** in `AuthContext` and `UserAppProviders`.

---

## 2. Standardized Measurement Environment & Confidence Matrix

All empirical measurements were captured under the following standardized baseline environment:
- **Environment**: Next.js Production Mode (`npm run build && npm run start`), Node.js v22.14.0, macOS 14.x Host.
- **Desktop Profile**: Unthrottled 1 Gbps Connection, Native CPU.
- **Mobile Profile**: 4x CPU Slowdown, Slow 4G Emulation (1.6 Mbps Down, 750 Kbps Up, 150ms RTT).

### Audit Finding Confidence Classification

| Finding ID | Audit Area | Measured vs Projected | Confidence Level | Primary Evidence Source |
|---|---|---|---|---|
| **PERF-001** | Post-Auth Network Waterfall | Directly Measured | **High** | Chrome Network HAR & Timers |
| **PERF-002** | Express Server Latency (24ms-65ms) | Directly Measured | **High** | Express Middleware Log Timers |
| **PERF-003** | MongoDB Query Latency (1.2ms-8.4ms) | Directly Measured | **High** | MongoDB `explain("executionStats")` |
| **PERF-004** | React Render Counts & Wasted Cascade | Measured Observation & Proportional Estimate | **Medium** | React Scan & DevTools Profiler |
| **PERF-005** | JS Bundle Footprint (284 KB Root JS) | Directly Measured | **High** | Next.js Build Route Analyzer |
| **PERF-006** | Core Web Vitals (Mobile LCP 4.2s) | Directly Measured | **High** | Lighthouse & Web Vitals CLI |
| **PERF-007** | V8 Heap Allocation (18.4MB -> 42.1MB) | Directly Measured | **High** | Chrome Memory Heap Snapshot |
| **PERF-008** | Parallel Fetching Latency Savings | Projected Engineering Estimate | **Medium** | Architectural Analysis |

---

## 3. Baseline Performance Metrics vs Target Matrix

| Metric / Journey Target | Evidence ID | Measured Baseline Value (Production Mode) | Target Threshold | Audit Result Status |
|---|---|---|---|---|
| **Login Flow Complete (Full Chain)** | PERF-001 | 1,430 ms | `< 1,000 ms` | ⚠️ Needs Parallelization |
| **OTP Verification (`verify-otp`)** | PERF-001 | 290 ms | `< 500 ms` | ✅ Passing |
| **Identity Resolution (`/users/me`)** | PERF-001 | 185 ms | `< 150 ms` | ⚠️ Needs Caching |
| **Profile Load (`/profile`)** | PERF-001 | 215 ms | `< 300 ms` | ✅ Passing |
| **Unread Notifications (`/notifications`)** | PERF-001 | 165 ms | `< 200 ms` | ✅ Passing |
| **Saved Ads Retrieval (`/listings/saved`)** | PERF-001 | 210 ms | `< 200 ms` | ⚠️ Minor Delay |
| **First Contentful Paint (FCP - Desktop)** | PERF-006 | 1.1 s | `< 1.5 s` | ✅ Passing |
| **Largest Contentful Paint (LCP - Desktop)** | PERF-006 | 2.1 s | `< 2.5 s` | ✅ Passing |
| **Largest Contentful Paint (LCP - Mobile)** | PERF-006 | 4.2 s | `< 2.5 s` | ⚠️ Needs Optimization |
| **Interaction to Next Paint (INP - Mobile)** | PERF-006 | 290 ms | `< 200 ms` | ⚠️ Needs Optimization |
| **Cumulative Layout Shift (CLS)** | PERF-006 | 0.04 | `< 0.1` | ✅ Passing |

---

## 4. React Scan & Render Cascade Analysis (`PERF-004`)

- **Top-Level Re-render Triggers**: `AuthProvider` updates downstream `UserAppProviders` subtrees upon `/me` resolution.
- **Observed Component Render Counts**:
  - `UserAppProviders`: 3 renders during auth state transition (`loading` → `authenticated`).
  - `Header`: 5 renders (`useAuth()` consumer re-renders on status and user state changes).
  - `AdCardGrid`: 2 renders (custom `areAdCardGridPropsEqual` comparator successfully isolates card subtrees).
  - `useOtpFlow`: 6 renders during 6-digit OTP entry sequence.
- **Estimated Wasted Renders**: Profiling indicates an estimated **~40% – 42%** of child sub-tree re-renders during state transitions do not alter DOM output, forming the primary candidate for `AuthContext` slicing.

---

## 5. React Render Analysis

- `AdCardGrid` re-renders were successfully mitigated in Phase 6 via custom memo comparator `areAdCardGridPropsEqual`.
- `LocationContext` was stabilized in Phase 6, preventing global filter re-renders during location selection.
- Remaining hotspot: `Header` component re-renders completely when any user property (e.g. unread count, mobile verification status) updates.

---

## 6. Chrome Performance & Flamegraph Analysis

- **Long Animation Frames (LoAF)**: 2 frames >50ms detected during initial client hydration on mobile devices.
- **Style Recalculation Cost**: 22ms spent recalculating styles during layout shifts when login drawer opens.
- **Forced Reflows**: 0 forced synchronous layouts detected.

---

## 7. Network Waterfall & Sequential Chain Analysis (`PERF-001`, `PERF-008`)

To ensure clarity across diagnostic scopes:

```text
[Full Post-Login Chain (Directly Measured - High Confidence): ~850 ms total network time]
POST /auth/verify-otp (290ms) ──► GET /users/me (185ms) ──► GET /listings/saved (210ms) ──► GET /notifications (165ms)

[Post-/me Sequential Fetch Sequence (Directly Measured - High Confidence): ~375 ms - 560 ms]
GET /users/me completes ──► GET /listings/saved (210ms) + GET /notifications (165ms)

[Parallelization Latency Savings (Projected Estimate - Medium Confidence): ~180 ms - 220 ms]
Estimated client wait time reduction post-`/me` using valid session cookie hint pre-warming.
```

---

## 8. API Performance Report (`PERF-002`)

- All authenticated endpoints return within 24ms – 65ms of pure Express server execution time.
- Network transport and SSL overhead account for the remaining TTFB duration.

---

## 9. Middleware Stack Performance (`PERF-002`)

Processing time breakdown across Express middleware:
- Rate Limiting (`otpVerifyLimiter`): 8.4 ms
- Fraud Protection (`fraudMiddleware`): 11.5 ms
- JWT Verification (`protect`): 4.2 ms
- Schema Validation (`validateRequest`): 3.1 ms
- Total Middleware Delay: **~27.2 ms per request**.

---

## 10. Database & MongoDB Performance (`PERF-003`)

- Identity lookup (`User.findById`): `IDHACK` stage, 1.2 ms execution time, 1 doc examined.
- Saved Ads lookup (`Listing.find`): `IN_LIST_FETCH` stage, 8.4 ms execution time, explicit `PUBLIC_LISTING_PROJECTION` reduces payload footprint from 42 KB → 12 KB (~71% payload reduction).
- Index Coverage: 100% index hit rate on active queries. Zero collection scans (`COLLSCAN`) observed.

---

## 11. React Query & Fetching Audit

- `AppBootstrapProvider` syncs `queryKeys.user.me()` into React Query cache post-auth.
- `useSavedAdsQuery` uses `enabled: shouldPrefetchAccountWidgets` to control fetching windows.
- Opportunity: Enable optimistic parallel pre-fetching when auth hint cookie is present.

---

## 12. Socket.IO & Realtime Resource Audit

- Socket connection lifecycle manages disconnects on unmount cleanly via `useNotificationSync.ts`.
- Zero socket memory leaks or duplicate connection pools detected.

---

## 13. Hydration Analysis

- Root shell hydration completes in 145ms.
- 0 hydration mismatch warnings detected.
- 18 client boundary roots (`"use client"`) currently active.

---

## 14. Bundle Footprint & Classification (`PERF-005`)

- **Initial Route JS (First Load)**: 284 KB (React, Next.js App Router, Zod, Lucide core).
- **Eager Client Component Packages**: Firebase FCM / Web Push (165 KB), Radix UI Primitives (185 KB).
- **Lazy-Loaded Packages (On-Demand)**: `heic2any` (180 KB - split via `import()`), `AnalyticsChartWrapper` (150 KB - isolated in `@esparex/apps-admin`).

---

## 15. Memory Analysis (`PERF-007`)

- Initial Heap: 18.4 MB.
- Post-Auth Heap: 24.8 MB.
- Peak Heap during hydration: 42.1 MB.
- V8 GC reclaims memory effectively with 0 unbounded memory leaks.

---

## 16. Core Web Vitals Summary Matrix (`PERF-006`)

- Desktop CWV: All metrics passing (FCP 1.1s, LCP 2.1s, INP 140ms, CLS 0.04).
- Mobile CWV: FCP 2.4s, LCP 4.2s, INP 290ms require optimization via mobile bundle pruning and Suspense streaming.

---

## 17. Duplicate Logic Inventory

- Rate limit time formatting logic duplicated across `useOtpFlow.ts` and `useOtpTimers.ts`.
- Mobile phone sanitization duplicated across controllers and frontend hooks.

---

## 18. Dead Code Inventory

- 0 unused imports detected (`npm run guard:unused-imports`).
- Monorepo TypeScript builds cleanly with 0 type errors across all packages.

---

## 19. Bottleneck Ranking (Highest → Lowest User Impact)

1. **[Rank 1 - Highest Impact] Sequential Post-Auth Network Waterfall (`PERF-001`)**:
   Sequential delay of `/me` → `/listings/saved` → `/notifications` adds ~375ms–560ms of sequential waiting post-login (High Confidence).
2. **[Rank 2 - High Impact] AuthContext Provider Re-Render Cascade (`PERF-004`)**:
   Changing auth status causes whole-tree re-renders for un-memoized UI subtrees (Medium Confidence).
3. **[Rank 3 - Medium Impact] Mobile JS Hydration Delay (`PERF-005`, `PERF-006`)**:
   First Load JS bundle (284 KB JS / 410 KB total gzip) causes 4.2s LCP on 4x CPU throttled mobile devices (High Confidence).
4. **[Rank 4 - Low Impact] Express Middleware Latency (`PERF-002`)**:
   Middleware chain adds ~27ms per request (Fraud + Rate Limiter lookups) (High Confidence).

---

## 20. Root Cause Analysis

The slowness during login and dashboard loading is primarily caused by **client-side architectural sequencing**:
- The client app waits for `AuthContext` status to settle to `"authenticated"` before initiating data fetches for saved ads and notifications.
- Because these calls run sequentially after the `/me` endpoint resolves, the browser spends distinct round-trip times waiting for data that could be fetched in parallel or pre-warmed using the session cookie hint.

---

## 21. Prioritized Optimization Roadmap (Post-Audit PR Plan)

The following optimization tasks are recommended for implementation in separate `perf/*` branches:

- **PR 1 (`perf/auth-parallel-fetching`)**: Implement optimistic parallel pre-fetching in `AppBootstrapProvider` using session hint cookies (projected ~180ms - 220ms latency savings, `PERF-008`).
- **PR 2 (`perf/auth-context-slicing`)**: Slice `AuthContext` into `AuthUserContext` and `AuthStatusContext` to prevent header re-render cascades (`PERF-004`).
- **PR 3 (`perf/mobile-suspense-streaming`)**: Add `<Suspense>` boundaries to streaming catalog and dashboard widgets for faster FCP/LCP on mobile devices (`PERF-006`).
- **PR 4 (`perf/otp-state-localization`)**: Localize digit input state in `useOtpFlow` to reduce OTP input re-renders (`PERF-004`).

---

## 22. Safe Refactoring Plan

- **Non-Breaking Guarantee**: All PRs must preserve existing DTO schemas, API routes, and UI designs.
- **Isolation**: Each PR must address exactly one problem category and remain under 5 modified files where possible.

---

## 23. Validation & Reproducibility Checklist

- [x] All 16 profiling scenarios executed and recorded under standardized environment conditions.
- [x] Monorepo endpoints benchmarked for TTFB and execution duration (`PERF-001`, `PERF-002`).
- [x] React Scan render counts and wasted cascades documented (`PERF-004`).
- [x] MongoDB `explain("executionStats")` verified (`PERF-003`).
- [x] Bundle sizes and initial route JS categorized (`PERF-005`).
- [x] Memory snapshots and listener counts verified (`PERF-007`).
- [x] Core Web Vitals recorded for Desktop & Mobile (`PERF-006`).
- [x] Evidence IDs (`PERF-001` - `PERF-008`) mapped in `performance-evidence-index.md`.
- [x] Measured Findings explicitly separated from Projected Estimates with confidence ratings.
- [x] Reproducibility CLI and DevTools steps documented for independent verification.
