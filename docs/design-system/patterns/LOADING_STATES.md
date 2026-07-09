---
id: UX-STATE-002
title: Loading States Pattern
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
  - Spinner
  - Skeleton
  - LoadingState
---

# UX-STATE-002 — Loading States Pattern

## 1. Overview

The Loading States pattern defines the interaction and presentation rules for async data fetching or submission states. It dictates when to use skeletons, spinners, button states, or full loading pages to maintain a smooth, perceived performance while loading content.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/events` | Grid skeletons while loading events list |
| Web | `/checkout/[bookingId]` | Form skeletal overlays or block loadings |
| Admin | All pages | Table skeletons, sidebar content lists |
| Web/Admin | Form submissions | Submit CTA button loader states |

---

## 3. Source of Truth

```
packages/ui/src/primitives/Spinner/Spinner.tsx - Shared raw spinner
packages/ui/src/primitives/Skeleton/Skeleton.tsx - Pulser blocks for UI layouts
packages/ui/src/composites/LoadingState/LoadingState.tsx - Spinner + text block
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - packages/ui/src/primitives/Spinner/Spinner.tsx
  - packages/ui/src/primitives/Skeleton/Skeleton.tsx
  - packages/ui/src/composites/LoadingState/LoadingState.tsx
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Spinner` | `@mad/ui` | Inline visual loading icon |
| `Skeleton` | `@mad/ui` | Pulsing shape placeholders representing unloading data |
| `LoadingState` | `@mad/ui` | Block level spinner and text display |

---

## 6. State Diagram

```
Data Fetching / Submit Action
 ├── [duration < 150ms] → Render nothing (prevents loading flicker)
 └── [duration >= 150ms]
      ├── [Action submit] → Button isLoading state (Button Spinner active)
      ├── [Initial page load] → Skeleton structure representing final layout
      └── [Block level load] → LoadingState (block spinner + text label)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `skeleton-loading` | Placeholders indicating structure of page elements | `Skeleton` block / `EventGridSkeleton` |
| `inline-loading` | Loading state inside interactive buttons | `Button` with `isLoading={true}` |
| `block-loading` | Card or container-level centered loading status | `LoadingState` |

---

## 8. Optional States

| State | Description |
|---|---|
| `global-loading` | Fullscreen cover loader (restricted use) |

---

## 9. Keyboard & Accessibility

- **Aria Live regions**: `LoadingState` defaults to `aria-live="polite"` and `aria-busy="true"` so screen readers are aware the container is loading.
- **Keyboard blocking**: Interactive inputs and buttons must have `disabled` set while in a loading state to prevent double submissions or keyboard focus changes.
- **Skeletons focus**: `Skeleton` elements are set to `aria-hidden="true"` and are not focusable. Skeletons must not receive keyboard focus.
- **WCAG AA criteria**:
  - **4.1.2 Name, Role, Value**: Loading indicators have alternative accessible text (e.g. `aria-label="Loading tickets"`).
  - **4.1.3 Status Messages**: Live regions announce status changes (success/fail).

---

## 10. Cross-Pattern Dependencies

There are no direct pattern dependencies.

---

## 11. Implementation Checklist

```
☐ Delay spinner display by 150ms to prevent visual flickering for fast connections
☐ Skeletons use pulsing animation and match size of final components
☐ Skeletons are hidden from screen readers (aria-hidden="true")
☐ LoadingState is set to aria-live="polite" and aria-busy="true"
☐ Interactive elements are disabled during loading to block duplicate actions
☐ Button isLoading prop is used for form submission buttons
☐ Standard design token colors are used for skeleton backgrounds (no custom hex values)
```

---

## 12. Governance Rules

#### Required
```
✓ Form submission buttons must use Button isLoading from @mad/ui
✓ Layout placeholders must use pulsing Skeleton or EventGridSkeleton
✓ Interactive fields must be disabled while submission loading is active
```

#### Forbidden
```
✗ Custom animated CSS spinners — use shared Spinner or LoadingState
✗ Full-screen unbranded blocking spinner overlays
✗ Making Skeletons focusable (Skeletons must remain hidden from accessibility trees)
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| 150ms throttle timing | ADR (to be linked) | Avoids drawing a spinner for actions that complete in milliseconds, reducing visual noise |
| Skeleton placeholders over spinners | ADR (to be linked) | Skeletons map page structure, reducing Cumulative Layout Shift (CLS) |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
