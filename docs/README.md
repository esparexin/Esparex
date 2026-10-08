# Esparex Platform Documentation Hub

Welcome to the Esparex Platform documentation hub. This directory contains technical and product specifications, architectural decision records, governance standards, system audits, and performance baselines.

---

## Documentation Directory Index

### ⚖️ [Governance](governance/) — Tier A/B canonical + discipline manuals (pointers stubs omitted from active guidance)
- **Owner**: Platform Governance Team
- **Key Specifications**:
  - [REPOSITORY-GOVERNANCE.md](governance/REPOSITORY-GOVERNANCE.md) — Tier A repo SSOT (structure, branches, enforcement tiers §3a).
  - [ENGINEERING-HANDBOOK.md](governance/ENGINEERING-HANDBOOK.md) — Tier B entry router (no new rules).
  - [DELETION_GATE.md](governance/DELETION_GATE.md) — 10 mandatory criteria for file deletions.
  - Discipline manuals: `API-GOVERNANCE.md`, `DATABASE-GOVERNANCE.md`, `SECURITY-GOVERNANCE.md`, `DEVOPS-GOVERNANCE.md`, `TESTING-GOVERNANCE.md`, `RELEASE-GOVERNANCE.md`.
  - Superseded pointers (not active guidance): `DOCUMENTATION-GOVERNANCE.md`, `ENFORCEMENT_HIERARCHY.md`, `ARCHITECTURE-GOVERNANCE.md`, `PROJECT_PRINCIPLES.md`, `quality-gates.md`, `sprint-execution-prompt.md` → see canonical owners in each file.

### 🏛️ [Architecture](architecture/) & [ADRs](architecture/adr/)
- **Owner**: Platform Architecture Team
- **Key Specifications**:
  - [PLATFORM_ARCHITECTURE.md](architecture/PLATFORM_ARCHITECTURE.md) — System architecture operating model v4.0.
  - [PLATFORM_CAPABILITY_CATALOG.md](architecture/PLATFORM_CAPABILITY_CATALOG.md) — Capability & hardware integration inventory.
  - [UI_TECHNICAL_SPECIFICATION.md](architecture/UI_TECHNICAL_SPECIFICATION.md) — Cross-platform UI component & layout technical specification.
  - [USER_FACING_FRONTEND_CATALOG.md](USER_FACING_FRONTEND_CATALOG.md) — Complete user-facing frontend inventory (Public & Private pages, features, user flows).
  - [DECISION_LOG.md](../.agents/logs/DECISION_LOG.md) — Master Architecture & Agent Decision Log (cross-reference [engineering-action-register.md](tracking/engineering-action-register.md)).
  - [PDR-001-action-color.md](architecture/adr/PDR-001-action-color.md) — Action color (blue era; superseded by `AGENTS.md` §21 Green, historical only).
  - [PDR-002-category-hierarchy-depth.md](architecture/adr/PDR-002-category-hierarchy-depth.md) — Category hierarchy depth bounding constraint (formerly ADR-005).

### 🎨 [Design System](design-system/)
- **Owner**: Design System Team
- **Key Specifications**:
  - [token-catalog.md](design-system/token-catalog.md) — Token catalog (STALE — regenerate from `packages/design-tokens`; see file header).
  - [compliance-report.md](design-system/compliance-report.md) — Compliance verification (FROZEN blue-era; superseded by EA-040).

### 🛠️ [Development & Product Specs](development/)
- **Owner**: Product Management Team
- **Key Specifications**:
  - [PROJECT_SPECIFICATION.md](development/PROJECT_SPECIFICATION.md) — Monorepo layout, context boundaries, and data flows.
  - [SELLER_EXPERIENCE_BRD.md](development/SELLER_EXPERIENCE_BRD.md) — Business Requirements Document for Post Ad 2.0.
  - [MASTER_ROADMAP.md](development/MASTER_ROADMAP.md) — Strategic priority work streams.
  - [PROJECT_STATUS.md](development/PROJECT_STATUS.md) — 2026-07-22 snapshot (FROZEN; superseded by roadmap + EA register).

### 🔍 [Audits](audits/) — FROZEN evidence (not active guidance)
- **Owner**: QA & Governance Team
- **Key Specifications** (all frozen; see file headers):
  - [HOME_FEED_LISTING_TYPE_LOCATION_AUDIT.md](audits/HOME_FEED_LISTING_TYPE_LOCATION_AUDIT.md) — Home Feed Listing Type & Location Architecture Audit.
  - [MOBILE_UX_ROOT_CAUSE_AUDIT.md](audits/MOBILE_UX_ROOT_CAUSE_AUDIT.md) — Mobile UI/UX Root Cause Audit & Verification Report (August 2026).
  - [TECHNICAL_DEBT_REMEDIATION_BASELINE.md](audits/TECHNICAL_DEBT_REMEDIATION_BASELINE.md) — Technical Debt Remediation Baseline & Safety Classification.

### 📈 [Performance](performance/) & 🛡️ [Security](security/) — point-in-time baselines (frozen where marked)
- **Owner**: Engineering Performance & Security Teams
- **Key Specifications**:
  - [baseline-report.md](performance/baseline-report.md) — Performance baseline metrics.
  - [security-audit-remediation-report.md](security/security-audit-remediation-report.md) — Security audit remediation report.
  - [google-brand-entity-remediation.md](seo/google-brand-entity-remediation.md) — Brand entity & search remediation playbook.

### 🚀 [Releases](releases/) & [Tracking](tracking/)
- **Owner**: Release Engineering Team
- **Key Specifications**:
  - [release-notes.md](releases/v1.0.0/release-notes.md) — Release notes v1.0.0.
  - [engineering-action-register.md](tracking/engineering-action-register.md) — Master Engineering Action Register (EA-001 .. EA-120).



