---
id: UX-STATE-001
title: Empty States Pattern
status: approved
priority: high
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-BOOK-001
  - JRN-ADMIN-001
related-patterns: []
related-components:
  - EmptyState
---

# UX-STATE-001 — Empty States Pattern

## 1. Overview

The Empty States pattern defines the unified display behavior when a container, table, or page has no data to display (e.g. no events found, no tickets purchased, search query returned zero results). It provides standard guidance on layout, copy, icon use, and optional actionable buttons to help the user recover or proceed.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/tickets` | When the user has not purchased any tickets yet |
| Web | `/events` | When no events match search/filter criteria |
| Admin | `/bookings` | When no bookings match filters or table is empty |
| Admin | `/events` | When no events are created yet |

---

## 3. Source of Truth

```
packages/ui/src/composites/EmptyState/EmptyState.tsx — Shared composite component
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - packages/ui/src/composites/EmptyState/EmptyState.tsx
  - packages/ui/src/composites/EmptyState/EmptyState.types.ts
  - apps/admin/src/app/bookings/page.tsx (audited local empty-table rendering)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `EmptyState` | `@mad/ui` | Displays the icon, title, description, and action button |

---

## 6. State Diagram

```
Container Empty
 ↓
Render EmptyState component
 ├── icon (Visual context)
 ├── title (What is empty/missing)
 ├── description (Why it is empty, how to fix)
 └── action (CTA button to create or search)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `default-empty` | Primary empty state for containers/pages | `EmptyState` with title and icon |

---

## 8. Optional States

| State | Description |
|---|---|
| `actionable-empty` | Empty state offering a button to resolve (e.g., "Create Event") |
| `no-results` | Search result empty state (e.g., "Try clearing your filters") |

---

## 9. Keyboard & Accessibility

- **Keyboard Focus on CTA**: If an action button (`action` prop) is provided, it must be focusable, operable via Space/Enter, and follow standard tab order.
- **Aria role**: Empty states are typically structural alerts. For search results, the container must announce to screen-readers that zero results were found.
- **Icon decoration**: The `icon` should be treated as presentation-only (using `aria-hidden="true"`) to avoid screen readers announcing non-descriptive icon names, unless the icon itself conveys meaning.
- **WCAG AA criteria**:
  - **1.1.1 Non-text Content**: Graphic elements in empty states have text alternatives or are hidden.
  - **1.4.3 Contrast**: Spaced-out descriptions must use sufficiently high-contrast text.

---

## 10. Cross-Pattern Dependencies

There are no direct pattern dependencies.

---

## 11. Implementation Checklist

```
☐ Uses EmptyState composite from @mad/ui
☐ Provides clear title string explaining what is missing
☐ Provides descriptive subtitle or action suggestion (description)
☐ Icons are wrapped with aria-hidden="true" or hidden from screen readers
☐ CTA buttons (action) are keyboard accessible and use Button from @mad/ui
☐ Renders inline inside tables or card grids (never takes over full screen unless appropriate)
☐ Design token mapping used for background and typography (no hardcoded styling overrides)
```

---

## 12. Governance Rules

#### Required
```
✓ Must use the shared @mad/ui EmptyState component
✓ Icon elements passed to the icon prop must have aria-hidden="true"
✓ Clear calls-to-action (CTA) must use @mad/ui Button variant styles
✓ Tables with 0 rows must render the EmptyState inside a full-width row span (colspan)
```

#### Forbidden
```
✗ Implementing custom, ad-hoc empty state displays or custom text divs
✗ Renders empty screens with blank views — always display a friendly message
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Standardized empty composite | ADR (to be linked) | Inconsistent empty layouts degrade user trust; unified empty pages keep brand voice consistent |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
