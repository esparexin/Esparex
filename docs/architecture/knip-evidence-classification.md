# ESPAREX CATALOG ARCHITECTURE — KNIP FINDINGS CLASSIFICATION & EVIDENCE MATRIX

**Audit Standard:** Zero Unsafe Deletions, Evidence-Gated Code Hygiene  
**Scope:** `knip_report.txt` verification across `apps/web`, `apps/admin`, `packages/contracts`, `core/src`, and root scripts.

---

## 1. Classification Methodology

Before deleting any file or export reported by static analysis tools (Knip), items must be categorized into one of five verified categories:
1. **Actually Dead**: Unreferenced by runtime, tests, build scripts, or external tooling. Safe for deletion.
2. **Used Dynamically**: Loaded at runtime via dynamic string templates, reflections, or plugin registrations.
3. **Used by Reflection / Framework**: Re-exported for controller bindings, Mongoose model schemas, or Next.js app router conventions.
4. **Used by Scripts / Tooling**: Invoked by CI/CD scripts, architecture linters (`npm run check:arch`), or build configurations.
5. **False Positive**: Core configuration file or type definition incorrectly flagged by static analysis.

---

## 2. Dependency Audit & Verification Matrix

| Dependency | Location | Empirical Codebase Status | Classification | Safe Remediation Action |
| :--- | :--- | :--- | :--- | :--- |
| `@tanstack/react-virtual` | `apps/web` | Imported in `BrowseServicesVirtualizedList.tsx` for service feed virtualization. | **Active Component Import** | Preserve in `apps/web`. |
| `vaul` | `apps/web` | Pruned from package manifest. Radix primitives utilized. | **Pruned / Verified** | Fully cleaned up. |
| `clsx` / `tailwind-merge` | `@esparex/ui` | Encapsulated inside `@esparex/ui` package helper `cn()`. | **Encapsulated** | Managed at UI package boundary. |

---

## 3. Verified Script & Export Classifications

| File Path / Export | Knip Designation | Empirical Codebase Status | Classification | Safe Remediation Action |
| :--- | :--- | :--- | :--- | :--- |
| `eslint.config.mjs` | Unused file | Root ESLint flat configuration file. | **False Positive** | **PRESERVE**: Required for linting. |
| `tooling/architecture/checks/*.ts` | Unused files | Executed by `npm run check:arch` via `verify-architecture.ts`. | **Used by Tooling** | **PRESERVE**: Architecture enforcement tool. |
| `CategoryModel` (`CatalogCategoryService.ts`) | Unused export | Re-exported so express controllers can pass the model to generic response helpers (`handlePaginatedContent`). | **Used by Reflection** | **PRESERVE** |

---

## 4. Governance Policy for Code Cleanup

1. **No Automated Deletions**: Automated `knip --fix` or bulk deletes are strictly prohibited.
2. **Evidence Matrix Requirement**: Every item targeted for cleanup must be explicitly verified in the Evidence Matrix with a verified **Actually Dead** status.
3. **Build Verification Gate**: Any cleanup commit must be validated via `npm run type-check && npm test && npm run build`.
