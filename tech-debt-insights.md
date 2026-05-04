# 📊 Esparex Technical Debt Insights

**Generated on:** 5/4/2026, 2:08:29 PM
**Total Violations Locked:** 186
**Affected Files:** 1436

## 🏢 Debt by Workspace
| Workspace | Violations | % of Total |
| :--- | :--- | :--- |
| apps | 139 | 74.7% |
| core | 14 | 7.5% |
| scratch | 11 | 5.9% |
| scripts | 9 | 4.8% |
| backend | 7 | 3.8% |
| shared | 6 | 3.2% |
| eslint.config.js | 0 | 0.0% |
| eslint.config.mjs | 0 | 0.0% |

## 🚨 Top Violating Rules (The "Burn-down" List)
| Rule ID | Count | Impact |
| :--- | :--- | :--- |
| `react-hooks/set-state-in-effect` | 63 | Runtime Stability |
| `no-console` | 28 | Maintenance |
| `@typescript-eslint/no-unused-vars` | 21 | Type Safety |
| `unused-imports/no-unused-vars` | 15 | Maintenance |
| `no-useless-escape` | 11 | Maintenance |
| `null` | 9 | Maintenance |
| `react/no-unescaped-entities` | 8 | Maintenance |
| `@typescript-eslint/no-explicit-any` | 7 | Type Safety |
| `react-hooks/incompatible-library` | 5 | Runtime Stability |
| `react-hooks/immutability` | 4 | Runtime Stability |
| `@typescript-eslint/no-empty-object-type` | 4 | Type Safety |
| `no-empty` | 4 | Maintenance |
| `no-case-declarations` | 2 | Maintenance |
| `react-hooks/static-components` | 1 | Runtime Stability |
| `@typescript-eslint/no-unused-expressions` | 1 | Type Safety |

## 🔥 Hotspots (Fix these first to clear 20% of debt)
| File Path | Violations | Complexity |
| :--- | :--- | :--- |

## 🚀 Recommended Remediation Plan
1. **Cleanup the Hotspots:** Addressing the top 15 files will remove ~0 violations.
2. **Type Safety Drive:** Fix the `@typescript-eslint/no-explicit-any` issues to restore type integrity.
3. **Governance Zero:** There should be 0 `esparex/` rules in this list. Fix those immediately.
