# Phase 2: Build Inventory Report

## 1. Executive Summary
A comprehensive inventory of all codebases, packages, helper/governance scripts, and documentation files in the Esparex repository was compiled. The inventory catalogs each item’s purpose, ownership, usage, and potential for removal. This will serve as a registry to track remediation targets.

---

## 2. Scope
This inventory encompasses:
- Apps in `apps/`
- Backend services in `backend/` and `core/`
- Shared packages in `shared/`
- Scripts in `scripts/` and root `package.json`
- Documentation files in `docs/` and root

---

## 3. Inventory

### Applications (in `apps/`)

| Path | Purpose | Owner | Used By | Can be removed? |
| :--- | :--- | :--- | :--- | :---: |
| **`apps/web`** | Main Next.js vehicle marketplace customer portal | Frontend Team | End-users | **No** |
| **`apps/admin`** | Internal Next.js administration portal | Admin Team | Moderators / Ops | **No** |
| **`apps/mobile`** | Capacitor wrapper stubs (iOS & Android) | Mobile Team | - (Placeholder) | **Yes** (if inactive) |

---

### Backend Services & Shared Packages

| Path | Purpose | Owner | Used By | Can be removed? |
| :--- | :--- | :--- | :--- | :---: |
| **`backend/user`** | Express REST server routing / middleware shell | Backend Team | Frontend Apps (Web/Admin) | **No** |
| **`core`** | Backend business logic, Mongoose schemas, jobs, queues | Backend Team | `backend/user` | **No** |
| **`shared`** | Environment-agnostic types, schemas, enums, utils, contracts | Platform Team | All workspaces | **No** |

---

### Developer & Governance Scripts (in `scripts/`)

| Script Path | Purpose | Owner | Callers / Usage | Can be removed? |
| :--- | :--- | :--- | :--- | :---: |
| `guard-platform-governance.js` | Main governance SDK runner | Platform Team | Husky pre-commit / CI | **No** |
| `enforce-component-api-boundary.js` | Enforces backend/frontend boundaries | Platform Team | governance:guards | **No** |
| `enforce-ai-governance-ssot.js` | Validates AI instruction parity | Platform Team | guard:ai-governance | **No** |
| `enforce-no-ad-hard-delete.js` | Blocks hard deletes of ad entities | Platform Team | guard:platform-governance | **No** |
| `enforce-moderation-route-whitelist.js`| Validates admin route permissions | Platform Team | guard:platform-governance | **No** |
| `enforce-schema-migration-gate.js` | Checks schema versions prior to merge | DB Admin | guard:schema-migration | **No** |
| `enforce-pr-impact-analysis.js` | Analyzes code impact of commits | CI Team | guard:pr-impact-analysis | **No** |
| `enforce-admin-status-literals.js` | Validates status strings against enums | Platform Team | lint:admin-status:ssot | **No** |
| `enforce-user-api-result-ssot.js` | Validates user api formats against SSOT | Lead Architect | lint:user-api-result:ssot | **No** |
| `verify-api-contract.js` | Verifies route signatures against contract | Lead Architect | contract:api | **No** |
| `guard-runtime-parity.js` | Validates Node/npm package configuration | Platform Team | guard:runtime-parity | **No** |
| `guard-core-export-parity.js` | Checks exports inside core package | Backend Team | guard:core-export-parity | **No** |
| `enforce-error-response-contract.js`| Enforces error payload structures | Backend Team | contract:error-envelope | **No** |
| `check-s3-images.ts` | Validates S3 asset links | Ops Team | check:s3-images | **No** |
| `eslint-rules/` | Custom lint checks for the workspace | Platform Team | eslint | **No** |
| `catalog-governance-audit.js` | Audits catalog db structures | Catalog Team | audit:catalog-governance | **No** |
| `catalog-stabilization.js` | Reconciles duplicate/orphan catalog items | Catalog Team | catalog:stabilize | **Yes** (post-migration)|
| `catalog-index-migration.js` | Manages mongodb index updates | DB Admin | catalog:index-migration | **Yes** (post-migration)|
| `clean-workspace.js` | Deletes local workspaces caches | Platform Team | clean:workspace-installs | **No** |
| `run-deterministic-e2e.mjs` | Spawns E2E tests deterministically | QA Team | e2e | **No** |
| `analyze-tech-debt.js` | Generates tech debt insight reports | Platform Team | debt:insights | **No** |
| `generate-eslint-baseline.js` | Re-generates eslint suppressions | Platform Team | debt:baseline | **No** |

*(Note: There are 27 other flat script files at the root of `scripts/` related to catalog maintenance and other checks. They are listed in detail in scripts audit.)*

---

### Documentation Files (in `docs/`)

| Path | Purpose | Owner | Classification | Can be removed? |
| :--- | :--- | :--- | :--- | :---: |
| `docs/00-index.md` | General landing and registry of all docs | Platform Team | Active SSOT | **No** |
| `docs/MASTER_DOCUMENT_REGISTRY.md` | Inventory list of documents in the repo | Platform Team | Active SSOT | **No** |
| `docs/ssot/API_CONTRACT_SSOT.md` | Specification for REST API endpoints | Tech Leads | Active SSOT | **No** |
| `docs/ssot/ARCHITECTURE_FLOW_SSOT.md`| Overview of system design and messaging | Tech Leads | Active SSOT | **No** |
| `docs/ssot/CI_CD_SSOT.md` | Overview of continuous integration layout | DevOps | Active SSOT | **No** |
| `docs/ssot/DOMAIN_MODEL_SSOT.md` | DB collection schemas and indexing rulebook | DB Admin | Active SSOT | **No** |
| `docs/governance/AI_GOVERNANCE_BOUNDARY.md`| Coding rules for AI agents | Platform Team | Active SSOT | **No** |
| `docs/governance/GOVERNANCE_POLICY.md` | Local quality standards baseline | Platform Team | Active SSOT | **No** |
| `docs/supporting/catalog_atlas_search_indexes.md`| Documentation for MongoDB search indexes | DB Admin | Technical Note | **No** |
| `docs/supporting/listing-edit-e2e.md` | Details for editing listing E2E flows | QA Team | Technical Note | **No** |
| `docs/deprecated/08-deployment-runbook.md`| Deprecated server manual deploy runbook | DevOps | Deprecated | **Yes** |

---

## 4. Findings

### Medium Severity Findings
1. **Deprecated Deployment Runbook in docs**
   - **Finding**: The file `docs/deprecated/08-deployment-runbook.md` contains outdated commands for manual deployment.
   - **Impact**: Developers may use outdated scripts. It should be archived or deleted.

2. **Apps/Mobile Inactive Wrapper**
   - **Finding**: `apps/mobile/` is registered in folder structure but has no source files and is not in the workspaces registry.
   - **Impact**: It is dead space.

---

## 5. Evidence
All items listed above have been verified in the local workspace filesystem during this turn.

---

## 6. Risk Level
- **Overall Inventory Risk**: **Low**
- The repository has well-defined core applications and documentation registries, though there are minor stubs and deprecated runbooks.

---

## 7. Recommendations
1. Move the deprecated deployment runbook `docs/deprecated/08-deployment-runbook.md` to `archive/` or delete it.
2. Formally declare in the backlog whether `apps/mobile/` will be deleted or registered as an npm workspace.

---

## 8. Out-of-Scope Items
- Live inventory of NPM dependencies (covered in Phase 3).
- Feature listings (covered in Phase 6).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 3 — Dependency Audit**.
