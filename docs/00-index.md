# Esparex Documentation Portal (Navigation Index)

> [!WARNING]
> **NON-AUTHORITATIVE NAVIGATION FILE ONLY**  
> This file exists solely for developer convenience, navigation, and quick links.  
> The **ONLY** authoritative registry for documentation, ownership, and governance is [MASTER_DOCUMENT_REGISTRY.md](MASTER_DOCUMENT_REGISTRY.md).

---

## 🧭 Quick Links & Navigation

### 1. Authoritative Governance
- 📄 [Master Document Registry](MASTER_DOCUMENT_REGISTRY.md) - The SSOT of SSOTs

### 2. Tier 1: Canonical SSOTs
- 📖 [Repository Single Source of Truth](architecture/REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md) - Master repository guide, philosophy, layers, and conventions
- 📂 [Repository Directory Standard](architecture/REPOSITORY_DIRECTORY_STANDARD.md) - Allowed folder contents and template structures
- 🔍 [Current Architecture Report](architecture/CURRENT_ARCHITECTURE.md) - Map of package bounds and critical request/data flows
- 💾 [Domain Model SSOT](ssot/DOMAIN_MODEL_SSOT.md) - Identity, roles, lifecycles, schemas, GeoJSON rules
- 🔌 [API Contract SSOT](ssot/API_CONTRACT_SSOT.md) - Namespaces, HTTP methods, errors, compatibility
- 🗺️ [Architecture Flow SSOT](ssot/ARCHITECTURE_FLOW_SSOT.md) - Post/Edit Ad, Location prompts, Admin Approval
- 🚀 [CI/CD SSOT](ssot/CI_CD_SSOT.md) - Pipeline orders, validation guards, branch rules
- 📜 [Governance Policy](governance/GOVERNANCE_POLICY.md) - Developer standards, coding casing, lifecycle states
- 🤖 [AI Governance Boundary](governance/AI_GOVERNANCE_BOUNDARY.md) - Agent execution limits, prompt isolation rules
- 📐 [Repository Dependency Contract](architecture/PACKAGE_CONTRACT.md) - Package import rules, boundaries, and CI enforcement
- 📝 **Architecture Decision Records (ADRs)**
  - 📄 [ADR-001: Core Package Responsibilities](architecture/adr/ADR-001-core-package.md)
  - 📄 [ADR-002: Shared Package Responsibilities](architecture/adr/ADR-002-shared-package.md)
  - 📄 [ADR-003: Backend API Gateway Scope](architecture/adr/ADR-003-backend-api.md)
  - 📄 [ADR-004: Boundary Enforcement & APIs](architecture/adr/ADR-004-boundaries.md)
  - 📄 [ADR-005: Monorepo Layout & Stages](architecture/adr/ADR-005-monorepo.md)

### 3. Tier 2: Supporting Reference Docs
- 🔍 [Catalog Atlas Search Indexes](supporting/catalog_atlas_search_indexes.md) - Atlas configuration
- 🧪 [Listing Edit E2E Test Strategy](supporting/listing-edit-e2e.md) - Playwright E2E details
- 📂 **Folder Architecture Audit (Phases A–E)**
  - 📁 [Phase A: Folder Structure](repository-audit/PHASE_A_FOLDER_STRUCTURE.md)
  - 📁 [Phase B: Package Boundaries](repository-audit/PHASE_B_PACKAGE_BOUNDARIES.md)
  - 📁 [Phase C: Dependency Matrix](repository-audit/PHASE_C_DEPENDENCY_MATRIX.md)
  - 📁 [Phase D: Folder Ownership](repository-audit/PHASE_D_FOLDER_OWNERSHIP.md)
  - 📁 [Phase E: Refactor Recommendations](repository-audit/PHASE_E_REFACTOR_RECOMMENDATIONS.md)
  - 📝 [Baseline Verification](repository-audit/BASELINE_VERIFICATION.md)
  - 📝 [Transport Separation Audit](cleanup/transport-separation-audit.md)
  - 📝 [Rollback Guide](cleanup/ROLLBACK.md)
  - 📝 [Phase 17 Execution Log](repository-audit/PHASE_17_CLEANUP_EXECUTION.md)

---

## 💡 Developer Onboarding Guide
1. **Never create new undocumented audit files**: Always merge findings into the active canonical SSOT files and delete the temp audit.
2. **Follow Casing Conventions**: Always run `npm run guard:naming` before pushing.
3. **Respect AI Boundaries**: Never let a local prompt override the canonical architecture defined in these files.
