# Comprehensive Frontend Rendering & Platform Performance Audit Report

**Audit Status**: ✅ **Phase 2 PRs 1 & 2 Merged — PERF-006 Closed (Hypothesis Disproved) — PERF-003 Next**  
**Audit Version**: `v2.1.0`  
**Audit Date**: 2026-07-23  
**Branch**: `develop`  
**Environment**: Production Build (`npm run build && npm run start -p 3000`) & Local Dev Tier  
**Node.js**: `v22.14.0` | **npm**: `v10.9.7` | **Browser**: Chrome `v126.0` (V8 `v12.6`)  
**Dependencies**: React `v18.3.1`, Next.js `v16.2.4`, TanStack Query `v5.90.16`, React Scan `v0.2+`, Lighthouse `v12.0`  

---

## 1. Executive Summary & Governance Principle

A platform-wide frontend rendering performance audit was conducted across **@esparex/apps-web** and **@esparex/apps-admin** using **React Scan overlay**, **React DevTools Profiler**, Lighthouse Core Web Vitals, Chrome V8 Heap snapshots, and Network HAR waterfalls.

---

## 2. Phase 2 Finding Progress & Lifecycle Tracking

| Finding ID | Title / Domain | Current Lifecycle Status | Target PR Branch | Pre-PR Hypothesis Gate | Stage 1 Verification Result |
|---|---|---|---|---|---|
| **PERF-004** | Post-Auth Network Waterfall | **Closed** | `perf/post-auth-network-waterfall` | ☑ **Verified Safe** | **Merged in PR #182 (350ms latency reduction / ~62.5%)** |
| **PERF-001** | `AuthContext` Function Reference Instability | **Closed** | `perf/auth-context-splitting` | ☑ **Verified Safe** | **Merged in PR #183 (Eliminated route navigation re-renders)** |
| **PERF-006** | Root JS Bundle Optimization | **Closed (No Action)** | N/A — Hypothesis Disproved | ☑ **Gate Passed — No Issue Found** | Full Turbopack build analysis confirmed all heavy libs (firebase 119KB, framer-motion 118KB, socket.io 84KB, react-hook-form 56KB+) are already async chunks. Root bundle is 446KB (react-dom + Next.js shell only). |
| **PERF-003** | Memoize Listing Card Callbacks | **Identified** | `perf/ad-card-grid-memoization` | ☐ Pending Gate Check | Prop comparator audit pending |
| **PERF-002** | Localize OTP Digit State | **Deferred** | Phase C | ☐ Pending Gate Check | Form state localization pending |
| **PERF-005** | Verify `requestAnimationFrame` | **Closed** | N/A (Intentional UI Timing) | ☑ Verified (No Action) | Intentional frame pause to flush AuthContext |
| **PERF-007** | Detached DOM Reclamation | **Closed** | N/A (Healthy V8 GC) | ☑ Verified (No Action) | Reclaimed cleanly within 3s |
| **PERF-008** | Accessibility Compliance | **Closed** | N/A (100% WCAG 2.2 AA) | ☑ Verified (No Action) | 100% WCAG 2.2 AA pass |

---

## 3. PR 2 (`PERF-001`) Stage 1 Hypothesis Verification Proof

### Stage 1 Observational Subscriber & Churn Audit Results

1. **Subscriber Scope**:
   - `HeaderWrapper` (`Header`, `MobileHeader`, `MobileNavDrawer`)
   - `AuthGuard`
   - `MobileBottomNav`
   - `BusinessPostFAB`
   - `AppBootstrapProvider`
   - `useCurrentUser`
2. **Root Cause Analysis**:
   - In `AuthContext.tsx`, `fetchUser` depends on Next.js `router` from `useRouter()` (`[backendReady, router, setBackendReady, setHasAuthHint]`).
   - In App Router, `router` object identity changes on route navigation.
   - Consequently, `fetchUser` function reference changes on every page navigation.
   - Because `statusValue` and `combinedValue` include `fetchUser`, both context objects re-instantiate on every single route navigation.
   - Result: Every component subscribing to `useAuth()` re-renders on every page transition even when `user` and `status` remain completely identical.

3. **Stage 1 Solution Strategy (SSOT)**:
   - Store `router` in a stable `routerRef` inside `AuthContext.tsx`.
   - Remove `router` from `fetchUser`'s dependency array (`[backendReady, setBackendReady, setHasAuthHint]`).
   - Stabilize `fetchUser`, `statusValue`, and `combinedValue` across route navigations without introducing new context providers or hooks.
   - Migrate passive guards like `AuthGuard` to `useAuthStatus()` to bypass profile object updates.

---

## 4. Master Categorized Findings & Evidence Catalog

| Evidence ID | Component Name | Domain | Application Tier | Route / User Flow | Severity | Impact | Effort | Risk | Confidence | Root Cause |
|---|---|---|---|---|---|---|---|---|---|---|
| **PERF-004** | `AppBootstrapProvider` | Network | Dashboard | Post-Auth Initialization | **Critical** | Very High | Medium | Medium | **High** | Sequential query waterfall (`/me` -> `/saved` -> `/notifications`) after status settles (CLOSED) |
| **PERF-001** | `AuthProvider` | Context | All Tiers | `/login` / Session Restore | **Critical** | High | Medium | Low | **High** | `router` dependency in `fetchUser` causes `combinedValue` churn on every route navigation |
| **PERF-006** | Root JS Bundle | Bundle | Public | Initial App Hydration | **Pass** | None | N/A | N/A | **High** | Investigation disproved hypothesis. Root bundle: 446KB (react-dom + Next.js shell). Firebase (119KB), framer-motion (118KB), socket.io-client (84KB), react-hook-form (56KB+) all confirmed as Turbopack async chunks. No eager loading. No action required. |
| **PERF-003** | `AdCardGrid` | React Render | Public / Search | `/search` (Grid update) | **Medium** | Medium | Low | Low | **High** | Un-memoized inline callbacks passed to child `AdCard` instances |
| **PERF-002** | `useOtpFlow` | State | Auth | `/login` (OTP input) | **High** | Medium | Medium | Medium | **High** | 6-digit OTP string state lifted to top-level hook causing 6 card re-renders per digit |
| **PERF-005** | `useOtpFlow` (L324) | Flow Control | Auth | OTP Verification | **Low** | Low | Low | Low | **High** | Intentional frame pause to allow AuthContext to flush before router redirect |
| **PERF-007** | `ListingDetailDialogs` | Memory | Public | Dialog Open/Close | **Pass** | None | N/A | N/A | **High** | 12 transient detached HTMLDivElements post-close (reclaimed cleanly by V8 GC) |
| **PERF-008** | All Modals / Shell | Accessibility | All Tiers | Keyboard Navigation | **Pass** | None | N/A | N/A | **High** | 100% WCAG 2.2 AA compliant focus trapping and ARIA attributes |
