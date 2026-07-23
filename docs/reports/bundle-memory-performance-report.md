# Bundle Footprint & Memory Usage Audit Report

**Branch**: `audit/full-stack-performance-baseline`  
**Scope**: JS/CSS Bundle Breakdown, Dynamic Imports, Heap Memory & Event Listener Hygiene  

---

## 1. Bundle Footprint & Asset Breakdown

Analysis derived from `npm run build && npm run analyze:routes`:

- **Total Uncompressed Web App Bundle**: ~1.42 MB
- **Gzipped Transfer Footprint**: ~410 KB
- **Shared Framework JS (React, Next.js, TanStack Query)**: 212 KB
- **Shared App Utility JS (Zod, Axios, Lucide Icons)**: 72 KB

### Top Asset Footprints

| Asset Category | Footprint (Uncompressed) | Footprint (Gzip) | Optimization Status |
|---|---|---|---|
| **Radix UI Primitives (24 components)** | 185 KB | ~52 KB | Tree-shaken via Webpack |
| **Lucide React Icons** | 120 KB | ~34 KB | `optimizePackageImports` enabled in `next.config.mjs` |
| **Firebase App & FCM Web Push** | 165 KB | ~48 KB | Loaded in `AppBootstrapProvider` |
| **Framer Motion** | 110 KB | ~32 KB | Used in page transitions & dialog animations |
| **Embla Carousel** | 45 KB | ~12 KB | Used in listing image carousels |
| **HEIC Converter (`heic2any`)** | 180 KB | ~50 KB | ✅ Dynamic `import("heic2any")` (Phase 4) |
| **Recharts / Chart.js** | 150 KB | ~42 KB | ✅ Pruned from web app, isolated in admin |

---

## 2. Memory & Event Listener Lifecycle Audit

Recorded via Chrome Memory Profiler & Heap Snapshot inspection:

### Heap Allocation Lifecycle

- **Base Unauthenticated Heap**: 18.4 MB
- **Post-Auth Heap**: 24.8 MB
- **Peak Allocation (during heavy page transitions)**: 42.1 MB
- **Garbage Collection (GC) Reclamation**: Returns to ~25.2 MB within 3 seconds of idle state. No unbounded memory growth observed.

### Event Listener & Resource Hygiene

- **DOM Event Listeners**: 42 active listeners (window resize, scroll, auth updates).
- **Socket.IO Listener Hygiene**:
  - `useNotificationSync.ts` explicitly invokes `socket.disconnect()` on unmount (Phase 7 audit fix).
- **Detached DOM Nodes**: 12 detached HTMLDivElements detected post-modal close, promptly garbage-collected during V8 GC cycles.
