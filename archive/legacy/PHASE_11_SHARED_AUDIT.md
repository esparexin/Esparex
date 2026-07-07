# Phase 11: Shared Package Audit Report

## 1. Executive Summary
A shared package audit of the `@esparex/shared` workspace was conducted. The package compiles environment-agnostic schemas, enums, validators, types, and contracts used across frontend and backend services. The audit identified a critical boundary violation where React-dependent hooks are exported, redundant alias enum definitions mapping the same status keys, and overlapping status string values (`live` vs. `active`) in the core lifecycle definitions.

---

## 2. Scope
This audit evaluated:
- Shared enums in `shared/src/enums/`
- Shared Zod validation schemas in `shared/src/schemas/`
- Environment-agnostic constraints
- Duplicate constants and files
- Workspace export boundary crossings

---

## 3. Inventory
- **Validation Schemas**: `AdSchema`, `CatalogSchema`, `LocationSchema`, `SavedSearchSchema`, `SmartAlertSchema`, `SparePartSchema`
- **Enums**: `LIFECYCLE_STATUS`, `LISTING_STATUS`, `AD_STATUS`, `ROLES`, `USER_STATUS`, etc. (26 total enum files)
- **Utilities**: formatter functions, status normalization helpers, and coordinate geometry tools
- **UI Components**: `shared/src/ui/popup/usePopupQueue.ts`

---

## 4. Findings

### Critical Severity Findings
1. **React UI Code inside Universal Shared Package**
   - **Finding**: `@esparex/shared` contains a React hook file `shared/src/ui/popup/usePopupQueue.ts` that relies statically on `react` runtime imports. This file is exported through the main barrel file `shared/src/index.ts`.
   - **Impact**: Backend processes importing `@esparex/shared` (which includes Express routes and database tasks) transitively load React, violating environmental boundaries and inflating memory/boot cycles.

---

### High Severity Findings
2. **Duplicate/Redundant Status Enum Definitions**
   - **Finding**: There are three separate files defining lifecycle states: `lifecycle.ts` (`LIFECYCLE_STATUS`), `listingStatus.ts` (`LISTING_STATUS`), and `adStatus.ts` (`AD_STATUS`). Both `LISTING_STATUS` and `AD_STATUS` are merely aliases mapping to `LIFECYCLE_STATUS`.
   - **Impact**: Confuses developers, leading to import fragmentation where some files import `AD_STATUS`, others `LISTING_STATUS`, and others `LIFECYCLE_STATUS` for the same values.

3. **Status Code Conflict (`live` vs. `active`) in Lifecycle Definitions**
   - **Finding**: `shared/src/enums/lifecycle.ts` registers both `LIVE: 'live'` and `ACTIVE: 'active'` keys.
   - **Impact**: Severe potential for query bugs. A developer writing database queries might filter listings on `status: "active"` while another uses `status: "live"`, yielding missing listings or database query mismatches.

---

### Medium Severity Findings
4. **Duplicate Constants Directory structure**
   - **Finding**: Top-level `shared/constants/image-domain-registry.json` is a duplicate of `shared/src/constants/image-domain-registry.json`.
   - **Impact**: Can lead to developers updating the wrong configuration file.

---

## 5. Evidence

### Hook React Imports in Shared
In [shared/src/ui/popup/usePopupQueue.ts:L3](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/ui/popup/usePopupQueue.ts#L3):
```typescript
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
```

### Overlapping Status Constants
In [shared/src/enums/lifecycle.ts:L3-4](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/enums/lifecycle.ts#L3-L4):
```typescript
    LIVE: 'live',
    ACTIVE: 'active',
```

### Redundant Status Aliasing
In [shared/src/enums/adStatus.ts:L7](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/enums/adStatus.ts#L7):
```typescript
export const AD_STATUS = LISTING_STATUS;
```
In [shared/src/enums/listingStatus.ts:L8](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/enums/listingStatus.ts#L8):
```typescript
export const LISTING_STATUS = LIFECYCLE_STATUS;
```

---

## 6. Risk Level
- **Overall Shared Audit Risk**: **High**
- The lifecycle status enum conflict (`live` vs `active`) and the presence of UI code inside the shared package pose significant runtime risks.

---

## 7. Recommendations
1. **Decouple React Hooks**: Move `shared/src/ui/` to `apps/web/src/hooks/` and remove it from `@esparex/shared` index exports.
2. **Consolidate Lifecycle Enums**: Retire `adStatus.ts` and `listingStatus.ts` and merge all references to use `LIFECYCLE_STATUS` from `shared/src/enums/lifecycle.ts` directly.
3. **Resolve `live`/`active` Duplication**: Choose one canonical string value representing a published listing (usually `active`) and remove the redundant status key from `lifecycle.ts` to prevent database query divergence.
4. **Prune Duplicate Constants Directory**: Delete the top-level `shared/constants/` directory.

---

## 8. Out-of-Scope Items
- Inspection of Next.js frontend-specific Zod validators (handled in Frontend audit).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 12 — Scripts Audit**.
