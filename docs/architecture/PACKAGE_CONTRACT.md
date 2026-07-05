# Repository Dependency Contract

This document defines the authoritative dependency rules and package boundaries for the Esparex codebase. These rules are to be enforced automatically in Stage 5 via the governance engine (e.g. dependency-cruiser or ESLint boundaries) to prevent architectural drift.

---

## 1. Architectural Dependency Diagram

```
   [apps/web]      [apps/admin]
        │               │
        │               ▼
        │         [@esparex/shared] ◄─────┐
        ▼               ▲                 │
  [backend/user]        │                 │
        │               │                 │
        ▼               │                 │
  [@esparex/core] ──────┘                 │
        │                                 │
        └─────────────────────────────────┘
```

### Layer Direction Rules
1. Dependencies flow **only downward** according to the following hierarchy:
   `Apps` ➔ `Backend API` ➔ `Core` ➔ `Shared`
2. **Never upward**: A lower layer (e.g. `core` or `shared`) must never import from a higher layer (e.g. `backend/user` or `apps`).
3. **Never sideways**: Equal-tier sibling scopes (e.g. `apps/web` and `apps/admin`) must never cross-import from each other.

---

## 2. Dependency Matrix & Boundary Constraints

| Package / Folder | Owner | Public API | Allowed Imports | Forbidden Imports | Boundary Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`apps/web`** | Frontend Team | None | `@esparex/shared` | `@esparex/backend-user`, `@esparex/core` internals | Frontend UI leaf application. Can only import shared types/schemas. Must not access backend controller logic or direct DB access layers. |
| **`apps/admin`** | Frontend Team | None | `@esparex/shared` | `@esparex/backend-user`, `@esparex/core` internals | Frontend admin console UI. Must not import backend logic. |
| **`backend/user`** | API Layer Team | HTTP Entry points | `@esparex/core`, `@esparex/shared` | `apps/` (React components, client Hooks) | The API routing and validation gateway. Invokes business logic inside `core`. Must never import client-side UI layouts or hooks. |
| **`core`** | Domain Layer Team | `src/index.ts` | `@esparex/shared` | `apps/`, Express typings/modules, `backend/user` | Core business logic, models, workers, and queues. Must remain completely transport-neutral (no Express/HTTP details) and domain-focused. Deep internal services must not be imported directly by gateway packages. |
| **`shared`** | Platform Team | `src/index.ts` | External npm libraries only (agnostic) | `@esparex/core`, `@esparex/backend-user`, `apps/`, React, Next.js | General helper modules, types, and schemas. Must be 100% environment-agnostic (runnable on both browser and server; no React or Express packages). |

---

## 3. Enforcement Strategy (Stage 5)

These rules are machine-enforceable. The CI/CD validation pipeline enforces boundaries in the following chain:

```
Repository Contract ➔ Dependency Rules ➔ Boundary Rules ➔ CI Validation ➔ Architecture Audit ➔ Automatic Failure
```

1. **Automatic Build Failure**: The CI checks fail immediately and automatically block pull requests if any crossing of forbidden boundaries is detected (e.g. any import from `apps/` inside `core` or `backend/user`, or any React/Express import inside `@esparex/shared`).
2. **Tools**: We will configure `dependency-cruiser` (or an equivalent import validation check) using these boundaries.
3. **Guard Integration**: The boundary validator tool is integrated directly into the root `npm run lint` and pre-commit workflow rules.
