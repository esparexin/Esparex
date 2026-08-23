# Esparex UI Technical Specification (`UI_TECHNICAL_SPECIFICATION.md`)

```text
Status:          LIVING SINGLE SOURCE OF TRUTH (SSOT)
Owner:           Platform Architecture & Frontend/Mobile Engineering
Applies To:      Web (apps/web), Admin (apps/admin), Mobile Web, Android, iOS (apps/mobile)
Packages:        @esparex/design-tokens, @esparex/ui, @esparex/mobile-ui
```

---

## 🎯 1. Overview & Core Philosophy

This technical specification is the single reference document for developers implementing UI across Esparex. Every page, form, layout, button, modal, and control must adhere strictly to these technical standards.

* **"What was done in Sprint 1?"** ➔ See [`docs/audits/UI_FOUNDATION_AUDIT.md`](../audits/UI_FOUNDATION_AUDIT.md)
* **"How should UI be implemented from now on?"** ➔ Follow this document.

---

## 📦 2. Component Ownership & Package Boundaries

Every UI component in the monorepo has an assigned owner package:

| Component Primitive | Owner Package | Source Path | Allowed Usage |
|---|---|---|---|
| **Design Tokens** | `@esparex/design-tokens` | `packages/design-tokens` | Primary source for all design values |
| **Web Primitives** (`Button`, `Input`, `Select`, `Dialog`, `Container`, `Popup`) | `@esparex/ui` | `packages/ui` | Shared Web / Admin components |
| **Mobile Primitives** (`AppButton`, `AppInput`, `Screen`, `Container`) | `@esparex/mobile-ui` | `packages/mobile-ui` | Shared React Native components |
| **Icons Registry** | `@esparex/ui` & `lucide-react-native` | `packages/ui/atoms/icons.ts` | Shared icon components |
| **Web App Primitives** (`Card`, `Badge`, `Accordion`, `DropdownMenu`, `Skeleton`) | Web App Shell | `apps/web/src/components/ui` | Web application layout & display |
| **Web App Guards** (`EmptyStateShell`, `PageStateGuard`, `SafeImage`) | Web Application | `apps/web/src/components/ui` | Web application routing & state |

---

### 2.1 Component Lifecycle Maturity Taxonomy

*Previously documented in `docs/architecture/ESPAREX_UI_COMPONENT_GUIDELINES.md`. Consolidated here per DOCUMENTATION-GOVERNANCE §7 anti-sprawl policy.*

```text
Experimental  ──►  Internal  ──►  Public  ──►  Stable  ──►  Deprecated  ──►  Legacy
(Local feature)   (@esparex/ui)  (Documented)  (L4 Standard) (JSDoc notice)  (To be deleted)
```

- **Stable**: Fully tested, WCAG 2.2 AA compliant, tokenized, zero breaking changes permitted.
- **Deprecated**: Maintained only for backwards compatibility; points developers to the canonical replacement with JSDoc `@deprecated` annotation.
- **Legacy**: Scheduled for removal in the next cleanup phase. Do not use in new code.


---

## 🌐 3. Multi-Platform Boundaries (Web vs Mobile)

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

## 🎨 4. Design Tokens & Semantic Color Usage

All visual styling must consume tokens from `@esparex/design-tokens`:

### Palette Reference
* **Action Primary**: `semantic.light.action` (`#2563eb` / `--color-action`) — Primary buttons, active links, focus indicators.
* **Brand Primary**: `base.brand[600]` (`#0284c7`) / `base.brand[500]` (`#0ea5e9`).
* **Slate Grayscale**: `base.slate[50]` to `base.slate[950]`.
* **Feedback Colors**:
  - `success`: `#10b981` (Subtle: `#dcfce7`, Dark: `#16a34a`)
  - `error`: `#ef4444` (Subtle: `#fee2e2`, Dark: `#dc2626`)
  - `warning`: `#f59e0b` (Subtle: `#fef3c7`, Dark: `#d97706`)
  - `info`: `#3b82f6` (Subtle: `#eff6ff`, Dark: `#1d4ed8`)

---

## 📐 5. Layout & Container Specifications

* **Maximum Page Width**: `1280px` (`max-w-7xl`) for wide layouts; `1536px` (`max-w-screen-2xl`) for dashboards.
* **Container Variants**:
  - `compact`: `768px` (`max-w-3xl`) — Form wizards, auth screens, settings.
  - `default`: `1024px` (`max-w-5xl`) — Detail views and articles.
  - `wide`: `1280px` (`max-w-7xl`) — Search feeds, catalog grids, dashboards.
  - `full`: `100%` (`max-w-full`) — Hero banners and full-bleed headers.
* **Gutters & Padding**: Horizontal gutters `px-4 sm:px-6 md:px-8`; section spacing `py-6 md:py-8`.

---

## 🔤 6. Typography Scale Specifications

* **Font Family**: Google Fonts `Inter` / `Outfit` (`var(--font-primary)`, `sans-serif`).
* **Scale Breakdown**:
  - `display`: `36px` (`2.25rem`), line height `1.2`, weight `700` (`bold`).
  - `h1`: `30px` (`1.875rem`), line height `1.25`, weight `700` (`bold`).
  - `h2`: `24px` (`1.5rem`), line height `1.3`, weight `600` (`semibold`).
  - `h3`: `20px` (`1.25rem`), line height `1.35`, weight `600` (`semibold`).
  - `h4`: `18px` (`1.125rem`), line height `1.4`, weight `600` (`semibold`).
  - `body`: `14px` (`0.875rem`), line height `1.55`, weight `400` (`normal`).
  - `small`: `13px` (`0.8125rem`), line height `1.5`, weight `400` (`normal`).
  - `caption`: `12px` (`0.75rem`), line height `1.4`, weight `500` (`medium`).
  - `tiny`: `11px` (`0.6875rem`), line height `1.4`, weight `500` (`medium`).

---

## 📱 7. Comprehensive Responsive Behavior Matrix

| Breakpoint | Viewport Range | Layout Structure | Navigation Pattern | Sidebar Behavior | Dialog / Modal Presentation |
|---|:---:|---|---|---|---|
| **`sm`** | `< 768px` | Single Column (`grid-cols-1`) | Mobile Bottom Navigation + Drawer | Hidden / Slide-over Drawer | Full-screen or Bottom Sheet (`<Drawer>`) |
| **`md`** | `768px – 1023px` | Two Column (`md:grid-cols-2`) | Top Header Shell + Drawer Sheet | Collapsible Drawer | Centered Large Sheet / Dialog |
| **`lg`** | `1024px – 1279px` | Multi-Column (`lg:grid-cols-3`) | Top Header Shell + Nav Links | Collapsible Sidebar | Centered Standard `<Dialog>` |
| **`xl`** | `1280px – 1535px` | Wide Grid (`xl:grid-cols-4`) | Top Header Shell + Account Menu | Persistent Sidebar | Standard `<Dialog>` |
| **`2xl`** | `≥ 1536px` | Ultra-wide Dashboard Grid | Full Header Shell | Persistent Widescreen Sidebar | Standard `<Dialog>` |

---

## 🎛️ 8. Component Standards (Forms, Buttons, Dialogs, Tables, Cards)

### Forms & Controls
* **Control Height**: Standardized 48dp (`h-12` / `48px`) across Web inputs (`Input.tsx`) and Mobile inputs (`AppInput.tsx`).
* **Button Heights**: `lg` = 56dp, `md` = 48dp, `sm` = 32dp + 8dp internal `hitSlop` (Satisfying 44dp WCAG minimum bound).
* **Label Spacing**: `mb-2` margin below form labels.
* **Error Presentation**: `FormError` primitive displaying `text-error text-xs mt-1`.

### Dialogs & Modals
* **Max Widths**: `sm` (`max-w-lg`), `md` (`max-w-xl`), `lg` (`max-w-2xl`).
* **Action Footer**: Right-aligned flex container `flex flex-row justify-end gap-3`.

### Data Display & Tables
* **Responsive Strategy**: Data tables wrap inside `overflow-x-auto` with sticky headers (`sticky top-0 z-10 bg-white`).
* **Pagination**: Standardized `DataTablePagination` control.
* **Empty States & Loading**: `EmptyStateShell`, `Spinner`, and `Skeleton`.

---

## ♿ 9. Accessibility Requirements (WCAG 2.2 AA)

* **Touch Targets**: Minimum 44x44 dp on touch devices (handled internally via `hitSlop` on compact components).
* **Focus Visible**: All interactive web controls must have visible focus rings (`focus-visible:ring-2 focus-visible:ring-action`).
* **Screen Readers**: Native semantic HTML5 tags (`<button>`, `<input>`, `<label>`) or `accessibilityRole` / `accessibilityLabel` on Mobile.
* **Modal Overlay Inert**: Hidden overlay subtrees must use `inert` to prevent keyboard focus traversal leaks.

---

## 🛠️ 10. Implementation "DO / DON'T" Rules

### ✅ DO
* **DO** consume components from `@esparex/ui` (Web) or `@esparex/mobile-ui` (Mobile).
* **DO** use CSS breakpoint utilities (`hidden md:flex`, `flex md:hidden`) for responsive layouts.
* **DO** reference design tokens for all colors, typography, spacing, and border radii.
* **DO** ensure all form controls have associated accessible labels.

### ❌ DON'T
* **DON'T** hardcode hex colors (`#2563eb`, `bg-blue-600`) or magic spacing values (`padding: 13px`).
* **DON'T** duplicate shared primitives (`Button`, `Input`, `Dialog`, `Container`) in feature subfolders.
* **DON'T** use JavaScript window checks (`useIsMobile()`) for static layout DOM branching.
* **DON'T** use inline `style={{ ... }}` to override design token values.
