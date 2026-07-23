# Program 3 — Sprint 3 Candidate Audit (v2)
## Scored Responsibility Analysis — Full Evidence

**Audit Date**: 2026-07-22
**Revision**: v2 — all candidates inspected from source; structural-pattern inferences removed
**Framework**: ADR-001 Responsibility-First Audit (Gate 0 + 9-criterion scoring rubric)
**Baseline**: `develop @ 9a782218` (`p2.2-sprint2`)

---

## Audit Process

Each candidate is evaluated in two stages:

1. **Gate 0 — Cohesion Check**: Three yes/no questions. All YES → No Action immediately. Any NO → proceed to scoring.
2. **Scoring Rubric**: 9 criteria, 0–5 each (max 45). Applied only to Gate 0 failures.

Score → Action:
- 0–10: No Action (mandatory)
- 11–18: Optional (specific benefit must be named; deferred unless benefit is concrete)
- 19–30: Recommended
- 31–45: High Priority

---

## Candidate 1 — `CatalogRequestsTab.tsx`

**File**: `apps/admin/src/components/catalog/tabs/CatalogRequestsTab.tsx`
**LOC**: 496

### Observed Evidence

**Responsibilities identified**:
1. Renders the catalog requests data table via `CatalogPageTemplate`
2. Manages single-reject modal state and confirmation flow (lines 65–67, 147–154, 359–373)
3. Manages bulk-reject modal state and confirmation flow (lines 73–75, 156–168, 375–419)
4. Manages a complete bulk-duplicate workflow: owns its own debounced API search (`useEffect` lines 90–115), result list state, target selection state, and confirmation flow (lines 78–83, 170–182, 421–491)
5. Manages row-level bulk selection state (lines 70, 117–133)

**State ownership**: 11 `useState` declarations across 5 separate modal/feature lifecycles

**Side effects**: One `useEffect` (lines 90–115) runs a debounced API search (`getBrands` or `getModels`) tied to `searchQuery` and `requestType`. This is an embedded async data-fetching side effect not related to the core table presentation concern.

**Business logic**: The bulk-duplicate modal derives the request type from the first selected item to decide whether to search brands or models — this is type-routing business logic.

**Rendering complexity**: Three modals rendered inline (single reject, bulk reject, bulk duplicate). The bulk duplicate modal contains a scrollable result list with selection state.

**External dependencies**: `getBrands`, `getModels`, `parseAdminResponse` — API calls owned directly by the component rather than delegated to a hook.

**Public API**: Single default export, no external consumers.

**Reason for score**: Gate 0 fails on the first question — the file has four distinct responsibilities, with the bulk duplicate feature being a self-contained mini-feature that is sufficiently independent to extract.

### Gate 0 — Cohesion Check

| Question | Answer |
|---|---|
| Single primary responsibility? | **No** — table display, single-reject, bulk-reject, and bulk-duplicate (with embedded debounced search) are four distinct concerns |
| Single bounded context? | **No** — spans moderation review and a catalog entity lookup sub-feature |
| Understandable and maintainable as-is? | **Partial** — the core table is clear; the bulk duplicate modal (lines 78–115, 421–491) embeds an independent async sub-feature |

**Gate 0 Result**: FAIL — proceed to scoring

### Scoring Rubric

| Criterion | Score | Evidence |
|---|:---:|---|
| Multiple responsibilities | **4** | Table, single-reject, bulk-reject, bulk-duplicate with own search — 4 distinct concerns |
| Coupling | **2** | Delegates table to `CatalogPageTemplate` and mutations to `useAdminCatalogRequests`; direct API calls in the component are the coupling concern |
| Cognitive complexity | **3** | `useEffect` debounce embedded in component body; type-routing logic for brand vs model search adds hidden branching |
| Duplicate business logic | **2** | Bulk-reject and bulk-duplicate share the same open/reset/confirm/close pattern — minor duplication |
| UI composition complexity | **4** | Three inline modals; bulk duplicate modal contains scrollable result list |
| State management complexity | **4** | 11 `useState` declarations; 3 distinct modal lifecycles |
| Testability | **3** | Embedded debounce + API calls require either mounting the full component or mocking at component level |
| Public API impact | **1** | Single default export; low churn risk |
| Risk of regression | **2** | Core table well-guarded; modal interactions are fairly isolated |

**Total Score**: **25 / 45** → Recommended

### Reusability Verification for Proposed Extraction

**Proposed**: Extract `BulkDuplicateModal` as a standalone component.

| Reusability question | Answer |
|---|---|
| Clear API? | Yes — `isOpen`, `onClose`, `selectedIds`, `requestType`, `onConfirm(selectedIds, targetId)` |
| Receivable via props? | Yes — all required state (`selectedIds`, `requestType`, `isBulkDuplicating`, `onConfirm`) can be passed as props |
| Avoids parent implementation details? | Yes — the debounced search, result list, and selection state are entirely internal to the modal |
| Would another catalog screen reasonably reuse it? | Yes — the BrandsTab and ModelsTab handle the same catalog entities; a future duplicate-detection workflow on those tabs would reuse this modal directly |

**Extraction is justified.**

### Architectural Boundary Rationale

> **The modal owns an asynchronous catalog lookup workflow with its own independent state machine: query → debounce → fetch → results → selection → confirmation.** This workflow has an independent lifecycle from the parent moderation table — it is initiated by a bulk selection action, executes an async search sequence, and resolves to a confirmation. The parent table does not need to know about this lifecycle, nor does the lifecycle depend on any internal details of the parent. That independence is the defining criterion for a component boundary, not the line count or the number of state variables.

That is why extraction is justified here, while `MyListingsTab`'s modal dialogs (which have no lifecycle of their own beyond open/close) are not extracted.

### Recommended Outcome

**P3-REF-001** — Extract `BulkDuplicateModal` component from `CatalogRequestsTab.tsx`

- New file: `apps/admin/src/components/catalog/tabs/components/BulkDuplicateModal.tsx`
- Parent reduction: 11 → 6 `useState` declarations; removes `useEffect`, `getBrands`, `getModels`, `parseAdminResponse` imports from parent
- Makes debounced catalog search independently testable
- Enables reuse on BrandsTab and ModelsTab without reimplementation

---

## Candidate 2 — `ProfileSettingsSidebar.tsx`

**File**: `apps/web/src/components/user/ProfileSettingsSidebar.tsx`
**LOC**: 492

### Observed Evidence

**Responsibilities identified**: Single — orchestrates the user profile page. Renders the sidebar navigation, tracks the active tab, conditionally fetches data per-tab via lazy hooks, and renders the active tab component.

**State ownership**: 2 `useState` declarations (`activeTab`, `isMobileMenuView`). All data state delegated to `useProfileSettings`, `useBusiness`, `useSmartAlerts`, `usePurchases`, `useDynamicPlans`, `useMyListingsStatsQuery`, `useChatUnreadCount`.

**Side effects**: 1 `useEffect` (lines 154–159) synchronizes `activeTab` when `initialTab` prop changes. This is a standard URL→state sync effect; not a data-fetching concern.

**Business logic**: None. All business logic is in the hooks. The component only routes tab values to page navigation via `handleTabChange`.

**Rendering complexity**: High line count is a product of rendering 8+ distinct tab components conditionally. Each render branch is a single component invocation, not complex JSX.

**External dependencies**: 8 hooks, all lazy-activated per active tab. No direct API calls.

**Public API**: Single named export. Called from one parent (the user profile page).

**Reason for Gate 0 pass**: Despite 492 LOC and 8 imported hooks, every line in the file serves the same single purpose — presenting the user profile shell with tab navigation. All data and business logic are already extracted. No seam for extraction exists.

### Gate 0 — Cohesion Check

| Question | Answer |
|---|---|
| Single primary responsibility? | **Yes** — user profile shell orchestrator |
| Single bounded context? | **Yes** — user profile presentation |
| Understandable and maintainable as-is? | **Yes** — clear linear structure: initialization → active tab → tab render → modal render |

**Gate 0 Result**: PASS ✅

### Recommended Outcome

**No Action** — Cohesive orchestrator. High LOC reflects the number of tabs coordinated, not mixed responsibility. All business logic already delegated.

---

## Candidate 3 — `MyListingsTab.tsx`

**File**: `apps/web/src/components/user/profile/tabs/MyListingsTab.tsx`
**LOC**: 468

### Observed Evidence

**Responsibilities identified**: Single — renders the user's own listings with three sub-tabs (ads, services, spare-parts), per-type status filtering, and modal confirmation dialogs for destructive actions.

**State ownership**: 10 `useState` declarations — all modal lifecycle state (delete, deactivate, activate, mark-sold for ads, mark-sold for spare parts). No business logic state owned by the component.

**Side effects**: 1 `useEffect` (lines 81–86) that syncs the URL status parameter when the normalized status differs from the current query param. This is a URL normalization effect, not a data concern.

**Business logic**: None. All listing mutations (`handleDelete`, `handleMarkSold`, `handleDeactivate`, `handleActivate`, `handleRepost`) are delegated to `useProfileListings`. The `confirmDelete/Deactivate/Activate` handlers are simple modal dispatch → mutation → close sequences.

**Rendering complexity**: The component uses a `configMap` record (lines 209–360) to configure all three sub-tab variants, then passes the active config to `UserListingsTemplate`. This is an explicit, readable data-driven approach that avoids conditional JSX sprawl. The 5 modal dialogs at the bottom are thin — they wrap `AlertDialog` and `SoldReasonDialog` with local state.

**External dependencies**: `useProfileListings` (3 instances, one per sub-type), router, search params. No direct API calls.

**Public API**: Named export. Receives 7 props from `ProfileSettingsSidebar`.

**Reason for Gate 0 pass**: The `configMap` pattern makes the component longer than a naive conditional approach, but it is a deliberate, readable design choice. The modal dialogs are all structurally identical thin wrappers. There is no embedded logic that would benefit from extraction.

### Gate 0 — Cohesion Check

| Question | Answer |
|---|---|
| Single primary responsibility? | **Yes** — user listing management tab with sub-type switching |
| Single bounded context? | **Yes** — user-owned listing display and lifecycle actions |
| Understandable and maintainable as-is? | **Yes** — `configMap` pattern is explicit and readable; modals are thin and consistent |

**Gate 0 Result**: PASS ✅

### Recommended Outcome

**No Action** — Cohesive listing management tab. The `configMap` data-driven pattern is intentional and makes the three sub-type variants readable without conditional JSX. Modal dialogs are thin wrappers with no extractable logic.

---

## Candidate 4 — `PlanFormModal.tsx`

**File**: `apps/admin/src/components/plans/PlanFormModal.tsx`
**LOC**: 455

### Observed Evidence

**Responsibilities identified**: Single — renders the admin plan create/edit modal form, with type-conditional field sections.

**State ownership**: Zero `useState` declarations. All form state managed by `react-hook-form` via `useForm`, `useWatch`, and `Controller`. The component is effectively a controlled form with no local state.

**Side effects**: 1 `useEffect` (lines 155–159) that resets the form when the modal opens or `editPlan` changes. This is standard form lifecycle management.

**Business logic**: Two pure transformation functions — `planToForm` (line 64) maps a `Plan` domain object to form values, and `formToPayload` (line 91) maps form values back to an API payload. These are co-located with the form by design: they are tightly coupled to the form schema and have no reuse potential outside this modal. The `onValidSubmit` handler (lines 161–170) is a straightforward create/update dispatch.

**Rendering complexity**: The field sections (limits, flags) are conditional on `formType` (AD_PACK / SPOTLIGHT / SMART_ALERT). This is type-appropriate conditional rendering — not complexity. The JSX is verbose due to the number of fields (20+), not structural nesting.

**External dependencies**: `react-hook-form`, `zod`, `createPlan`, `updatePlan`. No side-effectful hooks beyond form state.

**Public API**: Named export. 4 props (`open`, `onClose`, `onSaved`, `editPlan`).

**Reason for Gate 0 pass**: The file is a single form modal. `planToForm` and `formToPayload` are correctly co-located because they are schema-bound to this form and have no consumers elsewhere. The field count drives the LOC, not any architectural problem.

### Gate 0 — Cohesion Check

| Question | Answer |
|---|---|
| Single primary responsibility? | **Yes** — plan create/edit modal form |
| Single bounded context? | **Yes** — admin plan management |
| Understandable and maintainable as-is? | **Yes** — type-conditional sections are clearly marked; form logic is standard react-hook-form |

**Gate 0 Result**: PASS ✅

### Recommended Outcome

**No Action** — Cohesive form modal. LOC is driven by field count and type-conditional sections, not mixed responsibility. `planToForm` and `formToPayload` are correctly co-located schema-bound helpers.

---

## Candidate 5 — `SmartAlertsTab.tsx`

**File**: `apps/web/src/components/user/profile/tabs/SmartAlertsTab.tsx`
**LOC**: 443

### Observed Evidence

**Responsibilities identified**: Single — renders the smart alerts tab, which presents the alert list, the create/edit form, and the saved searches list in a two-column layout.

**State ownership**: 2 `useState` declarations — `selectedLocation` (transient selection for the location picker) and `pendingDeleteId` (two-step delete confirmation). Both are purely UI state with no business logic implications.

**Side effects**: 2 `useEffect` declarations:
  - Lines 70–74: Resets `selectedLocation` when `smartAlertForm.location` is cleared externally — standard two-way UI sync.
  - Lines 76–78: Resets `selectedLocation` when `editingAlertId` changes — clears stale selection when switching to a different alert for editing.

**Business logic**: None. All smart alert mutations (`handleCreateAlert`, `handleToggleAlertStatus`, `handleDeleteAlert`, `handleDeleteSavedSearch`, `handleEditAlert`) are received as props from `useSmartAlerts` in the parent. The `handleLocationSelect` handler (lines 80–99) maps a `Location` object to the form data shape — this is a pure adapter function with no business decisions.

**Rendering complexity**: Two-column layout (alert list + create form). The alert list renders per-alert action buttons (View, Edit, Pause/Resume, Delete with two-step confirmation). This is standard list-with-actions UI. The create form (lines 285–437) is a form with 5 fields and a location picker — tightly coupled to the `smartAlertForm` props by design.

**External dependencies**: `LocationSelector` (a controlled component), UI primitives. No direct API calls.

**Public API**: Named export. Receives 14 props (all state and handlers from `useSmartAlerts`).

**Reason for Gate 0 pass**: The file is a pure presentation component. All state management is in `useSmartAlerts` (already extracted in a prior sprint). The two `useEffect`s are location picker synchronization effects specific to this form's UX, not business logic. The two-step delete confirmation (`pendingDeleteId`) is correct inline UI state that would gain nothing from extraction.

### Gate 0 — Cohesion Check

| Question | Answer |
|---|---|
| Single primary responsibility? | **Yes** — smart alerts tab rendering: list + create/edit form + saved searches |
| Single bounded context? | **Yes** — smart alert management within user profile |
| Understandable and maintainable as-is? | **Yes** — pure presentation component; all logic in props from `useSmartAlerts` |

**Gate 0 Result**: PASS ✅

### Recommended Outcome

**No Action** — Cohesive presentation tab. State management already extracted to `useSmartAlerts`. The `selectedLocation` and `pendingDeleteId` state are correctly local to the component. No extractable logic exists.

---

## Candidate 6 — `useAdActions.ts`

**File**: `apps/admin/src/app/(protected)/ads/hooks/useAdActions.ts`
**LOC**: 442

### Observed Evidence

**Responsibilities identified**: Single bounded domain — manages all admin ad moderation action state and handlers. Sub-areas within that domain:
  - View modal state + handler (`handleView`, stale-request guard via `lastRequestId` ref)
  - Reject modal state + handlers (single and bulk)
  - Delete modal state + handlers (single and bulk)
  - Ban seller modal state + handlers
  - Bulk action handlers (approve, deactivate, expire, extend, resend warnings ×2)
  - Modal-specific action variants (approve/deactivate/activate/block/extend that also refresh the modal view after mutation)

**State ownership**: 8 `useState` declarations — all modal state. One `useRef` (`lastRequestId`) for stale-request cancellation.

**Side effects**: Zero `useEffect`. The `lastRequestId` ref pattern is not an effect — it is a synchronous guard inside `handleView`.

**Business logic**: `resolveAdId` (lines 63–66) resolves an ad ID from a `ModerationItem` object — a small normalization utility. All mutation calls go through `runMutation` from `useAdminMutation`. No business decisions made in this file.

**Rendering complexity**: This is a hook — no rendering.

**External dependencies**: 10 API functions from `@/lib/api/moderation`, `normalizeModerationAd`, `useAdminMutation`. All well-bounded.

**Public API**: Exports ~30 values (state, setters, and handlers). Wide surface, but stable — handlers have not changed shape since the hook was introduced.

**Observed duplication**: The 4 modal-specific handlers (`handleModalApprove`, `handleModalDeactivate`, `handleModalActivate`, `handleModalExtend`) share an identical pattern:
```
run mutation → refresh table → try { re-fetch detail → setViewAd } catch { /* table refreshed */ }
```
This is 4 repetitions of the same 10-line structure. At current scale (4 instances) it is manageable. At 8+ instances it would justify a `runModalMutation` helper.

**Reason for Gate 0 pass (borderline)**: All handlers belong to a single domain (admin ad moderation). The wide handler count is a product of the number of supported moderation actions, not mixed responsibility. The repeated modal-action pattern is noted but below extraction threshold.

### Gate 0 — Cohesion Check

| Question | Answer |
|---|---|
| Single primary responsibility? | **Yes** — admin ad moderation action state and handler orchestration |
| Single bounded context? | **Yes** — ad moderation domain |
| Understandable and maintainable as-is? | **Yes** — consistent `runMutation` pattern throughout; state is clearly organized in named groups |

**Gate 0 Result**: PASS (borderline — scoring applied to verify)

### Scoring Rubric

| Criterion | Score | Evidence |
|---|:---:|---|
| Multiple responsibilities | **2** | Wide handler surface but all belong to one domain |
| Coupling | **2** | Props-driven (`refresh`, `setSelectedIds`); API calls well-delegated |
| Cognitive complexity | **1** | Every handler follows identical `runMutation` wrapper — minimal per-handler cognitive load |
| Duplicate business logic | **3** | 4 modal-action handlers share an identical run→refresh→refetch pattern |
| UI composition complexity | **0** | Hook — no UI |
| State management complexity | **2** | 8 well-organized modal states |
| Testability | **2** | Consistent pattern makes individual handlers easy to test |
| Public API impact | **3** | ~30 exported values; broad surface |
| Risk of regression | **2** | `runMutation` abstracts error handling; low regression risk per change |

**Total Score**: **17 / 45** → Optional range

**Decision**: **No Action** for Sprint 3. Score 17 is Optional but no concrete benefit outweighs the churn risk on a ~30-value public hook surface. Flag for re-evaluation when (if) additional modal action handlers are added, at which point `runModalMutation` extraction becomes justified.

### Recommended Outcome

**No Action** — Cohesive ad moderation hook. The repeated modal-action pattern is tracked for future review; at 4 instances it does not meet extraction threshold.

---

## Ranked Audit Summary

| Rank | File | LOC | Gate 0 | Score | Outcome |
|---|---|:---:|---|:---:|---|
| 1 | `CatalogRequestsTab.tsx` | 496 | FAIL | **25** | **Extract Component** — `BulkDuplicateModal` → P3-REF-001 |
| 2 | `useAdActions.ts` | 442 | PASS | **17** | No Action (monitor: modal handler count) |
| 3 | `ProfileSettingsSidebar.tsx` | 492 | PASS | — | No Action |
| 4 | `MyListingsTab.tsx` | 468 | PASS | — | No Action |
| 5 | `PlanFormModal.tsx` | 455 | PASS | — | No Action |
| 6 | `SmartAlertsTab.tsx` | 443 | PASS | — | No Action |

---

## Program 3 Sprint 3 Backlog

### Approved for Implementation

| ID | Task | Outcome | Justification |
|---|---|---|---|
| **P3-REF-001** | Extract `BulkDuplicateModal` from `CatalogRequestsTab.tsx` | Extract Component | Embedded debounced API search + result selection is a self-contained mini-feature; reduces parent useState 11→6; makes search logic independently testable; reusable on BrandsTab/ModelsTab |

### Closed — No Action Required

| File | Gate 0 Result | Audit Finding |
|---|---|---|
| `ProfileSettingsSidebar.tsx` | PASS | Cohesive profile shell orchestrator; all logic already delegated to hooks |
| `MyListingsTab.tsx` | PASS | `configMap` pattern is intentional; modal dialogs are thin wrappers with no extractable logic |
| `PlanFormModal.tsx` | PASS | Form modal; `planToForm`/`formToPayload` are schema-bound helpers correctly co-located |
| `SmartAlertsTab.tsx` | PASS | Pure presentation tab; all state management in `useSmartAlerts` |
| `useAdActions.ts` | PASS | Cohesive moderation hook; repeated modal-action pattern below extraction threshold at 4 instances |

---

## Audit Accuracy — Sprint 3

| Metric | Count |
|---|---|
| Audited files | 6 |
| Gate 0 passes (No Action immediate) | 4 (67%) |
| Gate 0 failures (proceeded to scoring) | 2 (33%) |
| No Action after scoring | 1 |
| Approved for implementation | 1 |
| **Total No Action decisions** | **5 / 6 (83%)** |
| **False Positive Rate** | **83%** |

### False Positive Rate

The False Positive Rate measures the percentage of nominated candidates that ultimately received a No Action outcome.

> A high false positive rate is **not** a sign of wasted effort. It is evidence that the audit process is functioning as a genuine filter rather than a generator of implementation work.

For comparison, an audit process with a 0% false positive rate — where every nominated file proceeds to implementation — would indicate that candidate selection has collapsed back into metric-driven (LOC-driven) targeting rather than evidence-based evaluation.

**Sprint 3 baseline: 83% — target range for healthy audits is 50–85%.**

Track across sprints:

| Sprint | Candidates | No Action | Implemented | False Positive Rate |
|---|:---:|:---:|:---:|:---:|
| P3 Sprint 3 | 6 | 5 | 1 | 83% |
| P3 Sprint 4 | — | — | — | — |
| P3 Sprint 5 | — | — | — | — |
