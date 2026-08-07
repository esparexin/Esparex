# Esparex Platform UI Governance Contract (`UI_GOVERNANCE_CONTRACT.md`)

```text
Version:         v1.0.0
Status:          APPROVED & LOCKED
Owner:           Platform Architecture & Core UI/UX Team
Effective Date:  2026-08-07
Review Cadence:  Quarterly
Supersedes:      None
Governing ADRs:  ADR-001 (Design Tokens SSOT), ADR-002 (Component Ownership),
                 ADR-003 (Responsive Architecture), ADR-004 (Accessibility Baseline),
                 ADR-005 (Platform Boundary Rules)
```

---

## 🎯 1. Purpose & Scope

This contract serves as the living, authoritative Single Source of Truth governing all user interface design, token management, component creation, responsive behavior, accessibility, and platform boundaries across **Web (`apps/web`)**, **Admin (`apps/admin`)**, **Mobile Web**, **Android**, and **iOS (`apps/mobile`)**.

---

## 🏛️ 2. UI Foundation Principles

Every UI component, layout, and feature implemented across Esparex must adhere strictly to these 5 core principles:

1. **SSOT First**: Design tokens (`@esparex/design-tokens`) are the only authoritative source of design values (colors, typography, spacing, radius, breakpoints, elevation, motion).
2. **Composition Over Duplication**: Pages and screens must be assembled by composing shared primitives rather than writing custom ad-hoc layout markup or duplicate local components.
3. **Responsive by Default**: Interfaces adapt dynamically to viewports via CSS breakpoint utilities (`hidden md:flex`, `flex md:hidden`). Rendering duplicate component trees for desktop vs mobile is strictly forbidden unless platform capabilities natively differ.
4. **Accessibility by Default**: Every interactive control must meet WCAG 2.2 AA standards (touch targets $\ge 44\text{dp}$, visible focus rings, keyboard navigation, ARIA attributes) natively without requiring feature developers to add extra styling.
5. **Platform Consistency**: Web, Admin, Mobile Web, Android, and iOS share the identical design language, token contracts, and visual semantics while respecting platform-native interaction patterns.

---

## 📦 3. Component Ownership Matrix & Maturity Levels

Every UI component in the monorepo has an assigned maturity level and exactly one canonical owner package.

```text
Maturity Levels:
  🔒 STABLE / PROTECTED   — Reusable across apps; public API locked; breaking changes prohibited.
  ⚙️ INTERNAL / ADAPTIVE   — Application-specific or platform adapter wrapper.
  🧪 EXPERIMENTAL          — Feature-scoped trial component (Must be promoted or retired within 1 sprint).
```

| Component Primitive | Maturity Level | Canonical Owner | Package Location | Prohibited In |
|---|:---:|---|---|---|
| **Design Tokens** | 🔒 Stable | `@esparex/design-tokens` | `packages/design-tokens` | Local app inline magic values |
| **Web Primitives** (`Button`, `Input`, `Select`, `Dialog`, `Container`, `Popup`) | 🔒 Stable | `@esparex/ui` | `packages/ui` | `apps/web/src/components/ui/Button.tsx` |
| **Mobile Primitives** (`AppButton`, `AppInput`, `Screen`, `Container`) | 🔒 Stable | `@esparex/mobile-ui` | `packages/mobile-ui` | Feature-level duplicate controls |
| **Icons Registry** | 🔒 Stable | `@esparex/ui` & `lucide-react-native` | `packages/ui/atoms/icons.ts` | Ad-hoc SVG inline definitions |
| **Web-Specific Primitives** (`Card`, `Badge`, `Accordion`, `DropdownMenu`, `Skeleton`) | ⚙️ Internal | Web App Shell | `apps/web/src/components/ui` | Unjustified promotion to `@esparex/ui` |
| **Web App Guards & Shells** (`EmptyStateShell`, `PageStateGuard`, `SafeImage`) | ⚙️ Internal | Web Application | `apps/web/src/components/ui` | Core package primitives |

---

## 🌐 4. Multi-Platform Boundaries

To prevent forced reuse where platforms naturally differ, Esparex classifies UI capabilities into 4 explicit boundary tiers:

```text
                                  @esparex/design-tokens
                 (Colors, Spacing, Typography, Radius, Shadows, Motion)
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
   Shared Concepts                     Web Only                           Mobile Only
(Button, Input, Modal, Nav)     (Radix Dialog, Popover, Tables)   (Bottom Sheet, Native Stack, Safe Area)
```

1. **Shared Across All Platforms (Token SSOT)**:
   - Colors, spacing, typography scales, border radius, shadows, breakpoints, motion durations/easings, elevation scale.
2. **Web Only (Desktop & Mobile Web)**:
   - Radix Dialogs, Popovers, Dropdown Menus, HTML Tables (`DataTable`), CSS Grid/Flex layout utilities.
3. **Mobile Only (iOS & Android Native)**:
   - Bottom Sheets, Native Stack Navigator, Safe Area Compensation, Pressable Haptics, Native Gestures.
4. **Shared Concept, Platform-Specific Implementation**:
   - `Button`, `Input`, `Avatar`, `Badge`, `Card`, `Modal/Dialog`, `Navigation` (Implemented via `@esparex/ui` on Web and `@esparex/mobile-ui` on Mobile).

---

## 📐 5. Responsive Behavior Matrix

Component layout and navigation behavior adapt dynamically across standard breakpoints:

| Breakpoint | Viewport Range | Layout Structure | Navigation Pattern | Sidebar Behavior | Dialog / Modal Presentation |
|---|:---:|---|---|---|---|
| **`sm`** | `< 768px` | Single Column (`grid-cols-1`) | Mobile Bottom Navigation + Drawer | Hidden / Slide-over Drawer | Full-screen or Bottom Sheet (`<Drawer>`) |
| **`md`** | `768px – 1023px` | Two Column (`md:grid-cols-2`) | Top Header Shell + Drawer Sheet | Collapsible Drawer | Centered Large Sheet / Dialog |
| **`lg`** | `1024px – 1279px` | Multi-Column (`lg:grid-cols-3`) | Top Header Shell + Nav Links | Collapsible Sidebar | Centered Standard `<Dialog>` |
| **`xl`** | `1280px – 1535px` | Wide Grid (`xl:grid-cols-4`) | Top Header Shell + Account Menu | Persistent Sidebar | Standard `<Dialog>` |
| **`2xl`** | `≥ 1536px` | Ultra-wide Dashboard Grid | Full Header Shell | Persistent Widescreen Sidebar | Standard `<Dialog>` |

---

## 🚫 6. Explicit Prohibitions ("Do Not" Rules)

The following practices are strictly forbidden monorepo-wide to prevent architectural drift:

1. **Do NOT hardcode colors**: Raw hex codes, RGB values, or ad-hoc Tailwind color utilities (`#2563eb`, `bg-blue-600`) are forbidden. Always reference design tokens (`semantic.light.action`, `--color-action`).
2. **Do NOT hardcode spacing values**: Magic padding/margin numbers (`padding: 13px`) are forbidden. Use spacing scale tokens (`spacing[4]`, `p-4`).
3. **Do NOT introduce page-specific typography scales**: Defining custom `font-size` or `line-height` classes inside page files is prohibited.
4. **Do NOT duplicate shared primitives**: Creating local `Button.tsx`, `Input.tsx`, or `Modal.tsx` components inside feature folders is prohibited.
5. **Do NOT create alternate responsive breakpoints**: Adding custom media queries outside `sm`, `md`, `lg`, `xl`, `2xl` is prohibited.
6. **Do NOT bypass design tokens**: Using inline `style={{ ... }}` to override design system values is strictly forbidden (Zero Inline Styles Policy).
7. **Do NOT create parallel navigation systems**: All navigation must use `HeaderShell` / `BottomNavigation` on Web and Native Stack / Bottom Tabs on Mobile.
8. **Do NOT introduce local design systems**: Creating isolated theme objects or styling abstractions outside `@esparex/design-tokens` is prohibited.

---

## 🔄 7. Change Management, Exception Process & Review Cadence

### A. Change Management Policy
* **Design Token Modifications**: Any change to `@esparex/design-tokens` requires an Architecture Decision Record (ADR) evaluating backwards compatibility across Web, Admin, and Mobile.
* **Primitive Promotions**: Promoting an application component from `apps/web` or `apps/mobile` into `@esparex/ui` or `@esparex/mobile-ui` requires documented evidence of active cross-package consumption by at least 2 independent features or applications.
* **Breaking Changes**: Breaking changes to primitive prop signatures are strictly prohibited without a deprecation window and backwards-compatible alias layer.

### B. Controlled Exception Process
In rare cases where platform constraints prevent strict compliance:
```text
Exception Request ──► Architecture Review ──► Time-Limited Approval ──► CI Exemption Flag ──► Resolution before Release
```

### C. Deprecation Lifecycle
```text
Experimental ──► Supported ──► Deprecated (Warning emitted) ──► Removal Scheduled ──► Removed
```

### D. Governance Review Cadence
This contract undergo a formal **Quarterly Architecture Review** by the Platform Architecture Team to evaluate token evolution, component promotion requests, and deprecation schedules. Next scheduled review: **November 2026**.

---

## 🤖 8. Automated CI Enforcement Rules

Compliance with this contract is validated automatically in CI via automated lint & governance scripts:

- `npm run guard:shared-ssot` — Enforces 0 local primitive duplicates in `apps/web/src/components/ui/`.
- `npm run guard:duplicate-code` — Enforces zero duplicate layout containers or un-used primitives.
- `npm run type-check` — Enforces 100% strict TypeScript contract compliance across all packages.
