# Esparex Repository Single Source of Truth (SSOT)

Welcome to the Esparex project. This document serves as the authoritative entry point and architectural guidelines for all developers. Every code change, document addition, or dependency update must conform to these rules.

> [!NOTE]
> The repository architecture baseline is established. Future architectural changes must be made through ADRs and the governance process.

---

## 1. Repository Philosophy
Our repository is built on three core pillars:
1. **Separation of Concerns**: Client code is decoupled from API gateways, gateway routes are decoupled from business logic, and business logic is transport-neutral.
2. **Immutable Boundaries**: Package dependency boundaries are strict and automatically validated. No frontend details leakage into backend or shared packages.
3. **Automated Guardrails**: CI/CD checks lint and type-check every commit. Builds fail automatically on any architectural drift.

### 1.1 Repository Invariants
The following invariants are fundamental rules of the repository architecture. They must **never** be broken under any circumstances:
1. **Apps never import backend**: Frontend applications must remain presentation leaf structures.
2. **Backend never imports apps**: API gateways must never import UI layouts, components, or client-side React hooks.
3. **Core never imports Express**: The domain logic layer must remain completely transport-agnostic.
4. **Shared never imports React**: Agnostic shared packages must compile without browser-dependent framework warnings.
5. **No deep imports**: Sibling packages must only import through the package public export API.
6. **Every package exports from index.ts**: Barrel files define the public entry points.
7. **No duplicate SSOT documents**: Authoritative files must not replicate information elsewhere to avoid source fragmentation.
8. **One owner per package**: Responsibility maps to a single owner team.
9. **One responsibility per package**: Every workspace coordinates a single distinct concern.
10. **Every architectural change requires an ADR**: Major structural or pattern updates must publish an ADR first.

### 1.2 Repository Change Lifecycle
Every significant change follows this strict process flow to preserve code quality:

```
Idea ➔ ADR ➔ Implementation Plan ➔ Review ➔ Implementation ➔ Verification ➔ Documentation ➔ Merge ➔ Governance Audit ➔ Release
```

---

## 2. Layer Diagram & Architecture
The codebase is structured in a strict hierarchical dependency flow:

```
   [apps/web]      [apps/admin]      [apps/mobile (Capacitor)]
        │               │                 │
        │               ▼                 ▼
        │         [@esparex/shared] ◄─────┘
        ▼               ▲
  [backend/user]        │
        │               │
        ▼               │
  [@esparex/core] ──────┘
```

### Monorepo Structure & Long-Term Target
The project currently operates with top-level directories: `apps/`, `backend/`, `core/`, `shared/`, `scripts/`, `docs/`.

**Long-Term Path Relocation Plan**: To establish an industry-standard monorepo reusable libraries layout, we will eventually introduce a `packages/` directory and relocate core internal workspaces under it:
```
apps/
backend/
packages/
    core/
    shared/
scripts/
docs/
```
*Note: This structural migration is a low-priority enhancement and will **not** be performed until the repository has been stable through at least one production release.*

---

## 3. Package Responsibilities

### 📱 Client Leaf Applications (`apps/`)
* **Owns**: UI Views, layouts, components, pages, forms, client state management, Next.js page/segment routing.
* **Never Owns**: Business rules, database models, payment calculations.

### 🔌 API Gateway Layer (`backend/`)
* **Owns**: HTTP servers/connections, REST endpoints, routing ingress, authentication guards, middlewares, input schema validation, request/response lifecycles.
* **Never Owns**: Domain logic rules, direct database queries.

### 🧠 Domain Layer (`core/`)
* **Owns**: Core business logic rules, domain services, payment and booking logic engines, background workers, queues, database models and Mongoose schemas.
* **Never Owns**: Express typings/modules, React views, Next.js configs, HTTP direct handlers.

### 📦 Agnostic Utility Layer (`shared/`)
* **Owns**: Data Transfer Objects (DTOs), data types, Zod schemas, enums, constants, pure utilities and formatting helpers.
* **Never Owns**: React hooks, Express endpoints, Database models, business workflows.

---

## 4. Import & Dependency Constraints

### Dependency Rules
* Dependencies must flow **only downward** according to the hierarchy: `Apps` ➔ `Backend API` ➔ `Core` ➔ `Shared`.
* **Never Upward**: A lower package must never import from a package higher in the chain.
* **Never Sideways**: Sibling packages in the same tier (e.g. `apps/web` and `apps/admin`) must never cross-import.

### Matrix: Allowed & Forbidden Imports

| Package / Folder | Allowed Imports | Forbidden Imports | Public API Endpoint |
| :--- | :--- | :--- | :--- |
| **`apps/web`** | `@esparex/shared` | `@esparex/backend-user`, `@esparex/core` internals | None |
| **`apps/admin`** | `@esparex/shared` | `@esparex/backend-user`, `@esparex/core` internals | None |
| **`backend/user`** | `@esparex/core`, `@esparex/shared` | `apps/` (React views, client hooks) | HTTP routing only |
| **`core`** | `@esparex/shared` | `apps/`, Express typings/modules, `backend/user` | `src/index.ts` |
| **`shared`** | External agnostic libraries only | `@esparex/core`, `@esparex/backend-user`, `apps/`, React, Next.js, Express | `src/index.ts` |

---

## 5. Folder & File Naming Conventions

### File Casing
* **Services**: PascalCase (e.g. `AdCreationService.ts`, `LocationHierarchyService.ts`).
* **Schemas**: camelCase with suffix `.schema.ts` (e.g. `ad.schema.ts`).
* **Validators**: camelCase with suffix `.validator.ts` (e.g. `ad.validator.ts`).
* **Jobs**: camelCase with suffix `.job.ts` (e.g. `expireAds.job.ts`).
* **Utils/Helpers**: camelCase (e.g. `stringUtils.ts`).

### Directory structure
* All packages use `camelCase` for directories (e.g., `core/src/services/smartAlert/`).
* Next.js route directories inside `apps/` use `kebab-case` or Next.js route groups (e.g. `apps/web/src/app/(public)/browse-services/`).

---

## 6. Public API Rules
To prevent tight coupling:
* **Strict Public Entry Points**: Every package must expose exactly one public entry point defined in each package's `package.json` export configurations (e.g., `@esparex/core` or `@esparex/shared`).
* **No Deep Imports**: Sibling packages must never import deep internal files. Always import the package name directly:
  - **Correct**: `import { AdCreationService } from '@esparex/core';`
  - **Incorrect**: `import { AdCreationService } from '@esparex/core/src/services/ad/AdCreationService';`
* All public exports of `@esparex/core` and `@esparex/shared` must be registered in their respective `src/index.ts` barrel files. Internals must remain private.

---

## 7. Build Sequence
Monorepo builds must compile in the following sequence to guarantee dependent targets resolve built files correctly:
1. `@esparex/shared`
2. `@esparex/core`
3. `@esparex/backend-user`
4. `@esparex/apps-admin`
5. `@esparex/apps-web`

---

## 8. Testing Standards
We enforce clean testing environments:
* **Unit/Integration Tests**: Written using Jest (for backend/core packages) or Vitest (for apps-web). Tests must be located under `<package>/src/__tests__/` and suffix with `.spec.ts`.
* **E2E Tests**: Written using Playwright (for apps-web and apps-admin). Tests are placed under `<app>/tests/` and suffix with `.spec.ts`.
* **Mocks**: Global Jest module mocks reside in `<package>/__mocks__/`. Test-specific mocks are kept in local test directories.

---

## 9. Governance & CI/CD Checks
The repository enforces a "zero-regression" standard. The CI/CD validation pipeline operates under this chain:

```
Repository Contract ➔ Dependency Rules ➔ Boundary Rules ➔ CI Validation ➔ Architecture Audit ➔ Automatic Failure
```

1. **Pre-commit Check**: Runs automatic checks (`npm run lint`, `npm run type-check`, `npm run guard:duplicate-code`) before commits are finalized.
2. **CI Check**: Triggers `npm run ci:strict` (compilation + lints + tests) on every PR to `main`.
3. **Automatic Build Failure**: Any import boundary violation (e.g. core importing Express, shared importing React) fails automatically, blocking the pull request.

---

## 10. Repository Health Gates

The following criteria must be met in full for any code to merge:

| Metric | Target | Checked By |
| :--- | :---: | :--- |
| **TypeScript errors** | 0 | `npm run type-check` |
| **ESLint errors** | 0 | `npm run lint` / `lint:ci` |
| **Build failures** | 0 | `npm run build` |
| **Circular dependencies** | 0 | `madge --circular` |
| **Boundary violations** | 0 | `dependency-cruiser` (Stage 5) |
| **Deep imports** | 0 | `dependency-cruiser` / import linter (Stage 5) |
| **Duplicate files** | 0 | `docs:lint` / `guard:duplicate-code` |
| **Documentation link failures** | 0 | `docs:lint` |
| **Dead exports** | 0 | `guard:dead-code` |
| **Unused dependencies** | 0 | `depcheck` / `guard:unused-imports` |
| **Orphan routes** | 0 | `guard:route-collision` / `guard:route-hierarchy` |
| **Orphan APIs** | 0 | `guard:api-surface` |
| **ADR coverage for architecture changes** | 100% | Architecture Review Board / CI Check |

---

## 11. Pre-Refactoring Stabilization Checkpoint

Before beginning Milestone 3 (Architecture Refactoring), the development team must execute this strict Milestone 2 stabilization checkpoint:

1. **Fresh Clone**: Perform a fresh clone of the repository in a clean environment.
2. **Deterministic Install**: Run `npm install` without package manager strictness bypass flags (ensure clean npm lockfile state under supported Node/npm versions).
3. **Verification Suites**:
   - `npm run type-check` (verify 0 compilation errors)
   - `npm run lint` (verify 0 formatting or linting errors)
   - `npm test` (verify all unit/integration test suites pass)
   - `npm run build` (verify optimized web, admin, and backend builds compile successfully)
4. **Subsystems Check**: Start the backend service, web app, and admin dashboard simultaneously: `npm run dev:all`.
5. **Critical Flows Validation**: Manually exercise the core user flows:
   - Authentication (sign-up, login, token refresh)
   - Browse listings & listings filtering
   - Create/edit listings (classified ads)
   - Search & geolocation calculations
   - Customer-to-seller chat messaging
   - Payments simulation/reconciliation triggers
   - Admin back-office moderation access and approval controls
6. **Tag & Archive Baseline**: If all steps pass successfully:
   - Tag the commit as `baseline-stable-v1`.
   - Archive the baseline execution logs (Node/npm versions, OS validated, command stdout logs of installs/builds/tests, and test reports). This establishes a recovery and validation baseline to reference during Milestone 3 architecture refactoring.
