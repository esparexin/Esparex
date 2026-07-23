# Full-Stack Performance Audit Framework & Operational Protocol

**Branch**: `audit/full-stack-performance-baseline`  
**Governance Standard**: Esparex Architecture & Performance Governance (`AGENTS.md`)  
**Mode**: Read-Only / Evidence-Based Baseline Audit  

---

## 1. Executive Summary & Objective

This document establishes the operational framework, scope, success thresholds, endpoint inventory, profiling matrix, and regression guardrails for the full-stack performance audit of the Esparex platform.

The objective of this audit is to identify, profile, document, and rank the structural bottlenecks across the entire application lifecycle—from client rendering and network waterfalls down to backend middleware latency, database query execution, and bundle sizes.

> [!IMPORTANT]
> **Audit-Only Rule**: This branch is strictly read-only with respect to production application logic. No performance optimizations, refactorings, API contract changes, database schema updates, or UI redesigns will be made during this audit phase. All recommendations will be backed by empirical profiling data before execution in separate `perf/*` feature branches.

---

## 2. Governance Alignment & Constraints

All activities within this audit adhere to the Esparex Engineering Standards (`AGENTS.md`):

1. **Evidence-First Decision Gate**: No diagnostic conclusions or optimization suggestions will be declared without empirical profiling measurements (Chrome Traces, React Scan overlays, MongoDB `explain("executionStats")` metrics).
2. **Single-Category Commits**: Each stage of the audit will be committed independently following strict conventional commit formats (`perf(audit): ...`, `docs(performance): ...`).
3. **No Code Mutations**: Application business rules, authentication handlers, API endpoints, database schemas, and shared contracts remain 100% untouched.
4. **Build Integrity**: All documentation and profiling scripts must preserve `npm run build` and `npm run type-check` status across all monorepo packages.

---

## 3. Full-Stack Audit Scope

The audit evaluates performance metrics across the entire 15-stage request and render pipeline:

```text
1. Browser Window & Event Loop
   ↓
2. DNS / TCP / TLS & HTTP Preflight
   ↓
3. Next.js App Router Shell Hydration
   ↓
4. React Rendering & Commit Operations
   ↓
5. React Context State Propagation
   ↓
6. React Query Cache & Refetch Triggers
   ↓
7. Express Server Gateway
   ↓
8. Middleware Pipeline (CORS, Rate Limiting, JWT, Fraud Guard)
   ↓
9. Express Controllers & Schema Validation
   ↓
10. Application Domain Services
   ↓
11. Repository Ports & Database Adapters
   ↓
12. MongoDB Queries & Aggregation Pipelines
   ↓
13. Redis Cache Lookups & Key Scans
   ↓
14. Response Payload Serialization & Encoding
   ↓
15. Client Re-hydration, Painting & Frame Commits
```

---

## 4. Performance Success Targets

The audit will measure current empirical metrics against the following target latency and rendering benchmarks:

| Metric Category | Targeted Operation / Metric | Baseline Target Threshold |
|---|---|---|
| **Authentication** | Login Flow Complete | `< 1,000 ms` |
| **Authentication** | OTP Verification (`POST /auth/verify-otp`) | `< 500 ms` |
| **User Identity** | Identity Resolution (`GET /api/v1/users/me`) | `< 150 ms` |
| **Profile** | User Profile Hydration (`GET /profile`) | `< 300 ms` |
| **Notifications** | Unread Notification Retrieval (`GET /notifications`) | `< 200 ms` |
| **Saved Ads** | Saved Listings Retrieval (`GET /listings/saved`) | `< 200 ms` |
| **Core Web Vitals** | First Contentful Paint (FCP) | `< 1.5 s` |
| **Core Web Vitals** | Largest Contentful Paint (LCP) | `< 2.5 s` |
| **Core Web Vitals** | Interaction to Next Paint (INP) | `< 200 ms` |
| **Core Web Vitals** | Cumulative Layout Shift (CLS) | `< 0.1` |
| **Core Web Vitals** | Total Blocking Time (TBT) | `< 200 ms` |

---

## 5. Matrix of Profiling Scenarios

Performance metrics will be collected across 16 distinct client and server scenarios:

1. **User Identity Scenarios**:
   - New User (Unauthenticated, empty state)
   - Returning User (Cold session storage)
   - Active Authenticated User (Valid JWT cookie)
2. **Data Volume Scenarios**:
   - User with 0 saved ads
   - User with large saved ads collection (50+ items)
   - User with high notification volume (100+ items)
3. **Caching States**:
   - Cold Redis / Browser cache
   - Warm Redis / Edge cache
4. **Session States**:
   - First-time login flow
   - Pre-existing active session hydration
5. **Hardware & Network Emulation**:
   - Desktop (Unthrottled CPU, High-speed Connection)
   - Mobile (4x CPU Slowdown, Slow 4G Network Emulation)

---

## 6. Monorepo Endpoint Inventory

Every authenticated and bootstrap API request will be individually measured for latency, TTFB, payload footprint, and waterfall placement:

| Endpoint | Method | Security Scope | Expected Data Dependencies |
|---|---|---|---|
| `/api/v1/auth/send-otp` | `POST` | Public / Rate Limited | Rate Limiter, Fraud Guard, SMS Gateway |
| `/api/v1/auth/verify-otp` | `POST` | Public / Idempotent | Rate Limiter, Idempotency Guard, User Repo, JWT Sign |
| `/api/v1/users/me` | `GET` | Authenticated | JWT Guard, Mongo User Repo, Business Status |
| `/api/v1/users/profile` | `GET` | Authenticated | User Repo, Address Repo |
| `/api/v1/notifications` | `GET` | Authenticated | Notification Repo, Unread Index |
| `/api/v1/listings/saved` | `GET` | Authenticated | Saved Listing Repo, Ad Detail Join |
| `/api/v1/health` | `GET` | Public | DB Ping, Redis Ping |
| `Socket.IO Handshake` | `WS/HTTP` | Authenticated | Socket Auth Middleware, Connection Pool |
| `Web Push Registration` | `POST` | Authenticated | Push Token Storage, Device Registry |

---

## 7. Audit Tooling Stack

- **React Scan**: Real-time render profiling, commit counts, wasted renders.
- **Chrome DevTools Performance & Performance Insights**: CPU flamegraphs, Long Animation Frames (LoAF), forced reflows.
- **Chrome Memory Profiler**: Heap snapshots, detached DOM nodes, listener counts.
- **Lighthouse & Web Vitals CLI**: Standardized CWV lab metrics.
- **Next.js Route Analyzer**: First Load JS, shared chunks, route JS footprint.
- **MongoDB `explain("executionStats")`**: Query execution plan, collection scan (`COLLSCAN`) detection, index utilization.

---

## 8. Audit Regression Constraints

During this audit phase, the following actions are **strictly forbidden**:
- Modifying core application business logic.
- Altering authentication logic or security guards.
- Modifying API schemas or shared DTO types in `@esparex/contracts`.
- Updating MongoDB database schemas or indexes directly.
- Altering SSR/SSG fetching configurations.
- Applying UI component re-styling or layout redesigns.

---

## 9. Audit Exit Criteria

The audit will be declared complete only when all of the following conditions are met:

1. [ ] All 16 profiling scenarios executed and recorded.
2. [ ] All endpoints in the Monorepo Endpoint Inventory benchmarked for latency and TTFB.
3. [ ] React rendering hotspots, wasted renders, and context cascades captured via React Scan.
4. [ ] React Query caching policies (`staleTime`, `gcTime`, refetch triggers) evaluated.
5. [ ] Network waterfalls during authentication captured and mapped.
6. [ ] Express middleware stack latency broken down step-by-step.
7. [ ] MongoDB database queries analyzed with `explain("executionStats")`.
8. [ ] Bundle size and chunk footprint broken down by route.
9. [ ] Memory heap snapshots and DOM node counts analyzed.
10. [ ] Core Web Vitals recorded for Desktop and Mobile viewports.
11. [ ] Duplicate logic and dead code inventoried.
12. [ ] Bottlenecks ranked by user-perceived impact with root-cause analysis.
13. [ ] Comprehensive final performance report (`docs/reports/full-stack-performance-audit-report.md`) published.

---

## 10. Sequential Commit Strategy

```text
Commit 1: chore(performance): establish full-stack performance audit framework
Commit 2: perf(audit): capture baseline performance benchmarks
Commit 3: perf(audit): profile React rendering with React Scan
Commit 4: perf(audit): analyze authentication and user initialization pipeline
Commit 5: perf(audit): profile API latency and request waterfall
Commit 6: perf(audit): inspect backend execution and database performance
Commit 7: perf(audit): evaluate Next.js architecture and hydration performance
Commit 8: perf(audit): analyze bundle footprint and memory usage
Commit 9: perf(audit): identify duplicate logic and unnecessary resource usage
Commit 10: docs(performance): publish comprehensive performance audit report
```
