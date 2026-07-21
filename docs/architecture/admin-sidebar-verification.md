# AdminSidebar — Post-Refactor Verification

**Date:** 2026-07-21
**Change:** Added `inert` + `aria-hidden` to mobile sidebar panel

---

## Addressed by This Change

| Item | Status | Detail |
|---|---|---|
| Keyboard focus into hidden panel | ✅ Fixed | `inert` removes all focusable elements from tab order |
| Screen reader announces hidden panel | ✅ Fixed | `aria-hidden={!isMobileOpen}` removes from AT tree |
| WCAG 2.2 SC 2.4.3 (Focus Order) | ✅ Conformant | Offscreen links no longer participate in sequential focus |

---

## Remaining Gaps (Pre-existing, not introduced)

These issues exist before and after our change:

### ❌ Focus does not return to menu button on close

When the mobile sidebar closes, focus is not explicitly returned to the toggle button (FAB at `bottom-6 right-6`). A keyboard user who opens the sidebar, tabs through it, then closes it, may have focus lost to the document body.

**Fix:** Add a `useEffect` that focuses the toggle button when `isMobileOpen` transitions from `true → false`.

### ❌ Escape key does not close the sidebar

The overlay click handler (`onClick={() => setIsMobileOpen(false)}`) handles mouse interaction, but there's no `onKeyDown` handler for Escape on the overlay.

**Fix:** Add `onKeyDown={(e) => e.key === 'Escape' && setIsMobileOpen(false)}` to the overlay div.

### ❌ Scroll not locked when sidebar is open

The overlay backdrop uses `fixed inset-0` but `overflow-y: hidden` is not applied to `<body>`. Background page content scrolls while the mobile sidebar is open, creating a confusing dual-scroll experience.

**Fix:** Use `useEffect` with `isMobileOpen` to toggle `document.body.style.overflow = 'hidden'`.

### ❌ No `aria-controls` / `aria-expanded` on toggle button

The FAB toggle button has no ARIA relationship with the panel it controls:

```tsx
<button
  aria-controls="mobile-sidebar"
  aria-expanded={isMobileOpen}
  aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
>
```

**Fix:** Add `id="mobile-sidebar"` to the `<aside>`, and wire up `aria-controls` + `aria-expanded` on the button.

---

## Summary

| Item | Status |
|---|---|
| Focus into hidden panel | ✅ Fixed |
| AT tree for hidden panel | ✅ Fixed |
| Focus return to trigger | ❌ Pre-existing gap |
| Escape to close | ❌ Pre-existing gap |
| Scroll lock | ❌ Pre-existing gap |
| aria-controls / aria-expanded | ❌ Pre-existing gap |

Our change (`inert` + `aria-hidden`) is the **minimum viable fix** for the WCAG violation identified in the audit. The remaining gaps can be addressed in a follow-up accessibility PR.
