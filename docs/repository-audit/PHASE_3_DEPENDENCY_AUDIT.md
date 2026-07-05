# Phase 3: Dependency Audit Report

## 1. Executive Summary
A comprehensive dependency audit of all package definitions, dependencies, devDependencies, and import/export behaviors in the Esparex workspaces was completed. The audit discovered severe package mismatches across workspaces, including critical version discrepancies in TypeScript (v5.9 vs v5.2), Sentry, Bull-Board, and Jest. Additionally, a critical package boundary violation was found where `@esparex/shared` exports React-dependent UI components, forcing backend services to transitively load React dependencies.

---

## 2. Scope
This audit inspected:
- Workspace `package.json` dependency lists
- Workspace devDependency lists
- Version alignment across workspaces
- Hoisting alignment and dependency replication
- Boundary crossings (e.g. backend transitively loading UI/frontend code)

---

## 3. Inventory

### Dependencies Count by Workspace
- **`@esparex/shared`**: 2 dependencies, 1 devDependency
- **`@esparex/core`**: 32 dependencies, 7 devDependencies
- **`@esparex/backend-user`**: 49 dependencies, 34 devDependencies
- **`@esparex/apps-web`**: 63 dependencies, 23 devDependencies
- **`@esparex/apps-admin`**: 13 dependencies, 8 devDependencies

---

## 4. Findings

### Critical Severity Findings
1. **Transitive React Import via `@esparex/shared` Barrel Export**
   - **Finding**: `@esparex/shared` contains React code inside `shared/src/ui/popup/usePopupQueue.ts` (which imports `react`, `useReducer`, `useEffect`, etc.). This hook is exported via the main barrel index file `shared/src/index.ts` (line 84).
   - **Impact**: Any node server file importing `@esparex/shared` (which includes `@esparex/core` and `@esparex/backend-user`) is forced to load React-dependent hooks. This breaks environment-agnostic constraints and can cause runtime issues in strict non-browser Node environments.

---

### High Severity Findings
2. **TypeScript Compiler Version Mismatches**
   - **Finding**: The workspaces do not agree on a single TypeScript version:
     - Root, `@esparex/shared`, `@esparex/core`, `@esparex/backend-user`: `"typescript": "^5.9.3"`
     - `@esparex/apps-web`, `@esparex/apps-admin`: `"typescript": "^5.2.2"`
   - **Impact**: Can lead to inconsistent compilation results, type errors present in the IDE but not in CI, and compiler caching failures.

3. **Version Mismatches in Core Third-Party Libraries**
   - **Finding**: Dependencies shared between `core` and `backend/user` use different versions:
     - `@bull-board/api` & `@bull-board/express`: `^7.0.0` (in `core`) vs `^6.20.3` (in `backend-user`)
     - `@sentry/node`: `^10.51.0` (in `core`) vs `^10.38.0` (in `backend-user`)
     - `jest`: `^30.3.0` (in `core`) vs `^30.2.0` (in `backend-user`)
     - `ts-jest`: `^29.4.9` (in `core`) vs `^29.4.6` (in `backend-user`)
     - `tailwindcss`: `^3.4.1` (in `apps/web`) vs `^3.4.19` (in `apps/admin`)
     - `react-hook-form`: `^7.69.0` (in `apps/web`) vs `^7.72.1` (in `apps/admin`)
     - `recharts`: `^3.5.1` (in `apps/web`) vs `^3.7.0` (in `apps/admin`)
   - **Impact**: Causes npm to create nested `node_modules` folders, inflating lockfiles and introducing risks of prototype pollution or type incompatibilities at runtime.

---

### Medium Severity Findings
4. **Massive Overlap Between `@esparex/core` and `@esparex/backend-user`**
   - **Finding**: `@esparex/backend-user` lists 49 production dependencies, of which 30+ are identical to `@esparex/core` (Mongoose, BullMQ, Redis, AWS SDK, Speakeasy, Razorpay, etc.).
   - **Impact**: Duplicated declarations increase maintenance overhead.

---

## 5. Evidence

### Transitive Hook Export
In [shared/src/index.ts:L84](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/index.ts#L84):
```typescript
export * from './ui/popup/usePopupQueue';
```
In [shared/src/ui/popup/usePopupQueue.ts:L3](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/ui/popup/usePopupQueue.ts#L3):
```typescript
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
```

### Version Discrepancies
- **TypeScript**: [apps/web/package.json:L112](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/package.json#L112) vs [core/package.json:L76](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L76)
- **Sentry**: [backend/user/package.json:L72](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/user/package.json#L72) vs [core/package.json:L41](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L41)
- **Bull Board**: [backend/user/package.json:L69](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/user/package.json#L69) vs [core/package.json:L38](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/package.json#L38)

---

## 6. Risk Level
- **Overall Dependency Risk**: **High**
- The mix of TypeScript versions and runtime dependency version skew between backend server and domain layers introduces high risks of build compilation errors and execution discrepancies.

---

## 7. Recommendations
1. **Move UI to Frontend**: Remove `shared/src/ui/popup/usePopupQueue.ts` (and its index export) from `@esparex/shared` and move it to `apps/web/src/hooks/usePopupQueue.ts` and `apps/admin/src/hooks/usePopupQueue.ts` (or implement a separate frontend-only shared package).
2. **Unify TypeScript Versions**: Update `@esparex/apps-web` and `@esparex/apps-admin` to use TypeScript version `^5.9.3`.
3. **Synchronize Backend Dependencies**: Align package versions of `@bull-board`, `@sentry`, `jest`, and `ts-jest` across `core` and `backend/user`.
4. **Leverage Workspace Dependencies**: Clean up redundant package declarations in `backend/user` where transitively resolved by `core`.

---

## 8. Out-of-Scope Items
- Audit of internal Javascript imports inside components (handled in Phase 4 Architecture Audit).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 4 — Architecture Audit**.
