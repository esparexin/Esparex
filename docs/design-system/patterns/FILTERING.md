---
id: UX-FORM-003
title: Filtering Pattern
status: approved
priority: medium
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-BOOK-001
  - JRN-ADMIN-001
related-patterns:
  - UX-STATE-001
  - UX-STATE-002
related-components: []
---

# UX-FORM-003 — Filtering Pattern

## 1. Overview

The Filtering pattern covers selecting categorical subsets of lists or grids (such as filtering events by genre, bookings by transaction status, or dates by range). It dictates parameter mappings, active indicators, and reset controls.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/events` | Filter events catalog list by status, date, or category tags |
| Admin | `/bookings` | Filter table by booking status, event selection, or date range |

---

## 3. Source of Truth

```
apps/admin/src/app/bookings/page.tsx — Orchestrator managing filter category states
apps/admin/src/app/bookings/_components/BookingFilters.tsx — Filter drop-downs and clear controls
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/admin/src/app/bookings/page.tsx
  - apps/admin/src/app/bookings/_components/BookingFilters.tsx
```

---

## 5. Shared Components Used

No shared `@mad/ui` components are directly used for filtering dropdowns.

> [!NOTE]
> **Backlog Gap BL-003**: No `DateRangePicker` component exists in `@mad/ui`. Date range filters use raw native HTML input pairs, causing layout alignment differences.

---

## 6. State Diagram

```
Filters Idle (No filters active)
 ├── [select filter option] → Filter Selected (URL syncs, query refetches)
 ├── [clear category] → Filter Cleared (parameters reset, URL syncs)
 └── [click clear all] → Filters Idle (all filters reset)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `filtering` | Reloading data list matching active filters | Page-level skeletal loader |
| `active-filters` | Visual display of current filter parameters | Badges/pills indicating selection |

---

## 8. Optional States

| State | Description |
|---|---|
| `collapsable-filters` | Filter drawer panel for space optimization |

---

## 9. Keyboard & Accessibility

- **Focus Order**: Categorical filter selects or toggle groups must follow standard tab order.
- **Select labels**: All filter selects must be labeled explicitly or possess an `aria-label` describing the category (e.g. `aria-label="Filter by Status"`).
- **Clear buttons**: Individual pill removal buttons must contain descriptive accessibility tags (e.g. `aria-label="Remove Confirmed status filter"`).
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Filters are grouped logically.
  - **4.1.2 Name, Role, Value**: Active states correctly passed to AT.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-STATE-001` | Empty States | Renders fallback if filtered result matches zero items |
| `UX-STATE-002` | Loading States | Displays skeletal placeholders while active filter loads |

---

## 11. Implementation Checklist

```
☐ Filter parameters synchronize with URL query strings (for page reload persistence)
☐ Clear indicators (badges/pills) exist for every active selection
☐ A "Clear All" button is visible when any filter category is active
☐ Clearing filters immediately triggers data list refetch and resets page counts
☐ Native dropdown selections include accessible aria-label attributes
☐ Backlog ID BL-003 registered for DateRangePicker primitive
```

---

## 12. Governance Rules

#### Required
```
✓ Active filter states must synchronize with URL parameters
✓ Changing a filter must reset active pagination page counts back to 1
✓ Must render the standard EmptyState composite when filter combinations yield zero records
```

#### Forbidden
```
✗ Silent filters — active parameters must always be visually indicated (e.g. badges, checkmarks)
✗ Hard-coded dropdown colors that do not align with semantic design tokens
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| URL synchronization for filters | ADR (to be linked) | Preserving filters in query parameters enables admins to bookmark specific views or share links |

---

## 14. Backlog Gaps

| ID | Description | Impact |
|---|---|---|
| `BL-003` | No `DateRangePicker` in `@mad/ui` | Date range filters use ad-hoc native date inputs |

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
