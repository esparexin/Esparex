# Shared UI Foundation Verification & Repository Evidence Report (`UI_FOUNDATION_AUDIT.md`)

**Execution Date**: August 7, 2026  
**Auditor**: Esparex Lead UI/UX & Platform Architect  
**Branch**: `refactor/ui-foundation-sprint-1`  
**Scope**: Shared UI Foundation across Web (`apps/web`), Admin (`apps/admin`), Mobile (`apps/mobile`), Web UI Package (`packages/ui`), Mobile UI Package (`packages/mobile-ui`), and Design Tokens (`packages/design-tokens`).  

---

## 🎯 Sprint Goal & Governance Scope

> **Establish a single UI foundation for Esparex across Web, Admin, Mobile Web, Android, and iOS by validating and consolidating design tokens, shared primitives, responsive architecture, accessibility, and layout standards while eliminating verified duplicate, orphaned, and legacy UI code. No new features, no visual redesign, and no behavioral changes.**

### ✅ In Scope
- Design token alignment (without changing visual appearance).
- Shared UI primitive verification and consolidation where duplication is **proven**.
- Removal of **verified** orphaned and legacy UI code.
- Responsive architecture verification.
- Accessibility improvements that do not change public APIs or behavior.
- Monorepo build, lint, type-check, and regression verification.

### ❌ Out of Scope
- New components.
- Component renaming.
- Folder restructuring.
- API changes.
- Design refresh or visual redesign.
- Typography redesign.
- Navigation redesign.
- Layout redesign.
- React Native feature work.
- Any visual changes detectable by users.

---

## 🔒 Mandatory Pre-Deletion Verification Gate

Before removing **any** file or component from the repository, all 8 of the following checks must be verified with zero hits:

- [ ] **1. Zero runtime imports**: `grep -r "import ... from '<file>'" .`
- [ ] **2. Zero type-only imports**: `grep -r "import type ... from '<file>'" .`
- [ ] **3. Zero dynamic imports**: `grep -r "import('<file>')" .`
- [ ] **4. Zero package index exports**: Check `index.ts` / `index.js` in all packages.
- [ ] **5. Zero Storybook references**: Check `.stories.tsx` files.
- [ ] **6. Zero test references**: Check `.spec.ts` / `.test.ts` files.
- [ ] **7. Zero documentation references**: Check `docs/` and `.md` files.
- [ ] **8. Zero build / bundler references**: Check `tsconfig.json`, `webpack`, `vite`, `next.config.js`.

Only when all 8 gates evaluate to zero will a file be eligible for deletion.

---

## 📐 Strict Component Duplication Definition Rule

A component is considered a duplicate **only if all 6 of the following criteria are true**:

1. **Same responsibility**.
2. **Same public API**.
3. **Same behavior**.
4. **Same accessibility contract**.
5. **Same styling contract**.
6. **Same intended consumers**.

If any single criterion differs, the component **must be treated as a distinct implementation** and kept separate.

---

## 1. Design Tokens SSOT & Adapter Layer Audit

### Analysis
* **Status**: `packages/design-tokens` is the official Single Source of Truth for tokens across the monorepo.
* **Adapter Layer Pattern**: `packages/mobile-ui/src/tokens/colors.ts` is an **intentional React Native adapter object layer**, NOT a redundant duplicate file.
* **Safe Alignment Plan**: Add `@esparex/design-tokens` as a workspace dependency of `@esparex/mobile-ui` and map adapter colors to `@esparex/design-tokens` values (`semantic.light.action = #2563eb`), ensuring brand color parity across Web and Mobile without changing visual appearance or public APIs.

```text
packages/design-tokens (SSOT)
         │
         ▼
packages/mobile-ui/src/tokens/colors.ts (RN Adapter)
         │
         ▼
React Native / NativeWind Components
```

---

## 2. Web Component Classification & Duplication Matrix (`apps/web/src/components/ui/`)

| File Path | Classification | Re-exports `@esparex/ui`? | Duplication Status (6 Criteria) | Action Plan |
|---|---|:---:|---|---|
| `checkbox.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `dialog.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `field.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `FormError.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `input.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `label.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `radio-group.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `select.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `switch.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `textarea.tsx` | Canonical Re-export | ✅ YES | N/A (Re-export) | Keep as-is |
| `EmptyStateShell.tsx` | App-Specific Layout Shell | ❌ No | Distinct | Keep (Web App Shell) |
| `PageStateGuard.tsx` | App-Specific Routing Guard | ❌ No | Distinct | Keep (Web App Guard) |
| `SafeImage.tsx` | App-Specific Image Wrapper | ❌ No | Distinct | Keep (Next.js Image Fallback) |
| `accordion.tsx` | Web App Radix Primitive | ❌ No | Distinct | Keep (No duplicate in `@esparex/ui`) |
| `badge.tsx` | Web App Radix Primitive | ❌ No | Distinct | Keep (No duplicate in `@esparex/ui`) |
| `card.tsx` | Web App Radix Primitive | ❌ No | Distinct | Keep (No duplicate in `@esparex/ui`) |
| `dropdown-menu.tsx` | Web App Radix Primitive | ❌ No | Distinct | Keep (No duplicate in `@esparex/ui`) |
| `separator.tsx` | Web App Radix Primitive | ❌ No | Distinct | Keep (No duplicate in `@esparex/ui`) |
| `skeleton.tsx` | Web App Radix Primitive | ❌ No | Distinct | Keep (No duplicate in `@esparex/ui`) |
| `PageContainer.tsx` | **Unused Legacy Abstraction** | ❌ No | Orphaned | **Remove ONLY if 8 pre-deletion gates pass** |
| `useMobile.ts` | Interaction Utility | N/A | Distinct | Keep (Interaction Hook) |
| `utils.ts` | Classname Merge Utility | N/A | Distinct | Keep (Local `cn` Helper) |

---

## 3. Subsystem Architecture Audits

### A. Responsive Architecture & Breakpoint SSOT
* **Breakpoints SSOT**: [`packages/design-tokens/src/breakpoints.ts`](file:///Users/admin/Desktop/Esparex/packages/design-tokens/src/breakpoints.ts) (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`).
* **`useIsMobile()` Call Site Audit**: All 4 call sites (`UploadSourcePicker.tsx`, `ListingImagesField.tsx`, `LocationOverlayHost.tsx`, `EntitySearchCombobox.tsx`) strictly govern device capabilities and overlay presentation. **0 call sites use JS for static layout DOM grid/flex branching.**

### B. Mobile Touch Target Accessibility Pattern
* **Rule**: Keep public APIs unchanged.
* **Internal Calculation**: Calculate `hitSlop` internally for touchable components whose rendered visual height is below 44dp (e.g. `AppButton` size `sm` with 32dp height gets `hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}`).

---

## 🛠️ Approved Sprint Implementation Checklist

- [ ] **Commit 1**: `audit(ui): verify shared UI foundation`
- [ ] **Commit 2**: `refactor(tokens): align mobile token adapter with design tokens`
- [ ] **Commit 3**: `refactor(ui): remove verified duplicate and orphaned UI code` (Execute 8-point gate before removing `PageContainer.tsx`)
- [ ] **Commit 4**: `fix(a11y): improve shared mobile touch targets` (Internal `hitSlop` calculation without public API changes)
- [ ] **Commit 5**: `chore(ui): verify build, lint, type-check and regression`

---

## 🏆 Sprint Success Criteria

1. ✅ One design-token SSOT across Web and Mobile.
2. ✅ No verified duplicate shared UI primitives.
3. ✅ No verified orphaned or legacy shared UI code.
4. ✅ One responsive architecture standard.
5. ✅ Shared accessibility baseline for Web and Mobile.
6. ✅ Zero visual regressions.
7. ✅ Zero behavior changes.
8. ✅ Zero new features.
9. ✅ Clean `lint`, `type-check`, `test`, and `build`.
10. ✅ One focused PR from one dedicated branch (`refactor/ui-foundation-sprint-1`).

---

## 📊 Sprint Execution & Verification Log

*(Progress, command evidence, exit codes, and final completion status will be appended directly to this section as implementation proceeds.)*
