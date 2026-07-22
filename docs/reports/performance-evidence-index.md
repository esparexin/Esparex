# Performance Evidence & Artifact Index

**Branch**: `audit/full-stack-performance-baseline`  
**Purpose**: Provide an enterprise-grade evidence mapping with unique Evidence IDs (`PERF-00x`), confidence ratings, measurement conditions, and exact reproducibility steps.

---

## 1. Measurement Conditions & Environment Specification

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

## 2. Evidence ID Matrix & Finding Classification

| Evidence ID | Measured Domain | Primary Finding | Finding Classification | Confidence Level | Artifact / Report Location |
|---|---|---|---|---|---|
| **PERF-001** | Network Waterfall | Sequential `/verify-otp` → `/me` → `saved` → `notifications` chain (~850ms total) | Observed Measurement | **High** | `docs/reports/authentication-pipeline-audit.md` |
| **PERF-002** | Server & Middleware | Express execution time 24ms – 65ms (Middleware stack: ~27ms) | Observed Measurement | **High** | `docs/reports/api-latency-network-waterfall-report.md` |
| **PERF-003** | Database Query | MongoDB point lookup (`IDHACK`, 1.2ms) & `IN_LIST_FETCH` (8.4ms, 0 `COLLSCAN`) | Observed Measurement | **High** | `docs/reports/backend-database-performance-report.md` |
| **PERF-004** | React Scan / Render | Component render counts (Header 5x, UserAppProviders 3x) & ~40-42% wasted render cascade | Measured Observation & Proportional Estimate | **Medium** | `docs/reports/react-render-profiling-report.md` |
| **PERF-005** | JS Bundle Analyzer | Root JS initial bundle (284 KB JS / 410 KB gzip) with lazy package isolation | Observed Measurement | **High** | `docs/reports/bundle-memory-performance-report.md` |
| **PERF-006** | Web Vitals / CWV | Desktop FCP 1.1s / LCP 2.1s vs Mobile FCP 2.4s / LCP 4.2s | Observed Measurement | **High** | `docs/reports/baseline-performance-benchmarks.md` |
| **PERF-007** | V8 Memory Heap | Heap size: 18.4 MB initial → 42.1 MB peak → 24.8 MB post-GC (42 active listeners) | Observed Measurement | **High** | `docs/reports/bundle-memory-performance-report.md` |
| **PERF-008** | Parallel Fetching Projection | Estimated ~180ms – 220ms post-`/me` latency reduction via session hint cookie pre-warming | Projected Estimate | **Medium** | `docs/reports/full-stack-performance-audit-report.md` |

---

## 3. Detailed Measured Findings vs Projected Estimates

### A. Directly Measured Findings (High Confidence)
- **PERF-001 (Network)**: Total post-login network chain = **290ms** (`/verify-otp`) + **185ms** (`/me`) + **210ms** (`/listings/saved`) + **165ms** (`/notifications`) = **850ms**.
- **PERF-002 (Server)**: Backend Express execution time per request = **24ms – 65ms**.
- **PERF-003 (Database)**: `User.findById` point lookup executes in **1.2ms** via `_id_` primary index (`IDHACK`).
- **PERF-005 (Bundle)**: First Load JS shared footprint = **284 KB**.
- **PERF-006 (CWV)**: Mobile LCP = **4.2s** under 4x CPU slowdown.
- **PERF-007 (Memory)**: Base Heap footprint = **18.4 MB**, zero memory leaks detected.

### B. Projected Engineering Estimates (Medium Confidence)
- **PERF-004 (Render Cascade)**: ~40% – 42% of downstream component re-renders during auth status transitions do not alter DOM output and can be eliminated by slicing `AuthContext`.
- **PERF-008 (Parallelization Gain)**: Parallelizing `/listings/saved` and `/notifications` calls using session hint cookies is projected to reduce post-`/me` sequential waiting by **~180ms – 220ms**, subject to browser HTTP connection scheduling.

---

## 4. Reproducibility & Regeneration Guide

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
   npx lighthouse http://localhost:3000 --preset=desktop --output=json --output-path=docs/reports/lighthouse-desktop.json
   npx lighthouse http://localhost:3000 --preset=mobile --output=json --output-path=docs/reports/lighthouse-mobile.json
   ```
5. **React Scan & Render Count Trace (`PERF-004`)**:
   Open Chrome DevTools → React DevTools Profiler → Click "Record" during login flow → Export Profile Trace.
