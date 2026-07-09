---
id: UX-FORM-004
title: Sorting Pattern
status: approved
priority: medium
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-ADMIN-001
related-patterns:
  - UX-DATA-001
related-components: []
---

# UX-FORM-004 — Sorting Pattern

## 1. Overview

The Sorting pattern governs ordering lists or tables based on specified fields (e.g. date, amount, reference code). It details column header click controls, direction indicators (ascending/descending indicators), and default sorting configs.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Admin | `/bookings` | Sort by booking reference ID, amount, or booking date |
| Admin | `/events` | Sort events list by date, capacity, or status |

---

## 3. Source of Truth

```
apps/admin/src/app/bookings/_components/BookingsTable.tsx — Row header buttons and sort order arrows
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/admin/src/app/bookings/_components/BookingsTable.tsx
```

---

## 5. Shared Components Used

No shared `@mad/ui` components are directly used for sorting toggles (implemented within table head cell clicks).

---

## 6. State Diagram

```
Sort Idle (Default sort order active)
 ↓ [click sortable header]
Field Selected (order = asc, indicator ▲ shown)
 ├── [click same header] → Direction Toggle (order = desc, indicator ▼ shown)
 └── [click different header] → Sort Changed (field updated, order resets to asc)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `ascending` | Low-to-high order active | Indicator arrow ▲ |
| `descending` | High-to-low order active | Indicator arrow ▼ |

---

## 8. Optional States

| State | Description |
|---|---|
| `unsorted` | Column is sortable but not currently active |

---

## 9. Keyboard & Accessibility

- **Header Interactive Role**: Sortable column headers must behave like buttons. They must have focus indicators, be tab-reachable, and respond to Space/Enter.
- **State Announcements**: Active sort column and direction must be announced via `aria-sort="ascending"` or `aria-sort="descending"` on the table cell container.
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Direction indicators are visually and programmatically linked to column headers.
  - **2.1.1 Keyboard**: Sorting headers fully operable via keyboard.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-DATA-001` | Tables Pattern | Sorting operates within table header cells |

---

## 11. Implementation Checklist

```
☐ Sortable column headers are focusable and respond to Space and Enter keys
☐ Active sort field and direction are declared via aria-sort attribute
☐ Sort direction indicators (▲/▼) are visually distinct and match text styling
☐ Click actions toggle direction if clicking active field, or switch field if clicking new column
☐ Sorting changes trigger immediate page data reload and reset active page index to 1
```

---

## 12. Governance Rules

#### Required
```
✓ Sortable headers must utilize aria-sort attributes to declare active direction
✓ Clicking a sort header must reset the active pagination page count back to 1
```

#### Forbidden
```
✗ Allowing multi-column sort in standard listings — only single column sorting is supported
✗ Visual sort indicators that lack text alternatives for screen reader users
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Single column sort standard | ADR (to be linked) | Multi-column sort adds significant UX complexity; single-column covers 99% of back-office use cases |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
