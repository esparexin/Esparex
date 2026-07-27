# ESPAREX AUTHORIZATION ARCHITECTURE — OWNERSHIP MODEL & GOVERNANCE BASELINE

**Scope:** Application Authorization & Middleware Boundaries  
**Governance Standard:** Single Source of Truth (SSOT), Permission-First Architecture, Zero Controller Authorization

---

## 1. Layered Authorization Ownership Model

The Esparex platform enforces a strict, single-owner **Layered Authorization Pipeline**:

```text
[HTTP Request]
     │
     ▼
[Authentication Layer (Middleware)]
     │  - Verifies JWT signatures & sessions (requireAdmin).
     │  - Normalizes roles (normalizeRole() -> Role enum).
     │  - Populates req.user.
     ▼
[Authorization Layer (Middleware)]
     │  - Evaluates permissions & role allowlists (requirePermission).
     │  - Evaluates Super Admin bypass rules.
     │  - Rejects unauthorized requests at gateway (401 / 403).
     ▼
[Business Validation Layer (Controllers / Services)]
     │  - Validates request payload DTOs (@esparex/contracts).
     │  - MUST NOT re-verify authentication or role permissions.
     ▼
[Domain Execution Layer (Core Services)]
     │  - Enforces domain invariants and entity state transitions.
     │  - Business rules ONLY.
     ▼
[Persistence Layer (Repositories / Models)]
     │  - Data storage and soft-delete query scoping only.
     │  - NEVER performs authorization.
```

---

## 2. Core Governance Rules

1. **Authentication Belongs to Middleware**: `requireAdmin` authenticates the JWT session, normalizes `admin.role` via `normalizeRole()`, and attaches `req.user`.
2. **Authorization Belongs to Middleware**: `requirePermission('module:action')` enforces role allowlists (`roleGrantsPermission`) and permission arrays.
3. **Controllers Must NOT Re-Authorize**: Controllers must focus strictly on input DTO parsing, invoking core services, and formatting HTTP responses. Re-verifying user roles inside controllers (e.g. `hasAdminAccess`) is forbidden.
4. **Services Enforce Business Rules Only**: Domain services validate entity ownership and invariants (e.g., cannot delete an active entity with dependent children).
5. **Repositories Never Enforce Authorization**: Database adapters operate purely on entity persistence and safe query scoping.
