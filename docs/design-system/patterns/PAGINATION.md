---
id: UX-FORM-005
title: Pagination Pattern
status: approved
priority: medium
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-ADMIN-001
related-patterns: []
related-components: []
---

# UX-FORM-005 — Pagination Pattern

## 1. Overview

The Pagination pattern governs dividing large datasets into discrete pages. It standardizes page navigation buttons, status messages (e.g. "Page X of Y"), URL parameter synchronization, page count controls, and boundary disable rules.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Admin | `/bookings` | Booking table pagination |
| Admin | `/events` | Admin events listing page |
| Admin | `/users` | Admin users listing page |

---

## 3. Source of Truth

```
apps/admin/src/app/bookings/_components/BookingsTable.tsx — Rendered page buttons (Prev / Next)
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/admin/src/app/bookings/_components/BookingsTable.tsx
```

---

## 5. Shared Components Used

No shared `@mad/ui` components are used for pagination.

> [!NOTE]
> **Backlog Gap BL-001**: No `Pagination` component exists in `@mad/ui`. Admin listings implement ad-hoc pagination controls locally, causing layout differences.

---

## 6. State Diagram

```
Page 1 (First page active)
 ├── Prev button disabled
 └── Next button clicked
      ↓
     Page X (Intermediate page active)
      ├── Prev button enabled
      ├── Next button enabled
      └── Next button clicked (until totalPages reached)
           ↓
          Page Y (Last page active)
           ├── Prev button enabled
           └── Next button disabled
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `first-page` | First page active; previous page action disabled | Prev button disabled |
| `last-page` | Last page active; next page action disabled | Next button disabled |
| `loading-page` | Async load active for newly selected page | Page-wide skeletons shown |

---

## 8. Optional States

| State | Description |
|---|---|
| `page-size-select` | Select control allowing configuration of limit (e.g. 15, 30, 50) |

---

## 9. Keyboard & Accessibility

- **Semantic Navigation Wrapper**: Pagination controls must be wrapped in a `<nav>` container with `aria-label="Pagination"`.
- **Button labeling**: "Prev" and "Next" controls must have descriptive tags if icons are used (e.g. `aria-label="Go to next page"`).
- **Disabled state**: Disabled buttons must declare `disabled` HTML attributes so screen readers know they are inactive.
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Navigation controls organized logically.
  - **2.1.1 Keyboard**: Page select controls operable via keyboard.
  - **4.1.2 Name, Role, Value**: Button state properties correctly passed to AT.

---

## 10. Cross-Pattern Dependencies

There are no direct pattern dependencies.

---

## 11. Implementation Checklist

```
☐ Navigation controls are wrapped inside <nav aria-label="Pagination">
☐ Prev button is disabled when current page is 1
☐ Next button is disabled when current page equals totalPages
☐ Pagination parameters (page, limit) synchronize with URL query parameters
☐ Changing page number triggers data fetch and displays loading skeletons
☐ Backlog ID BL-001 registered for Pagination primitive in @mad/ui
```

---

## 12. Governance Rules

#### Required
```
✓ Prev/Next actions must be disabled when boundary conditions are reached
✓ Page number parameters must synchronize with URL query strings
```

#### Forbidden
```
✗ Allowing page changes to exceed totalPages or drop below 1
✗ Custom page buttons that lack clear keyboard focus styles
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| URL synchronization for page states | ADR (to be linked) | Preserving page index in URL ensures pagination state is persistent upon browser refresh |

---

## 14. Backlog Gaps

| ID | Description | Impact |
|---|---|---|
| `BL-001` | No `Pagination` component in `@mad/ui` | Pagination controls across admin pages are custom duplicates |

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
