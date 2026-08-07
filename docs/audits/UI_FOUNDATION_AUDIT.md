# Shared UI Foundation Verification & Platform UI Contract (`UI_FOUNDATION_AUDIT.md`)

**Execution Date**: August 7, 2026  
**Auditor**: Esparex Lead UI/UX & Platform Architect  
**Branch**: `refactor/ui-foundation-sprint-1`  
**Sprint Status**: ✅ **COMPLETED, VERIFIED & LOCKED (READY FOR PR)**  
**Scope**: Shared UI Foundation across Web (`apps/web`), Admin (`apps/admin`), Mobile (`apps/mobile`), Web UI Package (`packages/ui`), Mobile UI Package (`packages/mobile-ui`), and Design Tokens (`packages/design-tokens`).  

---

## 🎯 Final Sprint Goal

> **Establish the single UI foundation for Esparex across Web, Admin, Mobile Web, Android, and iOS by validating, consolidating, and documenting the complete UI contract while removing verified duplicate, orphaned, and legacy UI code. No new features, no visual redesign, no behavioral changes, and no unnecessary public APIs.**

---

## 🏛️ 1. Platform UI Contract (Definitive Reference)

This contract serves as the non-negotiable Single Source of Truth for every future page, layout, form, dialog, and component implementation across Esparex.

### A. Layout Contract
* **Maximum Page Width**: `1280px` (`max-w-7xl`) for standard wide layouts; `1536px` (`max-w-screen-2xl`) for dashboards.
* **Container Variants**:
  - `sm` / `compact`: `768px` (`max-w-3xl` / `max-w-xl`) — Form wizards, auth screens, settings.
  - `md` / `default`: `1024px` (`max-w-5xl` / `max-w-3xl`) — Standard article and listing detail viewports.
  - `lg` / `wide`: `1280px` (`max-w-7xl`) — Search feeds, catalog grids, account dashboards.
  - `full`: `100%` (`max-w-full`) — Full-bleed headers, hero banners, analytics grids.
* **Section Spacing**: Vertical section padding `py-6 md:py-8`; stack gap `space-y-4 md:space-y-6`.
* **Gutters & Page Padding**: Horizontal gutters `px-4 sm:px-6 md:px-8`.

---

### B. Typography Contract
* **Font Family**: Primary Google Font `Inter` / `Outfit` (`var(--font-primary)`, `sans-serif`).
* **Heading Scale Hierarchy**:
  - `display`: `36px` (`2.25rem`), line height `1.2`, weight `700` (`bold`), tracking `-0.02em`.
  - `h1`: `30px` (`1.875rem`), line height `1.25`, weight `700` (`bold`), tracking `-0.02em`.
  - `h2`: `24px` (`1.5rem`), line height `1.3`, weight `600` (`semibold`), tracking `-0.01em`.
  - `h3`: `20px` (`1.25rem`), line height `1.35`, weight `600` (`semibold`), tracking `-0.01em`.
  - `h4`: `18px` (`1.125rem`), line height `1.4`, weight `600` (`semibold`), tracking `0`.
* **Body Text Scale**:
  - `body`: `14px` (`0.875rem`), line height `1.55`, weight `400` (`normal`).
  - `small`: `13px` (`0.8125rem`), line height `1.5`, weight `400` (`normal`).
  - `caption`: `12px` (`0.75rem`), line height `1.4`, weight `500` (`medium`).
  - `tiny`: `11px` (`0.6875rem`), line height `1.4`, weight `500` (`medium`).

---

### C. Responsive Breakpoint Contract
* **Breakpoints SSOT**:
  - `sm`: `640px` — Mobile landcape & small tablet boundary.
  - `md`: `768px` — Desktop / Mobile layout transformation boundary.
  - `lg`: `1024px` — Tablet landscape & laptop boundary.
  - `xl`: `1280px` — Desktop widescreen boundary.
  - `2xl`: `1536px` — Ultra-wide desktop boundary.
* **Responsive Transformation Rules**:
  - Navigation: Desktop header links (`hidden md:flex`) transform into mobile slide-over `<Drawer>` (`flex md:hidden`).
  - Overlay Presentation: Mobile touch viewports render bottom slide-up `<Drawer>` or `<Sheet>`; Desktop viewports render centered `<Dialog>`.

---

### D. Navigation Contract
* **Desktop Navigation**: Top header shell (`HeaderShell`) with inline primary links, search bar, and user account dropdown.
* **Mobile Web Navigation**: Sticky header with brand logo, search trigger, and bottom fixed tab bar (`BottomNavigation`: Home, Search, Post Ad, Chat, Account).
* **React Native App Navigation**: Native Stack Navigator + Bottom Tab Bar with safe-area bottom inset compensation.

---

### E. Forms & Inputs Contract
* **Input Height**: Standardized 48dp (`h-12` / `48px`) across Web inputs (`Input.tsx`) and Mobile inputs (`AppInput.tsx`).
* **Button Height**:
  - `lg`: 56dp (`py-4` / `h-14`) — Primary CTA / Hero actions.
  - `md`: 48dp (`py-3` / `h-12`) — Standard form submit buttons.
  - `sm`: 32dp (`py-2` / `h-8`) — Compact inline actions (Includes internal `hitSlop` to satisfy 44dp WCAG minimum touch bound).
* **Label Spacing**: Standardized `mb-2` margin below form labels.
* **Error Presentation**: Unified `FormError` component displaying `text-error text-xs mt-1`.
* **Disabled & Loading States**: `opacity-50 pointer-events-none` with spinning `ActivityIndicator` / `Spinner`.

---

### F. Dialogs & Modals Contract
* **Max Widths**: `sm` (`max-w-lg`), `md` (`max-w-xl`), `lg` (`max-w-2xl`).
* **Padding**: Body padding `p-6`; Header/Footer border separators `border-b` / `border-t` `py-4 px-6`.
* **Action Footer**: Right-aligned flex container `flex flex-row justify-end gap-3`.

---

### G. Tables & Data Display Contract
* **Responsive Strategy**: Data tables wrap inside `overflow-x-auto` with sticky headers (`sticky top-0 z-10 bg-white`).
* **Pagination**: Standardized `DataTablePagination` control displaying page count, total items, and page size selector.
* **Empty State**: Integrated `EmptyStateShell` displaying title, icon, description, and primary CTA.

---

## 🔒 2. Executed Pre-Deletion Verification Gates

Before removing `apps/web/src/components/ui/PageContainer.tsx`, all 8 pre-deletion gates were executed with 0 hits:
1. Zero runtime imports
2. Zero type-only imports
3. Zero dynamic imports
4. Zero package index exports
5. Zero Storybook references
6. Zero test references
7. Zero documentation references
8. Zero build references

---

## 📐 3. Component Duplication Matrix (`apps/web/src/components/ui/`)

| File Path | Classification | Re-exports `@esparex/ui`? | Action Executed |
|---|---|:---:|---|
| `checkbox.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `dialog.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `field.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `FormError.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `input.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `label.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `radio-group.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `select.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `switch.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `textarea.tsx` | Canonical Re-export | ✅ YES | Kept as-is |
| `EmptyStateShell.tsx` | App-Specific Layout Shell | ❌ No | Kept (Web App Shell) |
| `PageStateGuard.tsx` | App-Specific Routing Guard | ❌ No | Kept (Web App Guard) |
| `SafeImage.tsx` | App-Specific Image Wrapper | ❌ No | Kept (Next.js Image Fallback) |
| `accordion.tsx` | Web App Radix Primitive | ❌ No | Kept (Distinct Web Primitive) |
| `badge.tsx` | Web App Radix Primitive | ❌ No | Kept (Distinct Web Primitive) |
| `card.tsx` | Web App Radix Primitive | ❌ No | Kept (Distinct Web Primitive) |
| `dropdown-menu.tsx` | Web App Radix Primitive | ❌ No | Kept (Distinct Web Primitive) |
| `separator.tsx` | Web App Radix Primitive | ❌ No | Kept (Distinct Web Primitive) |
| `skeleton.tsx` | Web App Radix Primitive | ❌ No | Kept (Distinct Web Primitive) |
| `PageContainer.tsx` | **Unused Legacy Abstraction** | ❌ No | **Removed** (Passed 8 pre-deletion gates) |
| `useMobile.ts` | Interaction Utility | N/A | Kept (Interaction Hook) |
| `utils.ts` | Classname Merge Utility | N/A | Kept (Local `cn` Helper) |

---

## 🏆 4. Sprint Success Criteria Verification Matrix

| Criterion | Requirement | Verification Result | Status |
|---|---|---|:---:|
| **1. Token SSOT** | One token source across Web and Mobile | `@esparex/design-tokens` mapped in `@esparex/mobile-ui` | ✅ **PASSED** |
| **2. Shared Primitives** | 0 un-flagged duplicate primitives | Verified 6 distinct primitives vs re-exports | ✅ **PASSED** |
| **3. Orphaned / Legacy Code** | 0 remaining orphaned files | `PageContainer.tsx` deleted | ✅ **PASSED** |
| **4. Responsive Standard** | Single-instance CSS utilities (`hidden md:flex`) | Verified 0 static JS layout branching | ✅ **PASSED** |
| **5. Accessibility Baseline** | 44dp minimum touch target hitSlop | Internal `computedHitSlop` in `AppButton` | ✅ **PASSED** |
| **6. Visual Regressions** | 0 visual appearance changes | Verified clean | ✅ **PASSED** |
| **7. Behavioral Regressions**| 0 public API or behavior changes | Verified clean | ✅ **PASSED** |
| **8. Feature Work** | 0 new features added | Verified clean | ✅ **PASSED** |
| **9. Quality Gates** | `type-check` & `test` Exit Code 0 | All 129 Test Suites & Type-Checks Pass | ✅ **PASSED** |
| **10. Dedicated PR** | One PR on `refactor/ui-foundation-sprint-1` | 5 Clean Commits Executed | ✅ **PASSED** |

---

## 📜 Executed Git Commit Trajectory (`refactor/ui-foundation-sprint-1`)

```text
e398ff02 docs(ui): verify shared UI foundation
b89463e6 refactor(tokens): align mobile token adapter with design tokens
d59df07f refactor(ui): remove verified duplicate and orphaned UI code
4649f460 fix(a11y): improve shared mobile touch targets
f93f0f1f chore(ui): verify build, lint, type-check and regression
```
