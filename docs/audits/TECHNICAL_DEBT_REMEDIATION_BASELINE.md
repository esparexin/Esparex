# Esparex Technical Debt Remediation Baseline & Safety Classification

**Branch:** `refactor/repository-debt-prevention-remediation`  
**Base Commit SHA:** `bf384509f3e8cdf3364b074e7f5b01f05378d12c`  
**Date:** 2026-09-17  
**Governance Scope:** Authoritative Evidence Baseline (Phase 0)  

---

## 1. Safety Classification Taxonomy

Every item evaluated in this remediation is strictly classified into one of the following categories:
- **`KEEP`**: Essential code that provides genuine UI, routing, business logic, or data access. Must remain untouched.
- **`MIGRATE`**: Valid consumers/callers that currently depend on legacy shims, shadow schemas, or transitional imports. Must be updated to point to canonical SSOT paths before legacy paths are deleted.
- **`MERGE`**: Split implementations of the same responsibility that must be combined into a single canonical owner without functional regression or data loss.
- **`DELETE`**: Verified dead, orphan, or redundant code with zero production callers, whose canonical replacement is already in place.
- **`REPLACE`**: Flawed configurations, validators, or schemas that must be substituted with robust, AST-aware, or type-safe equivalents.
- **`INVESTIGATE`**: Code requiring deep runtime or business-rule analysis before taking irreversible deletion or migration actions.

---

## 2. Category Inventory & Detailed Proofs

### A. Dead Service Islands (`core/src/services/service/`)

| File / Component | Classification | Production References | Test-Only References | Dynamic / Runtime Refs | Canonical Replacement | Database Ownership | Contract Ownership | Public API Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `core/src/services/service/ServiceMutationService.ts` | **`DELETE`** | **0** | `core/src/__tests__/services/ServiceMutationService.spec.ts` | **0** | `core/src/domains/listings/application/mutations/AdMutationService.ts` | Listings / MongoDB User DB | `@esparex/contracts` Ad payloads | None (never exported by `core/src/index.ts` or package.json) |
| `core/src/services/service/ServiceMutationRepository.ts` | **`DELETE`** | **0** | `core/src/__tests__/services/ServiceMutationService.spec.ts` | **0** | `MongoListingRepositoryAdapter` | Listings / MongoDB User DB | N/A | None |
| `core/src/__tests__/services/ServiceMutationService.spec.ts` | **`DELETE`** | N/A | Tests dead island only | N/A | `core/src/__tests__/services/AdMutationService.spec.ts` | N/A | N/A | None |

**Proof Summary:**
- `createServiceMutation` and `updateServiceMutation` are only invoked in `ServiceMutationService.spec.ts`.
- `findServiceForUpdate` in `ServiceMutationRepository.ts` is only called by `ServiceMutationService.ts` and mocked in its test.
- The entire feature set for service listing creation and editing has run through `AdMutationService` and `AdOrchestrator` since the rollout of the Unified Ad Engine.
- Removal of these files eliminates 493 lines of dead code and reduces `compatibility-marker-baseline.json` by 2 violations.

---

### B. Next.js Routing & Redirect Stubs (`apps/web/src/app/`)

| File / Component | Classification | Canonical Destination | Existing Route Mechanism | Status / Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `apps/web/src/app/(private)/chat/page.tsx` | **`DELETE`** | `/account/messages` | Calls `redirect(buildChatInboxRoute(view))` | Pure redirect stub. Move to `next.config.mjs` declarative permanent redirect. |
| `apps/web/src/app/(private)/chat/[conversationId]/page.tsx` | **`DELETE`** | `/account/messages/:conversationId` | Calls `redirect(buildChatConversationRoute(...))` | Pure redirect stub. Move to `next.config.mjs` declarative permanent redirect. |
| `apps/web/src/app/(private)/account/page.tsx` | **`DELETE`** | `/account/profile` | Calls `redirect("/account/profile")` | Pure redirect stub (7 lines). Move to `next.config.mjs` declarative redirect. |
| `apps/web/src/app/(private)/account/ads/page.tsx` | **`KEEP`** | `/account/ads` | Renders `<AccountPageShell tab="mylistings" />` | Genuine UI shell tab with parameter normalization. Must be preserved. |
| `apps/web/src/app/(private)/account/services/page.tsx` | **`KEEP`** | `/account/services` | Renders `<AccountPageShell tab="mylistings" />` | Genuine UI shell tab with parameter normalization. Must be preserved. |
| `apps/web/src/app/(private)/account/spare-parts/page.tsx` | **`KEEP`** | `/account/spare-parts` | Renders `<AccountPageShell tab="mylistings" />` | Genuine UI shell tab with parameter normalization. Must be preserved. |
| `apps/web/src/app/(private)/account/alerts/page.tsx` | **`KEEP`** | `/account/alerts` | Renders `<AccountPageShell tab="smartalerts" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(private)/account/business/page.tsx` | **`KEEP`** | `/account/business` | Renders `<AccountPageShell tab="business" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(private)/account/plans/page.tsx` | **`KEEP`** | `/account/plans` | Renders `<AccountPageShell tab="buyplans" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(private)/account/profile/page.tsx` | **`KEEP`** | `/account/profile` | Renders `<AccountPageShell tab="personal" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(private)/account/purchases/page.tsx` | **`KEEP`** | `/account/purchases` | Renders `<AccountPageShell tab="purchases" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(private)/account/saved/page.tsx` | **`KEEP`** | `/account/saved` | Renders `<AccountPageShell tab="saved" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(private)/account/settings/page.tsx` | **`KEEP`** | `/account/settings` | Renders `<AccountPageShell tab="settings" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(private)/account/wallet/page.tsx` | **`KEEP`** | `/account/wallet` | Renders `<AccountPageShell tab="plans" />` | Genuine UI shell tab. Must be preserved. |
| `apps/web/src/app/(public)/search/page.tsx` | **`KEEP`** | `/search` | Renders browse feed, filters, and skeleton fallback | Core marketplace search UI. Must be preserved. |
| `apps/admin/src/app/page.tsx` | **`KEEP`** | `/dashboard` | Root entry point for admin portal | Preserved as standard Next.js entrypoint. |

**Ping-Pong Elimination Proof:**
- Current flow: `user navigates to /messages` $\to$ `next.config.mjs redirects to /chat` $\to$ `chat/page.tsx redirects to /account/messages` (2 HTTP roundtrips).
- Target flow: `next.config.mjs` redirects `/messages` $\to$ `/account/messages` directly (1 HTTP roundtrip, 0 server-side component hops).

---

### C. Validation Schemas & Contract Ergonomics (`packages/contracts` vs `apps/web/src/schemas/`)

| Schema File | Classification | Current Problem | Solution | Canonical SSOT |
| :--- | :--- | :--- | :--- | :--- |
| `packages/contracts/.../adPayload.schema.ts` | **`REPLACE`** | Uses `z.preprocess` on ObjectId, inferring `unknown` type in TypeScript | Change to `z.union([objectId, z.literal("")]).optional()` | `@esparex/contracts` |
| `apps/web/src/schemas/serviceListingPayload.schema.ts` | **`DELETE`** | Shadow schema created solely because of contract typing defect | Migrate consumers to `@esparex/contracts` `BaseServicePayloadSchema` | `@esparex/contracts` |
| `apps/web/src/schemas/adPayload.schema.ts` | **`MERGE`** | Overrides contract schemas with duplicate form types | Align with updated contract schema; eliminate divergence | `@esparex/contracts` |
| `apps/web/src/schemas/postSparePartForm.schema.ts` | **`INVESTIGATE`** | Local form schema for spare parts wizard | Verify field constraints against `BaseAdPayloadSchema` before migration | `@esparex/contracts` |

**Proof Summary:**
- Developer comments in `serviceListingPayload.schema.ts` explicitly state: *"ObjectIdSchema uses z.preprocess which TypeScript infers as unknown output, breaking react-hook-form Resolver typing."*
- Fixing the type at `@esparex/contracts` restores direct compilation for `react-hook-form` and eliminates the need for any local shadow schema.

---

### D. Core Service Shims (`core/src/services/`)

| Legacy Shim Path | Classification | Production Callers to Migrate | Canonical Domain Destination |
| :--- | :--- | :--- | :--- |
| `core/src/services/AdMutationService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../editListing.controller.ts`, `lifecycle.controller.ts` | `core/src/domains/listings/application/mutations/AdMutationService.ts` |
| `core/src/services/AdOrchestrator.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../createListing.controller.ts` | `core/src/domains/listings/application/ad/AdOrchestrator.ts` |
| `core/src/services/AdEngagementService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../engagement.controller.ts` | `core/src/domains/listings/application/ad/AdEngagementService.ts` |
| `core/src/services/ContactRevealService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../engagement.controller.ts` | `core/src/domains/communications/application/services/ContactRevealService.ts` |
| `core/src/services/ad/AdAggregationService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../getListings.controller.ts`, `stats.controller.ts` | `core/src/domains/listings/application/ad/ad/AdAggregationService.ts` |
| `core/src/services/ad/AdDetailService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../getListings.controller.ts` | `core/src/domains/listings/application/ad/ad/AdDetailService.ts` |
| `core/src/services/ad/AdMetricsService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../stats.controller.ts` | `core/src/domains/listings/application/ad/ad/AdMetricsService.ts` |
| `core/src/services/FeedService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../getListings.controller.ts` | `core/src/domains/discovery/application/services/FeedService.ts` |
| `core/src/services/TrendingService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../getListings.controller.ts` | `core/src/domains/discovery/application/services/TrendingService.ts` |
| `core/src/services/lifecycle/StatusMutationService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../lifecycle.controller.ts` | `core/src/domains/listings/application/lifecycle/StatusMutationService.ts` |
| `core/src/services/lifecycle/ListingExpiryService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../stats.controller.ts` | `core/src/domains/listings/application/lifecycle/ListingExpiryService.ts` |
| `core/src/services/AdminSessionService.ts` | **`MIGRATE` $\to$ `DELETE`** | `backend/api/.../adminSessionController.ts`, `adminAuth.ts` | `core/src/domains/identity/application/sessions/AdminSessionService.ts` |

**Proof Summary:**
- Every file above is a 1-to-2 line file containing solely `export * from '../domains/...'`.
- Migrating the 12 callers in `backend/api/src/controllers/listing/*` to import directly from `@esparex/core/domains/*` allows deleting these shims without modifying runtime business logic.

---

### E. Ad Engagement Persistence Consolidation

| Persistence Entity | Classification | Current Role | Target Role | Database Connection |
| :--- | :--- | :--- | :--- | :--- |
| `core/src/models/AdMetrics.ts` | **`KEEP`** | Buffered tracking of views, favorites, impressions | Canonical engagement metrics SSOT | User DB (`getUserConnection()`) |
| `core/src/models/AdAnalytics.ts` | **`MERGE`** | Unbuffered tracking of views, favorites, and score | Replaced by `AdMetrics` aggregation | Admin DB (`getAdminConnection()`) |
| `core/src/models/Ad.ts` (`views` field) | **`DELETE`** | Deprecated embedded views subdocument | Removed | User DB (`getUserConnection()`) |

**Read/Write Path Analysis:**
- `AdEngagementService` currently triggers both `ViewBufferingService.recordView` (User DB) and `recordAdAnalyticsEvent` (Admin DB).
- `stats.controller.ts` reads `AdMetrics` for seller counts.
- `TrendingService` reads `AdAnalytics` for score calculation.
- Consolidation Strategy: Point `TrendingService` scoring query to `AdMetrics` (`getUserConnection()`), unify write buffering through `ViewBufferingService`, and safely sunset `AdAnalytics` without data loss.

---

### F. UI Micro-Wrappers (`apps/admin/src/components/business/`)

| Component | Classification | Lines | Role | Target Consolidation |
| :--- | :--- | :--- | :--- | :--- |
| `BusinessReasonModal.tsx` | **`KEEP`** | 150 | Canonical base dialog for reason-prompted administrative actions | Retained as canonical reusable primitive |
| `BusinessRejectModal.tsx` | **`MERGE`** | 35 | 1-line wrapper passing fixed props to `BusinessReasonModal` | Inline or consolidate into unified `BusinessReasonModal` call |
| `BusinessSuspendModal.tsx` | **`MERGE`** | 33 | 1-line wrapper passing fixed props to `BusinessReasonModal` | Inline or consolidate into unified `BusinessReasonModal` call |
| `BusinessAdminModals.tsx` | **`MIGRATE`** | 103 | Orchestrator passing 15 props through to modals | Simplify prop interface and directly invoke `BusinessReasonModal` |

---

### G. Detection & Prevention Tooling

| Tool / Script | Classification | Current Flaw | Target Repair |
| :--- | :--- | :--- | :--- |
| `knip.json` | **`REPLACE`** | `exports: off`, `types: off`, `duplicates: off`; services marked as entry points | Remove wildcard service entry points; enable export/type/duplicate checks with tracked baseline |
| `scripts/git/esparex/duplicate-validator.js` | **`REPLACE`** | Substring `content.includes(fileName)` matched comments and tests | Parse AST imports; exclude test files and reports from keeping production files alive |
| `scripts/git/esparex/auditor-validator.js` | **`REPLACE`** | Reads committed static `repository-audit.json` without running scanner | Execute live in-memory verification against working tree |
| `scripts/guard-pr-quality.js` | **`REPLACE`** | `baseLines + 5` ceiling caused micro-file splintering | Remove rigid line ceiling; adopt complexity and cohesion checks |
| `scripts/enforce-validation-ssot.js` | **`REPLACE`** | Only checked 4 hardcoded files | Glob all `apps/*/src/schemas/**/*.ts` files dynamically |
| `scripts/git/esparex/route-validator.js` | **`MIGRATE`** | Did not detect redirect-only page components | Reject `page.tsx` files whose AST is a pure `redirect()` |

---

## 3. Implementation Pre-Conditions
- All 10 phases will be executed sequentially on `refactor/repository-debt-prevention-remediation`.
- Every phase commit must pass:
  1. `npm run repo:gate`
  2. `npm run type-check`
  3. `npm test`
- No breaking API changes or UI redesigns are introduced.
