# Esparex Documentation Portal (Navigation Index)

> [!WARNING]
> **NON-AUTHORITATIVE NAVIGATION FILE ONLY**  
> This file exists solely for developer convenience, navigation, and quick links.  
> The **ONLY** authoritative registry for documentation, ownership, and governance is [MASTER_DOCUMENT_REGISTRY.md](file:///Users/admin/Desktop/EsparexAdmin/docs/MASTER_DOCUMENT_REGISTRY.md).

---

## 🧭 Quick Links & Navigation

### 1. Authoritative Governance
- 📄 [Master Document Registry](file:///Users/admin/Desktop/EsparexAdmin/docs/MASTER_DOCUMENT_REGISTRY.md) - The SSOT of SSOTs

### 2. Tier 1: Canonical SSOTs
- 💾 [Domain Model SSOT](file:///Users/admin/Desktop/EsparexAdmin/docs/ssot/DOMAIN_MODEL_SSOT.md) - Identity, roles, lifecycles, schemas, GeoJSON rules
- 🔌 [API Contract SSOT](file:///Users/admin/Desktop/EsparexAdmin/docs/ssot/API_CONTRACT_SSOT.md) - Namespaces, HTTP methods, errors, compatibility
- 🗺️ [Architecture Flow SSOT](file:///Users/admin/Desktop/EsparexAdmin/docs/ssot/ARCHITECTURE_FLOW_SSOT.md) - Post Ad, Edit Ad, Location prompts, Admin Approval
- 🚀 [CI/CD SSOT](file:///Users/admin/Desktop/EsparexAdmin/docs/ssot/CI_CD_SSOT.md) - Pipeline orders, validation guards, branch rules
- 📜 [Governance Policy](file:///Users/admin/Desktop/EsparexAdmin/docs/governance/GOVERNANCE_POLICY.md) - Developer standards, naming casing, lifecycle states
- 🤖 [AI Governance Boundary](file:///Users/admin/Desktop/EsparexAdmin/docs/governance/AI_GOVERNANCE_BOUNDARY.md) - Agent execution limits, prompt isolation rules

### 3. Tier 2: Supporting Reference Docs
- 🔍 [Catalog Atlas Search Indexes](file:///Users/admin/Desktop/EsparexAdmin/docs/supporting/catalog_atlas_search_indexes.md) - Atlas configuration
- 🧪 [Listing Edit E2E Test Strategy](file:///Users/admin/Desktop/EsparexAdmin/docs/supporting/listing-edit-e2e.md) - Playwright E2E details

---

## 💡 Developer Onboarding Guide
1. **Never create new undocumented audit files**: Always merge findings into the active canonical SSOT files and delete the temp audit.
2. **Follow Casing Conventions**: Always run `npm run guard:naming` before pushing.
3. **Respect AI Boundaries**: Never let a local prompt override the canonical architecture defined in these files.
