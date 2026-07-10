---
MetadataSchema: 1.0
Brain-ID: ERB-001
Title: Repository Identity
Version: 1.0
Status: Active
Type: Dynamic
Owner: Repository Identity
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-000
    impacts:
      - ERB-002
      - ERB-003
  repository:
    consumes:
      - package.json
      - tsconfig.json
    owns:
      - Repository Workspaces Map
      - Product Identity Facts
    validates:
      - Workspace Directory Layout
    generates:
      - AI Workspace Boundary
---

# 01. Repository Identity

This document defines the core product identity, monorepo workspaces, and target engine configurations.

## 1. Product & Workspace Identity
* **Repository Name**: `esparex-admin-root`
* **Core Product**: Electronics trade-in and diagnostics marketplace.
* **Monorepo Strategy**: npm Workspaces.
* **Execution Host**: Node.js `22` (compiled with target NodeNext ESM/CommonJS modules).

---

## 2. Workspaces Mapping
The monorepo contains six registered workspaces:

1. `@esparex/apps-web` (Presentation Layer) located at [apps/web/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web)
2. `@esparex/apps-admin` (Presentation Layer) located at [apps/admin/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/admin)
3. `@esparex/backend-api` (Transport Layer) located at [backend/api/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/backend/api)
4. `@esparex/core` (Business Domain Layer) located at [core/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core)
5. `@esparex/shared` (Shared Library Layer) located at [shared/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared)
6. `@esparex/repository-governance` (Governance Platform) located at [packages/repository-governance/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/packages/repository-governance)

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Name & Workspaces definition**: [package.json#L2-16](file:///c:/Users/Administrator/Documents/GitHub/Esparex/package.json#L2-16)
* **Node.js Version**: [.nvmrc#L1](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.nvmrc#L1)
* **Project References**: [tsconfig.json#L34-40](file:///c:/Users/Administrator/Documents/GitHub/Esparex/tsconfig.json#L34-40)

---

## 4. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized workspace identities facts sheet.
