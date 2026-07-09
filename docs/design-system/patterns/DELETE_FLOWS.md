---
id: UX-DLG-002
title: Delete Flows Pattern
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
  - UX-DLG-001
  - UX-STATE-003
related-components:
  - Modal
  - Button
---

# UX-DLG-002 — Delete Flows Pattern

## 1. Overview

The Delete Flows pattern covers the interaction sequence for destructive, data-removing operations (such as deleting coupons, event categories, or canceling bookings). It dictates two-step confirmation steps, optimistic updates, and recovery handling.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Admin | `/bookings` | Cancel booking action sequence |
| Admin | `/coupons` | Delete coupon action sequence |

---

## 3. Source of Truth

```
apps/admin/src/app/bookings/page.tsx — Page mutations coordinating delete locks
apps/admin/src/app/bookings/_components/CancelBookingModal.tsx — Action confirmation dialog
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/admin/src/app/bookings/page.tsx (cancelMutation logic)
  - apps/admin/src/app/bookings/_components/CancelBookingModal.tsx
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Modal` | `@mad/ui` | Confirmation dialog overlay |
| `Button` | `@mad/ui` | Destructive submit actions |

---

## 6. State Diagram

```
Data Row Active (Delete trigger clicked)
 ↓
Confirmation Dialog Open (UX-DLG-001)
 ├── [cancel] → Data Row Active (aborted)
 ↓ [confirm delete]
Deleting (API request in flight)
 ├── [success] → Row Removed (list refetched, success toast)
 └── [error] → Dialog Remains Open (display error, allow retry)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `confirm-pending` | Verification active | `Modal` open |
| `deleting` | Delete request in progress | Button `isLoading={true}` |
| `error` | Delete request rejected | Error banner in modal |

---

## 8. Optional States

| State | Description |
|---|---|
| `optimistic-remove` | Hide item immediately before API response confirms (if safe) |

---

## 9. Keyboard & Accessibility

- **Keyboard Focus**: Focus must trap inside confirmation modal dialogs.
- **Destructive Button styling**: Primary action buttons must use destructive variants (red border/colors) and be keyboard operable.
- **WCAG AA criteria**:
  - **2.1.1 Keyboard**: Operable via keyboard.
  - **3.3.4 Error Prevention (Legal, Financial, Data)**: Checks are implemented to prevent accidental deletions of data.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-DLG-001` | Confirmation Dialogs Pattern | Delete flows require confirmation modals |
| `UX-STATE-003` | Error States | Handles failed deletion alerts |

---

## 11. Implementation Checklist

```
☐ Deletion requires a two-step confirmation dialog (UX-DLG-001)
☐ Deleting CTA uses destructive button styles
☐ Submit button is disabled and displays isLoading spinner while API request is in progress
☐ On delete failure, the dialog remains open and displays a clear error message
☐ On delete success, the dialog closes and the data list is updated (invalidating cache)
```

---

## 12. Governance Rules

#### Required
```
✓ Must require explicit secondary confirmation before removing data
✓ Delete CTA buttons must use destructive button variants (red highlight/borders)
✓ Must invalidate query caches on successful data removal to sync list views
```

#### Forbidden
```
✗ Executing immediate delete queries on list cell click (one-step deletes are prohibited)
✗ Closing dialog while delete API requests are actively in flight
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Two-step delete standard | ADR (to be linked) | One-step deletions cause accidental data loss; secondary confirmation checks prevent errors |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
