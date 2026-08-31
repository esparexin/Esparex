# Esparex Accessibility Standard (WCAG 2.2 AA)

Accessibility is a **mandatory engineering requirement**, not a post-development enhancement.

---

## 1. Contrast Requirements
- **Normal Text (< 18pt)**: Minimum **4.5:1** contrast ratio against background.
- **Large Text (≥ 18pt or 14pt bold)**: Minimum **3.0:1** contrast ratio.
- **UI Components & Graphical Objects**: Minimum **3.0:1** contrast ratio for borders and icons.

---

## 2. Keyboard Navigation
Every interactive control MUST be fully operable via keyboard:
- `Tab` / `Shift + Tab`: Predictable logical focus traversal.
- `Enter` / `Space`: Activate buttons, toggles, checkboxes, accordions.
- `Escape`: Close modals, drawers, dropdown menus, popovers.
- `Arrow Keys`: Navigate within radio groups, tabs, comboboxes, select menus.

---

## 3. Focus Management & Visible Focus Rings
- Never remove focus rings using `outline-none` without providing a replacement.
- Use `focus-visible:ring-2 focus-visible:ring-action focus-visible:outline-none`.
- Modals MUST trap focus inside the dialog while open and restore focus to the trigger element when closed.
- Hidden drawers/sheets MUST set `inert` when closed.

---

## 4. Touch Target Sizes
- On touch devices (Mobile & Tablet viewports), interactive elements MUST meet the minimum **44×44px** touch target size.
- Compact buttons in desktop Admin UI MUST scale to 44px touch targets on mobile viewports.

---

## 5. Semantic HTML & ARIA
- Use native HTML elements (`<button>`, `<label>`, `<select>`, `<input>`) before custom `<div>` controls.
- Link form inputs to labels using `htmlFor` / `id`.
- Link input errors using `aria-invalid="true"` and `aria-describedby="error-message-id"`.
