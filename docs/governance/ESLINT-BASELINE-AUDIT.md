# ESLint Legacy Baseline Audit & Ratchet Ledger (SSOT Reference Point)

## 1. Audit Overview
- **Starting Baseline:** 134 Allowed Legacy Violations
- **Final Baseline:** 0 Allowed Legacy Violations (`[]`)
- **New / Critical Violations:** 0
- **Governing Scripts:**
  - Enforcement Gate: `scripts/lint-baseline-enforcement.js`
  - Generator: `scripts/generate-eslint-baseline.js`
  - Canonical Ledger: `eslint-baseline.json`

---

## 2. Rule & Category Breakdown & Resolution

| Category | Rule ID | Starting Count | Final Count | Resolution Strategy |
|---|---|---|---|---|
| **Unused Code** | `@typescript-eslint/no-unused-vars` | 38 | 0 | Removed unused parameters, imports, and variables |
| **Unused Code** | `unused-imports/no-unused-vars` | 37 | 0 | Cleaned up unused import variables |
| **Unused Code** | `unused-imports/no-unused-imports` | 8 | 0 | Removed redundant import specifiers |
| **Global Declarations** | `no-undef` | 16 | 0 | Configured Jest globals in mobile setup and eslint config |
| **React State in Effects** | `react-hooks/set-state-in-effect` | 18 | 0 | Derived state, used `useSyncExternalStore` & internal async loaders |
| **Strict Typing** | `@typescript-eslint/no-explicit-any` | 3 | 0 | Replaced `any` with canonical contract DTOs |
| **Hook Dependencies** | `react-hooks/exhaustive-deps` | 4 | 0 | Wrapped in `useMemo` / added stable dependencies |
| **Residual Rules** | `no-console` | 3 | 0 | Removed unnecessary console logging |
| **Residual Rules** | `@typescript-eslint/no-this-alias` | 2 | 0 | Typed `this` parameter via `AggregateContext` in Mongoose hooks |
| **Residual Rules** | `no-case-declarations` | 1 | 0 | Wrapped switch case clauses in block scopes `{}` |
| **Residual Rules** | `react-hooks/incompatible-library` | 1 | 0 | Configured off in ESLint flat config for React Hook Form |
| **Residual Rules** | `null` (syntax/directive) | 3 | 0 | Ignored CocoaPods in ESLint & removed unused directive |
| **TOTAL** | | **134** | **0** | **100% Resolved to Zero** |

---

## 3. Workspace Distribution

- `apps/mobile`: 45 -> 0
- `scripts/*`: 55 -> 0
- `apps/web`: 15 -> 0
- `apps/admin`: 6 -> 0
- `tooling/*`: 6 -> 0
- `core/src`: 3 -> 0
- `packages/mobile-ui`: 3 -> 0
- `packages/ui`: 2 -> 0
- `backend/api`: 1 -> 0
- `shared.js`: 2 -> 0

---

## 4. Phase Ratchet Ledger & Commits

```text
Phase 1: [6116c185] chore(lint): audit legacy baseline enforcement (134 baseline audited)
Phase 2: [0bc00c7a] refactor(lint): remove legacy unused code (134 -> 51)
Phase 3: [4d74c7b1] fix(lint): resolve legacy script globals (51 -> 35)
Phase 4: [05955bed] refactor(react): remove legacy state effect cascades (35 -> 17)
Phase 5: [7c8b800f] refactor(types): eliminate legacy loose types (17 -> 14)
Phase 6: [b0383524] fix(lint): resolve remaining baseline violations (14 -> 0)
Phase 7: [820707c2] chore(lint): ratchet legacy baseline to zero (eslint-baseline.json -> [])
Phase 8: [current]  test(lint): verify zero legacy violations (CI & negative proof verified)
```

---

## 5. Verification & Negative Proof

### Verification Checks
1. **Full Repository Lint:**
   ```bash
   npm run lint:ci
   ```
   **Output:**
   ```text
   📊 Lint Audit Summary:
   ✅ Legacy Violations (Allowed): 0
   ❌ New/Critical Violations: 0
   --------------------------------------------------
   🎉 Governance Check Passed! No new violations introduced.
   ```

2. **Monorepo Type Check:**
   ```bash
   npm run type-check
   ```
   **Result:** Exit code `0` across all packages (`@esparex/design-tokens`, `@esparex/contracts`, `@esparex/shared`, `@esparex/core`, `@esparex/backend-api`, `@esparex/apps-admin`, `@esparex/apps-web`, `@esparex/mobile-ui`, `@esparex/apps-mobile`).

3. **Repository Gate:**
   ```bash
   node scripts/git/repo-gate.js
   ```
   **Result:** 18/18 checks passed (Score 100/100, zero circular dependencies, zero duplicate rate regressions).

### Negative Proof Verification
- Injected an intentional unused variable violation into `packages/shared/src/test-negative-proof.ts`.
- Verified that `scripts/lint-baseline-enforcement.js` caught the new violation, reported:
  `❌ New/Critical Violations: 2`, and exited with exit code `1`.
- Cleaned up the test fixture immediately afterwards.
