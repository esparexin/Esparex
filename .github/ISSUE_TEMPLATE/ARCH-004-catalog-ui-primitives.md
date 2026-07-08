---
name: ARCH-004 Split CatalogUiPrimitives.tsx
about: Decompose the 841-line admin catalog UI primitives file into individual components
title: "ARCH-004: Split CatalogUiPrimitives"
labels: refactor, arch, admin, ui
assignees: ""
---

## Scope

Only this file:
```
apps/admin/src/components/catalog/CatalogUiPrimitives.tsx
```

## Current State

- **841 lines**
- **Complexity: 218**
- **Maintainability: 45/100**
- Contains 25+ React components + 2 types in a single file
- Directly imported by ~15 admin page components

## Target Architecture

New folder: `apps/admin/src/components/catalog/primitives/`

24 new files — one per component/type:

| File | Component(s) |
|------|-------------|
| `CatalogSearchInput.tsx` | CatalogSearchInput |
| `CatalogSelectFilter.tsx` | CatalogSelectFilter |
| `CatalogAsyncComboboxFilter.tsx` | CatalogAsyncComboboxFilter |
| `CatalogCategoryFilter.tsx` | CatalogCategoryFilter |
| `CatalogActiveStatusFilter.tsx` | CatalogActiveStatusFilter |
| `CatalogStatusBadge.tsx` | CatalogStatusBadge + toneClasses |
| `CatalogActiveToggleButton.tsx` | CatalogActiveToggleButton |
| `CatalogActionIconButton.tsx` | CatalogActionIconButton |
| `CatalogActionsRow.tsx` | CatalogActionsRow |
| `CatalogEditDeleteActions.tsx` | CatalogEditDeleteActions, CatalogEditDeleteActionPair |
| `CatalogSearchAndCategoryFilters.tsx` | CatalogSearchAndCategoryFilters, CatalogBoundSearchCategoryFilters |
| `CatalogEntityCell.tsx` | CatalogEntityCell |
| `CatalogTextInputField.tsx` | CatalogTextInputField |
| `CatalogCheckboxCard.tsx` | CatalogCheckboxCard |
| `CatalogActiveCheckboxField.tsx` | CatalogActiveCheckboxField |
| `CatalogArchivedCategoryNotice.tsx` | CatalogArchivedCategoryNotice |
| `CatalogRejectSuggestionForm.tsx` | CatalogRejectSuggestionForm |
| `CatalogCategoryIcon.tsx` | CatalogCategoryIcon, getListingTypeIcon |
| `CatalogCategoryTags.tsx` | CatalogCategoryTags |
| `CatalogSelectField.tsx` | CatalogSelectField |
| `CatalogCheckboxGroupField.tsx` | CatalogCheckboxGroupField |
| `CatalogListingTypeBadges.tsx` | CatalogListingTypeBadges |
| `CatalogEntityTypes.ts` | SelectOption, NamedEntityOption types |
| `index.ts` | Barrel re-export |

Original file becomes:
```tsx
"use client";
export * from './primitives';
```

## API Compatibility

Components currently imported via:
```ts
import { CatalogSearchInput } from '../CatalogUiPrimitives';
// or
import { CatalogSearchInput } from './CatalogUiPrimitives';
```

With barrel re-export, these continue to work. Must verify all ~15 consumer files resolve correctly.

## Risk

This is the highest-risk split because:
- Barrel must preserve `"use client"` directive
- 15+ admin components import from this file
- Need to verify every import path resolves through the barrel

## Acceptance Criteria

Same as ARCH-001.

## Pre-Implementation Verification

- [ ] Search all `import.*CatalogUiPrimitives` to catalog every consumer
- [ ] Verify `"use client"` directive in barrel works
- [ ] Check for existing patterns of barrel re-exports in admin components
- [ ] Confirm git working tree is clean
