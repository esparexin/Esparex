# Developer Handbook & Local Setup Guide

**Workspace:** `esparex`  
**Classification:** Tier 3 Onboarding & Workflows  
**Authority:** Platform Architecture Board  

---

## 1. Local Setup & Installation

To initiate local development, engineers must execute installation and initial build steps in downstream dependency order:

```text
Developer Local Startup
        ↓
1. Install node dependencies (npm install)
        ↓
2. Build shared contract library (npm run build -w @esparex/shared)
        ↓
3. Build core domain library (npm run build -w @esparex/core)
        ↓
4. Compile backend API gateway (npm run build -w @esparex/backend-api)
        ↓
5. Start visual hot-reloader daemon (npm run dev:all)
        ↓
6. Access development server (Browser runtime localhost)
```

---

## 2. Compile Ordering Graph

Dependencies must compile in sequential downstream order to allow TS reference emission:

1. **`@esparex/shared`** (`npm run build -w @esparex/shared` ➔ outputs `dist/`)
2. **`@esparex/core`** (`npm run build -w @esparex/core` ➔ compiles via `tsc --build` + `tsc-alias` ➔ outputs `dist/`)
3. **`@esparex/backend-api`** (`npm run build -w @esparex/backend-api` ➔ compiles via `tsc` ➔ outputs `dist/index.js`)
4. **`apps/admin` & `apps/web`** (`npm run build -w @esparex/apps-admin` & `@esparex/apps-web` ➔ compiles via Next.js ➔ outputs `.next/`)

---

## 3. Testing Strategy by Workspace

Tests are organized per workspace scope to match execution environments:

* **`@esparex/shared`:** Verified via TypeScript compile checks (`npm run type-check -w @esparex/shared`).
* **`@esparex/core`:** Unit and domain-level rules verified in isolation using Jest with mock memory databases. Direct HTTP endpoints are not loaded.
* **`backend/api`:** Integration REST API shape validations run via Jest + Supertest.
* **`apps/*`:** Presentation interface and views verified via Playwright E2E suites.

---

## 4. Feature Implementation Workflow

When adding a new business capability, developers must code from bottom to top of the monorepo layered architecture:

* [ ] **1. Contract Types:** Declare static contracts / TS interfaces inside `shared/src/types`.
* [ ] **2. DTO Schemas:** Define payload schemas (Zod schemas) inside `core/src/validators`.
* [ ] **3. DB Schemas:** Configure database model properties or indexes inside `core/src/models`.
* [ ] **4. Domain Service:** Implement service logic inside `core/src/services`.
* [ ] **5. Unit Testing:** Validate logic with Jest in isolated test suites (memory DB mock).
* [ ] **6. Ingress Controller:** Implement Express adapter logic inside `backend/api/src/controllers`.
* [ ] **7. Route Mounting:** Map REST endpoints in `backend/api/src/routes`.
* [ ] **8. Integration Testing:** Verify API shape and HTTP response codes (Supertest).
* [ ] **9. OpenAPI Specs:** Update parameters inside Swagger configuration schemas.
* [ ] **10. UI View Components:** Integrate React components inside Next.js client pages.
* [ ] **11. Boundary Lint:** Run `npm run guard:platform-governance` to verify no package leaks occurred.

---

## 5. Architectural Decision Tree

Before creating new packages or adding imports, evaluate features using the following decision tree:

```text
Do you need to write custom database queries?
  ├── YES ──► core
  └── NO
       │
       ▼
Do you need to bind Express routes or HTTP Request/Response contexts?
  ├── YES ──► backend/api
  └── NO
       │
       ▼
Is it a pure contract interface, constant enum, or shared DTO?
  ├── YES ──► shared
  └── NO  ──► core (or apps/ if purely presentation logic)
```

---

## 6. Folder Placement Strategy

New files must be placed inside the correct subfolder based on their architectural role:
* **Domain Service:** `core/src/services/`
* **Queue Definition:** `core/src/queues/`
* **Scheduled Job:** `core/src/jobs/`
* **Express Route:** `backend/api/src/routes/`
* **Express Middleware:** `backend/api/src/middleware/`
* **UI Component:** `apps/web/src/components/` (or `apps/admin/src/components/`)

---

## 7. Common Coding Mistakes & Corrections

### 7.1 Direct Database Query in Controller
* ❌ **Wrong Pattern:**
  ```typescript
  // Inside backend/api/src/controllers/adController.ts
  import AdModel from '@esparex/core/models/Ad';
  export const getActiveAds = async (req: Request, res: Response) => {
      const ads = await AdModel.find({ status: 'active' }); // DIRECT PERSISTENCE ACCESS
      return res.status(200).json(ads);
  };
  ```
* ✅ **Correct Pattern:**
  ```typescript
  // Inside backend/api/src/controllers/adController.ts
  import * as AdService from '@esparex/core/services/AdService';
  export const getActiveAds = async (req: Request, res: Response) => {
      const ads = await AdService.fetchActiveListings(); // DELEGATED TO CORE SERVICE
      return res.status(200).json(ads);
  };
  ```

### 7.2 Core Dependency on Transport Express Types
* ❌ **Wrong Pattern:**
  ```typescript
  // Inside core/src/services/UserService.ts
  import { Request } from 'express'; // LEAKING EXPRESS LAYER INTO CORE
  export const updateProfile = async (req: Request) => {
      const { name } = req.body;
      // ...
  };
  ```
* ✅ **Correct Pattern:**
  ```typescript
  // Inside core/src/services/UserService.ts
  export const updateProfile = async (userId: string, data: { name: string }) => {
      // PURE DATA PARAMS PASSED INTO CORE
      // ...
  };
  ```

---

## 8. Definition of Done (DoD)

Every new feature commit must satisfy the following checklist before merge approval:

1. **Unit Tests:** Core service rules verify 100% path coverage using Jest.
2. **Integration Tests:** REST route payload shapes verify correct return envelopes via Supertest.
3. **Static Boundary validation:** Linter scans return 0 leaks crossing package layers.
4. **Architecture validation:** `npm run guard:platform-governance` passes without warnings.
5. **Documentation updated:** Swagger specs and the Platform Domain Map reflect structural additions.
6. **ADR approval:** Received sign-off if modifying package dependencies or building new workspaces.
7. **CI Pipeline:** Automated build checks are completely green.
8. **Automated Audits:** Boundary checks, duplicate code detection (`jscpd`), circular dependency validations (`dependency-cruiser`), and dead code detection (`knip`) return 0 errors.
