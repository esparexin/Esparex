---
id: UX-STATE-004
title: Success States Pattern
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
  - Alert
  - Button
---

# UX-STATE-004 — Success States Pattern

## 1. Overview

The Success States pattern governs how confirmed system actions, successful API operations, form completions, and purchase results are represented. It guides developers on when to show transient alerts/toasts, inline success callouts, or full-page confirmation screens.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/checkout/[bookingId]` | Confirmed purchase redirect screen |
| Web | `/dashboard` | Post-profile onboarding success confirmation |
| Admin | All routes | Popups indicating successful save/update of coupon, event, or team member |

---

## 3. Source of Truth

```
packages/ui/src/composites/Alert/Alert.tsx — Shared Alert composite with variant="success"
apps/web/src/components/booking/CheckoutContent.tsx — Booking Confirmation success display block
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - packages/ui/src/composites/Alert/Alert.tsx
  - apps/web/src/components/booking/CheckoutContent.tsx (status === BookingStatus.CONFIRMED success block)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Alert` | `@mad/ui` | Banner displaying inline success message with a CheckCircle icon |
| `Button` | `@mad/ui` | Navigation buttons (e.g. "View Tickets") |

---

## 6. State Diagram

```
Action Completes Successfully
 ├── [Page transition required] → Full-page Success Confirmation Card
 │                                  ├── Glowing checkmark header
 │                                  ├── Booking Reference ID block
 │                                  └── CTAs ("View Tickets", "Continue Browsing")
 ├── [Inline notification needed] → success-variant Alert banner
 └── [Action triggered in modal/list] → success-variant Toast (dismissible)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `inline-success` | Successful operation that stays on-screen | `Alert` with `variant="success"` |
| `page-success` | Complete page dedicated to confirming an event | Booking Confirmed block |

---

## 8. Optional States

| State | Description |
|---|---|
| `transient-toast` | Toast alert that automatically dismisses |

---

## 9. Keyboard & Accessibility

- **Programmatic Announcements**: Success alerts must trigger screen-reader announcements to confirm completion of a task. Page-level success templates must focus programmatically on the main success header (e.g., "Booking Confirmed!") or the first action CTA.
- **Dismiss button**: Inline `Alert` dismiss buttons (`onDismiss`) must be fully accessible and include a descriptive `aria-label="Dismiss alert"`.
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Text elements are organized with clear header hierarchy (`h2` for page title, `h5` for banners).
  - **2.1.1 Keyboard**: All buttons and CTAs are keyboard-operable.
  - **4.1.3 Status Messages**: Completion messages are exposed to AT without requiring user focus.

---

## 10. Cross-Pattern Dependencies

There are no direct pattern dependencies.

---

## 11. Implementation Checklist

```
☐ Inline success notifications use Alert component with variant="success"
☐ Confirmation pages display clear reference metrics (e.g. Booking Reference ID)
☐ Includes descriptive next-step information (e.g. "We emailed tickets to...")
☐ Next-step buttons use Button component from @mad/ui
☐ Success icons have appropriate decorative role or hide labels
☐ Dynamic notification components have role="status" or role="alert"
☐ Focus transitions are managed when navigating from loading to success page
```

---

## 12. Governance Rules

#### Required
```
✓ Page-level success confirmation layouts must present primary action CTAs ("View Tickets", "Back to Home") using @mad/ui Button
✓ Banners indicating success must utilize @mad/ui Alert with variant="success" (no custom green divs)
✓ Confirmations must display explicit confirmation ID references (e.g. order ref, profile token)
```

#### Forbidden
```
✗ Silent success — always inform the user that their action completed
✗ Custom dismiss buttons without an explicit aria-label
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Full-page booking success page | ADR (to be linked) | Gating booking success with a dedicated, clean URL/view structure provides a clear conclusion to the purchasing journey |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
