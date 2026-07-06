# Repository Package Contract

**Architecture Version:** v1.1.0  
**Status:** Enforced (Automated)  
**Single Source of Truth:** [`scripts/architecture/matrix.js`](../../scripts/architecture/matrix.js)  
**Last Updated:** 2026-07-06

---

## Overview

This document defines the authoritative dependency rules and package boundaries for the Esparex monorepo.

As of Architecture v1.1.0, these rules are **actively enforced** by two tools both generated from `scripts/architecture/matrix.js`:

1. **Dependency Cruiser** (`.dependency-cruiser.cjs`) — CI enforcement on the compiled import graph
2. **ESLint Boundaries** (`scripts/architecture/boundaries-config.js`) — editor-time warnings on source imports

Do not author rules directly in those generated files. Update `matrix.js` and run `npm run architecture:generate`.

---

## 1. Architectural Layer Diagram

```
    [apps/web]      [apps/admin]
          │               │
          │ (types, domain only)
          ▼               ▼
    [backend/user]  ──────────────── [@esparex/shared]
          │                                ▲
          │ (public namespaces only)       │
          ▼                               │
    [@esparex/core] ─────────────────────┘
```

**Layer Rules:**
1. Dependencies flow **only downward**: `Apps` ➔ `Backend` ➔ `Core` ➔ `Shared`
2. **Never upward**: `core` and `shared` must never import from `backend` or `apps`.
3. **Never sideways**: Sibling apps (`apps/web` and `apps/admin`) must not cross-import.
4. **Public namespace only**: `backend` must import from `@esparex/core/*` namespaces, never from `core/src/**` internals.

---

## 2. Package Boundary Matrix

| Package | Allowed Imports | Forbidden Imports |
| --- | --- | --- |
| `apps/web` | `@esparex/shared`, `@esparex/core/types`, `@esparex/core/domain` | All other `@esparex/core/*` namespaces |
| `apps/admin` | `@esparex/shared`, `@esparex/core/types`, `@esparex/core/domain` | All other `@esparex/core/*` namespaces |
| `backend/user` | `@esparex/core/*` (all 14 namespaces), `@esparex/shared` | `core/src/**` internal paths |
| `core` | `@esparex/shared` | `backend/**`, `apps/**` |
| `shared` | *(only external npm packages)* | `@esparex/core`, `backend/**`, `apps/**` |

---

## 3. Core Internal Namespace Dependency Matrix

Governs imports **inside** `core/src`. Each namespace is listed with what it may import.

| Namespace | May Import From |
| --- | --- |
| `types` | *(nothing internal)* |
| `config` | *(nothing internal)* |
| `domain` | `types` |
| `utils` | `types`, `config` |
| `validators` | `types`, `domain` |
| `events` | `domain`, `types` |
| `models` | `domain`, `types`, `config` |
| `infrastructure` | `config`, `utils` |
| `tooling` | `infrastructure`, `config`, `utils` |
| `services` | `models`, `domain`, `validators`, `utils`, `events`, `infrastructure`, `config` |
| `queues` | `infrastructure` |
| `jobs` | `services`, `infrastructure` |
| `workers` | `queues`, `services` |

---

## 4. Public Namespace Contract

The 14 canonical public namespaces exposed by `@esparex/core`:

```
@esparex/core              (root index)
@esparex/core/models       @esparex/core/services     @esparex/core/events
@esparex/core/utils        @esparex/core/config        @esparex/core/types
@esparex/core/infrastructure               @esparex/core/tooling
@esparex/core/validators   @esparex/core/jobs          @esparex/core/queues
@esparex/core/workers      @esparex/core/domain
```

All exports from these namespaces are curated (no wildcard re-exports). Adding a new public symbol requires an explicit export line in the namespace barrel file.

---

## 5. Enforcement

| Tool | Mode | When |
| --- | --- | --- |
| Dependency Cruiser | Hard fail (error) | CI — `npm run architecture:check` |
| ESLint Boundaries | Warn (to become error) | Editor + pre-commit |
| `git grep` deep import check | Hard fail | CI — Gate 1 |
| `madge` circular detection | Hard fail | CI — Gate 2 |
| Public API load test | Soft (skips without live DB) | CI — Gate 5 |

To run the full architecture check:

```bash
npm run architecture:check    # Hard fail (CI mode)
npm run architecture:report   # Report mode (no exit 1)
```

---

## 6. Exception Process

Any exception to these rules must be:
1. Registered in `scripts/architecture/matrix.js` under `EXCEPTIONS` with a justification, approver, and date.
2. No inline silencing (`/* depcruise-ignore */`) without a corresponding exception entry.
3. Reviewed in the PR that introduces the exception.

The `[skip-arch]` commit token bypasses `architecture:check` for emergency hotfixes only (rate-limited to once per quarter).


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
