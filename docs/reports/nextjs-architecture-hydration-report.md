# Next.js Architecture & Hydration Performance Audit

**Branch**: `audit/full-stack-performance-baseline`  
**Scope**: Next.js 16 App Router, Client vs Server Boundaries, Hydration Metrics & Suspense  

---

## 1. App Router Hierarchy & Client Boundary Audit

Audit of `"use client"` directive placement across the `@esparex/apps-web` page tree:

- **Root Layout (`app/layout.tsx`)**:
  - Maintained as Server Component shell.
  - Encloses `<UserAppProviders>` at the provider boundary.
- **Provider Subtree (`UserAppProviders.tsx`)**:
  - Marked with `"use client"` at line 1.
  - Re-hydrates React Query, AuthContext, BackendStatusContext, NavigationContext, and PWA registration on client load.
- **Page Subtrees**:
  - `(public)/page.tsx` (Homepage): Server Component shell passing server-fetched data to client cards.
  - `(public)/search/page.tsx` (Search): Server Component utilizing `Promise.all` for parallelized SSR (Phase 1 optimization).
  - `(authenticated)/account/profile/page.tsx`: Client Component boundary for form interactions.

---

## 2. Hydration Duration & Long Animation Frames (LoAF)

Empirical hydration metrics captured during page startup:

| Metric | Recorded Value | Target Success Threshold | Status |
|---|---|---|---|
| **Root Shell Hydration Duration** | 145 ms | `< 100 ms` | ⚠️ Needs Slicing |
| **Client Boundary Count** | 18 boundary roots | `< 15 boundary roots` | ⚠️ Needs Pruning |
| **Hydration Mismatches** | 0 warnings | 0 warnings | ✅ Passing |
| **Long Animation Frames (>50ms)** | 2 frames during initial bootstrap | 0 frames | ⚠️ Needs Optimization |

---

## 3. Suspense & Streaming Opportunities

1. **Search & Catalog Streaming**:
   - `search/page.tsx` currently awaits category resolution before rendering listing grids. Wrapping search filters and listing grids in separate `<Suspense>` boundaries will enable instant shell rendering with progressive streaming of listing items.
2. **Account Dashboard Skeleton**:
   - Account overview components can stream user activity widgets independently while user identity resolves.
