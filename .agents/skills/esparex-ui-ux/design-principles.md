# Esparex UI/UX Design Principles

## 1. Single Source of Truth (`@esparex/design-tokens`)
Visual styles (colors, font sizes, margins, shadows, radii) MUST originate from `@esparex/design-tokens` or CSS variables (`var(--color-...)`).
Never define local component design tokens, magic hex strings, or arbitrary pixel values.

## 2. Platform Parity with Surface Adaptation
The visual language (brand sky, deep slate, indigo action, Geist typography) is identical across Web, Admin, and Mobile.
- **Web Marketplace**: Optimized for trust, scannability, discovery, and conversion.
- **Admin Dashboard**: Optimized for high information density, table scannability, fast navigation, and low cognitive overhead.
- **Mobile Native**: Optimized for touch targets (44×44px), bottom sheets, safe areas, and gesture navigation.

## 3. Surface Hierarchy
Layouts follow a clean single-responsibility containment hierarchy:
`PageShell` $\rightarrow$ `Container` $\rightarrow$ `Section` $\rightarrow$ `Card` $\rightarrow$ `Content`.
- `<Card>` is used for data surfaces—never as a full-page wrapper or form container.

## 4. Intent-Driven Interactive Controls
Interactive controls (buttons, links, selectable rows) communicate state clearly:
- Action intent: Indigo (`#2563eb`)
- Brand intent: Sky (`#0284c7`)
- Destructive intent: Error Red (`#ef4444`)
- Success intent: Emerald (`#10b981`)

## 5. Non-Negotiable Accessibility
Visual excellence is incomplete without accessibility. Every component must support keyboard navigation (`Tab`, `Enter`, `Escape`), visible focus rings, minimum 4.5:1 text contrast, and screen reader compatibility.
