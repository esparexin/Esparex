# ESLint Legacy Baseline Audit & Ratchet Ledger (SSOT Reference Point)

## 1. Audit Overview
- **Starting Baseline:** 134 Allowed Legacy Violations
- **New / Critical Violations:** 0
- **Governing Scripts:**
  - Enforcement Gate: `scripts/lint-baseline-enforcement.js`
  - Generator: `scripts/generate-eslint-baseline.js`
  - Canonical Ledger: `eslint-baseline.json`

---

## 2. Rule & Category Breakdown

| Category | Rule ID | Count | Action Plan |
|---|---|---|---|
| **Unused Code** | `@typescript-eslint/no-unused-vars` | 38 | Remove unused imports and variables |
| **Unused Code** | `unused-imports/no-unused-vars` | 37 | Remove unused imports and variables |
| **Unused Code** | `unused-imports/no-unused-imports` | 8 | Remove unused import specifiers |
| **Global Declarations** | `no-undef` | 16 | Configure Jest globals for test setup files |
| **React State in Effects** | `react-hooks/set-state-in-effect` | 18 | Derive state declaratively / event-driven |
| **Strict Typing** | `@typescript-eslint/no-explicit-any` | 3 | Use canonical contract DTOs |
| **Hook Dependencies** | `react-hooks/exhaustive-deps` | 4 | Wrap in useMemo/useCallback or declare deps |
| **Residual Rules** | `no-console` | 3 | Remove or replace with repository logger |
| **Residual Rules** | `@typescript-eslint/no-this-alias` | 2 | Refactor to arrow functions / typed this |
| **Residual Rules** | `no-case-declarations` | 1 | Wrap switch case clauses in block scopes `{}` |
| **Residual Rules** | `react-hooks/incompatible-library` | 1 | Decouple watch subscription in form hook |
| **Residual Rules** | `null` (syntax/directive) | 3 | Ignore Pods in ESLint & remove unused directive |
| **TOTAL** | | **134** | Target: **0** |

---

## 3. Workspace Distribution

- `apps/mobile`: 45
- `scripts/*`: 55
- `apps/web`: 15
- `apps/admin`: 6
- `tooling/*`: 6
- `core/src`: 3
- `packages/mobile-ui`: 3
- `packages/ui`: 2
- `backend/api`: 1
- `shared.js`: 2

---

## 4. Phase Ratchet Milestones

```text
Phase 1: Audit Reference Point (134 allowed)
Phase 2: Safe Unused-Code Cleanup (134 -> 51)
Phase 3: Script/Test Globals (51 -> 35)
Phase 4: React State in Effects (35 -> 17)
Phase 5: Strict Type Cleanup (17 -> 14)
Phase 6: Hook Dependencies & Residuals (14 -> 0)
Phase 7: Ratchet Baseline Ledger to 0
Phase 8: Full Verification & Final Gate Proof
```
