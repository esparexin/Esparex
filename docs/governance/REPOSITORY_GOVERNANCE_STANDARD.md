# Repository Governance Standard & Boundary Rules

**Workspace:** `esparex`  
**Classification:** Tier 3 Platform Policy  
**Authority:** Platform Architecture Board  

---

## 1. Prohibited Coding Patterns

The following patterns violate repository governance and will block CI merge approvals:

* ❌ **Controller Model Queries:**
  ```typescript
  // Forbidden inside backend/api/src/controllers/
  const ads = await AdModel.find({ status: 'active' }); 
  ```
* ❌ **Middleware Transaction Management:**
  ```typescript
  // Forbidden inside backend/api/src/middleware/
  const session = await mongoose.startSession(); 
  ```
* ❌ **Direct App Core Imports:**
  ```typescript
  // Forbidden inside apps/web/src/
  import UserService from "@esparex/core/services/UserService"; 
  ```
* ❌ **Framework Imports in Core:**
  ```typescript
  // Forbidden inside core/src/
  import express from "express"; 
  ```
* ❌ **Upstream API Imports in Core:**
  ```typescript
  // Forbidden inside core/src/
  import { startServer } from "@esparex/backend-api"; 
  ```

---

## 2. Core Architectural Invariants

The following validation rules are considered invariants and must never be broken:

1. `core` must never import Express or any HTTP-specific routing library.
2. `apps/*` must never import Mongoose models or query databases directly.
3. Controllers in `backend/api` must never contain business logic or transaction sessions.
4. Services in `core` own all database transaction boundaries.
5. Mongoose models in `core/src/models/` must never call or import domain services.
6. Mongoose models are internal implementation details of `@esparex/core`. Only TypeScript types or explicitly exported interfaces may be consumed externally. Business operations must always go through Core services.
7. `shared` must never depend on any runtime package or connect to external databases.
8. Every new business capability must belong to exactly one business domain owner.
9. **Single Entrypoint for Shared**: Workspaces consuming `@esparex/shared` must import directly from the root barrel (e.g. `import { x } from "@esparex/shared"`). Deep source file imports are prohibited.
10. **Encapsulated Core Imports**: Workspaces consuming `@esparex/core` must import only from public namespace exports (e.g. `@esparex/core/services`, `@esparex/core/models`). Direct source imports (e.g. `@esparex/core/src/models/User`) are banned.

---

## 3. Automated Architecture Validation Rules & Compliance

Architectural invariants are validated in CI. The compliance mapping matches the rules to their specific enforcement mechanisms and owners:

| Rule | Enforcement Mechanism | Owner Role (Recommended) |
| :--- | :--- | :--- |
| **Core cannot import Express** | `eslint` (custom rule check) | Platform Engineering Role |
| **Controllers cannot query Models** | `governance:boundaries` (ESLint boundary check) | Platform Engineering Role |
| **Apps cannot import Core** | `dependency-cruiser` (boundary checks) | Architecture Lead Role |
| **Shared has zero runtime dependencies** | `governance:boundaries` (npm workspaces build check) | DevOps Engineering Role |
| **New features belong to exactly one domain** | Manual PR review checklist | Architecture Board Role |
| **Lock root folder structure freeze** | `governance:folders` (Structure validator) | DevOps Engineering Role |
| **Expose only validated public exports** | `package exports audit` (Export validator) | Architecture Lead Role |

---

## 4. Architecture Exceptions

Exceptions to these architectural rules are strictly monitored to prevent structural decay:

* **Exception Criteria:** Exceptions are only permitted when technical limitations prevent standard implementation (e.g. integration of third-party dependencies requiring Express hooks).
* **Exception Requirements:**
  * Must be documented in a dedicated Architecture Decision Record (ADR) under `docs/decisions/`.
  * Must include a detailed technical justification.
  * Must be approved by a majority vote of the Architecture Board.
  * Must carry a set expiration date for remediation.

---

## 5. Package Stability Levels

Workspaces define distinct stability tiers to prevent architectural rot and control modifications:

| Exported Package Path | Stability Tier | Modification Rules |
| :--- | :--- | :--- |
| `@esparex/shared` | **Stable** | Modifications require ADR review. Contract changes require client-server coordination. |
| `@esparex/core/services/*` | **Stable** | Direct consumption by delivery layer. Modifications must avoid breaking downstream controller signatures. |
| `@esparex/core/events` | **Stable** | Core lifecycle hook. Signature changes require ADR authorization. |
| `@esparex/core/validators/*` | **Stable** | Contract-adjacent shapes. Changes require coordination with controllers. |
| `@esparex/core/jobs/*` | **Internal** | Consume only within core worker contexts. |
| `@esparex/core/models/*` (Types) | **Internal** | Internal database schema shapes. Banned from direct controller logic. |
| `backend/api/controllers/*` | **Private** | Transport-specific implementation handlers. Fully private to the gateway. |

---

## 6. Package Interface Specification

To enforce encapsulation, workspaces divide their APIs into public interfaces (accessible downstream) and private internals.

### 6.1 `backend/api` Workspace
* **Package Public Interface:**
  * `bootstrap()` / `startServer()` (invoked by the root startup script)
* **Internal-Only (Hidden):**
  * `controllers/` (delivery handlers)
  * `routes/` (route definitions)
  * `middleware/` (HTTP filters)
  * `utils/` (Express transport utilities: `respond`, `errorResponse`, `controllerUtils`)

### 6.2 `core` Workspace
* **Package Public Interface (Exported Subpaths):**
  * `services/*` (domain engines)
  * `events` (event dispatcher bootstrap)
  * `validators/*` (business rules and Zod schemas)
  * `queues/*` (BullMQ queues)
  * `jobs/*` (cron runners)
  * `lib/*` (Redis client wrappers, geocode libraries)
  * `db/*` (schema index governance checks)
  * `utils/logger` / `utils/AppError` (framework-agnostic utils)
* **Internal-Only (Hidden):**
  * Mongoose models (`core/src/models/*` — exported strictly as TypeScript interfaces, direct value imports by API controllers are banned)
  * Private service helper methods

---

## 7. Validator Casing & Categorization

Validation logic is partitioned into three distinct categories with explicit package ownership:

* **Transport Validators** (owned by `backend/api`): Sanitizes incoming HTTP requests, decodes multipart file uploads, parses headers, and validates payload sizes. (e.g. `validateRequest.ts` middleware).
* **Business Validators** (owned by `core`): Validates invariants, business rules, transaction limits, and entity states independently of transport. (e.g. `AdValidationService`).
* **Shared DTO Validators/Schemas** (currently in `core` exported publicly; planned to migrate to `shared`): Zod schemas that enforce the shape of data transfer objects shared across packages. (e.g. `loginSchema`, `adCreateSchema`).

---

## 8. Package Ownership Matrix

Every top-level directory in the repository has a single architectural owner and a defined public interface context:

| Folder / Path | Owner Workspace | Public API? | Allowed Importers | Architectural Rationale |
| :--- | :---: | :---: | :--- | :--- |
| `apps/web/src` | `apps/web` | ❌ No | None | Public Next.js client application. |
| `apps/admin/src` | `apps/admin` | ❌ No | None | Back-office admin Next.js portal. |
| `backend/api/src/controllers` | `backend/api` | ❌ No | `backend/api/src/routes` | Thin request/response adapters. |
| `backend/api/src/routes` | `backend/api` | ❌ No | `backend/api/src/server.ts` | HTTP REST endpoint route bindings. |
| `backend/api/src/middleware` | `backend/api` | ❌ No | `backend/api/src/routes` | Express authentication gates, rate limiters, and parse filters. |
| `backend/api/src/utils` | `backend/api` | ❌ No | `backend/api` | Express-specific utilities (`respond`, `errorResponse`, `controllerUtils`). |
| `core/src/services` | `core` | ✅ Yes | `backend/api`, Core background workers | Domain services and database transaction boundaries. |
| `core/src/events` | `core` | ✅ Yes | `backend/api` (bootstrap) | Event emitter dispatcher engine. |
| `core/src/models` | `core` | ✅ Yes (Types only) | `backend/api` (Types only), Core | Mongoose database models and schema definitions. Value imports are forbidden in API controllers to enforce service encapsulation. |
| `core/src/validators` | `core` | ✅ Yes | `backend/api`, Core CLI scripts | Shared DTO schemas (Zod) and business validation rules. |
| `core/src/queues` | `core` | ✅ Yes | `backend/api` (producers), Core | BullMQ job submission handles. |
| `core/src/jobs` | `core` | ✅ Yes | `backend/api` (verify scripts), Core | Background cron jobs and scheduled tasks. |
| `core/src/lib` | `core` | ✅ Yes | `backend/api`, Core | Shared clients (Redis client configuration, location shims). |
| `core/src/utils` | `core` | ✅ Yes | `backend/api`, Core | Framework-independent logging, error wrappers, and utilities. |
| `shared/src/types` | `shared` | ✅ Yes | All packages | Global TypeScript interface and type definitions. |
| `shared/src/constants` | `shared` | ✅ Yes | All packages | Global constants and enum records. |

---

## 9. Architectural Governance & Change Control

### 9.1 Architecture Decision Record (ADR) Lifecycle
To prevent architectural drift, any major change to the package interfaces or dependencies must follow the ADR change workflow:

```
Propose Change (Draft ADR in docs/decisions/)
        ↓
Review (Platform Architecture Board)
        ↓
Approval (Merges ADR to docs/decisions/)
        ↓
Implementation Phase
        ↓
Update Repository SSOT (docs/governance/REPOSITORY_ARCHITECTURE_SSOT.md)
```

### 9.2 Handbook Versioning Policy
Modifications to this governance standard are governed according to semantic documentation versioning rules:
* **Patch Changes (vX.Y.Z):** Documentation-only adjustments (typo corrections, formatting updates). Does not require review board sign-off.
* **Minor Changes (vX.Y.0):** Architecture clarifications, new domain service additions, or dependency matrix adjustments that match existing patterns. Requires reviewer sign-off.
* **Major Changes (vX.0.0):** Repository structural changes (new packages, extraction of services, layer deletions). Requires formal ADR approval.

---

## 10. Pull Request Architecture Review Checklist

Before any PR affecting system structure is merged, reviewers must verify:

* [ ] Does this PR violate downstream dependency direction flow?
* [ ] Does it introduce a new package or top-level workspace root folder?
* [ ] Does it expose new package public exports in `core/package.json`?
* [ ] Does it require a new Architecture Decision Record (ADR)?
* [ ] Does it change runtime connection initialization ownership?
* [ ] Does it affect deployment topology or environmental configurations?
