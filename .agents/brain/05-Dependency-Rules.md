---
MetadataSchema: 1.0
Brain-ID: ERB-005
Title: Dependency Rules
Version: 1.0
Status: Active
Type: Static
Owner: Dependency Boundary Map
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run lint
  - npm run architecture:check
Relationships:
  documents:
    depends:
      - ERB-004
    impacts:
      - ERB-007
  repository:
    consumes:
      - eslint.config.mjs
      - scripts/architecture/boundaries-config.js
    owns:
      - Directory Dependency Rules
      - Barrel Import Rules
    validates:
      - Deep Core Imports
      - Upward Layer Imports
    generates:
      - Workspace Dependency Validation Map
---

# 05. Dependency Rules

This document registers the permitted compile-time dependencies, import scopes, and boundary enforcement rules.

## 1. Allowed & Forbidden Import Boundaries
The boundary check rules are defined in [boundaries-config.js](file:///c:/Users/Administrator/Documents/GitHub/Esparex/scripts/architecture/boundaries-config.js):

* **Presentation Layer (`apps/`)**:
  * **Allowed**: `@esparex/shared` (types/schemas), `@esparex/core/types` (public types), and `@esparex/core/domain` (public domain entities).
  * **Forbidden**: Direct imports of backend components, core services, or core database models.
* **Transport Layer (`backend/user/`)**:
  * **Allowed**: `@esparex/shared` and public `@esparex/core` namespaces.
  * **Forbidden**: Direct imports from `apps/` or core infrastructure files.
* **Business Domain (`core/`)**:
  * **Allowed**: `@esparex/shared`.
  * **Forbidden**: Direct imports from `apps/` or `backend/` zones.
* **Shared Library (`shared/`)**:
  * **Allowed**: None.
  * **Forbidden**: Direct imports from `apps/`, `backend/`, or `core/` zones (strictly isolated isomorphic package).

---

## 2. Import Validation Rules

### R-001 — Single Entrypoint for Shared
* **Statement**: Code consuming `@esparex/shared` must import from the root barrel.
* **Incorrect**: `import { x } from "@esparex/shared/src/utils/x"`
* **Correct**: `import { x } from "@esparex/shared"`
* **Enforcer**: ESLint pattern matches in [eslint.config.mjs#L72-82](file:///c:/Users/Administrator/Documents/GitHub/Esparex/eslint.config.mjs#L72-82).

### R-002 — Ban on Deep Imports from Core
* **Statement**: Workspaces consuming `@esparex/core` must import from public namespaces exports (`@esparex/core/models`, `@esparex/core/services`, `@esparex/core/utils`).
* **Incorrect**: `import { User } from "@esparex/core/src/models/User"`
* **Correct**: `import { User } from "@esparex/core/models"`
* **Enforcer**: Checked by `DeepImportChecker` during the build validation run.

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **ESLint Import boundaries config**: [eslint.config.mjs#L196-212](file:///c:/Users/Administrator/Documents/GitHub/Esparex/eslint.config.mjs#L196-212)
* **Boundaries Element matrix rules**: [scripts/architecture/boundaries-config.js](file:///c:/Users/Administrator/Documents/GitHub/Esparex/scripts/architecture/boundaries-config.js)
* **Deep import enforcer checker**: [packages/repository-governance/src/analyzers/architecture/checkers/deepImports.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/packages/repository-governance/src/analyzers/architecture/checkers/deepImports.ts)

---

## 4. Central Decisions References

* Central Decision Record: [0002-transport-separation](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0002-transport-separation.md)
* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized dependency rules and ESLint boundary configurations.
