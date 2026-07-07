---
id: UX-DATA-001
title: Tables Pattern
status: approved
priority: high
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-ADMIN-001
related-patterns:
  - UX-FORM-003
  - UX-FORM-004
  - UX-FORM-005
  - UX-STATE-001
  - UX-STATE-002
related-components:
  - Table
  - TableHeader
  - TableBody
  - TableRow
  - TableHead
  - TableCell
---

# UX-DATA-001 — Tables Pattern

## 1. Overview

The Tables pattern governs tabular data representation for back-office and admin portals. It standardizes cell alignments, column headers, sorting integration, row hover behaviors, action buttons, loading skeleton rows, and fallback empty table displays.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Admin | `/bookings` | Booking details list table |
| Admin | `/events` | Admin events listing table |
| Admin | `/users` | Admin users listing table |

---

## 3. Source of Truth

```
packages/ui/src/composites/Table/Table.tsx — Shared Table components
apps/admin/src/app/bookings/_components/BookingsTable.tsx — Audited admin table implementation
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - packages/ui/src/composites/Table/Table.tsx
  - apps/admin/src/app/bookings/_components/BookingsTable.tsx
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Table` | `@mad/ui` | Main table container wrapper |
| `TableHeader` | `@mad/ui` | Header section containing column titles |
| `TableBody` | `@mad/ui` | Body section containing data rows |
| `TableRow` | `@mad/ui` | Row wrapper |
| `TableHead` | `@mad/ui` | Column header cells |
| `TableCell` | `@mad/ui` | Data cells |

---

## 6. State Diagram

```
Table Loaded (Idle)
 ├── [data fetching] → Render loading row skeletons (pulse active)
 ├── [sorting click] → UX-FORM-004
 └── [zero rows returned] → Empty row with colspan matching columns length (UX-STATE-001)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `loading-rows` | Renders placeholder rows while data fetches | Row skeleton components |
| `empty-table` | Renders a friendly warning card when table dataset is empty | Row cell with full-width colSpan |
| `loaded` | Renders data cells | `TableBody` populated with `TableRow` |

---

## 8. Optional States

| State | Description |
|---|---|
| `row-expanded` | Displays secondary details inline under row |

---

## 9. Keyboard & Accessibility

- **Keyboard navigation**: Interactive elements in rows (like Action buttons) must be reachable via Tab and respond to Space/Enter. Row click targets must not block keyboard access to sub-elements.
- **Aria role**: Tables must use standard semantic HTML structure (`table`, `thead`, `tbody`, `tr`, `th`, `td`) which carry default implicit ARIA roles.
- **Header associations**: Header cells must use the `<th scope="col">` markup so screen readers correctly associate values.
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Colspan and scopes declared correctly.
  - **1.4.3 Contrast**: Text colors satisfy contrast minimums.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-FORM-003` | Filtering Pattern | Filter parameters update table contents |
| `UX-FORM-004` | Sorting Pattern | Sorting updates column direction |
| `UX-FORM-005` | Pagination Pattern | Controls page slices shown |
| `UX-STATE-001` | Empty States | Fallback displays |
| `UX-STATE-002` | Loading States | Rules for layout loading |

---

## 11. Implementation Checklist

```
☐ Table composition uses @mad/ui Table components
☐ Header cells use <TableHead> (which renders <th>)
☐ Sorting indicators are displayed on active columns (UX-FORM-004)
☐ Colspan attribute on empty states equals total number of columns
☐ Loading skeletons match layout heights and widths
☐ Row actions are keyboard focusable and operable
```

---

## 12. Governance Rules

#### Required
```
✓ Must use the shared @mad/ui Table sub-components
✓ Column header elements must be wrapped in TableHead
✓ Empty tables must render fallback messages inside a cell spanning all columns (colSpan)
```

#### Forbidden
```
✗ Custom CSS tables built with divs outside @mad/ui Table components
✗ Interactive rows that lack keyboard focus indicators
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Semantic table structures | ADR (to be linked) | Screen readers rely on native table cells to announce column and row context correctly |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
