# Esparex Single-Instance Responsive Architecture

## Mandatory Governance Rule

Every screen, header, footer, card, modal, and drawer across the platform MUST be rendered from a **single responsive component instance**.

---

## 1. Prohibited Viewport Component Duplication

```text
❌ PROHIBITED — Component duplication by viewport
   DesktopHeader.tsx
   MobileHeader.tsx
   DesktopCard.tsx
   MobileCard.tsx

✅ MANDATORY — Single-instance responsive component
   Header.tsx (using CSS media query utilities: hidden md:flex, flex md:hidden)
   Card.tsx   (using CSS grid utilities: grid-cols-1 md:grid-cols-3)
```

---

## 2. CSS-Driven Responsiveness First

Layout adjustments (grid columns, flex direction, padding, margins, visibility) MUST be driven by CSS media query utilities:

- Breakpoint tokens: `sm` (`640px`), `md` (`768px`), `lg` (`1024px`), `xl` (`1280px`), `2xl` (`1536px`).
- Example:
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  ```

---

## 3. Restricted JS Viewport Checks

JavaScript window width checks (`useIsMobile`, `window.innerWidth`) are **forbidden for static layout branching**.
JS viewport checks are permitted strictly for dynamic canvas calculations (e.g. virtualized list lane count) or backdrop dismissal.

---

## 4. Off-screen Subtree Focus Protection (`inert`)

Hidden subtrees (mobile drawers, navigation sheets) MUST apply the `inert` attribute when closed to prevent keyboard `Tab` navigation leaks into off-screen elements.
