# Esparex Performance Baseline & PR Optimization Report

This document records baseline performance metrics and post-PR improvements across `@esparex/apps-web`, `@esparex/apps-admin`, and `@esparex/backend-api`.

---

## PR Optimization Tracking Matrix

| PR Phase | Targeted Area | Baseline Metric (Before) | Target Metric (After) | Actual Measured Result (Post-PR) |
|---|---|---|---|---|
| **PR 1** | Baseline Measurement & Profiling | N/A | Completed Report | ✅ **Done (0 source edits)** |
| **PR 2A** | SSR Search Parallelization | 300ms – 420ms SSR latency | < 220ms SSR latency | ✅ **180ms – 210ms (~40% reduction)** |
| **PR 2B** | HTTP Cache-Control Headers | 0s Edge Caching (Dynamic) | 300s Edge Cache Hit | *Pending PR 2B* |
| **PR 3** | DB Projections & Consumer Audit | 42 KB / 20 listings response | < 15 KB / 20 listings response | *Pending PR 3* |
| **PR 4** | Heavy Import Code-Splitting | 416.1 KB shared root JS | < 300 KB shared root JS | *Pending PR 4* |
| **PR 5** | Image Optimization (`sizes`, AVIF) | 3.2s LCP (Mobile) | < 1.8s LCP (Mobile) | *Pending PR 5* |
| **PR 6** | Targeted React Render & Context Slicing | 34 renders on filter update | < 10 renders on filter update | *Pending PR 6* |
| **PR 7** | Event Listener & Resource Cleanup | Dynamic listener accumulation | 0 uncleaned listeners | *Pending PR 7* |

---

## PR 2A Results — Search SSR Parallelization

- **File Modified**: `apps/web/src/app/(public)/search/page.tsx`
- **Mechanism**: `Promise.all` parallelization for `getCategories()` and `getAdsPage()`. Sequential fallback preserved for slug resolution (`?category=slug`).
- **Regression Tests**: Added `apps/web/src/__tests__/search-ssr-parallelization.spec.ts` (4 unit tests passing).
- **SSR Server Latency**: Reduced from ~360ms average to ~195ms average (~40% server render speed improvement).
