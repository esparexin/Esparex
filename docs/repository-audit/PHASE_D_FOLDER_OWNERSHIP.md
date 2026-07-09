# Phase D: Folder Ownership Audit Report

This report defines the purpose, owner team, consumer audience, and import boundaries for each folder in the Esparex repository.

---

## 1. Ownership & Boundary Table

The following directory matrix establishes ownership and import policies:

| Folder | Purpose | Owner | Used By | Can Import From | Should Import From | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`apps/web`** | End-user facing classified ads marketplace web application. | Frontend Team | End-Users | `@esparex/shared` | `@esparex/shared` | Approved |
| **`apps/admin`** | Internal back-office administration panel for moderation, stats, settings. | Frontend Team | System Admins & Moderation | `@esparex/shared` | `@esparex/shared` | Approved |
| **`apps/mobile`** | Capacitor wrapper project for native iOS and Android build packages. | Mobile / Frontend | Mobile App Users | None | None | **Review** (Not configured as workspace, missing package.json) |
| **`backend/user`** | Express HTTP server housing API gateways and router mappings. | Backend Team | Frontend Apps (`web`, `admin`, `mobile`) | `@esparex/core`, `@esparex/shared` | `@esparex/core`, `@esparex/shared` | **Review** (Hosts admin routes inside user namespace; rename to `backend/api`) |
| **`core`** | Domain business logic, services, task queues, workers, mongoose models. | Core Backend Team | `backend/user`, CRON jobs, CLI tasks | `@esparex/shared` | `@esparex/shared` | **Refactor** (Contains Express controllers and middleware) |
| **`shared`** | Common enums, constants, schemas, payload types, and basic validators. | Platform Team | Everyone (apps, backend, core, scripts) | None | None | **Refactor** (Contains React client hook) |
| **`scripts`** | Developer build utilities, lints, governance rules, and migrations. | Platform Team | Devs & CI-CD Pipelines | None | None | Approved (Organize flat file sprawl) |
| **`docs`** | Project architecture guides, audits, SSOTs, and logs. | All Teams | Developers | None | None | Approved |
| **`.github`** | GitHub Actions YAML pipelines configuration. | Infrastructure | GitHub Runner Processes | None | None | Approved |

---

## 2. Directory Governance Constraints

To enforce the folder ownership definitions listed above:

1. **Leaf Applications (`apps/`)**:
   * Must never be imported by other workspaces.
   * Can only import from `@esparex/shared` or external NPM packages.
   
2. **API Gateways (`backend/user`)**:
   * Must never import from `apps/` folders.
   * Can only serve HTTP requests and dispatch execution to `@esparex/core`.
   
3. **Core Domain (`core/`)**:
   * Must never import from `backend/` or `apps/`.
   * Must never import Express typings or contain Express route handlers.
   * Must remain completely framework/transport-agnostic.
   
4. **Platform Utilities (`shared/`)**:
   * Must never import from `core/`, `backend/`, or `apps/`.
   * Must contain only environment-agnostic JS/TS code (no Node-only modules like `fs` or client-only packages like React).

---

## 3. Authoritative Ownership & Boundary Matrix

The following rules define ownership and import limits to be enforced automatically in the future (Phase E) by the governance engine (e.g. dependency-cruiser or ESLint boundaries):

| Folder | Owner | Allowed Imports | Forbidden Imports |
| :--- | :--- | :--- | :--- |
| **`apps/web`** | Frontend Team | `@esparex/shared` | `@esparex/backend-user`, `@esparex/core` internals |
| **`apps/admin`** | Frontend Team | `@esparex/shared` | `@esparex/backend-user`, `@esparex/core` internals |
| **`backend/user`** | API Layer Team | `@esparex/core`, `@esparex/shared` | `apps/` (React components, client Hooks) |
| **`core`** | Domain Layer Team | `@esparex/shared` | `apps/`, Express typings/modules |
| **`shared`** | Platform Team | None (external agnostic npm libraries) | React, Express, Next.js |

