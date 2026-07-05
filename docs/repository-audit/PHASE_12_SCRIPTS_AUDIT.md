# Phase 12: Scripts Audit Report

## 1. Executive Summary
A developer and governance scripts audit was conducted on the contents of the `scripts/` directory. The audit examined script purposes, callers, and location patterns. The verification identified high-severity file sprawl (49 flat scripts at root level) and inconsistent placements of database migrations, mixing temporary remediation tools with critical, recurring pre-commit and CI/CD validation gates.

---

## 2. Scope
This audit evaluated:
- Flat script layout at the root of `scripts/`
- Folder structure division (`eslint-rules/`, `ops/`, `policy/`)
- Relationship between script paths and root `package.json` scripts
- Redundancy and lifecycle of database migration scripts

---

## 3. Inventory
The `scripts/` directory contains 49 flat script files and 3 subfolders:
- **`eslint-rules/`**: Workspace-specific custom ESLint checks (2 files).
- **`ops/`**: Category database migrations (2 files).
- **`policy/`**: Policy baselines and update tools (4 files).
- **Flat Root Scripts (49 total)**: Divided logically into:
  - *Governance & Validation Guards* (22 files, e.g. `guard-platform-governance.js`, `enforce-component-api-boundary.js`)
  - *Database & Catalog Remediation* (13 files, e.g. `catalog-stabilization.js`, `catalog-parity-convergence.js`)
  - *Developer Tooling & Maintenance* (10 files, e.g. `clean-workspace.js`, `analyze-tech-debt.js`, `kill-port.js`)
  - *Testing Utilities* (4 files, e.g. `run-deterministic-e2e.mjs`)

---

## 4. Findings

### High Severity Findings
1. **Unstructured Flat File Sprawl in `scripts/`**
   - **Finding**: 49 developer and governance script files are dumped directly into the flat namespace of the `scripts/` root. Critical pre-commit git hooks coexist at the same level as run-once database patches and debugging helpers.
   - **Impact**: High discovery overhead, clutter, and risk of developers running obsolete or dangerous remediation scripts by mistake.

2. **Inconsistent Database Migration Placements**
   - **Finding**: Database migration files are scattered:
     - `scripts/migrate-roles.ts` and `scripts/migrate-user-type.ts` live at the flat root.
     - `scripts/ops/migrate-catalog-category-ids.ts` and `scripts/ops/migrate-category-type.ts` live inside the `ops/` sub-directory.
     - Express migrations live under `backend/user/migrations/`.
   - **Impact**: No single, clean directory tracks data schema changes and seeding routines, complicating operational deployment.

---

### Medium Severity Findings
3. **Presence of Obsolete Catalog Remediation Scripts**
   - **Finding**: Transient, run-once scripts (e.g. `catalog-null-canonical-remediation.js`, `catalog-status-remediation.js`, `catalog-strict-collision-remediation.js`) are kept in the active scripts registry.
   - **Impact**: Clutters the repository; should be moved to an archive folder to prevent accidental re-execution.

---

## 5. Evidence

### Flat Scripts Path Listing
- [scripts/catalog-stabilization.js](file:///c:/Users/Administrator/Documents/GitHub/Esparex/scripts/catalog-stabilization.js)
- [scripts/guard-platform-governance.js](file:///c:/Users/Administrator/Documents/GitHub/Esparex/scripts/guard-platform-governance.js)
- [scripts/migrate-roles.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/scripts/migrate-roles.ts)
*(Coexisting at the same root directory).*

### Scattered Migration Paths
- `scripts/migrate-roles.ts` (Root)
- `scripts/ops/migrate-catalog-category-ids.ts` (Subdirectory)

---

## 6. Risk Level
- **Overall Scripts Risk**: **Medium**
- The scripts are functional, but the chaotic flat structure and split migration placement introduce friction for repository operations.

---

## 7. Recommendations
1. **Establish Subfolders**: Restructure the `scripts/` directory into functional directories:
   - `scripts/governance/` — all `enforce-*` and `guard-*` scripts.
   - `scripts/migrations/` — all `migrate-*` files.
   - `scripts/testing/` — all `e2e-*` and regression tools.
   - `scripts/utils/` — common utilities (`kill-port`, `clean-workspace`).
2. **Archive Run-Once Patches**: Relocate one-off catalog remediation scripts to `archive/legacy/` once their execution on staging/production databases has completed.
3. **Update package.json**: Refactor all npm scripts configurations in `package.json` to point to the new paths.

---

## 8. Out-of-Scope Items
- Execution output analysis of the individual governance rules (covered under specific tool runs).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 13 — Documentation Audit**.
