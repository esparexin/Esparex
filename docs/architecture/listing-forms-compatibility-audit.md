# Listing Forms — Architecture Compatibility Audit

**Date:** 2026-07-21
**Purpose:** Determine whether `PostAdForm`, `PostServiceForm`, and `PostSparePartForm` should be consolidated.

---

## 1. Field Matrix

| Field | Ad | Service | Spare Part |
|---|---|---|---|
| **title** | validatedText (10–60) | validatedText (10–100) | validatedText (5–120) |
| **description** | validatedText (20–2000) | validatedText (20–2000) | validatedText (20–2000) |
| **price** | number (0–10M) | number → priceMin (0–10M) | number (0–10M) |
| **categoryId** | ObjectId (optional→required) | requiredObjectId | requiredObjectId |
| **brandId** | ObjectId (optional) | optionalObjectId | optionalObjectId |
| **modelId** | ObjectId (optional) | optionalObjectId | — |
| **images** | array 1–10 | array 1–10 | array 1–10 |
| **location** | LocationMetaSchema (required refine) | Business profile | Business profile |
| **Service/Part type** | `spareParts[]` (max 10) | `serviceTypeIds[]` (1–20) | `sparePartTypeId` (required) |
| **screenSize** | string | — | — |
| **deviceCondition** | enum optional | — | — |
| **isFree** | boolean default false | — | — |
| **attributes** | Record optional | — | — |
| **listingType** | enum optional | — | — |

---

## 2. Similarity Scoring

### 2a. Shared Validation

All three use `validatedTextSchema` from shared contracts for title/description, the same price range (0–10M), and the same image count constraints (1–10).

| Pair | Shared % | Details |
|---|---|---|
| Ad ↔ Service | **~70%** | Text + image + price match. Location differs (refine vs business). Ad has extra fields. |
| Ad ↔ Spare Part | **~70%** | Same pattern. Ad has screenSize, condition, isFree extras. |
| Service ↔ Spare Part | **~95%** | Nearly identical. Only the catalog-type field differs (array vs string). |

### 2b. Shared Business Logic

| Logic | Ad | Service | Spare Part |
|---|---|---|---|
| Image upload | `useListingImages` + form sync | `useGenericListingForm` → `useListingImages` | Same |
| Location | `useListingLocation` + form sync | Business profile (shared) | Same |
| Edit preload | Custom `EditAdWrapper` + `initializeFromListing` | Shared `useListingEditPreload` | Same |
| Form submission | `useListingSubmission` | `useListingSubmission` | Same |
| Catalog cascade | Category → brand → model → size → parts | Category → brand → types | Category → brand → parts |
| AI generation | Yes | No | No |

| Pair | Shared % | Details |
|---|---|---|
| Ad ↔ Service | **~30%** | Only `useListingSubmission` shared |
| Ad ↔ Spare Part | **~30%** | Only `useListingSubmission` shared |
| Service ↔ Spare Part | **~70%** | `useGenericListingForm` + `useListingSubmission` shared |

### 2c. Shared UI Components

| Component | Ad | Service | Spare Part |
|---|---|---|---|
| Form shell | `PostAdShell` (custom 4-state) | `GenericPostForm` | `GenericPostForm` |
| Images/Location fields | Via context hooks | Via `GenericPostForm` | Via `GenericPostForm` |
| Category selector | Custom (wizard step 1) | `CategorySelectorGrid` | `CategorySelectorGrid` |
| Brand selector | Custom auto-complete | `BrandSearchSelect` | `BrandSearchSelect` |
| Title/Price/Description | Inline in wizard step 2 | `ListingTitleField`/`PriceField`/`DescriptionField` | Wrappers around same |
| Success modal | `ListingSubmissionSuccessModal` | Same | Same |

| Pair | Shared % | Details |
|---|---|---|
| Ad ↔ Service | **~20%** | Only success modal shared |
| Ad ↔ Spare Part | **~20%** | Same |
| Service ↔ Spare Part | **~85%** | Both use `GenericPostForm` + same field components |

### 2d. Shared API

All three call `createListing`/`updateListing` from `listingMutationAPI.ts` with thin wrappers. Route: `API_ROUTES.USER.LISTINGS`.

| Pair | Shared % |
|---|---|
| Ad ↔ Service | **~95%** |
| Ad ↔ Spare Part | **~95%** |
| Service ↔ Spare Part | **~95%** |

### 2e. Shared Workflow

| Step | Ad | Service | Spare Part |
|---|---|---|---|
| Category → Brand → Model → Size | ✅ Wizard step 1 | ❌ | ❌ |
| Category → Brand → Type | ❌ | ✅ Single page | ✅ Single page |
| Title → Description → Price | ✅ Wizard step 2 | ✅ Single page | ✅ Single page |
| Images → Location | ✅ Wizard step 2 | ✅ Single page | ✅ Single page |

| Pair | Shared % | Details |
|---|---|---|
| Ad ↔ Service | **~20%** | 2-step wizard vs single page |
| Ad ↔ Spare Part | **~20%** | Same |
| Service ↔ Spare Part | **~90%** | Both single-page, same field order |

---

## 3. Overall Score

| Pair | Validation | Business Logic | UI | API | Workflow | **Overall** |
|---|---|---|---|---|---|---|
| Ad ↔ Service | 70% | 30% | 20% | 95% | 20% | **~47%** |
| Ad ↔ Spare Part | 70% | 30% | 20% | 95% | 20% | **~47%** |
| Service ↔ Spare Part | 95% | 70% | 85% | 95% | 90% | **~87%** |

---

## 4. Verdict

### Post Ad should NOT be consolidated with Service/Spare Part

**Overall similarity: ~47%** — below the recommended threshold.

Key incompatibilities:
1. **Wizard vs single-page:** Post Ad uses a 2-step wizard with per-step validation; Service/Part use single-page forms
2. **Location:** Ad requires location selection via `LocationMetaSchema` with custom `superRefine`; Service/Part use the business profile location
3. **AI generation:** Ad has `usePostAdAiGeneration` — not present in other forms
4. **Catalog cascade:** Ad supports brand → model → screen size → spare parts; Service/Part only need brand + type
5. **Extra fields:** Ad has `screenSize`, `deviceCondition`, `isFree`, `attributes`, `listingType` — none shared
6. **Edit flow:** Ad uses custom `EditAdWrapper` + `initializeFromListing`; Service/Part use shared `useListingEditPreload`
7. **State management:** Ad uses 6 context providers; Service/Part use direct hook calls

Forcing unification would require a complete Post Ad rewrite with no measurable benefit.

### Service + Spare Part SHOULD be consolidated

**Overall similarity: ~87%** — sufficient to justify a `ListingFormConfig` approach.

Differences are all **parameterizable**:
| Difference | Config knob |
|---|---|
| Schema imports | `config.schema`, `config.editSchema` |
| Catalog field name | `config.catalogFieldName` |
| Multi vs single select | `config.catalogMultiSelect` |
| Grid columns / skeletons | `config.catalogGridCols`, `config.catalogSkeletonCount` |
| Title max length | `config.titleMaxLength` |
| Title/Description labels | `config.titleLabel`, `config.titlePlaceholder` |
| Icon | `config.defaultIcon` |
| Payload mapping | `config.buildCreatePayload`, `config.buildEditPayload` |
| Edit lock behavior | `config.editLockMessage`, `config.catalogLockField` |

---

## 5. Similarity Threshold Assessment

Per the **Similarity Threshold Rule**, consolidation is warranted when **overall similarity > 75%** AND no single dimension is < 50%.

| Pair | Overall | Min Dimension | Verdict |
|---|---|---|---|
| Ad ↔ Service | 47% | 20% (UI) | ❌ Do not consolidate |
| Ad ↔ Spare Part | 47% | 20% (UI) | ❌ Do not consolidate |
| Service ↔ Spare Part | 87% | 70% (Logic) | ✅ Consolidate via `ListingFormConfig` |

---

## 6. Consolidation Scope (Service + Spare Part Only)

```
ServiceForm + SparePartForm
        ↓
   ListingFormConfig
        ↓
   <ListingForm config={serviceConfig} />
   <ListingForm config={sparePartConfig} />
```

**Estimated savings:** ~350 lines removed, 1 file created (config), 1 component file.

**Risk:** Medium. Both forms must be tested after consolidation.
**Migration:** Create `ListingForm.tsx` + configs, update page imports, delete old files.
