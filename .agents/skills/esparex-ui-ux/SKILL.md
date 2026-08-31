---
name: esparex-ui-ux
description: "Authoritative Esparex UI/UX Skill: design system tokens (@esparex/design-tokens), Geist typography SSOT, single-instance responsive architecture, WCAG 2.2 AA accessibility, native popup bus, Admin density, Web marketplace UX, and visual QA."
argument-hint: "[component|page|view] [web|admin|mobile]"
license: MIT
metadata:
  author: esparex
  version: "1.0.0"
---

# Esparex UI/UX Design System & Experience Skill

This skill enforces **Esparex's canonical visual language, design token SSOT, component standards, and accessibility requirements** across `apps/web`, `apps/admin`, `apps/mobile`, `@esparex/ui`, `@esparex/mobile-ui`, and `@esparex/design-tokens`.

---

## Non-Negotiable Core Laws

1. **Semantic Token Consumption Principle**: Primitive tokens define the palette; semantic tokens define meaning; component tokens define implementation. Application code MUST consume **semantic or component tokens** (e.g. `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) rather than primitive names (`bg-slate-50`, `text-slate-700`) wherever an appropriate semantic token exists.
2. **Design Token SSOT (`@esparex/design-tokens`)**: All colors, font scales, spacing, shadows, and radii MUST consume `@esparex/design-tokens` or CSS variables. Arbitrary Tailwind utilities (e.g. `bg-[#123456]`, `p-[17px]`) are strictly forbidden.
3. **Typography SSOT (Geist)**: **Geist** is the single font family SSOT across all applications via `--font-primary`. Do not introduce competing font families (e.g. Inter, Outfit, Roboto).
4. **Single-Instance Responsive Architecture**: Every user-facing UI component must be rendered from a single responsive instance using CSS media utilities (`hidden md:flex`, `grid-cols-1 md:grid-cols-3`). Creating duplicate `Desktop*` vs `Mobile*` components is prohibited.
5. **Native Popup SSOT**: User notifications and alerts MUST use Esparex's single-instance native popup system (`popupBus`, `notify`). External toast packages (`sonner`, `react-hot-toast`) are strictly banned.
6. **WCAG 2.2 AA Compliance**: Minimum 4.5:1 text contrast, 44×44px touch targets on touch surfaces, visible focus rings (`focus-visible:ring-2`), keyboard accessibility (`Tab`, `Enter`, `Escape`), and screen reader ARIA compliance.

---

## Skill Architecture & Reference Map

| Domain | Reference Guide | Content Summary |
|---|---|---|
| **Design Principles** | [`design-principles.md`](file://./design-principles.md) | Core visual philosophy, brand identity, and design goals. |
| **Color System** | [`color-system.md`](file://./color-system.md) | 3-layer tokens (Sky Brand, Slate Neutrals, Indigo Action, Light/Dark semantics). |
| **Typography** | [`typography.md`](file://./typography.md) | Geist font SSOT, discrete scale (`display` $\rightarrow$ `tiny`), Admin density rules. |
| **Spacing & Layout** | [`spacing-layout.md`](file://./spacing-layout.md) | 4px baseline grid, surface hierarchy (`PageShell` $\rightarrow$ `Container` $\rightarrow$ `Section` $\rightarrow$ `Card`). |
| **Components** | [`components.md`](file://./components.md) | `@esparex/ui` & `@esparex/mobile-ui` primitives (`Card`, `Button`, `Dialog`, `Drawer`). |
| **Interaction States** | [`interaction-states.md`](file://./interaction-states.md) | Complete state matrix (`default`, `hover`, `focus-visible`, `disabled`, `loading`, `error`). |
| **Responsive Architecture** | [`responsive.md`](file://./responsive.md) | Single-instance responsive rules, CSS breakpoint mapping, container bounds. |
| **Accessibility (WCAG 2.2 AA)** | [`accessibility.md`](file://./accessibility.md) | Contrast ratios, focus traps, keyboard navigation, screen reader roles. |
| **Admin UX** | [`admin-ux.md`](file://./admin-ux.md) | High-density tables, filter toolbars, status chips, low cognitive load layout. |
| **Marketplace Web UX** | [`marketplace-ux.md`](file://./marketplace-ux.md) | Trust signals, category cards, price formatting, search filters, post-ad wizard. |
| **Mobile App UX** | [`mobile-ux.md`](file://./mobile-ux.md) | Expo React Native standards, bottom sheets, safe areas, mobile gestures. |
| **Visual QA** | [`visual-qa.md`](file://./visual-qa.md) | Visual inspection workflow using Chrome DevTools and Pencil MCP. |
| **Anti-Pattern Registry** | [`anti-patterns.md`](file://./anti-patterns.md) | Forbidden UI patterns, arbitrary classes, and design system forks. |

---

## When to Activate

- Creating or modifying UI components in `apps/web`, `apps/admin`, or `apps/mobile`.
- Designing forms, modals, tables, dashboards, cards, or navigation bars.
- Auditing UI responsiveness, accessibility, design token usage, or visual consistency.
- Conducting visual QA with Pencil MCP or Chrome DevTools.
