# Esparex Admin — Audit Remediation Changelog

## Session Summary

All P1 / P2 / P3 audit items resolved. TypeScript: 0 errors on both `frontend/` and `admin-frontend/` after all changes.

---

## P1 — Security / Critical

### 1. Removed Brand & Model Suggest Endpoints (backend)
**File:** `backend/src/routes/catalogRoutes.ts`  
- Removed `POST /brands/suggest` route (allowed unauthenticated brand creation)
- Removed `POST /models/suggest` route (allowed unauthenticated model creation)

### 2. Rate-limit Spare Parts Search (backend)
**File:** `backend/src/routes/catalogRoutes.ts`  
- Added `searchLimiter` middleware to `GET /spare-parts` (was unprotected, open to enumeration/DoS)

### 3. SparePartType Admin UI — New Page (admin-frontend)
**Files created:**
- `admin-frontend/src/lib/api/sparePartTypes.ts` — CRUD API functions (`getSparePartTypes`, `createSparePartType`, `updateSparePartType`, `deleteSparePartType`)
- `admin-frontend/src/app/(protected)/(catalog)/spare-part-types/page.tsx` — Full admin management page with DataTable, pagination, category filter, CRUD modal

**Files modified:**
- `shared/contracts/api/adminRoutes.ts` — Added `SPARE_PART_TYPES` and `SPARE_PART_TYPE_BY_ID` route constants

*SparePartType had a Mongoose model and backend routes but zero admin UI — admins could not manage Part Types at all.*

---

## P2 — Navigation & Form Coverage

### 4. Tab Restructure — Catalog & Spare Parts Master
**File:** `admin-frontend/src/components/layout/adminModuleTabSets.ts`
- `catalogManagementTabs`: Renamed "Brands & Models" → "Brands", added separate "Models" tab, **removed** "Spare Parts" tab (spare parts moved to own module)
- **Added** `sparePartsMasterTabs` export: `["Spare Parts", "Part Types"]`

### 5. Nav Alias — Spare Part Types Page Active-State
**File:** `admin-frontend/src/components/layout/adminNavigation.ts`  
- Added `/spare-part-types` to `partsCatalog` module `aliases` so sidebar highlights correctly on the new page

### 6. Parts Catalog Page — Correct Tab Set
**File:** `admin-frontend/src/app/(protected)/(catalog)/parts-catalog/page.tsx`  
- Changed from `catalogManagementTabs` → `sparePartsMasterTabs` so the Spare Parts and Part Types tabs render correctly

### 7. Category TypeScript Type — 7 Missing Fields
**File:** `admin-frontend/src/types/category.ts`  
Added fields that existed in the backend Mongoose schema but were absent from the frontend type:
```typescript
deviceType?: 'smartphone' | 'tablet' | 'laptop' | 'component' | 'accessory';
supportsSpareParts?: boolean;
supportsModel?: boolean;
supportsConditionToggle?: boolean;
pricingMode?: 'fixed' | 'negotiable' | 'free' | 'any';
imageRequirement?: { min: number; max: number };
```

### 8. Category Admin Form — Exposed 7 Backend Fields
**File:** `admin-frontend/src/app/(protected)/(catalog)/categories/page.tsx`  
Previously the form only had 4 fields: name, type, isActive, hasScreenSizes. Now exposes all backend fields:
- `deviceType` select (shown only when type = "device")
- `pricingMode` select (any / fixed / negotiable / free)
- Feature checkboxes: **Supports Spare Parts**, **Supports Model**, **Condition Toggle**
- **Image Requirement** min/max number inputs

`openEditModal` now populates all new fields from the existing category. `handleSubmit` constructs the full payload including `imageRequirement: { min, max }`.

---

## P3 — Hardcoded Fallback Removal & Type Completeness

### 9. Remove TV/Monitor Hardcoded Screen-Size Fallback
**File:** `frontend/src/hooks/usePostAdCategories.ts`  
Removed slug/name-based `tv` / `monitor` heuristics from `shouldLoadScreenSizes`. Screen size loading is now driven exclusively by the `category.hasScreenSizes` flag from the database.

```diff
- const shouldLoadScreenSizes =
-     categoryHasScreenSizes ||
-     catSlug.includes("tv") ||
-     catSlug.includes("monitor") ||
-     catName.includes("tv") ||
-     catName.includes("monitor");
+ const shouldLoadScreenSizes = Boolean(catObj?.hasScreenSizes);
```

Also removed now-unused `catSlug` and `catName` variables.

### 10. Add `'inactive'` to Model Status Union
**File:** `admin-frontend/src/types/model.ts`
```diff
- status: 'active' | 'pending' | 'rejected';
+ status: 'active' | 'inactive' | 'pending' | 'rejected';
```

---

## Model & Suggest Removal (user frontend + backend)

These were completed in the same session as part of Option B (keep DB data, remove UI):

| File | Change |
|------|--------|
| `frontend/src/components/user/post-ad/PostAdWizard.tsx` | Step 1 gate uses `requiresScreenSize` from `categoryMap` instead of `!watch("model")` |
| `frontend/src/components/user/post-ad/PostAdContext.tsx` | Removed `handleSuggestBrand`, `handleSuggestModel`, `handleModelChange`, `modelIsPending`, `availableModels`, `loadModelsForBrand` from interface + implementation |
| `frontend/src/hooks/usePostAdCategories.ts` | Removed `modelMap`, `availableModels`, `loadModelsForBrand`, `DeviceModelOption` interface; fixed duplicate export bug |
| `frontend/src/hooks/usePostAdForm.ts` | Removed `modelId: ""` from form default values |
| `frontend/src/hooks/usePostAdPreload.ts` | Removed `loadModelsForBrand` from props, body, and deps |
| `frontend/src/components/user/post-ad/steps/DeviceIdentityFields.tsx` | Removed suggest button + `handleSuggestBrand`; replaced with "No brands found" text; fixed missing `</div>` |
| `backend/src/routes/catalogRoutes.ts` | Removed `POST /brands/suggest`, `POST /models/suggest` |

---

*TypeScript: 0 errors — `admin-frontend/` and `frontend/` both pass `tsc --noEmit` clean.*
