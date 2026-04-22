# Platform SSOT Remediation Plan

Status: Stabilization
Effective date: 2026-04-21
Scope: `backend`, `frontend`, `admin-frontend`, `shared`

## Purpose

This file is the active migration plan for reducing high coupling and low isolation across the Esparex monorepo.

It replaces the older backend-only controller-to-service tracker with a broader plan covering:

- contracts
- backend controller/service split
- frontend component/API split
- catalog blast-radius reduction
- legacy compatibility removal

## Historical Context

Milestone `M1` in [ENGINEERING_ROADMAP.md](./ENGINEERING_ROADMAP.md) remains complete:

- 27 backend controllers were moved away from direct runtime model imports
- `controllers/` reached zero runtime model imports

That work was necessary but not sufficient. The current audit shows coupling now lives in:

- shared runtime contracts and mixed schema runtimes
- controller-owned orchestration and database access through shared helper surfaces
- component-owned API mutations and cross-feature state orchestration
- catalog cascades and broad cache invalidation
- legacy aliases, adapters, and compatibility branches

## Audit Baseline

Baseline captured on 2026-04-21:

- `292` source files import from `shared`
- `101` source files contain `legacy`, `compatibility`, or `@deprecated`
- `19` backend controller files still contain direct DB/ObjectId query logic
- `12` React component files still call `apiClient`, `adminFetch`, `chatApi`, `createListing`, `updateListing`, or `fetchUserApiJson` directly
- `admin-frontend` still has `3` circular dependencies
- `frontend` uses Zod v3, `admin-frontend` uses Zod v4, and `shared` does not own an explicit schema runtime package boundary

## Current Status Snapshot

Snapshot updated on 2026-04-22:

- contracts/runtime normalization is complete for the active app/runtime path
- first-pass backend controller/service split targets are complete
- first-pass frontend component/API split targets are complete
- catalog blast-radius reduction is complete for the main posting flows
- major query-contract and mutation-contract alias removal is complete
- generic mobile/phone naming cleanup is complete outside the explicit phone-reveal boundary

Deliberate compatibility boundaries still kept:

- public listing reveal route path remains `/phone`
- backend reveal service may still accept/emit legacy `phone` internally while frontend normalizes it to canonical `mobile`
- internal persistence ownership fields such as `userId` remain in models/services where they are storage identifiers, not public API contracts
- explicit alias rejection guards remain for legacy payloads such as `serviceTypes`, `phone`, and `userId`

Closeout tracker:

- deterministic e2e coverage: the listing contact smoke now uses an explicit `SMOKE_LISTING_FIXTURES` contract instead of scanning live listing feeds, and the full local matrix is green for `ad`, `service`, `spare_part`, and listing-detail reveal on desktop and mobile
- dataset/fixture setup: `npm run smoke:fixtures -w backend` now provisions stable non-owned `ad` / `service` / `spare_part` fixture listings and emits the exact `SMOKE_LISTING_FIXTURES` payload the smoke suite needs
- CI wiring: `.github/workflows/frontend-listing-smoke.yml` is now self-contained, boots local Mongo/Redis plus frontend/backend, provisions fixtures automatically, runs the full contact smoke, and sweeps reveal-policy variants (`mobile`, `masked`, `request_only`, `hidden`)
- remaining manual policy step: make the smoke workflow required in GitHub branch protection after it is green for a few runs

## Remediation Principles

1. Contracts stabilize first. No workstream is allowed to redefine payloads ad hoc while the contract layer is unstable.
2. Each workstream owns a narrow write scope. Cross-workstream edits require explicit coordination and should be minimized.
3. Smaller, reviewable PRs are mandatory. No "big bang" refactors.
4. New compatibility layers are forbidden unless this document is updated first.
5. Every phase must add tests or guardrails before removing compatibility code.

## Priority Order

| Priority | Workstream | Why first | Can run in parallel with |
|---|---|---|---|
| P0 | Contracts | Shared runtime contracts are the largest blast-radius multiplier | none |
| P1 | Backend controller/service split | Reduces server-side logic leakage and hidden data coupling | frontend component/API split |
| P2 | Frontend component/API split | Prevents UI changes from mutating runtime behavior | backend controller/service split |
| P3 | Catalog blast-radius reduction | Depends on cleaner contracts and thinner UI/backend boundaries | limited legacy inventory work |
| P4 | Legacy compatibility removal | Safe only after contracts and isolated flows are stable | targeted cleanup only |

## Workstream Isolation Rules

### Workstream A: Contracts

Owns:

- `shared/schemas/**`
- `shared/contracts/**`
- `shared/enums/**`
- `shared/types/**`
- `frontend/src/schemas/**`
- `admin-frontend/src/schemas/**`

Must not own:

- controller orchestration changes
- component behavior refactors
- catalog cascade behavior changes

### Workstream B: Backend Controller/Service Split

Owns:

- `backend/src/controllers/**`
- `backend/src/services/**`
- `backend/src/utils/**` when used only to move backend logic out of controllers

Must not own:

- shared payload shape changes unless blocked and coordinated with Workstream A
- frontend component rewrites

### Workstream C: Frontend Component/API Split

Owns:

- `frontend/src/components/**`
- `frontend/src/hooks/**`
- `frontend/src/lib/api/**`
- `admin-frontend/src/components/**`
- `admin-frontend/src/hooks/**`
- `admin-frontend/src/lib/api/**`

Must not own:

- backend controller/service internals
- shared schema redesign

### Workstream D: Catalog Blast-Radius Reduction

Owns:

- `backend/src/controllers/catalog/**`
- `backend/src/services/catalog/**`
- `backend/src/events/listeners/CatalogPromotionListener.ts`
- `frontend/src/hooks/listings/useListingCatalog.ts`
- `frontend/src/components/user/post-ad/hooks/useCategoryDependents.ts`
- catalog-related admin and user catalog flows

Must not own:

- unrelated auth, wallet, chat, or notification work

### Workstream E: Legacy Compatibility Removal

Owns:

- deprecated enums and adapters in `shared/**`
- compatibility route aliases
- backward-compatibility re-export barrels
- migration-only normalization helpers that are no longer needed

Must not own:

- new feature work
- behavioral refactors not required for removal

## Phase Plan

### Phase 0: Contract Freeze and Audit Guardrails

Goal:

- stop new coupling from entering while the plan is executing

Deliverables:

- mark this document as the active migration plan
- open a temporary contract freeze on new payload fields and enum aliases
- add a CI rule or repo policy note: no new `@deprecated`, `legacy`, or `compatibility` markers without approval
- add a CI rule or repo policy note: no new direct API client calls in React components

Exit gate:

- PR reviewers have one canonical reference for allowed and disallowed migration behavior

### Phase 1: Contracts

Goal:

- make `shared` a stable runtime boundary instead of a loose source-sharing surface

Problems addressed:

- mixed Zod major versions
- duplicate or mirrored validators
- divergent route and schema behavior across apps
- frontend/backend schema workaround code

Deliverables:

- define an explicit schema runtime boundary in `shared/package.json`
- unify Zod major version usage across `shared`, `frontend`, `backend`, and `admin-frontend`
- remove manual "keep in sync" validators where shared runtime schemas can be composed directly
- split transport contracts from UI-only form extras
- add contract tests for:
  - listing create/update payloads
  - catalog read payloads
  - location event payloads
  - report submission payloads

Required PR slices:

1. runtime dependency normalization for `shared` plus version alignment
2. schema mirror removal or controlled wrapper generation
3. contract tests and guardrails

Exit gates:

- no mixed Zod major version runtime path
- no frontend schema files carrying "keep in sync with backend" warnings for canonical flows
- contract tests exist for the main listing, catalog, location, and reporting payloads

### Phase 2: Backend Controller/Service Split

Goal:

- make controllers thin request/response adapters again

Problems addressed:

- controller-owned business logic
- controller-owned DB queries
- shared helper files leaking model access back into controller call paths

Deliverables:

- audit remaining controller query and mutation logic
- move query construction, model reads, and orchestration into services
- narrow controller helpers in `shared.ts`-style files so they expose service functions, not models
- add service-level tests for moved logic before deleting controller branches

Priority targets:

1. `backend/src/controllers/service/serviceMutationController.ts`
2. `backend/src/controllers/smartAlert/smartAlertMutationController.ts`
3. `backend/src/controllers/wallet/walletQueryController.ts`
4. all remaining controllers identified by direct `find`, `findOne`, `countDocuments`, or `ObjectId` handling

Acceptance rule:

- controllers may validate inputs, call services, map HTTP status, and serialize responses
- controllers may not perform query composition, relation resolution, or model orchestration

Exit gates:

- no controller performs direct persistence orchestration
- service tests cover the extracted logic
- repo docs and lint/guard scripts align with the actual controller boundary

### Phase 3: Frontend Component/API Split

Goal:

- ensure UI-only changes stay UI-only

Problems addressed:

- components making direct network calls
- components building payloads and deciding route behavior
- container and presentational responsibilities mixed together

Deliverables:

- move direct API mutations out of components into hooks or API modules
- move multi-endpoint admin search/sidebar aggregation into dedicated hooks or services
- split form containers from presentational subcomponents for listing, reporting, boosts, and plans
- keep UI-only props and display state in components; keep submission, retry, and response mapping in hooks

Priority targets:

1. `frontend/src/components/user/ReportAdDialog.tsx`
2. `frontend/src/components/user/BoostPlanDialog.tsx`
3. `frontend/src/components/user/post-ad/PostAdContext.tsx`
4. `frontend/src/components/user/post-service/PostServiceForm.tsx`
5. `frontend/src/components/user/post-spare-part/PostSparePartForm.tsx`
6. `admin-frontend/src/components/plans/PlanFormModal.tsx`
7. `admin-frontend/src/components/layout/AdminGlobalSearch.tsx`
8. `admin-frontend/src/components/layout/AdminSidebar.tsx`

Admin UI structural cleanup in this phase:

- break the `CategoryTreeRow` and `BrandTreeRow` cycle
- break the `DataTable` / `DataTableBody` / `DataTableRow` cycle by moving `ColumnDef` into a separate type module

Exit gates:

- no React component calls `apiClient`, `adminFetch`, or mutation helpers directly for app data flows
- all component-side mutations route through hooks or API layer functions
- `admin-frontend` circular dependency count is zero

### Phase 4: Catalog Blast-Radius Reduction

Goal:

- isolate master-data changes so catalog work does not unpredictably impact posting, browsing, search, and admin at once

Problems addressed:

- unified catalog loader fan-out
- category-driven resets that tightly couple dependent fields
- broad catalog cache invalidation
- multi-entity cascade behavior hidden behind one mutation

Deliverables:

- split catalog read models from mutation orchestration
- define explicit dependency boundaries:
  - category -> brands
  - brand -> models
  - category + listingType -> spare parts
  - category -> screen sizes
- reduce whole-namespace cache clears where targeted invalidation is possible
- add integration tests for:
  - category change in post ad flow
  - brand/model dependency resolution
  - spare part listing category mapping
  - category delete/update cascades
- add observability for cache invalidation and catalog cascade side effects

Priority targets:

1. `frontend/src/hooks/listings/useListingCatalog.ts`
2. `frontend/src/components/user/post-ad/hooks/useCategoryDependents.ts`
3. `backend/src/services/catalog/CatalogOrchestrator.ts`
4. `backend/src/controllers/catalog/**`
5. catalog-related event listeners and cache clear helpers

Exit gates:

- category mutation tests cover downstream brand/model/part/screen-size side effects
- catalog invalidation is narrowed and measurable
- user and admin flows no longer depend on one monolithic catalog hook for unrelated concerns

### Phase 5: Legacy Compatibility Removal

Goal:

- remove adapters only after the system can stand without them

Problems addressed:

- dual enum systems
- alias fields and compatibility query paths
- re-export barrels that hide true ownership
- migration leftovers becoming permanent architecture

Deliverables:

- inventory every remaining compatibility surface
- classify each item as:
  - remove now
  - remove after one release
  - keep as external contract
- remove deprecated listing-type aliases:
  - `FORM_PLACEMENT`
  - `listingTypeMap`
  - legacy `postad`/`postservice`/`postsparepart` acceptance where no longer required
- remove unnecessary controller/service re-export barrels
- remove stale field aliases once contract tests and client adoption prove no runtime dependency remains

Removal order:

1. internal-only aliases
2. unused compatibility helpers
3. route/controller re-export barrels
4. enum and payload aliases still accepted only for old client support
5. migration scripts and temporary guards after post-removal verification

Exit gates:

- no internal code path depends on deprecated enum aliases
- compatibility markers trend materially downward from the 2026-04-21 baseline
- remaining compatibility surfaces are documented as intentional external contracts

## First 10 PRs

1. Convert `SSOT_REFACTOR.md` into this plan and freeze new compatibility additions.
2. Normalize Zod/runtime contract ownership in `shared`.
3. Replace mirrored location schema ownership with shared composition or generated wrappers.
4. Move `ReportAdDialog` submission flow into a hook or API mutation wrapper.
5. Move `BoostPlanDialog` purchase/promote orchestration into a hook/service boundary.
6. Break `admin-frontend` UI cycles in taxonomy and data table primitives.
7. Move `PlanFormModal` submit logic into admin API hooks/services.
8. Thin `AdminGlobalSearch` and `AdminSidebar` by extracting fetch orchestration.
9. Extract service creation/update orchestration out of `serviceMutationController`.
10. Extract smart alert plan/wallet/query orchestration out of `smartAlertMutationController`.

## Success Metrics

- `0` mixed Zod major-version runtime seams across shared contract consumers
- `0` React components performing direct app-data mutations through raw API clients
- `0` backend controllers performing persistence orchestration
- `0` circular dependencies in `admin-frontend/src`
- targeted catalog invalidation replaces whole-namespace clears where possible
- compatibility-marked files reduced from the 2026-04-21 baseline of `101`

## Non-Goals

- no product redesign
- no domain-behavior changes unless required to restore layering or contract correctness
- no bulk feature work bundled into remediation PRs

## Reporting Rule

Every remediation PR must state:

- workstream
- owned paths
- contract impact or explicit "no contract impact"
- guardrails or tests added
- compatibility removed, added, or unchanged
