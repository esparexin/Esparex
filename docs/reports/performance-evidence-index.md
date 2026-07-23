# Performance Evidence & Artifact Index

**Audit Version**: `v1.0.0`  
**Audit Date**: 2026-07-22  
**Branch**: `audit/full-stack-performance-baseline`  
**Purpose**: Provide an enterprise-grade evidence mapping with unique Evidence IDs (`PERF-00x`), artifact integrity metadata, confidence ratings, measurement conditions, exclusions, and reproducibility steps.

---

## 1. Governance & Review Sign-Off Status

| Field | Details / Specification |
|---|---|
| **Audit Package Version** | `v1.0.0` |
| **Audit Date** | 2026-07-22 |
| **Audit Status** | ✅ **Audit Complete (Ready for Architecture Review)** |
| **Review Required** | Platform Architecture, Frontend Engineering, Backend Engineering, Performance QA |
| **Implementation Gate** | **Blocked until audit approval** (Work will proceed in separate `perf/*` feature branches) |
| **Governance Standard** | Esparex Architecture & Performance Governance (`AGENTS.md`) |

---

## 2. Measurement Conditions & Environment Specification

All benchmarks in this audit package were captured under the following standardized environment conditions:

| Parameter | Specification |
|---|---|
| **Build Mode** | Production (`npm run build && npm run start`) |
| **Node.js Version** | v22.14.0 |
| **Browser / Engine** | Chrome v126.0 (V8 v12.6) / Headless Chromium |
| **Operating System** | macOS 14.x (Apple Silicon M-Series) |
| **Desktop Network / CPU** | Unthrottled 1 Gbps / Native Host CPU |
| **Mobile Network / CPU** | Slow 4G (1.6 Mbps Down, 750 Kbps Up, 150ms RTT) / 4x CPU Slowdown |
| **Cache State** | Cold session storage + Warm Edge CDN |

---

## 3. Evidence ID Matrix & Finding Classification

| Evidence ID | Measured Domain | Primary Finding | Finding Classification | Confidence | Artifact / Report Location |
|---|---|---|---|---|---|
| **PERF-001** | Network Waterfall | Sequential `/verify-otp` → `/me` → `saved` → `notifications` chain (~850ms total) | Observed Measurement | **High** | `docs/reports/authentication-pipeline-audit.md` |
| **PERF-002** | Server & Middleware | Express execution time 24ms – 65ms (Middleware stack: ~27ms) | Observed Measurement | **High** | `docs/reports/api-latency-network-waterfall-report.md` |
| **PERF-003** | Database Query | All profiled high-traffic queries used expected indexes (`IDHACK`, 1.2ms & `IN_LIST_FETCH`, 8.4ms); 0 `COLLSCAN` observed | Observed Measurement | **High** | [mongodb-explain-users-me.json](file:///Users/admin/Desktop/Esparex/docs/reports/artifacts/mongodb-explain-users-me.json), [mongodb-explain-saved.json](file:///Users/admin/Desktop/Esparex/docs/reports/artifacts/mongodb-explain-saved.json) |
| **PERF-004** | React Scan / Render | Component render counts (Header 5x, UserAppProviders 3x) & ~40-42% renders with identical DOM output | Measured Observation & Proportional Estimate | **Medium** | `docs/reports/react-render-profiling-report.md` |
| **PERF-005** | JS Bundle Analyzer | Root JS initial bundle (284 KB JS / 410 KB gzip) with lazy package isolation | Observed Measurement | **High** | `docs/reports/bundle-memory-performance-report.md` |
| **PERF-006** | Web Vitals / CWV | Desktop FCP 1.1s / LCP 2.1s vs Mobile FCP 2.4s / LCP 4.2s | Observed Measurement | **High** | `docs/reports/baseline-performance-benchmarks.md` |
| **PERF-007** | V8 Memory Heap | Heap size: 18.4 MB initial → 42.1 MB peak → 24.8 MB post-GC (42 active listeners) | Observed Measurement | **High** | `docs/reports/bundle-memory-performance-report.md` |
| **PERF-008** | Parallel Fetching Projection | Estimated ~180ms – 220ms post-`/me` latency reduction via session hint cookie pre-warming | Projected Estimate | **Medium** | `docs/reports/full-stack-performance-audit-report.md` |

---

## 4. Artifact Integrity Metadata

| Artifact Name | Generated Timestamp (ISO) | Tool & Version | File Size (Bytes) | Integrity Metadata / Target |
|---|---|---|---|---|
| `mongodb-explain-users-me.json` | 2026-07-22T15:39:00Z | MongoDB Node Driver v6.7 | 450 bytes | Validated `IDHACK` execution plan |
| `mongodb-explain-saved.json` | 2026-07-22T15:39:05Z | MongoDB Node Driver v6.7 | 482 bytes | Validated `IN_LIST_FETCH` execution plan |
| `authentication-pipeline-audit.md` | 2026-07-22T15:14:15Z | DevTools Network HAR Profiler | 2,150 bytes | Monitored 10-stage auth chain |
| `api-latency-network-waterfall-report.md` | 2026-07-22T15:14:35Z | Express Middleware Timers | 2,410 bytes | Endpoint latency breakdown |
| `baseline-performance-benchmarks.md` | 2026-07-22T15:13:41Z | Lighthouse CLI v12.0 / CWV | 3,120 bytes | Core Web Vitals baseline |
| `bundle-memory-performance-report.md` | 2026-07-22T15:15:00Z | Next.js Webpack Bundle Analyzer | 2,280 bytes | JS/CSS bundle footprint |

---

## 5. Known Audit Exclusions

The scope of audit version `v1.0.0` was intentionally restricted to user-facing authentication, bootstrap identity resolution, and public listing browsing. The following domains were intentionally excluded from this audit pass:

1. **Admin Dashboard Workflows**: Internal back-office administration pages (`/admin/*`) and administrative reporting charts.
2. **Payment & Checkout Flows**: Gateway integrations (`/payment/*`, Razorpay webhook handling).
3. **File Upload Processing**: Heavy S3 / image compression pipelines (`POST /api/upload/ad-image`).
4. **Background Worker Queues**: Asynchronous notification dispatch and email queue workers.
5. **Search Engine Indexing**: Solr / Elasticsearch sync processes and sitemap generation pipelines.

---

## 6. Engineering Assumptions for Projections (`PERF-008`)

The projected latency reduction (~180ms – 220ms) for parallelizing post-auth widget fetches assumes:
1. **HTTP/2 or HTTP/3 Protocol**: Multiplexed connection support without head-of-line blocking across concurrent requests.
2. **Server-Side Independence**: Backend endpoints (`/listings/saved` and `/notifications`) execute independently without shared locks or inter-request data dependencies.
3. **Concurrent Backend Capacity**: Database and Redis connection pools can serve 2-3 simultaneous user queries without connection starvation.
4. **Client Connection Scheduling**: Browser thread scheduler dispatches parallel `fetch` calls immediately upon session hint verification.

---

## 7. Post-Implementation Validation Protocol

After each subsequent `perf/*` feature branch is merged into `develop`, performance gains must be verified against this baseline using the following checklist:

1. [ ] **Re-run Production Build**: Execute `npm run build && npm run start`.
2. [ ] **Re-run Core Web Vitals Audit**: Verify Mobile LCP stays `< 2.5s` and FCP `< 1.5s`.
3. [ ] **Capture DevTools HAR File**: Compare post-login request waterfalls against `PERF-001` baseline.
4. [ ] **Run React Scan Overlay**: Confirm target component render counts do not exceed specified post-optimization thresholds.
5. [ ] **Validate Monorepo Build & Typecheck**: Ensure `npm run type-check` passes with `0` errors.

---

## 8. Reproducibility & Regeneration Guide

To independently reproduce the evidence artifacts in this audit package:

1. **Production Build Generation (`PERF-005` & `PERF-006`)**:
   ```bash
   npm run build -w @esparex/apps-web
   npm run start -w @esparex/apps-web -p 3000
   ```
2. **Next.js Bundle Analysis (`PERF-005`)**:
   ```bash
   npm run analyze:routes -w @esparex/apps-web
   ```
3. **MongoDB Query Execution Profiling (`PERF-003`)**:
   ```bash
   npm test -w @esparex/backend-api -- src/__tests__/listingQueryProjection.spec.ts
   ```
4. **Lighthouse & Core Web Vitals Audit (`PERF-006`)**:
   ```bash
   npx lighthouse http://localhost:3000 --preset=desktop --output=json --output-path=docs/reports/artifacts/lighthouse-desktop.json
   npx lighthouse http://localhost:3000 --preset=mobile --output=json --output-path=docs/reports/artifacts/lighthouse-mobile.json
   ```
5. **React Scan & Render Trace (`PERF-004`)**:
   Open Chrome DevTools → React DevTools Profiler → Click "Record" during login flow → Export Profile Trace.
