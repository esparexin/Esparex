# Performance Audit Report — July 2026

## Scope
- Database indexes & MongoDB query performance
- N+1 queries & API response times
- Frontend (React) re-renders, bundle size, code splitting, image optimization
- Redis/BullMQ performance & caching strategy

---

## P0 — Critical (immediate action required)

### P0.1 — N+1 Bulk Admin Operations
**Files:** `backend/api/src/controllers/catalogRequestController.ts:308-378`, `core/src/services/adminBusiness/mutations.ts:67-93`, `core/src/services/adminListings/bulk.ts:11-74`

Three functions iterate `requestIds` with `for...of` making individual DB transactions per ID. An admin approving 500 listings triggers 500 sequential MongoDB queries.

**Fix:** Replace with `bulkWrite({ ordered: false })` or `updateMany()`.

### P0.2 — Sequential Status Mutations
**File:** `core/src/services/lifecycle/StatusMutationService.ts:390-396`

`mutateStatuses()` processes each request sequentially with full lifecycle validation. No concurrency control.

**Fix:** Add `Promise.allSettled` with concurrency limiter (e.g., `p-limit`).

### P0.3 — Missing BullMQ Queue Compound Indexes
**File:** `core/src/models/Boost.ts`

`FeedQueryService.ts:86` queries `Boost.find({ entityType: 'ad', isActive: true, startsAt: { $lte: now }, endsAt: { $gt: now } }).sort({ createdAt: -1 })` — no compound index covers this.

**Fix:** Add `{ entityType: 1, isActive: 1, startsAt: 1, endsAt: 1, createdAt: -1 }`.

### P0.4 — Unfiltered SmartAlert & AdminLog Queries
- `core/src/services/SmartAlertQueryService.ts:9` — `SmartAlert.find({})` returns all documents.
- `core/src/adapters/outbound/database/admin/MongoAdminDashboardRepositoryAdapter.ts:94` — `AdminLog.find()` without filter.

**Fix:** Add status/isActive filters and pagination.

### P0.5 — SavedSearch Sequential Notification Dispatch
**File:** `core/src/services/SavedSearchService.ts:148-188`

Per-user sequential DB round-trips + dispatches for every matching saved search.

**Fix:** Batch intents first, then dispatch via `NotificationDispatcher.bulkDispatch()`.

### P0.6 — Admin App Zero Code Splitting
**App:** `apps/admin`

Zero `dynamic()` or `React.lazy()` calls. Every page component loads eagerly.

**Fix:** Wrap all route pages with `next/dynamic()`. Needs ~10-15 component wrappers.

### P0.7 — 15 Images with `unoptimized`
**App:** `apps/web`

15 images bypass Next.js optimization via `unoptimized` flag. Many are S3-served product images.

**Fix:** Remove `unoptimized`, ensure `remotePatterns` covers all domains.

---

## P1 — High Priority

### P1.1 — Missing AdAnalytics Compound Sort Index
**File:** `core/src/models/AdAnalytics.ts`

`TrendingService.ts:201` sorts `{ score: -1, updatedAt: -1 }` — only partially covered by single-field `{ score: -1 }`.

**Fix:** Add `{ score: -1, updatedAt: -1 }` compound index.

### P1.2 — FraudSignal Missing Compound Indexes
**File:** `core/src/models/FraudSignal.ts`

Queries filter on `{ ip, signalType, createdAt }` and `{ deviceFingerprint, signalType, createdAt }` — only individual field indexes exist.

**Fix:** Add `{ ip: 1, signalType: 1, createdAt: -1 }` and `{ deviceFingerprint: 1, signalType: 1, createdAt: -1 }`.

### P1.3 — No In-Memory Cache Layer
All caching goes through Redis. No L1 cache for hot keys (categories, brands, location defaults).

**Fix:** Add `lru-cache` (or similar) for frequently accessed, rarely changing data.

### P1.4 — Regex Queries Without Anchors
Multiple services use `$regex: safeSearch` without `^` anchor — cannot use B-tree indexes.

**Fix:** Add text indexes or anchor patterns where possible.

### P1.5 — Home Feed Warmup Too Aggressive
Runs every 60 seconds via scheduler. Matches `HOME_FEED` TTL of 300s.

**Fix:** Reduce to every 5 minutes.

### P1.6 — ViewBufferingService Uses `KEYS *`
**File:** `core/src/services/ViewBufferingService.ts:127`

`redis.keys('views:buffer:*')` blocks Redis in production.

**Fix:** Replace with `SCAN`-based iteration.

### P1.7 — No Bundle Analyzer Tooling
Neither `apps/web` nor `apps/admin` has `@next/bundle-analyzer` configured.

**Fix:** Add bundle analysis to CI and create `analyze` script.

### P1.8 — Firebase Bundle Cost
Firebase (12.7.0) is ~80KB+ gzipped, used only for web push notifications.

**Fix:** Evaluate lighter push solution or tree-shake to `firebase/messaging` only.

### P1.9 — 40+ Packages Ignored in Knip
`knip.json` ignores 40+ packages — likely unused dependencies inflating installs.

**Fix:** Audit and remove unused dependencies.

### P1.10 — Unnecessary `"use client"` Markers
~50+ components (Footer, BackButton, Separator, Label, etc.) are marked `"use client"` unnecessarily. Admin app has 58% client components.

**Fix:** Audit each `"use client"` declaration; convert pure presentational components to server components.

---

## P2 — Medium Priority

### P2.1 — serializeDoc Recursive Overhead
**File:** `core/src/utils/serialize.ts`

Called on every API response. Recursively walks entire object tree converting ObjectIds, calling `toObject()`, stripping `__v`. Causes O(n*depth) overhead on large paginated results.

**Fix:** Cache serialization for frequently-returned objects; short-circuit for plain objects.

### P2.2 — Admin App No React.memo
Zero `React.memo` usage in admin app. `DataTable`, sidebar, navigation, list rows all re-render without memoization.

**Fix:** Memoize `AdminSidebar`, `AdminHeader`, `DataTableBody`, page-level components.

### P2.3 — Catalog Cache Invalidated Too Broadly
Any catalog change clears `catalog:*` — affects all cached catalog data.

**Fix:** Implement namespace-specific invalidation.

### P2.4 — bull-board UI Not Wired
Dependencies declared but no route mounting. Queue observability limited to `/health` and `/system/metrics-summary`.

**Fix:** Mount bull-board at `/admin/queues` with auth protection.

### P2.5 — Serialization in Notifications
ScheduledNotification job processing dispatches notifications with individual `Promise.all` calls (batch of 500). Fine for moderate scale but risks connection pool exhaustion at peak.

**Fix:** Monitor and consider batching via `bulkDispatch` with chunked pipeline.

### P2.6 — Missing Suspense Boundaries
Several `dynamic()` imports lack outer `<Suspense>` fallbacks or use `null`/text fallbacks.

**Fix:** Add meaningful skeleton components as Suspense fallbacks.

### P2.7 — Missing blurDataURL on Product Images
No `placeholder="blur"` or `blurDataURL` on any images. Above-the-fold images load with empty space.

**Fix:** Generate and include blurDataURL for critical images.

### P2.8 — schedulerJob Concurrency Too Low
Scheduler worker has concurrency 1. With 15 cron jobs, some running every minute, jobs accumulate.

**Fix:** Increase concurrency to 3-5.

---

## Summary Statistics

| Metric | Count | Severity |
|--------|-------|----------|
| N+1 loop patterns | 6+ | P0 |
| Missing DB compound indexes | 4+ | P0-P1 |
| Unoptimized images | 15 | P0 |
| Zero code splitting (admin) | All pages | P0 |
| Zero React.memo (admin) | All components | P2 |
| KEYS * usage | 1 | P1 |
| Unnecessary "use client" | ~50+ | P1 |
| Unused dependencies (knip) | 40+ | P1 |
| Missing bundle analyzer | 2 apps | P1 |
| Redis L1 cache | 0 | P1 |
