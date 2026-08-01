# UI Governance Standard (`UI_GOVERNANCE.md`)

This document defines the absolute Single Source of Truth (SSOT) rules for all user interface development across Esparex applications. These rules are non-negotiable and enforced via automated ESLint checks and CI gates.

## 1. Design Tokens First
**Rule**: No inline design values are allowed. Everything must use a design token.
- **Colors**: No hardcoded hex codes (`#ffffff`, `#000`). Use semantic tokens (e.g., `text-brand-500`, `bg-surface`).
- **Spacing**: No arbitrary pixel values (`margin: 15`). Use the spacing scale (`m-4`, `p-2`).
- **Typography**: No inline font sizes. Use semantic scales (`text-sm`, `text-xl`).
- **Radius**: No arbitrary border radii. Use `rounded-md`, `rounded-full`.

## 2. Primitive Components Only
**Rule**: React Native primitive components are banned in feature screens. You must use the `packages/mobile-ui` wrapper primitives.
- `Text` ➔ `AppText`
- `TextInput` ➔ `AppInput`
- `Button` ➔ `AppButton`
- `Modal` ➔ `AppModal`

*Why?* Centralizes typography, accessibility (WCAG), and spacing logic in one place.

## 3. Layout Standardization
**Rule**: Every screen must use a unified layout primitive.
- Every top-level view must be wrapped in a `<Screen>`, `<ScrollScreen>`, or `<KeyboardScreen>`.
- Internal vertical spacing must use `<Stack>`.
- Internal horizontal spacing must use `<Stack direction="row">` or `<Grid>`.

## 4. Accessibility (a11y)
**Rule**: UI elements must be natively accessible.
- **Touch Targets**: Minimum 44x44 points for all interactive elements.
- **Labels**: Use `accessibilityLabel` for all icon-only buttons.
- **Contrast**: Text must meet WCAG AA contrast ratio against its background.

## 5. Dark Mode Parity
**Rule**: Dark mode is a first-class citizen, not an afterthought.
- Never use fixed color classes that don't respond to dark mode (e.g., `text-black`).
- Always use adaptive semantic classes that have built-in dark mode definitions.

## 6. Icons
**Rule**: Never import raw icon libraries into screens.
- Use the central `<AppIcon>` component. This allows swapping underlying icon sets (Lucide, Material, custom SVG) without refactoring screens.

## Enforcement
These standards are enforced via:
- ESLint custom rules (`no-restricted-imports`) prohibiting React Native primitive imports outside of `packages/mobile-ui`.
- Type-checking preventing arbitrary design token usage.
- Automated tests verifying basic a11y standards.
