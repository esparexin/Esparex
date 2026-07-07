---
id: UX-DATA-002
title: Dashboard Pattern
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
  - UX-STATE-002
related-components:
  - Card
---

# UX-DATA-002 — Dashboard Pattern

## 1. Overview

The Dashboard pattern covers layout metrics, statistics widgets, chart placeholders, and data summaries for the main admin landing page. It defines stat card structure, refresh triggers, and visual consistency guidelines.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Admin | `/dashboard` | Landing page containing analytics widgets |

---

## 3. Source of Truth

```
apps/admin/src/app/dashboard/page.tsx — Main dashboard controller and layout wrapper
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/admin/src/app/dashboard/page.tsx
  - apps/admin/src/components/dashboard/StatCard.tsx (audited local widgets)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Card` | `@mad/ui` | Layout container for metrics and summaries |

---

## 6. State Diagram

```
Dashboard Loaded (Idle)
 ├── [query polling] → Reloading (refresh active)
 └── [loading metrics] → Render skeletal card content blocks
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `skeleton-loading` | Metric loader active | Pulsing card skeletons |
| `loaded` | Displays current count/metric | Card |

---

## 8. Optional States

| State | Description |
|---|---|
| `empty-widget` | Widget metrics are 0 or empty |

---

## 9. Keyboard & Accessibility

- **Focus order**: Dashboard elements must be navigable via Tab in logical reading order (left-to-right, top-to-bottom).
- **Landmarks**: Widget groups must reside in semantic containers (e.g. `<section aria-label="Key Performance Indicators">`).
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Metric values are clearly associated with their titles.
  - **1.4.3 Contrast**: Text colors satisfy contrast targets.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-STATE-002` | Loading States | Rules for layout loading |

---

## 11. Implementation Checklist

```
☐ Metric containers use Card component from @mad/ui
☐ Content sections use semantic grid elements for spacing
☐ Skeleton placeholders are displayed during initial queries
☐ Labels are descriptive and programmatically associated
```

---

## 12. Governance Rules

#### Required
```
✓ Metric widgets must utilize Card from @mad/ui as their container structure
✓ Widgets must support loading placeholders (skeletons) during fetch actions
```

#### Forbidden
```
✗ Custom card border styles outside standard design tokens
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Card-based layouts for metrics | ADR (to be linked) | Cards group values cleanly and separate dashboard metrics from other details |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
