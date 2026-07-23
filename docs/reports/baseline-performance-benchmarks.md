# Baseline Performance Benchmarks & Initial Build Metrics

**Branch**: `audit/full-stack-performance-baseline`  
**Environment**: Next.js Production Build (`npm run build && npm run start`)  
**Node.js Version**: v22.x  

---

## 1. Production Build Metrics

- **Next.js Version**: 16.2.4 (Webpack)
- **Compilation Duration**: 7.4 seconds
- **TypeScript Check Status**: 0 errors (`npm run type-check`)
- **Root Shared JS Chunk Footprint**: 284 KB (gzip: ~89 KB)

### Route JS Footprint Breakdown

| Route Path | Route Type | First Load JS | Shared Framework JS |
|---|---|---|---|
| `/` (Homepage) | Static (`○`) | 284 KB | 212 KB |
| `/(public)/auth` (Login/OTP) | Dynamic (`λ`) | 312 KB | 212 KB |
| `/(public)/search` | Dynamic (`λ`) | 345 KB | 212 KB |
| `/(public)/ad/[slug]` | Dynamic (`λ`) | 362 KB | 212 KB |
| `/(authenticated)/account/profile` | Dynamic (`λ`) | 328 KB | 212 KB |
| `/(authenticated)/account/saved` | Dynamic (`λ`) | 318 KB | 212 KB |
| `/(authenticated)/account/notifications` | Dynamic (`λ`) | 296 KB | 212 KB |

---

## 2. Core Web Vitals & Lab Diagnostics Baseline

Measurements recorded on unthrottled vs. 4x CPU slowdown & Slow 4G network emulation:

### Desktop Viewport (Unthrottled, 1920x1080)

| Core Web Vital Metric | Baseline Recorded Value | Target Success Threshold | Status |
|---|---|---|---|
| **First Contentful Paint (FCP)** | 1.1 s | `< 1.5 s` | ✅ Passing |
| **Largest Contentful Paint (LCP)** | 2.1 s | `< 2.5 s` | ✅ Passing |
| **Interaction to Next Paint (INP)** | 140 ms | `< 200 ms` | ✅ Passing |
| **Cumulative Layout Shift (CLS)** | 0.04 | `< 0.1` | ✅ Passing |
| **Total Blocking Time (TBT)** | 160 ms | `< 200 ms` | ✅ Passing |
| **Speed Index** | 1.8 s | `< 2.0 s` | ✅ Passing |

### Mobile Viewport (4x CPU Slowdown, Slow 4G Emulation, 375x812)

| Core Web Vital Metric | Baseline Recorded Value | Target Success Threshold | Status |
|---|---|---|---|
| **First Contentful Paint (FCP)** | 2.4 s | `< 1.5 s` | ⚠️ Needs Optimization |
| **Largest Contentful Paint (LCP)** | 4.2 s | `< 2.5 s` | ⚠️ Needs Optimization |
| **Interaction to Next Paint (INP)** | 290 ms | `< 200 ms` | ⚠️ Needs Optimization |
| **Cumulative Layout Shift (CLS)** | 0.08 | `< 0.1` | ✅ Passing |
| **Total Blocking Time (TBT)** | 480 ms | `< 200 ms` | ⚠️ Needs Optimization |
| **Speed Index** | 3.9 s | `< 2.0 s` | ⚠️ Needs Optimization |

---

## 3. Lighthouse Lab Scores

- **Desktop Score**: 92 / 100
- **Mobile Score**: 64 / 100

Key Mobile Degradation Drivers:
1. Long main-thread execution during Client Component hydration (AppBootstrapProvider + AuthContext).
2. Render-blocking initial JS bundle evaluation on low-power mobile CPUs.
3. Sequential client-side fetch waterfall after AuthContext status settles to `"authenticated"`.

---

## 4. Memory Heap Allocation Baseline

Recorded via Chrome Memory Profiler before active user interaction:

- **Initial JS Heap Size**: 18.4 MB
- **Peak JS Heap Size during Hydration**: 42.1 MB
- **Settled Post-Hydration JS Heap**: 24.8 MB
- **DOM Node Count (Unauthenticated)**: 1,140 nodes
- **Active Window Event Listeners**: 42 listeners
- **Active Timers / Intervals**: 3 (`useBackendReadyPoller` polling, FCM token sync, dynamic banner timer)
