# Phase 1: Verify Repository Structure Report

## 1. Executive Summary
An audit of the Esparex repository structure was conducted on the clean baseline branch. The workspace is managed as an npm workspaces monorepo with 5 registered workspaces and various supporting files. The verification revealed several structural concerns, including misplaced root-level folders, duplicate database fixtures and constants directories, unregistered workspace stubs, and significant script flat-file sprawl.

---

## 2. Scope
This audit inspected the repository's root directories, workspaces, file and directory duplicates, naming conventions, and configurations. It covered:
- Monorepo root directory structure
- Registered and unregistered packages
- Sub-directory mapping for `apps/`, `backend/`, `core/`, `shared/`, `scripts/`, and `docs/`
- Existence of duplicate or orphan files/folders at all levels

---

## 3. Inventory

### Workspaces (Registered)
- **`apps/admin`** — Internal admin dashboard (Next.js)
- **`apps/web`** — Customer-facing web portal (Next.js)
- **`backend/user`** — Express HTTP API Server
- **`core`** — Backend domain logic layer (Mongoose models, services, workers, queues, jobs)
- **`shared`** — Environment-agnostic utilities, contracts, schemas, types, and enums

### Auxiliary Directories (Non-Workspace)
- **`apps/mobile`** — Capacitor mobile shell scaffolding (iOS & Android)
- **`ai-governance`** — Prompt templates and system instruction context files
- **`archive/legacy`** — Historical audits and documentation (e.g. 2026-05)
- **`docs`** — Project documentation
- **`scripts`** — Developer utilities, lint rules, and governance guards
- **`.governance`** — Local governance cache directory
- **`.jscpd-report-audit`** — Auto-generated duplicate-code report outputs
- **`.husky`** — Git commit hooks

---

## 4. Findings

### High Severity Findings
1. **Duplicate Constants Directory structure in `shared/`**
   - **Finding**: A top-level `shared/constants/` directory exists containing a single file: `image-domain-registry.json` (34 bytes), which is a stub. The real file containing the domain remote patterns is located in `shared/src/constants/image-domain-registry.json` (1045 bytes).
   - **Impact**: Developers may modify the wrong file or get confused about the location of core constants.

2. **Flat scripts sprawl in `scripts/`**
   - **Finding**: The `scripts/` directory contains 49 flat script files (js, ts, mjs) directly at its root level. While sub-directories like `ops/` and `policy/` exist, they only contain a tiny fraction of the scripts (2 and 4 files, respectively).
   - **Impact**: Makes developer tooling hard to discover, maintain, and audit.

### Medium Severity Findings
3. **Unregistered Capacitor Mobile Shell Stub**
   - **Finding**: The `apps/mobile/` folder contains native iOS/Android directories and `capacitor.config.ts`, but has no `package.json` and is not registered in the root `package.json` workspaces list. It contains no application source code.
   - **Impact**: Increases repository size and adds complexity without functioning as a monorepo workspace.

4. **Duplicate `smoke-fixtures.json` files**
   - **Finding**: There are three identical copies of the `smoke-fixtures.json` (463 bytes) file:
     - Root: `smoke-fixtures.json`
     - Web App: `apps/web/smoke-fixtures.json`
     - Backend: `backend/user/smoke-fixtures.json`
   - **Impact**: Risk of out-of-sync fixtures when smoke test definitions change.

5. **`backend/user` Nesting**
   - **Finding**: The backend contains a nested subdirectory `backend/user`. Currently, Esparex only has a single backend service.
   - **Impact**: Adds unnecessary pathname nesting if Esparex is not moving towards a multi-service backend architecture.

6. **`core/` Package Naming Confusion**
   - **Finding**: The package `core/` contains database models, jobs, queues, workers, and business logic services. Its name implies it is a general utility/core library, whereas it is actually the full backend domain layer.
   - **Impact**: New developers may mistakenly place client-side code or general shared code in `core/`.

### Low Severity Findings
7. **Misplaced Root-Level `ai-governance/` Directory**
   - **Finding**: The `ai-governance/` folder is placed at the root level of the repository. It contains two markdown/json template files.
   - **Impact**: litters the root namespace; fits better inside `docs/` or the `.governance/` cache.

---

## 5. Evidence

### Top-level Structure (`list_dir`)
```
- ai-governance/ (not in workspaces)
- apps/
  - admin/ (workspace)
  - mobile/ (not in workspaces, Capacitor config only)
  - web/ (workspace)
- backend/
  - user/ (workspace)
- core/ (workspace)
- shared/ (workspace)
```

### Duplicate Fixtures Path Listing
- [smoke-fixtures.json (Root)](file:///c:/Users/Administrator/Documents/GitHub/Esparex/smoke-fixtures.json)
- [smoke-fixtures.json (apps/web)](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/smoke-fixtures.json)
- [smoke-fixtures.json (backend/user)](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/user/smoke-fixtures.json)

### Duplicate Constants Path Listing
- [shared/constants/image-domain-registry.json](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/constants/image-domain-registry.json)
- [shared/src/constants/image-domain-registry.json](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/constants/image-domain-registry.json)

---

## 6. Risk Level
- **Overall Structure Risk**: **Medium**
- The monorepo has solid boundaries overall, but duplicate files, unregistered folders, and flat script directories compromise the long-term maintainability of the project structure.

---

## 7. Recommendations
1. **Merge Constants**: Delete `shared/constants/` and point any tooling referencing it to the canonical `shared/src/constants/image-domain-registry.json`.
2. **Organize Scripts**: Move the 49 flat scripts in `scripts/` into functional subfolders (e.g. `scripts/governance/`, `scripts/migration/`, `scripts/ci/`).
3. **Consolidate Fixtures**: Keep a single `smoke-fixtures.json` at the root (or in `shared/`) and have the apps/backend symlink or import it, or read it dynamically.
4. **Relocate AI Governance**: Move `ai-governance/` into the `docs/` folder (e.g. `docs/governance/ai/`) or `.governance/`.
5. **Clarify `apps/mobile` Status**: Determine whether to delete `apps/mobile/` or register it properly as a workspace once development is planned.

---

## 8. Out-of-Scope Items
- Detailed code quality or lint audits within packages (addressed in later phases).
- Database connection checks or live server status (addressed in later phases).

---

## 9. Next Steps
- Mark Phase 1 complete on the [Project Health Dashboard](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/96dc25d9-b3e5-4f2e-9de7-694d0c39842f/project_health_dashboard.md).
- Proceed to **Phase 2 — Build Inventory**.
