# ADR-004: Action Color Semantic Promotion

**Date**: 2026-08-07  
**Status**: Approved  
**Decision Reference**: D-004  
**Author**: Platform Architecture Team  

---

## Context

During Sprint 2 color literal migration (PR 5), 9 instances of `#2563eb` (Tailwind blue-600) were encountered across interactive buttons, prices, and links in mobile screens (`BusinessStatusScreen`, `StepDocumentsUpload`, `PlanSelectionScreen`, `TransactionHistoryScreen`, `SmartAlertsScreen`, `CreateSmartAlertModal`, `BusinessRegistrationWizardScreen`, `SavedAdsScreen`).

The design token system defines `semantic.light.primary` as `#0284c7` (sky-600 — the Esparex brand identity blue).

Directly mapping `#2563eb` to `semantic.light.primary` would create visual drift (changing interactive controls to sky-600 or brand elements to blue-600). These represent two distinct design concerns:
1. **Brand Identity**: Expressed by `semantic.light.primary` (`#0284c7`)
2. **Interactive Affordance / Action**: Expressed by `semantic.light.action` (`#2563eb`)

---

## Decision

**Option A (Chosen)**: Add `semantic.light.action = base.action` (`#2563eb`) and `semantic.dark.action = base.brand[500]` (`#0ea5e9`) to `@esparex/design-tokens`.

Semantic naming rule D-008 is respected: the token is named `action` (intent), not `blue-action` (implementation color).

---

## Alternatives Considered

| Option | Description | Reason Rejected |
|--------|-------------|----------------|
| **Option B** | Replace brand primary (`#0284c7`) with blue-600 (`#2563eb`) monorepo-wide | High risk of visual regression across Web and Mobile brand headers, cards, and badges. |
| **Option C** | Replace all `#2563eb` action buttons with brand primary (`#0284c7`) | Alters established UI affordance contrast for primary call-to-action buttons. |

---

## Consequences

- `semantic.light.action` and `semantic.dark.action` are now part of the canonical public token API.
- All 9 suppressed `#2563eb` literals across 8 files can be replaced with `semantic.light.action`.
- `react-native/no-color-literals` suppressions for action colors are 100% removed.

---

## Verification

- `npx tsc --noEmit` passes in `@esparex/design-tokens` and `apps/mobile`.
- `no-color-literals` lint rule returns 0 violations.
- Visual QA verifies button contrast and appearance.

---

## Rollback

To revert, remove `action` from `semantic.light` / `semantic.dark` in `packages/design-tokens/src/colors.ts` and update consumer StyleSheets.
