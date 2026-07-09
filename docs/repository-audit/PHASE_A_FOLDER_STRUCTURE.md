# Phase A: Folder Structure Audit Report

This report documents the architectural audit of the directory structure of the Esparex repository. Every major top-level folder and key sub-package is analyzed to clarify its purpose, owners, dependency rules, and consolidation candidates.

---

## 1. Top-Level Folder Audit

### 📁 `apps/`
* **Why does it exist?** Acts as a monorepo workspace namespace containing all user-facing client application packages (e.g., web portal, admin panel, mobile shell).
* **Who owns it?** Frontend Team / Product Engineering.
* **Who can import it?** **No other folders.** It is a leaf in the dependency graph.
* **Can it be merged, renamed, or removed?** No. This conforms to industry standard monorepo folder layouts.

### 📁 `backend/`
* **Why does it exist?** Acts as a monorepo workspace namespace containing server-side runtime api applications and microservices.
* **Who owns it?** Backend Team.
* **Who can import it?** **No other folders.** Running applications are entrypoints only.
* **Can it be merged, renamed, or removed?** No, but the nested structure inside it (`backend/user`) needs review (see section below).

### 📁 `core/`
* **Why does it exist?** Holds the core business domain logic, Mongoose schema models, cron jobs, queues, workers, and background handlers.
* **Who owns it?** Domain / Core Backend Team.
* **Who can import it?** `backend/` applications (e.g. `backend/user`).
* **Can it be merged, renamed, or removed?** It should remain a separate package to keep business logic transport-agnostic, but it is currently heavily polluted with Express controllers and middlewares which must be moved out.

### 📁 `shared/`
* **Why does it exist?** Houses enums, constants, interfaces, types, validators, contracts, and helpers shared between the frontend applications (`apps/`) and backend services (`backend/`, `core/`).
* **Who owns it?** Platform / Architecture Team.
* **Who can import it?** **Everyone** (applications, backend, core, and scripts).
* **Can it be merged, renamed, or removed?** No. It is critical for ensuring Single Source of Truth (SSOT) types and schemas across the entire codebase.

### 📁 `packages/`
* **Why does it exist?** Does not currently exist in the repository.
* **Can it be merged, renamed, or removed?** It is recommended to create this folder and group the internal packages (`core/` and `shared/`) under it (e.g., `packages/core/` and `packages/shared/`) to clean up the root namespace.

### 📁 `scripts/`
* **Why does it exist?** Contains developer command-line utilities, DB seed/migration tools, custom ESLint/governance rules, and CI/CD pre-flight checkers.
* **Who owns it?** Platform / DevOps Team.
* **Who can import it?** It is not imported by source code. It is executed directly in shell processes.
* **Can it be merged, renamed, or removed?** No. It houses critical validation gates. However, the flat file sprawl (49+ files in root) needs reorganization.

### 📁 `docs/`
* **Why does it exist?** Centralized repository documentation, including architectural audits, technical debt logs, and Single Source of Truth (SSOT) system specs.
* **Who owns it?** All teams (shared knowledge base).
* **Who can import it?** Markdown files are referenced by developers and documentation index tools only.
* **Can it be merged, renamed, or removed?** No.

### 📁 `.github/`
* **Why does it exist?** Houses GitHub Action workflow files defining CI/CD pipelines.
* **Who owns it?** Infrastructure / DevOps.
* **Who can import it?** GitHub platform runner engine.
* **Can it be merged, renamed, or removed?** No.

---

## 2. Drilled-Down Folder Audit

### 📁 `apps/web/`
* **Why does it exist?** Next.js web application implementing the user-facing classified ads marketplace web portal.
* **Who owns it?** Frontend Team.
* **Who can import it?** None.
* **Can it be merged, renamed, or removed?** No.

### 📁 `apps/admin/`
* **Why does it exist?** Next.js web application implementing the back-office console for moderation, user management, and system stats.
* **Who owns it?** Admin/Frontend Team.
* **Who can import it?** None.
* **Can it be merged, renamed, or removed?** No.

### 📁 `apps/mobile/`
* **Why does it exist?** Capacitor shell project hosting native iOS/Android wrappers that reference and serve the web build.
* **Who owns it?** Mobile / Frontend Team.
* **Who can import it?** None.
* **Can it be merged, renamed, or removed?** Yes. It has no application code, no `package.json`, and is not registered in the root workspaces. If mobile support is inactive, this directory can be removed or archived. If active, it must be properly initialized as an npm workspace.

### 📁 `backend/user/`
* **Why does it exist?** Express HTTP API server executing routing and request dispatching for both user and admin apps.
* **Who owns it?** Backend Team.
* **Who can import it?** None.
* **Can it be merged, renamed, or removed?** It should be renamed to `backend/api` or split into `backend/user-api` and `backend/admin-api`, because the namespace `backend/user` is misleading since it also hosts all admin-facing routes (e.g. `adminRoutes.ts`).

### 📁 `core/` (src/ level)
* **Why does it exist?** Houses Mongoose models, business logic services, task queues (BullMQ), and handlers.
* **Who owns it?** Domain Team.
* **Who can import it?** `backend/user/`.
* **Can it be merged, renamed, or removed?** Needs internal refactoring to remove Express transport modules (`core/src/controllers/` and `core/src/middleware/`).

### 📁 `shared/` (src/ level)
* **Why does it exist?** Houses enums, type definitions, and schema schemas.
* **Who owns it?** Platform Team.
* **Who can import it?** Everyone.
* **Can it be merged, renamed, or removed?** Needs refactoring to decouple React hook dependencies (`shared/src/ui/popup/usePopupQueue.ts`).
