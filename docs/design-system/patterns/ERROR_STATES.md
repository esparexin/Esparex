---
id: UX-STATE-003
title: Error States Pattern
status: approved
priority: critical
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
  - ErrorState
  - Button
---

# UX-STATE-003 — Error States Pattern

## 1. Overview

The Error States pattern defines how system, network, API validation, and layout-level errors are presented across applications. It standardizes recovery actions (like retry triggers), inline error indicators, and page-level fallback templates.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/checkout/[bookingId]` | Lock fails, payment validation fails |
| Web | `/tickets` | Failed to fetch tickets list |
| Admin | All pages | API failures loading tables or forms |
| Web/Admin | Global | `error.tsx` / `global-error.tsx` error boundary files |

---

## 3. Source of Truth

```
packages/ui/src/composites/ErrorState/ErrorState.tsx — Shared composite error banner
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - packages/ui/src/composites/ErrorState/ErrorState.tsx
  - packages/ui/src/composites/ErrorState/ErrorState.types.ts
  - apps/web/src/app/error.tsx
  - apps/admin/src/components/ErrorBoundary.tsx
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `ErrorState` | `@mad/ui` | Unified layout for displaying errors with an icon, title, description, and retry button |
| `Button` | `@mad/ui` | Embedded retry buttons or custom actions |

---

## 6. State Diagram

```
Error Event Occurs
 ├── [Inline/Field level validation] → FormField input error text (focus on field)
 ├── [Section/Container level fail] → Render inline ErrorState composite
 │                                      ↓ [click Retry]
 │                                     Reset/re-fetch action
 └── [Global/Page level boundary] → Render full-page ErrorState (error.tsx / Boundary)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `inline-error` | Displayed inside form fields | FormField input validation text |
| `section-error` | Displays error inside cards, tables, or sections | `ErrorState` composite |
| `global-error` | Page-wide crashes or critical route load failures | `global-error.tsx` using `ErrorState` |

---

## 8. Optional States

| State | Description |
|---|---|
| `retry-loading` | Displays spinner while retry operation is actively loading |

---

## 9. Keyboard & Accessibility

- **Role and Focus**: `ErrorState` uses `role="alert"` programmatically so that screen readers immediately announce the message. On page-level or block-level mount, focus must move programmatically to the error title header or retry button so keyboard users are oriented.
- **Retry button**: The retry action must be focusable, operable via Space/Enter, and have clear labels.
- **WCAG AA criteria**:
  - **3.3.1 Error Identification**: Input errors clearly describe what is incorrect.
  - **3.3.3 Error Suggestion**: Guidance on how to correct inputs or fix connectivity is provided.
  - **4.1.3 Status Messages**: Live updates (like retry failures) announce.

---

## 10. Cross-Pattern Dependencies

There are no direct pattern dependencies.

---

## 11. Implementation Checklist

```
☐ ErrorState composite used for container or block-level errors
☐ Error messages use descriptive user-friendly wording (never display raw JSON or stack traces)
☐ Includes a visual icon (defaults to AlertTriangle)
☐ Exposes a functional onRetry / retry callback whenever recovery is possible
☐ Action button maps to Button from @mad/ui
☐ Error wrapper includes role="alert" for immediate screen reader announcement
☐ Programmatic focus returned or directed appropriately upon mounting
```

---

## 12. Governance Rules

#### Required
```
✓ Must use the shared @mad/ui ErrorState composite for section and page-level alerts
✓ Page boundaries (error.tsx) must render a full-screen layout wrapping ErrorState
✓ Error messages shown to the user must be translated or filtered (raw server exceptions must be hidden)
```

#### Forbidden
```
✗ Using native browser alert() dialogs
✗ Rendering raw stack traces, DB exceptions, or unparsed server Zod errors in UI
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Safe error messaging | ADR (to be linked) | Exposing stack traces in UI degrades security posture; error sanitization protects system data |
| Unified recovery pattern | ADR (to be linked) | Consistent placement of "Retry" button reduces friction when API errors occur |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
