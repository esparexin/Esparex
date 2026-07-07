---
id: UX-DLG-001
title: Confirmation Dialogs Pattern
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
  - UX-DLG-002
related-components:
  - Modal
  - Button
---

# UX-DLG-001 — Confirmation Dialogs Pattern

## 1. Overview

The Confirmation Dialogs pattern governs modal dialogs used to verify destructive or significant actions (e.g. canceling bookings, deleting coupons, updating email addresses). It standardizes header titles, body warnings, action button variants, focus trapping, and keyboard cancel bindings.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Admin | `/bookings` | Cancel booking confirmation dialog, edit email confirmation |
| Admin | `/coupons` | Delete coupon validation alert |

---

## 3. Source of Truth

```
packages/ui/src/composites/Modal/Modal.tsx — Shared Modal primitive
apps/admin/src/app/bookings/_components/CancelBookingModal.tsx — Audited booking cancel dialog
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - packages/ui/src/composites/Modal/Modal.tsx
  - apps/admin/src/app/bookings/_components/CancelBookingModal.tsx
  - apps/admin/src/app/bookings/_components/CorrectEmailModal.tsx
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Modal` | `@mad/ui` | Main overlay dialog structure |
| `Button` | `@mad/ui` | Action submit and cancel buttons |

---

## 6. State Diagram

```
Dialog Closed (Idle)
 ↓ [trigger action]
Dialog Active (Modal overlay mounted)
 ├── [press Escape / click cancel] → Dialog Closed (action aborted)
 └── [click primary confirm] → Action Executed (submit mutation active)
      ├── [success] → Dialog Closed (action complete)
      └── [error] → Dialog Active (display error inline)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `open` | Modal is active and focus trapped | `Modal` with `isOpen={true}` |
| `submitting` | Sending verification to backend | `Button isLoading={true}` on primary action |
| `error` | Submission failed | Inline error warning within dialog footer |

---

## 8. Optional States

| State | Description |
|---|---|
| `custom-fields` | Input fields inside dialog (e.g. reason for cancel) |

---

## 9. Keyboard & Accessibility

- **Focus Trap**: Active confirmation dialogs must trap focus programmatically. Keyboard focus must not escape to background controls. Focus is managed via `@mad/ui` `Modal` or the `useFocusTrap` hook. Focus must return to the trigger element when the dialog is closed.
- **Escape Key Action**: Pressing Escape must close the dialog and abort the action.
- **Header label**: Modals must declare an `aria-labelledby` referencing the title header ID.
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Screen readers associate heading structure.
  - **2.1.2 No Keyboard Trap**: Keyboard users can escape the modal.
  - **2.4.3 Focus Order**: Dialog inputs receive focus in order.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-DLG-002` | Delete Flows Pattern | Actions wrapped inside dialogs |

---

## 11. Implementation Checklist

```
☐ Dialog uses Modal composite from @mad/ui
☐ Focus is trapped within the active modal using useFocusTrap or modal props
☐ Dialog closes when Escape key is pressed
☐ Focus returns to trigger button after dialog is dismissed
☐ Primary CTAs use explicit descriptions (e.g. "Cancel Booking", not "OK")
☐ Primary CTA uses Button with isLoading prop
☐ Background page is non-scrollable while modal is active (body overflow locked)
```

---

## 12. Governance Rules

#### Required
```
✓ Confirmation dialogs must use Modal from @mad/ui
✓ Focus must be trapped inside active dialog overlays
✓ Modal closing must return keyboard focus to the initial trigger element
✓ Primary buttons must use descriptive titles matching the action (no generic "OK")
```

#### Forbidden
```
✗ Custom window.confirm() popups
✗ Leaving modal open without submit loaders during API requests
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Programmatic focus return | ADR (to be linked) | Retaining focus location improves keyboard workflow and meets WCAG AA navigation targets |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
