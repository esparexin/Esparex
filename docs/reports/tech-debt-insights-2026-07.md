# 📊 Esparex Technical Debt Insights

**Generated on:** 17/7/2026, 2:18:26 pm
**Total Violations Locked:** 439
**Affected Files:** 1553

## 🏢 Debt by Workspace
| Workspace | Violations | % of Total |
| :--- | :--- | :--- |
| core | 288 | 65.6% |
| tooling | 73 | 16.6% |
| backend | 41 | 9.3% |
| apps | 27 | 6.2% |
| scripts | 6 | 1.4% |
| .venv | 4 | 0.9% |
| .dependency-cruiser.js | 0 | 0.0% |
| commitlint.config.js | 0 | 0.0% |
| eslint.config.mjs | 0 | 0.0% |
| shared | 0 | 0.0% |

## 🚨 Top Violating Rules (The "Burn-down" List)
| Rule ID | Count | Impact |
| :--- | :--- | :--- |
| `@typescript-eslint/no-explicit-any` | 298 | Type Safety |
| `no-console` | 67 | Maintenance |
| `@typescript-eslint/no-unused-vars` | 33 | Type Safety |
| `unused-imports/no-unused-vars` | 20 | Maintenance |
| `unused-imports/no-unused-imports` | 13 | Maintenance |
| `react-hooks/set-state-in-effect` | 5 | Runtime Stability |
| `no-undef` | 2 | Maintenance |
| `react-hooks/exhaustive-deps` | 1 | Runtime Stability |

## 🔥 Hotspots (Fix these first to clear 20% of debt)
| File Path | Violations | Complexity |
| :--- | :--- | :--- |
| `tooling\architecture\index.ts` | 32 | High |
| `core\src\services\AdminDashboardService.ts` | 25 | High |
| `tooling\architecture\generate-domain.ts` | 23 | High |
| `core\src\adapters\outbound\database\admin\MongoAdminDashboardRepositoryAdapter.ts` | 16 | High |
| `core\src\adapters\outbound\database\listings\MongoListingRepositoryAdapter.ts` | 15 | High |
| `core\src\domains\chat\ports\ChatRepositoryPort.ts` | 15 | High |
| `backend\api\src\utils\content-handler\service.ts` | 13 | High |
| `core\src\adapters\outbound\database\catalog\MongoSparePartRepositoryAdapter.ts` | 13 | High |
| `core\src\adapters\outbound\database\chat\MongoChatRepositoryAdapter.ts` | 13 | High |
| `core\src\adapters\outbound\database\identity\MongoUserRepositoryAdapter.ts` | 13 | High |
| `core\src\domains\admin\ports\AdminDashboardRepositoryPort.ts` | 13 | High |
| `tooling\architecture\verify-architecture.ts` | 13 | High |
| `core\src\adapters\outbound\database\catalog\MongoModelRepositoryAdapter.ts` | 12 | High |
| `core\src\domains\identity\ports\UserRepositoryPort.ts` | 12 | High |
| `core\src\adapters\outbound\database\catalog\MongoCategoryRepositoryAdapter.ts` | 11 | High |

## 🚀 Recommended Remediation Plan
1. **Cleanup the Hotspots:** Addressing the top 15 files will remove ~239 violations.
2. **Type Safety Drive:** Fix the `@typescript-eslint/no-explicit-any` issues to restore type integrity.
3. **Governance Zero:** There should be 0 `esparex/` rules in this list. Fix those immediately.
