# Listing Forms Architecture Review

**Phase:** P0 — Audit / Review Only (No Implementation)
**Date:** 2026-07-21
**Reviewer:** AI Architecture Agent

---

## Objective

Evaluate whether `PostAdForm`, `PostServiceForm`, and `PostSparePartForm` should be consolidated into a single `ListingForm` with `ListingFormConfig`, or use a `ListingFormBase` inheritance model.

---

## Architecture Comparison

| Aspect | PostServiceForm | PostSparePartForm | PostAdWizard |
|---|---|---|---|
| **Pattern** | Single-page `GenericPostForm` | Single-page `GenericPostForm` | Multi-step wizard, context-based |
| **State** | Hook-based (`useForm` at component) | Hook-based (`useForm` at component) | Context-based (6 sub-contexts via `PostAdProvider`) |
| **Orchestration** | `usePostServiceFormOrchestration` | `usePostSparePartFormOrchestration` | `PostAdProvider` + 12 sub-hooks |
| **Schema** | `ServiceListingPayloadSchema` | `PostSparePartFormSchema` | `AdPayloadSchema` (via `usePostAdForm`) |
| **Catalog selector** | Multi-select service types (grid-cols-2) | Single-select spare part (grid-cols-3) | Complex cascade (brand → model → size → spare part) |
| **AI generation** | No | No | Yes (`usePostAdAiGeneration`) |
| **Steps** | Single | Single | 2-step wizard |
| **Form shell** | `GenericPostForm` | `GenericPostForm` | `PostAdShell` (custom, 4-state machine) |
| **Edit preload** | Shared `useListingEditPreload` | Shared `useListingEditPreload` | Custom `EditAdWrapper` |
| **Image upload** | Via `useListingImage` in orchestration | Via `useListingImage` in orchestration | Direct `useListingImages` + sync with form |

---

## Service vs Spare Part: Duplication Analysis

**~78% code duplication** between `PostServiceForm.tsx` (269 lines) and `PostSparePartForm.tsx` (272 lines).

### Identical patterns (block-level):
1. `useForm` setup with matching `defaultValues` shape
2. `useListingCategories` + `useBrandCatalog` invocation with same props
3. Category validation `useEffect` (same structure, different field name)
4. `handleCategorySelect` (same structure, different cleared field)
5. `useListingFormProps` call (100% identical code)
6. Loading state return (`ListingModalLoading`)
7. `ListingSubmissionSuccessModal` with same wrapper pattern
8. Brand selector JSX block (100% identical)
9. Category selector grid JSX (same structure, different icon)
10. Orchestration hook return shape (100% identical)

### Differences:
| Field | Service | Spare Part |
|---|---|---|
| Catalog field | `serviceTypeIds` (array) | `sparePartTypeId` (string) |
| Selection mode | Multi-select (toggle) | Single-select (radio) |
| Grid columns | `grid-cols-2` | `grid-cols-3` |
| Skeleton count | 4 | 6 |
| Title maxLength | 100 | 120 |
| Title label | "Service Title" | "Part Title" |
| Title placeholder | "e.g. iPhone Screen Replacement" | "e.g. iPhone 14 OEM Display Screen" |
| Description placeholder | "Describe your service..." | "Describe origin, quality, compatibility..." |
| Edit lock | Category + brand | Category + brand + spare part type |
| Icon | `Wrench` | `CircuitBoard` |
| Route | `services/pending` | `spare-parts/pending` |

---

## Post Ad: Fundamentally Different Architecture

`PostAdWizard` uses a fundamentally different approach that cannot be practically unified with Service/Spare Part:

1. **Multi-step wizard** with per-step validation vs single-page form
2. **AI description generation** (`usePostAdAiGeneration`) — not present in other forms
3. **Complex catalog cascade**: category → brand → model → screen size → spare parts
4. **Context provider architecture** with 6 sub-contexts vs direct hook calls
5. **Custom `PostAdShell`** with offline/loading/error/content state machine
6. **`FormProvider`** at top level vs inside `GenericPostForm`
7. **Different fields**: `isFree`, `condition`, `screenSize`, `spareParts` array — none shared with Service/Part
8. **Custom edit flow** (`EditAdWrapper` + `initializeFromListing`) vs shared `useListingEditPreload`

---

## Recommendation

### Option A: `ListingFormConfig` (Recommended for Service + Spare Part)

**Architecture:**

```typescript
type ListingFormConfig = {
  listingType: LISTING_TYPE;
  schema: z.ZodTypeAny;
  editSchema: z.ZodTypeAny;
  entityLabel: string;
  pendingRoute: string;
  formId: string;
  defaultIcon: LucideIcon;
  /** Catalog selector */
  catalogFieldName: "serviceTypeIds" | "sparePartTypeId";
  catalogLabel: string;
  catalogMultiSelect: boolean;
  catalogGridCols: string;
  catalogSkeletonCount: number;
  catalogHelpText: string;
  /** Title */
  titleLabel: string;
  titlePlaceholder: string;
  titleMaxLength: number;
  /** Description */
  descriptionPlaceholder: string;
  descriptionMaxLength: number;
  /** Edit lock description */
  editLockMessage: string;
  /** Payload builders */
  buildCreatePayload: (data: any) => any;
  buildEditPayload: (data: any) => any;
  buildEditValues: (payload: Record<string, unknown>) => any;
  /** API */
  createApi: (payload: any, options?: any) => Promise<any>;
  updateApi: (id: string, payload: any) => Promise<any>;
};
```

**Verdict:** ✅ **Consolidate Service + Spare Part.** The ~75% duplication is parameterizable. A single `ListingForm` with `ListingFormConfig` eliminates ~350 lines of debt.

### Option B: `ListingFormBase` (Not Recommended)

```typescript
abstract class ListingFormBase { /* ... */ }
class PostServiceForm extends ListingFormBase { /* ... */ }
class PostSparePartForm extends ListingFormBase { /* ... */ }
```

**Verdict:** ❌ Adds abstraction overhead without meaningful logic sharing. The forms are simple enough that a config object is cleaner than inheritance.

### Option C: Full Three-Way Consolidation (Not Recommended)

**Verdict:** ❌ Post Ad's architecture (wizard, AI, context, complex cascade) is fundamentally incompatible with the single-page form pattern. Forcing unification would require a complete Post Ad rewrite with no measurable benefit.

---

## Implementation Plan (Deferred to Phase 2)

```
Phase 2: Service + Spare Part unification
  1. Extract ListingFormConfig type
  2. Create useListingFormOrchestration(config) — replaces both orchestration hooks
  3. Create <ListingForm config={config} /> — replaces PostServiceForm + PostSparePartForm
  4. Remove usePostServiceFormOrchestration.ts and usePostSparePartFormOrchestration.ts
  5. Remove PostServiceForm.tsx and PostSparePartForm.tsx
  6. Update page imports

Phase 3: Post Ad alignment (if warranted)
  1. Audit whether Post Ad could benefit from a 2-step GenericPostForm approach
  2. Evaluate removing PostAdProvider in favor of hook-based pattern
```

---

## Risk Assessment

| Factor | Service + Spare Part Consolidation | Full Three-Way |
|---|---|---|
| Lines changed | ~650 (with ~350 removed) | ~2,500 |
| Test impact | Low (same behaviors) | High (wizard refactor) |
| Regression risk | Medium | High |
| Developer learning curve | Low | Medium |
| Maintenance benefit | High | Medium |

---

## Conclusion

**Do not consolidate Post Ad with Service/Spare Part.** The architectures are fundamentally different (wizard vs single-page, context vs hooks, AI generation, complex cascade).

**Defer Service + Spare Part consolidation to Phase 2.** The ~75% duplication is real and impactful, but the current Phase 1 scope should focus on the three P0 items: SearchFilters, Admin Sidebar, and Provider Analysis.

The existing shared abstractions (`GenericPostForm`, `ListingFormFields`, `useListingFormProps`, `useListingSubmission`) already represent a solid foundation. Building `ListingFormConfig` on top of these would complete the abstraction.
