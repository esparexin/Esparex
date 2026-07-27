# ESPAREX AUTHORIZATION ARCHITECTURE GOVERNANCE & MIGRATION GUIDE

**Scope:** Authorization Infrastructure, Middleware Boundaries, CI Guardrails  
**Governance Standard:** Single Source of Truth (SSOT), Permission-First Architecture, Automated CI Guardrails

---

## 1. Prohibited vs Approved Authorization Patterns

All human engineers and AI agents working on the Esparex monorepo must adhere strictly to the **Authorization Smell Standard**:

### ❌ Prohibited Authorization Anti-Patterns
- `❌ role === "admin"` or `role === "super_admin"` (Raw string literal comparisons).
- `❌ ["admin", "super_admin"].includes(role)` (Hardcoded raw role string arrays).
- `❌ hasAdminAccess()` (Manual controller-level authorization checks).
- `❌ authorization logic in repositories` (Database layer enforcing permission rules).
- `❌ authorization after requirePermission()` (Redundant checks inside controllers).
- `❌ string literals replacing Role enum constants`.

### ✅ Approved Canonical Authorization Patterns
- `✅ normalizeRole(role)` (Standardized role normalization).
- `✅ Role.ADMIN`, `Role.SUPER_ADMIN`, `Role.MODERATOR` (Shared `Role` enum from `@esparex/contracts`).
- `✅ requireAdmin()` (Middleware-level authentication SSOT).
- `✅ requirePermission('module:action')` (Middleware-level authorization SSOT).
- `✅ business validation ONLY inside services`.

---

## 2. Migration Examples

### Example A: Refactoring Controller-Level Role Checks

```typescript
// ❌ PROHIBITED (Legacy raw string comparison inside controller)
if (user.role === 'admin' || user.role === 'super_admin') {
    return proceed();
}

// ✅ APPROVED (Canonical role normalization and enum comparison)
import { Role } from '@esparex/contracts';
import { normalizeRole } from '@esparex/core/utils/roleNormalization';

const role = normalizeRole(user.role);
if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    return proceed();
}
```

### Example B: Eliminating Duplicate Authorization Guards

```typescript
// ❌ PROHIBITED (Redundant role check in controller guarded by requirePermission)
export const deleteBrand = async (req: Request, res: Response) => {
    if (!hasAdminAccess(req)) return res.status(403).json({ error: 'Admin access required' });
    // ...
};

// ✅ APPROVED (Rely on route middleware requireAdmin + requirePermission as SSOT)
export const deleteBrand = async (req: Request, res: Response) => {
    // Route middleware guarantees caller possesses valid session and 'catalog:write' permission
    const id = String(req.params.id);
    const result = await CatalogOrchestrator.deleteBrandOrchestrated(id);
    return res.json({ success: true, data: result });
};
```

---

## 3. Automated CI Guardrails & Exclusions

To prevent authorization drift, Esparex runs automated CI checks on every pull request (`npm run guard:auth-ssot`).

### CI Guardrail Policy (`scripts/enforce-authorization-ssot.js`)
- Scans `backend/api/src` for raw role string literals (`'super_admin'`, `'seller_pro'`) and banned controller checks.
- Fails build with `exit 1` if unauthorized raw role string comparisons exist outside normalization layers.

### Explicit Allowed Exclusions
The guardrail explicitly excludes the following modules from string checks:
1. `core/src/domains/identity/application/roles/roleNormalization.ts` (Authoritative normalization layer mapping legacy strings to `Role` enum).
2. Test fixtures (`*.spec.ts`, `*.test.ts`, `__mocks__`) intentionally testing legacy inputs and fallback states.
