# Engineering Governance Policy

This is the Tier 3 Canonical Single Source of Truth (SSOT) defining standard developer practices, code quality boundaries, folder architectures, and the strict lifecycle rules for all repository assets.

---

## 1. Type Safety & TypeScript Standards

To maintain high stability and catch issues at compile time, all TypeScript workspaces must enforce:
1. **Strict Type Declarations**: The use of TypeScript's `any` type is strictly forbidden. All interfaces, API return boundaries, and component prop types must be explicitly declared.
2. **Strict Null Checks**: The non-null assertion operator (`!`) must be avoided unless a value is logically and structurally guaranteed to be non-null. Always use optional chaining (`?.`) or fallback default values.
3. **No Speculative speculative patches**:Speculative code changes are banned. Developers must prove the root cause of an issue and address it at the source, rather than patching downstream consumers.

---

## 2. Directory & Coding Conventions

### 2.1 File & Variable Naming
To maintain consistent styling and import paths, the repository enforces:
- **`camelCase`**: Used strictly for variables, function names, object properties, and script files (e.g. `checkDocDuplicates.js`).
- **`PascalCase`**: Used strictly for class names, React components, and component files (e.g. `StatusBanner.tsx`).
- **Boolean Prefixes**: All boolean variables, flags, and fields must carry a clear indicator prefix (`is`, `has`, `can`, e.g. `isActive`, `hasAccess`, `canWrite`).
- **Singular/Plural DB Casing**: Model names and database schemas must be strictly **Singular** (e.g. `User`, `Location`). REST API resource collections and route parameters must be strictly **Plural** (e.g. `/api/v1/users`, `/api/v1/locations`).

### 2.2 Clean Architecture Boundaries & Core Principles
To maintain codebase health and prevent architectural drift, the repository enforces the following permanent guardrails:
1. **Core Package Purity**: `@esparex/core` must remain strictly framework-independent (0 Express/HTTP imports). All business logic, status mutation services, database schemas, background queues, and transaction controls belong here.
2. **Thin API Controllers**: Controllers live exclusively in the API/delivery package (`backend/user`), functioning solely as thin HTTP request-to-response adapters.
3. **No Direct Model Access**: Controllers must never access Mongoose models or query databases directly. All database access must be delegated to core services or orchestrators.
4. **Transaction Ownership**: Database session and transaction boundaries must be managed and owned entirely by services or orchestrators inside `core`, never inside controllers.
5. **Strict Dependency Flow**: Package imports must follow the downstream dependency direction:
   ```text
   Applications (Web/Admin/Mobile) ➔ API (backend/user) ➔ Core (@esparex/core) ➔ Shared (@esparex/shared)
   ```
   Upstream references or imports (e.g. `core` importing from `backend/user`) are strictly prohibited.
6. **No Circular Dependencies**: Circular dependency paths are banned across all packages.
7. **Architectural Guardrails**: Any new package creation requires an approved Architecture Decision Record (ADR). Any new circular dependency or package boundary violation must fail the build in CI.
8. **Frontend Purity**: React components must remain presentational. Direct API fetch calls within components are banned; they must delegate to custom hooks or unified API services.

---

## 3. Governance Lifecycle & Documentation Standards

All documents in this repository are subject to strict quality and lifetime regulations:

### 3.1 Document Lifecycle States
Every document moves through five explicit states:
1. **Draft**: Temporary authoring proposal.
2. **Active**: Official repository authority, registered in `docs/MASTER_DOCUMENT_REGISTRY.md`.
3. **Deprecated**: Obsolete document replaced by a Canonical SSOT. Must carry the `# DEPRECATED` warning.
4. **Archived**: Historical report. Moved to `/archive/legacy/YYYY-MM/` and completely excluded from execution.
5. **Deleted**: Permanently removed.

### 3.2 Documentation Quality Rules
- **No Suffix Proliferation**: Suffixes like `final`, `latest`, `updated`, `copy`, or `new` are strictly banned.
- **Update In Place**: Active canonical documents must be modified in place. Creating `01-business-blueprint-v2.md` is strictly forbidden. Context is maintained in Git history.
- **Exclusion of Archived Content**: All historical audits, RCCAs, and older migrations must be moved to the `/archive` directory. They must never participate in automated lints, search-index indexes, or AI context loaders.
