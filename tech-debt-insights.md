# 📊 Esparex Technical Debt Insights

**Generated on:** 5/4/2026, 10:15:28 AM
**Total Violations Locked:** 1235
**Affected Files:** 1482

## 🏢 Debt by Workspace
| Workspace | Violations | % of Total |
| :--- | :--- | :--- |
| apps | 674 | 54.6% |
| backend | 210 | 17.0% |
| scripts | 168 | 13.6% |
| core | 95 | 7.7% |
| shared | 79 | 6.4% |
| scratch | 9 | 0.7% |
| eslint.config.js | 0 | 0.0% |
| eslint.config.mjs | 0 | 0.0% |

## 🚨 Top Violating Rules (The "Burn-down" List)
| Rule ID | Count | Impact |
| :--- | :--- | :--- |
| `no-undef` | 349 | Maintenance |
| `no-console` | 324 | Maintenance |
| `null` | 268 | Maintenance |
| `@typescript-eslint/no-explicit-any` | 152 | Type Safety |
| `react/no-unescaped-entities` | 50 | Maintenance |
| `react-hooks/set-state-in-effect` | 37 | Runtime Stability |
| `@typescript-eslint/no-unused-vars` | 12 | Type Safety |
| `no-useless-escape` | 11 | Maintenance |
| `unused-imports/no-unused-vars` | 7 | Maintenance |
| `@typescript-eslint/no-empty-object-type` | 4 | Type Safety |
| `no-empty` | 4 | Maintenance |
| `unused-imports/no-unused-imports` | 4 | Maintenance |
| `react-hooks/immutability` | 3 | Runtime Stability |
| `react-hooks/incompatible-library` | 3 | Runtime Stability |
| `no-case-declarations` | 2 | Maintenance |

## 🔥 Hotspots (Fix these first to clear 20% of debt)
| File Path | Violations | Complexity |
| :--- | :--- | :--- |
| `backend/user/src/scripts/production_smoke_test.ts` | 34 | High |
| `backend/user/scripts/migrate_index_drift.mongosh.js` | 31 | High |
| `backend/user/scripts/remediate_india_guntur_hierarchy.mongosh.js` | 29 | High |
| `apps/web/scripts/analyze-next-build.cjs` | 28 | High |
| `apps/web/scripts/validate-image-domains.cjs` | 21 | High |
| `shared/observability/logger.ts` | 21 | High |
| `backend/user/migrations/20260313000000-master-data-full-repair.js` | 17 | High |
| `apps/admin/scripts/admin-ui-guard.mjs` | 15 | High |
| `apps/web/src/context/AuthContext.tsx` | 15 | High |
| `scripts/enforce-route-collision-guard.js` | 14 | High |
| `backend/user/src/scripts/ensure-listing-smoke-fixtures.ts` | 13 | High |
| `apps/admin/scripts/admin-guardrails.mjs` | 12 | High |
| `apps/web/src/app/(public)/terms/page.tsx` | 12 | High |
| `apps/web/src/components/user/profile/tabs/MyListingsTab.tsx` | 11 | High |
| `apps/web/src/components/user/useBrowseListingsController.ts` | 11 | High |

## 🚀 Recommended Remediation Plan
1. **Cleanup the Hotspots:** Addressing the top 15 files will remove ~284 violations.
2. **Type Safety Drive:** Fix the `@typescript-eslint/no-explicit-any` issues to restore type integrity.
3. **Governance Zero:** There should be 0 `esparex/` rules in this list. Fix those immediately.
