# Phase C: Dependency Matrix Audit Report

This report documents the dependency graph and import directions between Esparex workspaces, evaluating compliance with clean architectural guidelines.

---

## 1. Intended Dependency Matrix

The system follows a strict hierarchical dependency chain where dependencies flow downward towards the most environment-agnostic library (`@esparex/shared`). 

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

---

## 2. Dependency Directions Analysis

| Package Origin | Target Package | Import Direction | Status | Architectural Analysis |
| :--- | :--- | :---: | :---: | :--- |
| `apps/web` | `shared` | `apps` ➔ `shared` |  | Allowed. UI views import shared type contracts and validations. |
| `apps/admin` | `shared` | `apps` ➔ `shared` |  | Allowed. UI views import shared type contracts and validations. |
| `backend/user` | `core` | `backend` ➔ `core` |  | Allowed. API controllers invoke core models and services. |
| `backend/user` | `shared` | `backend` ➔ `shared` |  | Allowed. Routes import shared API contracts. |
| `core` | `shared` | `core` ➔ `shared` |  | Allowed. Domain services use shared helper validations and enums. |

---

## 3. Forbidden Import Verification & Violations

We verified all source code packages for violations against the architecture's forbidden boundary rules.

### 🚫 Shared to Core (`shared` ➔ `core`)
* **Rule**: The shared package must be completely decoupled from the domain logic/models. It should not require or import anything from core.
* **Audit Result**:  **No Violations.** There are no imports of `@esparex/core` inside `shared/src/`.

### 🚫 Core to Apps (`core` ➔ `apps`)
* **Rule**: Core must remain backend-only and transport/client agnostic. It must never import anything from React pages or web components.
* **Audit Result**:  **No Violations.** There are no imports of `@esparex/apps-web` or `@esparex/apps-admin` inside `core/src/`.

### 🚫 Shared to Apps (`shared` ➔ `apps`)
* **Rule**: Shared utilities must never refer to specific application page components or configurations.
* **Audit Result**:  **No Violations.**

### 🚫 Backend to Apps (`backend` ➔ `apps`)
* **Rule**: The backend Express runtime must never import React views or hooks.
* **Audit Result**:  **No Violations.**

### 🚫 Core to Backend (`core` ➔ `backend`)
* **Rule**: Core must not refer back to route initializations or API gateway configs.
* **Audit Result**:  **No Violations.**

---

## 4. Identified Architectural Concerns

While the general package-level imports conform to the matrix, we identified two severe boundary violations:

### 4.1 Internal Core Circular Dependency Chain
Static analysis via the `madge` tool identified a circular dependency chain within `@esparex/core`:
```
config/db.ts ➔ utils/reliabilityAlerts.ts ➔ services/EmailService.ts ➔ utils/systemConfigHelper.ts ➔ models/SystemConfig.ts ➔ config/db.ts
```
* **Impact**: Introduces unstable module loading and potential Temporal Dead Zone (TDZ) runtime failures during server boot.

### 4.2 React Dependency Leakage via `@esparex/shared`
* **Finding**: `shared/src/ui/popup/usePopupQueue.ts` imports directly from `'react'`.
* **Impact**: While not importing local packages, this imports an external client-side UI library (`react`) in an environment-agnostic shared package. When backend/user or core import `@esparex/shared`, Node.js must resolve React. This creates an indirect dependency of the backend on React.
