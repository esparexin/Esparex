# Performance Evidence & Artifact Index

**Branch**: `audit/full-stack-performance-baseline`  
**Purpose**: Map all qualitative and quantitative audit findings to empirical raw evidence files, trace logs, and profiling output.  

---

## 1. Evidence Matrix & Artifact Mapping

| Audit Finding | Measured Domain | Primary Evidence Source | Artifact Location / Format | Verification Status |
|---|---|---|---|---|
| **Post-Auth Waterfall Latency** | Network | Chrome DevTools Network HAR & Performance Trace | `docs/reports/authentication-pipeline-audit.md` | ✅ Verified (Sequential `/me` → `saved` → `notifications`) |
| **Backend & Express Execution** | Server / API | Express Middleware Timers & Router Logs | `docs/reports/api-latency-network-waterfall-report.md` | ✅ Verified (24 ms – 65 ms total server time) |
| **MongoDB Query Performance** | Database | MongoDB `explain("executionStats")` Output | `docs/reports/backend-database-performance-report.md` | ✅ Verified (`IDHACK`, `IN_LIST_FETCH`, 0 `COLLSCAN`) |
| **React Component Re-renders** | Client Rendering | React Scan & React DevTools Profiler Log | `docs/reports/react-render-profiling-report.md` | ⚠️ Measured Hypothesis (Provider cascade breakdown documented) |
| **Initial Bundle Breakdown** | JS Footprint | Next.js Build Route Analyzer Output | `docs/reports/bundle-memory-performance-report.md` | ✅ Verified (`npm run analyze:routes` / 284 KB root JS) |
| **Mobile Core Web Vitals** | Web Vitals / CWV | Lighthouse & Web Vitals CLI Log | `docs/reports/baseline-performance-benchmarks.md` | ✅ Verified (Desktop FCP 1.1s vs Mobile FCP 2.4s, LCP 4.2s) |
| **Memory Heap & Listener Hygiene** | V8 Engine | Chrome Memory Profiler Heap Allocation Log | `docs/reports/bundle-memory-performance-report.md` | ✅ Verified (18.4 MB base heap, 42 active listeners) |

---

## 2. Quantitative Claims & Scope Clarifications

### A. Authentication Waterfall Breakdown (Scope Clarification)

To avoid ambiguity across reports:
- **Total Post-Login Chain**: **~850 ms total client round-trip latency** spanning `POST /verify-otp` (290 ms) + `GET /me` (185 ms) + `GET /listings/saved` (210 ms) + `GET /notifications` (165 ms).
- **Post-`/me` Sequential Sequence**: **~375 ms – 560 ms** of sequential network waiting occurring *after* `/me` settles before account widgets are hydrated.
- **Parallelization Estimate**: Parallelizing `/listings/saved` and `/notifications` after session verification is estimated to reduce post-`/me` wait times by **~180 ms – 220 ms**, subject to browser request scheduling and connection multiplexing.

### B. React Scan & Re-Render Profiling (Evidence Breakdown)

- **Provider Hierarchy**: `UserAppProviders` → `AuthProvider` → `AppBootstrapProvider` → `NavigationProvider`.
- **Observed Component Re-render Counts during Auth State Change**:
  - `UserAppProviders`: 3 renders
  - `Header`: 5 renders (`useAuth()` consumer)
  - `AdCardGrid`: 2 renders (memoized comparator prevents child card re-renders)
  - `useOtpFlow` Input: 6 renders during 6-digit OTP entry (1 render per digit input)
- **Wasted Render Estimate**: Estimated ~40–42% of sub-tree re-renders during state transitions do not alter DOM nodes, representing target areas for context slicing and prop memoization.

### C. Bundle Footprint Classification (Runtime Impact)

- **Initial Route JS (First Load)**: 284 KB (React, Next.js App Router, Zod, Lucide core).
- **Lazy-Loaded Packages (On-Demand)**:
  - `heic2any` (180 KB): Code-split via `import("heic2any")` (only fetched on image upload).
  - `AnalyticsChartWrapper` (150 KB): Isolated in `@esparex/apps-admin`.
- **Eager Client Component Packages**:
  - Firebase FCM / Web Push (165 KB): Loaded in `AppBootstrapProvider` for authenticated users.
  - Radix UI Primitives (185 KB): Tree-shaken across shared component library.
