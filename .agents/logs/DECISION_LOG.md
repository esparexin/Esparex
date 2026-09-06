# Decision Log

Append-only. Every phase's evidence output is logged here, newest at the bottom. Do not edit or delete past entries — corrections get a new entry, not a rewrite.

Format per entry:

## [2026-07-13T19:17:57+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-13T20:29:16+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-13T22:23:55+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-13T22:42:00+05:30] EXECUTION-VERIFIED
- Task: PR-E — Complete the Listings Bounded Context (Repository-Wide Safe Migration)
- Scope: Migrated services (`ReportService`, `PlanService`, `CatalogSparePartService`, `CatalogReferenceService`, `CatalogBrandModelService`) from direct `Ad` model usage to `ListingRepositoryPort`. Added `getListingRepository()` singleton bridge in composition root.
- Verification Evidence:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm test -w @esparex/core`: PASS (39 test suites, 248 tests)
  - `npm run guard:dependencies`: PASS (0 violations)
  - `npm run guard:circular`: PASS (0 circular dependencies)
  - `npm run architecture`: PASS (Score: 100/100, 0 violations)

## [2026-07-14T11:19:35+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-14T13:06:32+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-14T13:06:32+05:30] EXECUTION-VERIFIED
- Task: Phase 8 Repository Cleanup & LocationQueryService Decoupling
- Scope: De-tracked `.eslintcache/web` and `.gradle` build caches, updated `.gitignore`, cleaned local merged branches (`fix/issue-99-post-ad-stabilization`, `refactor/ddd-core-consolidation`), and decoupled `LocationQueryService` from `Ad` model using `getListingRepository().count()`.
- Verification Evidence:
  - `git log --oneline --decorate --graph -10`: PASS (`70a93bff` tracking remote `origin/feat/issue-architecture-platform-foundation`)
  - `git branch -vv`: PASS (`[origin/feat/issue-architecture-platform-foundation]` up to date)
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm test -w @esparex/core`: PASS (39 test suites, 246 tests)
  - `npm test -w backend/api`: PASS (63 test suites, 317 tests)
  - `graphify update .`: PASS (10,836 nodes, 25,738 edges synchronized)

## [2026-07-14T20:41:05+05:30] EXECUTION-VERIFIED
- Task: Phase D3.5 — ScreenSize Repository Migration
- Scope: Created `ScreenSizeRepositoryPort` (with `ScreenSizeBulkDeleteCriteria` criteria object), `MongoScreenSizeRepositoryAdapter`; updated catalog barrel, `CatalogOrchestrator`, and `composition/catalog.ts`. Replaced raw `ScreenSize.updateMany().session()` in `cascadeCategoryDelete` with `this.screenSizeRepository.softDeleteByCriteria(...)`. No ScreenSize Mongoose import remains in Orchestrator.
- Verification Evidence:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm test -w @esparex/core`: PASS (39 test suites, 246 tests)
  - `npm run guard:dependencies`: PASS (0 violations, 2135 modules, 7377 dependencies)
  - `npm run guard:circular`: PASS (0 circular dependencies)
  - `npm run governance:guards`: PASS (all guards ✅)
  - `grep models/ScreenSize CatalogOrchestrator.ts`: 0 matches ✅
  - `grep ScreenSize.updateMany CatalogOrchestrator.ts`: 0 matches ✅
  - Committed: `fed6e5f2` — `refactor(catalog): migrate ScreenSize operations to repository (D3.5)`

## [2026-07-14T21:14:00+05:30] EXECUTION-VERIFIED
- Task: Phase D3.7 (Application-layer cleanup) & D4 (Cache abstraction)
- Scope:
  - Removed duplicate transactional helper methods `findCategoryByIdWithSession` and `softDeleteCategoryById` from `CatalogCategoryService.ts`.
  - Replaced redundant `mongoose.Types.ObjectId` cascade accumulators in `CatalogOrchestrator.ts` with plain `string[]` arrays.
  - Decoupled `CatalogOrchestrator.ts` from direct Redis `clearCachePattern` imports, delegating entirely to `this.cacheService` (`CatalogCachePort`).
  - Completely removed `mongoose` dependency from `CatalogOrchestrator.ts`.
- Verification Evidence:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm test -w @esparex/core`: PASS (39 test suites, 246 tests)
  - `npm test -w backend/api`: PASS (63 test suites, 317 tests)
  - `npm run guard:dependencies`: PASS (0 violations)
  - `npm run guard:circular`: PASS (0 circular dependencies)
  - `npm run governance:guards`: PASS (all 10 guards ✅)
  - Repository-wide search check: 0 model imports, 0 session leakage, 0 Redis leakage in Catalog application layer.
  - Committed: `a55cb868` — `refactor(catalog): application-layer cleanup & cache abstraction (D3.7 & D4)`


## [2026-07-15T07:38:27+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-15T09:31:10+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`
- Context: Master Operating Prompt registration + /graphify (fast-path, graph.json exists, 13037 nodes / 28637 edges) + /repository_intelligence RIS v3.0 execution

## [2026-07-15T08:50:00+05:30] Listings Bounded Context Migration Completion (Phase C, D, E)
- Completed cache decoupling (Phase C):
  - Created `ListingsCachePort` and `RedisListingsCacheAdapter`.
  - Registered in composition listings root.
  - Decoupled all services and event listeners from direct redisCache helpers.
- Completed controller cleanup (Phase D):
  - Refactored `getAndVerifyOwnedListing` to use `ListingRepositoryPort` instead of Mongoose `AdModel`.
  - Cleaned up stats & lifecycle controllers to consume standard `listing.id` instead of `_id`.
  - Updated mock structures with transitional comments.
- Completed final architecture audit & cleanups (Phase E):
  - Refactored `AdRepostService.ts` and `AdPromotionService.ts` to remove mongoose and MongoDB transactions, routing through UOW instead.
- Validation Evidence:
  - `npx tsc --noEmit`: PASS
  - `npm test -w @esparex/core`: PASS
  - `npm test -w backend/api`: PASS
  - `npm run guard:dependencies`: PASS
  - `npm run guard:circular`: PASS
  - `npm run governance:guards`: PASS
  - `graphify update .`: PASS

## [2026-07-15T11:38:00+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`
- Context: System behavior audit & architectural investigation for Dynamic Brand / Model Creation Flow (`/graphify` & `/repository_intelligence` invoked).

## [2026-07-15T11:45:00+05:30] AUDIT-COMPLETED
- Task: System Behavior Audit for Dynamic Brand and Model Creation Flow (Post-Ad Wizard & Catalog Request API)
- Scope: Architectural & State Management investigation across `BrandSection`, `ModelSection`, `BrandSearchSelect`, `ModelSearchSelect`, `CatalogRequestDialog`, `useBrandCatalog`, `useCategoryDependents`, `catalogRequestController`, `CatalogResolutionPolicy`, and `resolvers.ts`.
- Findings & Root Causes Identified:
  1. `loadModelsForBrand` (`useBrandCatalog.ts`) only updates local React state (`selectedBrandId`) and never calls `queryClient.invalidateQueries` for the models query when invoked during `ModelSection.onRequestSuccess`.
  2. `ModelSearchSelect.onSuccess` calls `onChange(resolvedEntityId, name)` upon auto-approval without invoking `setLocalSelection({ id: resolvedEntityId, name })`, leaving local selection state `null` while `availableModels` is stale (`[]`).
  3. `refreshBrands()` (`useBrandCatalog.ts`) only invalidates `brands` and `screen-sizes`, never awaiting or triggering model cache invalidations during brand creation cascades.
- Output Artifacts Produced (`C:\Users\Administrator\.gemini\antigravity-ide\brain\d91d521f-53f5-47a2-802f-34a5139bf3c6`):
  - `dynamic_brand_model_audit_report.md` (Contains all 7 required audit artifacts: Request Trace, State Flow Diagram, API Sequence, Root Causes, File Responsibilities, Failure Analysis, and Architecture Verification)
  - `implementation_plan.md` (Architectural remediation proposal submitted for user review)
  - `task.md` (Audit checklist completed)

## [2026-07-15T11:50:00+05:30] AUDIT-REFINED (Mutation State Machines & SSOT Architecture)
- Task: Refine System Behavior Audit and Implementation Plan based on user architectural review.
- Scope: Evaluated all mutations (`Create Brand`, `Create Model`, `Category Change`) as state machines; analyzed source of truth complexity.
- Architectural Refinements Adopted:
  1. **No new refreshModels() API:** Existing `loadModelsForBrand` and `loadBrandsForCategory` in `useBrandCatalog.ts` will directly execute query invalidation (`invalidate: true` option) instead of creating redundant public state APIs.
  2. **Canonical Source of Truth (SSOT):** Eliminated intermediate `localSelection` bridges and complex fallback chains in `BrandSearchSelect` / `ModelSearchSelect`. Selection state resides strictly in React Hook Form (`form.watch`); catalog state resides strictly in React Query.
  3. **Transactional UI Orchestration:** Added unified orchestrator actions (`suggestAndSelectBrand`, `suggestAndSelectModel`) inside `useCategoryDependents.ts` so no UI component coordinates multi-step async refetches and form resets across ad-hoc callbacks.
- Output Artifacts Updated (`C:\Users\Administrator\.gemini\antigravity-ide\brain\d91d521f-53f5-47a2-802f-34a5139bf3c6`):
  - `dynamic_brand_model_audit_report.md` (Added Section 8: Mutation State Machine Audit & Duplication Analysis with Mermaid state diagrams)
  - `implementation_plan.md` (Updated to reflect Single Source of Truth, Transactional UI Orchestrator, and exact mutation workflows)

## [2026-07-15T12:35:00+05:30] AUDIT-FINALIZED (3-Layer Orchestration & Network Recovery)
- Task: Finalize architectural design for Dynamic Brand and Model Creation Flow per user review.
- Scope: Structured architecture into three strict, decoupled layers (`useBrandCatalog`, `useCategoryDependents`, `useCatalogMutations`) with network recovery fallback.
- Architectural Refinements Finalized:
  1. **Strict Separation of Concerns across 3 Layers:**
     - Layer 1 (`useBrandCatalog`): Pure query loading and explicit cache sync commands (`syncBrands`, `syncModels`). No boolean `invalidate` flags inside queries.
     - Layer 2 (`useCategoryDependents`): Form updates and centralized dependent clearing (`clearCategoryDependents`, `clearBrandDependents`). Does not execute HTTP mutations or cache invalidations.
     - Layer 3 (`useCatalogMutations`): Dedicated mutation hook (`createAndSelectBrand`, `createAndSelectModel`) composing the 3 distinct phases (`Mutation -> Cache Sync -> Selection`).
  2. **Packet Loss / Network Recovery Strategy:** If `syncBrands` or `syncModels` times out or fails over network post-creation (`201 Created`), the orchestrator falls back to directly injecting the newly created item into the TanStack React Query cache (`queryClient.setQueryData(...)`) before selecting, ensuring selection never drops under packet loss.
  3. **Zero Local UI State / Intent-Driven Naming:** Removed `localSelection` completely from `BrandSearchSelect` and `ModelSearchSelect`; renamed orchestrator methods (`createAndSelectBrand`, `createAndSelectModel`) to express domain intent.
- Output Artifacts Updated (`C:\Users\Administrator\.gemini\antigravity-ide\brain\d91d521f-53f5-47a2-802f-34a5139bf3c6`):
  - `dynamic_brand_model_audit_report.md` (Updated Section 7 and Verification Plan)
  - `implementation_plan.md` (Updated with 3-Layer architecture and `setQueryData` recovery fallback)

## [2026-07-15T12:45:00+05:30] EXECUTION-APPROVED (3-Layer Orchestration & Visibility Guarantee)
- Task: Execute approved 3-layer architecture for Dynamic Brand and Model Creation Flow.
- Scope: Refactoring across `useBrandCatalog.ts`, `useCategoryDependents.ts`, `useCatalogMutations.ts` (new), `provider.tsx`, `types.ts`, `BrandSearchSelect.tsx`, and `ModelSearchSelect.tsx`.
- Architectural Guardrails (Enforced by User Approval):
  1. React Query internals (`queryClient`, cache keys, `setQueryData`) remain strictly encapsulated inside Layer 1 (`useBrandCatalog`).
  2. Visibility capabilities (`ensureBrandVisible`, `ensureModelVisible`, `mergeBrand`, `mergeModel`) exposed cleanly by Layer 1 with ordering normalization (`Alphabetical` / `Popularity`).
  3. Recovery from any cache sync failure (`timeout`, `cancellation`, `offline`, `5xx`) handled inside `ensure*Visible` without leaking transport details to callers.
  4. Selection occurs strictly after entity visibility is guaranteed (`POST -> ensureVisible -> select`).
  5. Multi-outcome handling (`AUTO_APPROVE`, `MANUAL_REVIEW`, `REJECTED`) and mutex concurrency protection (`if (activeMutationRef.current) return;`) enforced inside `useCatalogMutations`.
  6. Layer Invariants 1-5 strictly documented and enforced across all layers.

## [2026-07-15T12:56:00+05:30] EXECUTION-VERIFIED
- Task: Refactor Dynamic Brand and Model Creation Flow to 3-Layer Architecture (Phases 1-6 Complete)
- Scope:
  - Layer 1 (`useBrandCatalog.ts`): Encapsulated React Query cache normalization via `mergeBrand` / `mergeModel` and exposed resilient visibility APIs (`ensureBrandVisible`, `ensureModelVisible`) that catch network/timeout errors and guarantee cache visibility with alphabetical normalization.
  - Layer 2 (`useCategoryDependents.ts`): Refactored to act strictly as selection & clearing SSOT (`selectCategory`, `selectBrand`, `selectModel`, `clearCategoryDependents`, `clearBrandDependents`) without HTTP or query cache responsibilities.
  - Layer 3 (`useCatalogMutations.ts`): Created dedicated mutation orchestration hook composing `POST -> ensureVisible -> select` with mutex concurrency protection (`activeMutationRef`) and comprehensive outcome handling (`AUTO_APPROVE`, `MANUAL_REVIEW`, `REJECTED`).
  - Context & UI Integration: Registered layer 3 hooks (`createAndSelectBrand`, `createAndSelectModel`) in `PostAdActionContextType` / `provider.tsx`. Updated `CatalogRequestDialog.tsx` (`onSubmitRequest`), `BrandSearchSelect.tsx`, and `ModelSearchSelect.tsx` to eliminate legacy `localSelection` overrides and ad-hoc cache hacks.
- Verification Evidence:
  - `npx tsc --noEmit -p apps/web/tsconfig.json`: PASS (0 errors across web app and layers)
  - `npm test -w @esparex/core`: PASS (39 test suites, 246 tests passed)
  - `npm test -w apps/web -- --passWithNoTests`: PASS (30 test suites, 117 tests passed)
  - Fixed pre-existing test typo `shopImages` -> `images` in `business-registration.schema.spec.ts` to ensure 100% web test suite green across the board.

## [2026-07-15T22:33:00+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-16T09:26:21+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-18T08:58:25+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-18T09:16:07+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`
### Executed Phase 1: The Delete Phase (Post Ad Excellence Audit)
- **Removed Unused Types**: Cleared out unused contexts, \CategoryData\, \AdImage\, and other zombie types from \pps/web/src/components/user/post-ad/context/types.ts\ and \	ypes.ts\ flagged by knip.
- **Removed Duplicate Exports**: Resolved \piClient\ default vs named export, and \markListingAsSold\ vs \markAsSold\ aliases.
- **Cleaned API Routes**: Deleted legacy image upload routes and controllers (\uploadImage\, \getUploadPresignedUrl\) from \ackend/api\ that are no longer used by the frontend.

## [2026-07-19T18:46:54+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-20T16:03:20+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`

## [2026-07-20T16:23:14+05:30] AGENTS-BOOTSTRAP
- Loaded files:
  - `.agents/AGENTS.md`
  - `.agents/governance/GOVERNANCE.md`
  - `.agents/workflow/AI_WORKFLOW.md`
  - `.agents/project/PROJECT_CONTEXT.json`



## [2026-08-07T22:30:00+05:30] EXECUTION-VERIFIED
- Task: Root-cause fix — Esparex CI workflow cancelled at ~45 minutes (issue-ci-security-and-metrics-hardening)
- Root Cause (evidence): Job `Lint, Test, and Build Monorepo` (`ci.yml`, timeout-minutes: 45) was cancelled by its own timeout. Runs 31187464282 / 31183233812: step `Backend startup smoke test` ran 37.5m / 38.9m with zero log output then `##[error]The operation was canceled.`. Step executed `node -e "require('./backend/api/dist/app')"` which booted Mongo/Redis/Socket.IO/monitors and kept the Node event loop alive forever. Successful develop run 3117364278 completed the same step in 1s (no services → fail-fast + continue-on-error). Regression introduced by commit af956999 (added mongo/redis services + removed continue-on-error).
- Action:
  - backend/api/src/server.ts — split startServer into exported bootstrap()/startListener()/shutdownServer(); production entrypoint behavior unchanged.
  - backend/api/src/smoke.ts (new) — bootstrap → GET /health (assert 200) → canonical shutdown → exit 0/1.
  - backend/api/package.json — added "smoke" script.
  - core/src/utils/shutdownHandler.ts — ERR_SERVER_NOT_RUNNING treated as success (closeIO closes HTTP server first; also fixes production SIGTERM exit code).
  - .github/workflows/ci.yml — smoke step now `npm run smoke -w @esparex/backend-api` with timeout-minutes: 3.
- Verification Evidence:
  - Smoke success (live mongo+redis): exit 0 in ~1.0s; clean shutdown of Socket.IO → HTTP → Redis → Mongoose.
  - Smoke failure (bogus mongo): exit 1 in 33.6s (bounded).
  - `npm run type-check` (root, all workspaces): PASS (exit 0)
  - `npm run build` (root, incl. web + admin Next.js): PASS (exit 0)
  - `npm test -w @esparex/backend-api`: PASS (69 suites, 345 tests)
  - `npm test -w @esparex/core`: PASS (60 suites, 352 tests)
  - ESLint changed files: PASS (clean)
  - `npm run repo:gate`: PASS (Health Score 100%, zero orphans/duplicates/circular)
  - EA-034 appended to engineering-action-register; release-notes Engineering & Reliability note added.
