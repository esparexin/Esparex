# ADR-AUDIT-257 — User Frontend Validation Cleanup

**Branch:** `audit/user-frontend-validation-cleanup`
**Date:** 2026-08-01
**Status:** Complete — 8 commits, single PR

---

## Execution vs. Audit Discrepancies

Three findings from the baseline audit (`Validation-Audit-Baseline.md`) changed
during implementation. These are documented here so reviewers understand what
happened and why.

### D1 — `usePostAdValidation` was not zombie code

**Original audit finding:**
> `usePostAdValidation.ts`: zombie code, doing zero actual validation.

**Reality discovered during implementation:**
The hook had one active consumer (`PostAdProvider`). It was not unused/zombie.
However, the hook was an *unnecessary indirection* — it wrapped exactly two
`useState<string | null>` calls into a named hook, providing no logic, no
abstraction benefit, and no reuse across other components. Its `clearErrors`
function was defined but never imported outside the hook file itself.

**Decision:**
Inline the two `useState` declarations directly into `PostAdProvider`. This
removes an indirection layer with no functional value. No consumers were broken.
The hook file was deleted. This is a simplification, not a zombie removal.

**Reviewer should verify:**
- `loadError` and `formError` are now declared in `provider.tsx` lines 30–31.
- All downstream consumers via context (`PostAdShell`, `ValidationSummary`,
  `EditAdWrapper`) receive these values identically through the same context shape.
- No API surface of the context changed.

---

### D2 — BrandSearchSelect / ModelSearchSelect are NOT duplicates

**Original audit finding:**
> Duplicate search select primitives: BrandSearchSelect, ModelSearchSelect, CatalogSearchSelect — consolidate.

**Reality discovered during implementation:**
These are NOT duplicates. They are a correct three-layer composition:

| Component | Role |
|---|---|
| `CatalogSearchSelect<T>` | Generic, type-parameterized search-select primitive |
| `BrandSearchSelect` | Domain adapter: resolves brand IDs from `brandMap`, handles custom brand proposal |
| `ModelSearchSelect` | Domain adapter: owns model loading side-effects (`loadModelsForBrand`), server-side search trigger |

`ModelSearchSelect` has distinct behaviour that cannot be merged with
`BrandSearchSelect`: it triggers async loads on `brandId`/`categoryId` change,
uses `onSearchChange` for server-side search, and holds its own `useEffect` for
initial model loading. `BrandSearchSelect` has no async behaviour — it is a pure
display transform over `CatalogSearchSelect`.

**Similarity analysis (per AGENTS.md governance threshold):**
- Shared UI %: ~60% (both wrap CatalogSearchSelect)
- Shared business rules %: ~10% (brand = static list, model = async server search)
- Shared validation %: 0%
- Shared API contract %: 0% (different item types: `string` vs `DeviceModel`)
- Shared workflow %: ~15%
- **Overall: ~17% — far below the 75% consolidation threshold**

**Decision:** No consolidation. The original audit finding was **incorrect**.
The baseline audit doc should be treated as a preliminary scan, not a verified
finding. These components remain separate and correctly decomposed.

---

### D3 — No dedicated perf commit was needed

**Original plan:** `perf(forms): reduce duplicate renders in validation flow`

**Reality:** The only measurable duplication of renders was the double error
presentation path in `useListingSubmission` — firing both `onError()` and
`notify.error()` on the same API error. This was fixed as part of commit 3
(`refactor(forms): standardize inline validation`). No additional render
optimisation work was identified after repository inspection.

**Decision:** Perf concern resolved inline within commit 3. No separate perf
commit added. Commit count is 8, not the originally planned 12.

---

## Findings & Remediations (Confirmed)

### A — Validation UX

| # | Finding | File | Action |
|---|---------|------|--------|
| A1 | Generic messages for 20+ error codes (VALIDATION_ERROR, QUOTA_EXHAUSTED, IMAGE_MODERATION_FAILED, LISTING_LIMIT_EXCEEDED, NETWORK_ERROR, SERVER_MAINTENANCE, etc.) | `errorMapper.ts`, `toastMessages.ts` | Replaced with contextual, actionable guidance |
| A2 | Double error presentation: `onError()` + `notify.error()` both fired when field-level API errors were already injected | `useListingSubmission.ts` | Fixed: suppress global notification when `injectApiErrors` returns `true` |
| A3 | Aliased field duplication in ValidationSummary — category/categoryId, brand/brandId, model/modelId each shown as two separate error list items | `ValidationSummary.tsx` | Deduplicated via `FIELD_CANONICAL` map before rendering |

### B — Accessibility

| # | Finding | File | Action |
|---|---------|------|--------|
| B1 | No `aria-live` on ValidationSummary — errors silently updated, not announced | `ValidationSummary.tsx` | Added `aria-live="assertive"` + `aria-atomic="true"` |
| B2 | No `role="alert"` / `aria-live` on PostAdShell offline and load-error states | `PostAdShell.tsx` | Added to both containers |
| B3 | Decorative icons (WifiOff, AlertCircle, RefreshCcw) had no `aria-hidden` | `PostAdShell.tsx` | Added `aria-hidden="true"` to all three |
| B4 | Retry buttons had no descriptive label — "Try Again" / "Check Again" with no context | `PostAdShell.tsx` | Added `aria-label` with specific descriptions |

### C — Repository Hygiene

| # | Finding | Corrected Label | File | Action |
|---|---------|----------------|------|--------|
| C1 | `usePostAdValidation.ts` — trivial single-consumer wrapper for two `useState` calls, `clearErrors` never used externally | **Unnecessary indirection** (not zombie code) | `usePostAdValidation.ts` | Inlined state declarations into `provider.tsx`, deleted hook file |

### D — Confirmed Clean (No Changes)

- `errorMapper.ts` — single canonical error transformer. No parallel implementations.
- `injectApiErrors.ts` — single canonical field-injection utility. No duplicates.
- `BrandSearchSelect` / `ModelSearchSelect` — correct domain adapters. No consolidation needed.
- No duplicate search select primitives found.

---

## Verification Gates

| Gate | Result |
|------|--------|
| `guard:dead-code` | ✅ 0 orphans |
| `repo:gate` | ✅ 100% health score |
| `guard:platform-governance` | ✅ Pass |
| `type-check` | ✅ 0 errors |
| `build` | ✅ Succeeded |
| `test` | ✅ 309 tests passed (297 existing + 12 new) |

---

## Final Commit History (8 commits)

| # | Commit | Scope |
|---|--------|-------|
| 1 | `chore(audit)`: baseline validation and repository audit | Baseline documentation |
| 2 | `refactor(validation)`: replace generic messages with contextual guidance | `errorMapper.ts`, `toastMessages.ts` |
| 3 | `refactor(forms)`: standardize inline validation, remove duplicate error presentation | `useListingSubmission.ts` |
| 4 | `refactor(forms)`: scope validation to active fields + ARIA live region | `ValidationSummary.tsx` |
| 5 | `refactor(validation)`: consolidate SSOT + inline usePostAdValidation wrapper | `provider.tsx`, deleted `usePostAdValidation.ts` |
| 6 | `fix(a11y)`: ARIA improvements in PostAdShell error states | `PostAdShell.tsx` |
| 7 | `test(validation)`: 12 unit tests for mapErrorToMessage | `error-mapper.spec.ts` |
| 8 | `docs(audit)`: this document | `.agents/decisions/` |

Note: Original plan targeted 12 commits. Commits 6 (search-select consolidation)
and 10 (perf) were eliminated because the underlying findings were incorrect or
resolved inline. Commits 5 and 7 (SSOT + zombie removal) were merged because
they shared a single logical boundary: the provider.

---

## WCAG 2.2 AA Compliance

| Criterion | Status |
|---|---|
| 1.1.1 Non-text Content | ✅ Decorative icons marked aria-hidden |
| 4.1.2 Name, Role, Value | ✅ Retry buttons have descriptive aria-label |
| 4.1.3 Status Messages | ✅ aria-live on ValidationSummary + PostAdShell error states |
| 2.4.3 Focus Order | ✅ ValidationSummary buttons scroll to field and focus it |
| 2.1.1 Keyboard | ✅ All ValidationSummary error entries are keyboard-accessible buttons |
