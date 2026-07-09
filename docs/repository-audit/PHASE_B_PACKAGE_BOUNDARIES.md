# Phase B: Package Boundaries Audit Report

This report evaluates the architectural boundaries of the `@esparex/core` and `@esparex/shared` packages, identifying leakage violations and clarifying responsibilities.

---

## 1. Audit of `@esparex/core`

### 1.1 Boundary Verification

| Query | Answer | Details |
| :--- | :---: | :--- |
| **Does it contain only business logic?** | ❌ **No** | It is heavily coupled with Express routers, request/response controllers, and HTTP request middlewares. |
| **Are database models here?** |  **Yes** | All 60 database models (e.g. `User.ts`, `Ad.ts`, `SystemConfig.ts`) are housed in `core/src/models/` using Mongoose. |
| **Are services duplicated elsewhere?** | ❌ **No** | Services are centralized in `core/src/services/`, though there are split services (like the 9 flat classified ad services) that need folder organization. |
| **Does it know Express?** | ❌ **Yes** | Massive coupling. It imports `Request`, `Response`, `NextFunction`, and `Router` from `express` across 49+ controllers, middlewares, and utilities. |
| **Does it know React?** |  **No** | No imports of `react` or dependencies on UI components were found. |
| **Does it know Next.js?** |  **No** | No imports of `next` or dependencies on the Next.js router. |

### 1.2 Boundary Violations (High Severity)
* **Express Handlers Inside Core**: Files in `core/src/controllers/admin/`, `core/src/controllers/shared/`, and `core/src/controllers/smartAlert/` are transport-layer files, not business domain layer. The core domain package should be transport-agnostic (framework-neutral). Coupling it directly to Express makes unit testing harder, limits portability, and violates layering.
* **HTTP Middlewares Inside Core**: Files like `core/src/middleware/adminAuth.ts` and `core/src/middleware/HMACSignatureMiddleware.ts` are HTTP-specific and belong in the API gateway layer (`backend/user`), not the core package.

---

## 2. Audit of `@esparex/shared`

### 2.1 Boundary Verification

| Expected Content | Found? | Compliance Status |
| :--- | :---: | :--- |
| **constants** |  | Fully compliant (e.g., `AD_LIMITS`, `bannedWords.ts`). |
| **enums** |  | Fully compliant (e.g., `chatStatus.ts`, `adStatus.ts`). |
| **types** |  | Fully compliant (e.g., `api.ts`, `user.ts`, `location.ts`). |
| **validators** |  | Fully compliant (e.g., `textValidator.ts`). |
| **schemas** |  | Fully compliant (Zod schemas under `schemas/`). |
| **helpers & utilities** |  | Fully compliant (e.g., `formatters.ts`, `geoUtils.ts`). |

### 2.2 Forbidden Content Verification

| Forbidden Content | Found? | Details / Violation Status |
| :--- | :---: | :--- |
| **React components** |  | No React components. |
| **React Code / Hooks** | ❌ **Yes** | **Violation:** `shared/src/ui/popup/usePopupQueue.ts` imports React hooks (`useCallback`, `useEffect`, `useMemo`, `useReducer`, `useRef`). |
| **Next.js code** |  | No Next.js router or SSR dependencies. |
| **Express code** |  | No Express references or router logic. |
| **Mongo/Mongoose code** |  | No database connection schemas or models. |
| **Payment logic** |  | No Razorpay client calls or payment controllers. |
| **Chat logic** |  | No active messaging logic or socket connections. |

### 2.3 React Leakage in Shared (High Severity)
* **Finding**: `@esparex/shared` exports the React-dependent hook `usePopupQueue.ts` and registers it in the primary barrel file `shared/src/index.ts` (line 84).
* **Impact**: Node.js backend processes (such as `backend/user` or `core` runtimes) that import `@esparex/shared` will trigger import checks for the React runtime. This forces backend servers to compile/resolve React references, leading to type check warnings or crash risks if `react` is not present in the runtime dependencies of those packages.
