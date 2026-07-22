# Performance Evidence & Artifact Index

**Branch**: `audit/full-stack-performance-baseline`  
**Purpose**: Provide an enterprise-grade evidence mapping with unique Evidence IDs (`PERF-00x`), confidence ratings, raw artifact files, limitations, assumptions, and reproducibility steps.

---

## 1. Governance & Review Sign-Off Status

| Field | Status / Details |
|---|---|
| **Audit Status** | ✅ **Audit Complete** |
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

## 3. Evidence ID Matrix & Raw Artifact Mapping

| Evidence ID | Measured Domain | Primary Finding | Finding Classification | Confidence | Raw Artifact Location |
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

## 4. Engineering Assumptions for Projections (`PERF-008`)

The projected latency reduction (~180ms – 220ms) for parallelizing post-auth widget fetches assumes:
1. **HTTP/2 or HTTP/3 Protocol**: Multiplexed connection support without head-of-line blocking across concurrent requests.
2. **Server-Side Independence**: Backend endpoints (`/listings/saved` and `/notifications`) execute independently without shared locks or inter-request data dependencies.
3. **Concurrent Backend Capacity**: Database and Redis connection pools can serve 2-3 simultaneous user queries without connection starvation.
4. **Client Connection Scheduling**: Browser thread scheduler dispatches parallel `fetch` calls immediately upon session hint verification.

---

## 5. Audit Limitations

This performance investigation operates under the following explicit engineering boundaries:
1. **Synthetic Lab Profiles**: Benchmarks reflect controlled synthetic lab environments (Lighthouse CLI, Chrome DevTools throttling). Real-user Field Telemetry (RUM) may vary based on regional mobile ISP latencies.
2. **Sampled User Flows**: Profiling focused on core authentication, identity resolution, saved ads, and notifications. Niche admin or rare error-recovery flows were not included in this pass.
3. **Hardware Constraints**: Mobile CPU measurements reflect a simulated 4x slowdown on Apple Silicon host hardware.
4. **Third-Party Service Variance**: External SMS gateway, Firebase FCM push, and CDN network latency may experience transient network jitter outside local application control.

---

## 6. Reproducibility & Regeneration Guide

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
