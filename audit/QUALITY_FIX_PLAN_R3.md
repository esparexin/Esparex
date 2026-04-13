# QUALITY FIX PLAN — ROUND 3
# Esparex — Audit-Driven Remediation Backlog

**Command to use for every task:** `/quality-fix`
**Rule:** Audit-backed backlog only. One task per session. Mark checkbox only after verification passes. Do not combine High-risk tasks in one session.
**Baseline date:** 2026-04-13
**Source audit:** Repository-wide Git, structure, duplication, dead-code, route, security, and config audit on `main`
**Round 2 status:** Complete
**Round 3 objective:** Close governance gaps, reduce architecture drift, remove duplicate surfaces, and enforce SSOT without speculative refactors.

---

## EXECUTION ORDER

| # | Priority | Area | Target | Risk |
|---|----------|------|--------|------|
| 1 | P0 | GitHub Governance | Branch protection, review gates, branch cleanup | High |
| 2 | P0 | CI Contract | `.github/workflows/ci.yml`, `.github/workflows/architecture-guard.yml` | High |
| 3 | P0 | Runtime Contract | Node/npm version SSOT across repo + CI | High |
| 4 | P1 | API Surface | Auth / CSRF / legacy route aliases | High |
| 5 | P1 | Listing Route SSOT | `listingRoutes.ts`, `adRoutes.ts`, `serviceRoutes.ts`, `sparePartRoutes.ts` | High |
| 6 | P1 | Controller-Service Boundary A | Catalog controllers | High |
| 7 | P1 | Controller-Service Boundary B | Admin controllers | High |
| 8 | P1 | Controller-Service Boundary C | Auth / business / payment / invoice controllers | High |
| 9 | P1 | Duplicate Logic A | `backend/src/services/location/*` | High |
| 10 | P1 | Duplicate Logic B | `backend/src/services/ad/*` | High |
| 11 | P2 | Naming SSOT | ownership + lifecycle naming contracts | Medium |
| 12 | P2 | Env / Deployment SSOT | env examples, platform docs, deployment config | Medium |
| 13 | P2 | Dead Code Triage | orphan candidates from `/tmp/repo_orphan_report.json` | Medium |
| 14 | P2 | Frontend Hook Consolidation | user/listing/smart-alert hooks | Medium |
| 15 | P3 | Repo Ownership Hygiene | `CODEOWNERS`, PR flow documentation | Low |

---

## P0 — GOVERNANCE AND BUILD CONTRACT

### Task 1 — GitHub Governance Baseline

**Problem:**
- `main` is unprotected
- no required approvals
- no required checks
- no auto-delete on merge
- no `develop` branch strategy in GitHub

**Targets:**
- GitHub repository settings
- branch protection rules
- merge settings

**Steps:**
- [ ] Protect `main`
- [ ] Require pull requests before merge
- [ ] Require all green checks currently used by PRs
- [ ] Decide whether `1` approval is required and encode it explicitly
- [ ] Enable branch auto-delete on merge
- [ ] Decide whether `develop` is real policy or remove it from process docs
- [ ] Document final branch strategy in `CONTRIBUTING.md`

**Verification:**
- [ ] `gh api repos/esparexin/Esparex/branches/main/protection` returns protection enabled
- [ ] Merged branches are auto-deleted by GitHub
- [ ] PR cannot merge with failing checks

**Exit criteria:**
- `main` is no longer mergeable without the intended governance gates

---

### Task 2 — Consolidate CI Workflow Contract

**Problem:**
- two top-level workflows both act as CI
- Node version drift exists between workflows
- install/build/env bootstrapping logic is duplicated

**Targets:**
- [.github/workflows/ci.yml](/Users/admin/Desktop/EsparexAdmin/.github/workflows/ci.yml:1)
- [.github/workflows/architecture-guard.yml](/Users/admin/Desktop/EsparexAdmin/.github/workflows/architecture-guard.yml:1)

**Steps:**
- [ ] Decide canonical split:
  - `ci.yml` for build/test/type-check
  - `architecture-guard.yml` for policy guards only
- [ ] Align Node version across both workflows
- [ ] Align install strategy (`npm ci` vs `npm install`) across both workflows
- [ ] Extract repeated backend env bootstrap into one shared script or one composite pattern
- [ ] Ensure workflow names are distinct and intentional
- [ ] Remove any job duplication that creates the same guarantee twice

**Verification:**
- [ ] Fresh PR shows one coherent CI set, not overlapping/confusing duplicates
- [ ] Both workflows pass on the same commit
- [ ] No workflow uses a Node version outside repo engine policy

**Exit criteria:**
- CI behavior is deterministic and described by a single contract

---

### Task 3 — Runtime Version SSOT

**Problem:**
- repo engines require Node `>=24 <26`
- one GitHub workflow still uses Node `22`
- developer/runtime contract is not uniformly enforced

**Targets:**
- [package.json](/Users/admin/Desktop/EsparexAdmin/package.json:1)
- [.nvmrc](/Users/admin/Desktop/EsparexAdmin/.nvmrc:1)
- GitHub workflows
- any local setup docs

**Steps:**
- [ ] Pick canonical Node version family
- [ ] Align `.nvmrc`, root `package.json`, workspace `engines`, and CI
- [ ] Add one setup note in `README.md` or `CONTRIBUTING.md`
- [ ] Ensure any deployment configs use the same runtime family

**Verification:**
- [ ] `node -v` expectation is documented once
- [ ] GitHub Actions use the same major version everywhere
- [ ] No package advertises a conflicting engine

**Exit criteria:**
- local, CI, and deployment runtimes share one Node contract

---

## P1 — API AND ARCHITECTURE SSOT

### Task 4 — Remove Public Auth / CSRF Alias Sprawl

**Problem:**
- duplicate public auth endpoints exist under canonical and legacy paths
- CSRF discovery exists in both root and admin surfaces
- alias count is raising maintenance cost and collision risk

**Targets:**
- [backend/src/routes/adminRoutes.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/routes/adminRoutes.ts:1)
- [backend/src/routes/rootRoutes.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/routes/rootRoutes.ts:1)
- [backend/src/app.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/app.ts:323)

**Steps:**
- [ ] Inventory all public auth, reset-password, forgot-password, and CSRF endpoints
- [ ] Mark each one as canonical, compatibility alias, or delete candidate
- [ ] Keep one canonical route per action
- [ ] Move compatibility aliases behind explicit deprecation comments and sunset dates
- [ ] Remove alias routes once frontend/admin clients no longer call them

**Verification:**
- [ ] Endpoint matrix exists in `audit/` for canonical vs alias routes
- [ ] No new client code points to deprecated aliases
- [ ] Route collision guard still passes

**Exit criteria:**
- one canonical public route per action, with minimal compatibility surface

---

### Task 5 — Listing Route Single Source of Truth

**Problem:**
- listing lifecycle is split across generic and type-specific route files
- phone/view/detail behavior is partially duplicated across route surfaces

**Targets:**
- [backend/src/routes/listingRoutes.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/routes/listingRoutes.ts:1)
- [backend/src/routes/adRoutes.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/routes/adRoutes.ts:1)
- [backend/src/routes/serviceRoutes.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/routes/serviceRoutes.ts:1)
- [backend/src/routes/sparePartRoutes.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/routes/sparePartRoutes.ts:1)

**Steps:**
- [ ] Define which operations belong only to `/listings`
- [ ] Define which operations belong only to type-specific create/update/search routes
- [ ] Remove lifecycle aliases from type-specific routes after compatibility review
- [ ] Document the canonical route map in `audit/esparex_endpoint_action_matrix_canonical.csv`

**Verification:**
- [ ] Same listing action is not reachable from multiple public route families unless intentionally aliased
- [ ] API surface guard passes
- [ ] Route collision guard passes

**Exit criteria:**
- listing lifecycle/read operations have one canonical API surface

---

### Task 6 — Controller-Service Boundary Refactor A: Catalog

**Problem:**
- catalog controllers query Mongoose models directly
- business rules and DB access are mixed in controller layer

**Targets:**
- `backend/src/controllers/catalog/*`
- `backend/src/services/catalog/*`

**Examples from audit:**
- `catalogCategoryController.ts`
- `catalogBrandModelController.ts`
- `catalogSparePartController.ts`
- `catalogReferenceController.ts`
- `catalogGovernanceController.ts`

**Steps:**
- [ ] Map every direct model import inside catalog controllers
- [ ] Move query/mutation logic into service-layer functions
- [ ] Keep controllers limited to request parsing, response mapping, and error translation
- [ ] Reuse shared query builders where possible instead of new one-off helpers

**Verification:**
- [ ] No catalog controller imports catalog models directly unless proven unavoidable
- [ ] Type-check and tests pass
- [ ] Existing response contracts remain unchanged

**Exit criteria:**
- catalog controllers no longer own persistence logic

---

### Task 7 — Controller-Service Boundary Refactor B: Admin

**Problem:**
- admin controllers directly access models and aggregation pipelines
- admin system behavior is tightly coupled to DB layout

**Targets:**
- `backend/src/controllers/admin/*`
- `backend/src/controllers/admin/system/*`
- `backend/src/services/*`

**Priority hotspots:**
- `adminLocationController.ts`
- `adminDashboardController.ts`
- `adminBusinessController.ts`
- `adminInvoiceController.ts`
- `adminUsersController.ts`

**Steps:**
- [ ] Extract read models and mutation services by admin domain
- [ ] Separate dashboard aggregation logic from controller code
- [ ] Keep admin routes thin and policy-oriented

**Verification:**
- [ ] Admin controllers stop importing raw models for primary business flows
- [ ] Existing admin API responses remain backward compatible

**Exit criteria:**
- admin layer is orchestration, not persistence implementation

---

### Task 8 — Controller-Service Boundary Refactor C: Auth / Business / Payment / Invoice

**Problem:**
- several non-admin controllers still mix request handling with persistence logic

**Targets:**
- `backend/src/controllers/auth/*`
- `backend/src/controllers/business/*`
- `backend/src/controllers/payment/*`
- `backend/src/controllers/invoice/*`

**Steps:**
- [ ] Inventory direct model imports
- [ ] Extract service-layer read/write operations
- [ ] Standardize controller return/error flow

**Verification:**
- [ ] Controllers no longer contain raw DB lifecycle logic
- [ ] Tests pass without response contract changes

**Exit criteria:**
- controller layer is uniformly thin across core domains

---

### Task 9 — Duplicate Logic Cluster A: Location Services

**Problem:**
- `jscpd` flags strong duplication across location services
- search, reverse geocode, normalization, hierarchy, and analytics share repeated scaffolding

**Targets:**
- [backend/src/services/location/LocationSearchService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/location/LocationSearchService.ts:1)
- [backend/src/services/location/ReverseGeocodeService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/location/ReverseGeocodeService.ts:1)
- [backend/src/services/location/LocationNormalizer.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/location/LocationNormalizer.ts:1)
- [backend/src/services/location/LocationHierarchyService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/location/LocationHierarchyService.ts:1)
- [backend/src/services/location/LocationAnalyticsService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/location/LocationAnalyticsService.ts:1)

**Steps:**
- [ ] Identify duplicated helper blocks and pipeline builders
- [ ] Extract shared primitives into `LocationService.helpers.ts` or smaller focused helpers
- [ ] Remove copy-paste scaffolding while preserving domain-specific behavior

**Verification:**
- [ ] `npm run guard:duplication` reports fewer location clones
- [ ] No behavior change in location search and hierarchy flows

**Exit criteria:**
- location domain shares reusable primitives instead of copy-pasted service scaffolds

---

### Task 10 — Duplicate Logic Cluster B: Ad Services

**Problem:**
- ad service family repeats search/feed/detail/metrics/aggregation logic

**Targets:**
- [backend/src/services/ad/AdSearchService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/ad/AdSearchService.ts:1)
- [backend/src/services/ad/AdMetricsService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/ad/AdMetricsService.ts:1)
- [backend/src/services/ad/AdFeedService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/ad/AdFeedService.ts:1)
- [backend/src/services/ad/AdDetailService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/ad/AdDetailService.ts:1)
- [backend/src/services/ad/AdAggregationService.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/services/ad/AdAggregationService.ts:1)

**Steps:**
- [ ] Identify shared filter/query/pipeline logic
- [ ] Extract canonical ad query builders
- [ ] Ensure feed/detail/metrics services compose helpers rather than clone them

**Verification:**
- [ ] `guard:duplication` clone count drops in ad service family
- [ ] Search/feed/detail endpoints keep the same outputs

**Exit criteria:**
- ad-domain services compose shared query logic rather than forked implementations

---

## P2 — CONTRACT, CONFIG, AND CLEANUP

### Task 11 — Naming SSOT Remediation

**Problem:**
- ownership naming conflicts: `sellerId`, `userId`, `ownerId`
- lifecycle naming conflicts: `status` and `isActive`
- legacy placement names still accepted in shared schemas

**Targets:**
- [shared/schemas/ad.schema.ts](/Users/admin/Desktop/EsparexAdmin/shared/schemas/ad.schema.ts:1)
- [shared/schemas/catalog.schema.ts](/Users/admin/Desktop/EsparexAdmin/shared/schemas/catalog.schema.ts:1)
- frontend/admin API adapters and normalizers

**Steps:**
- [ ] Define canonical ownership key
- [ ] Define canonical lifecycle representation per domain
- [ ] Keep legacy aliases only at adapter edges
- [ ] Update `audit/canonical_field_inventory.csv`

**Verification:**
- [ ] Shared schema comments no longer advertise multiple competing canonical fields
- [ ] Adapter layer contains compatibility mapping, not core domain types

**Exit criteria:**
- one canonical field vocabulary per domain

---

### Task 12 — Env and Deployment SSOT

**Problem:**
- no clear staging env template pattern
- deployment contract is split across Render, Vercel, GitHub Actions, and tribal knowledge

**Targets:**
- `.env.*.example` files
- `README.md`
- `CONTRIBUTING.md`
- `render.yaml`
- frontend/admin Vercel config

**Steps:**
- [ ] Add explicit staging example files or document why staging is intentionally absent
- [ ] Write one deployment matrix document:
  - backend host
  - frontend host
  - admin host
  - required env variables
- [ ] Ensure example env files reflect all required production/runtime variables

**Verification:**
- [ ] New contributor can identify required env files and deploy targets from docs alone
- [ ] No platform remains implied-only

**Exit criteria:**
- environment and deployment topology are documented as SSOT

---

### Task 13 — Dead Code Triage Round

**Problem:**
- orphan sweep found `26` tier-C candidates
- none are safe for blind deletion yet

**Targets:**
- `/tmp/repo_orphan_report.json`
- `/tmp/repo_orphan_safe_candidates.json`
- orphan candidate files listed by audit

**Steps:**
- [ ] Review each tier-C candidate manually
- [ ] Classify each file as:
  - active but graph-missed
  - deprecated
  - delete candidate
- [ ] Delete only after proof via import graph, grep, and test coverage
- [ ] Record decisions in `audit/`

**Priority candidates:**
- `frontend/src/hooks/useMyAds.ts`
- `frontend/src/lib/auth/session.ts`
- `backend/src/services/ModerationService.ts`
- `admin-frontend/src/hooks/useAdminStatusFilteredList.ts`

**Verification:**
- [ ] Orphan report count decreases or is reclassified with documented justification

**Exit criteria:**
- dead-code list is triaged, not merely detected

---

### Task 14 — Frontend Hook Consolidation

**Problem:**
- duplicate or alias hooks remain in user/listing/profile domains
- some hooks mix UI state, validation, normalization, and API orchestration

**Targets:**
- [frontend/src/hooks/useUser.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/hooks/useUser.ts:1)
- [frontend/src/hooks/useCurrentUser.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/hooks/useCurrentUser.ts:1)
- [frontend/src/hooks/useMyAds.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/hooks/useMyAds.ts:1)
- [frontend/src/hooks/useUserListingManagement.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/hooks/useUserListingManagement.ts:1)
- [frontend/src/hooks/useSmartAlerts.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/hooks/useSmartAlerts.ts:1)

**Steps:**
- [ ] Keep one canonical user hook name
- [ ] Decide whether `useMyAds` is legacy or canonical
- [ ] Split `useSmartAlerts` into data, form, and mutation concerns if retained
- [ ] Remove compatibility wrappers only after call-site migration

**Verification:**
- [ ] Hook surface is smaller and more intentional
- [ ] No duplicate hook names for the same business concept remain

**Exit criteria:**
- frontend hook API is consolidated around one concept per behavior

---

## P3 — OWNERSHIP AND PROCESS HYGIENE

### Task 15 — Repo Ownership and Review Hygiene

**Problem:**
- PR template exists
- ownership enforcement does not
- no `CODEOWNERS`

**Targets:**
- `.github/CODEOWNERS`
- `CONTRIBUTING.md`

**Steps:**
- [ ] Add `CODEOWNERS` for backend, frontend, admin-frontend, shared, and workflows
- [ ] Document expected PR ownership and review routing
- [ ] Align review policy with branch protection

**Verification:**
- [ ] PRs automatically request the right owners
- [ ] Governance and repo docs no longer conflict

**Exit criteria:**
- ownership is encoded in-repo, not only implicit

---

## CROSS-CUTTING RULES

- [ ] Preserve backward compatibility unless a deprecation window is explicitly documented
- [ ] Do not introduce new parallel APIs or duplicate hooks while fixing old ones
- [ ] Every deletion must be backed by grep/import-graph/test evidence
- [ ] Every refactor must keep response contracts stable unless migration notes are written first
- [ ] Every controller-to-service extraction must reduce direct model imports in controllers
- [ ] Every naming cleanup must update shared schema, adapters, and audit inventory together

---

## SUCCESS METRICS FOR ROUND 3

- [ ] `main` is protected and governed
- [ ] CI workflows are unified and runtime-aligned
- [ ] Route alias count is materially reduced
- [ ] Controllers stop owning primary DB logic
- [ ] `jscpd` duplication drops in location and ad service clusters
- [ ] canonical field inventory has one ownership vocabulary and one lifecycle vocabulary per domain
- [ ] orphan candidate list is triaged and reduced
- [ ] deployment/env topology is documented as SSOT

---

## NOTES

- This backlog is intentionally audit-first. It is not a mandate to rewrite the repo in one sweep.
- P0 and P1 tasks should land before broad cleanup work.
- Any task that expands scope into multiple domains should be split before implementation starts.
