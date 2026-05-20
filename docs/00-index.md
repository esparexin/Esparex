# Esparex Master Documentation Registry

This is the Single Source of Truth for all active documentation in the Esparex platform. Any document not listed here is considered non-authoritative or legacy.

## 5-Layer Governance Hierarchy

To prevent circular authority and context overload, all documents follow a strict 5-layer hierarchy. A rule in a higher layer overrides a lower layer.

1. **Layer 1: Master SSOT (Business Truth)** -> `01-business-blueprint.md`
2. **Layer 2: Engineering SOP (Process Truth)** -> `02-engineering-governance.md`
3. **Layer 3: Developer Standards (Implementation Truth)** -> `03-developer-standards.md`, `06-frontend-admin-standards.md`, `11-security-compliance.md`
4. **Layer 4: API & Infrastructure (Connectivity Truth)** -> `04-api-connectivity-map.md`, `05-database-schema-ssot.md`
5. **Layer 5: AI Execution (Agent Truth)** -> `ai-governance/SSOT.md`, `ai-governance/SOP.md`

## Document Registry

| File Path | Purpose | Owner | Authority | Validated By | CI Enforced |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `README.md` | Platform Overview & Setup | Engineering | L1 | Manual | No |
| `docs/00-index.md` | Master Registry | Doc Gov | L0 | `docs:lint` | Yes |
| `docs/01-business-blueprint.md` | Business Goals & Strategy | Product | L1 | Manual | No |
| `docs/02-engineering-governance.md` | Global Policies & Guardrails | Arch | L2 | `guard:platform-gov`| Yes |
| `docs/03-developer-standards.md` | Coding & Naming Standards | Engineering | L3 | `guard:naming` | Yes |
| `docs/04-api-connectivity-map.md` | API & Env Connectivity | Arch | L4 | `guard:api-surface` | Yes |
| `docs/05-database-schema-ssot.md` | Database Schema & Indexes | Data | L4 | `guard:ad-ssot` | Yes |
| `docs/06-frontend-admin-standards.md` | UI/UX & Component Rules | Frontend | L3 | `guard:component-api`| Yes |
| `docs/07-enforcement-matrix.md` | Rule-to-Script Mapping | Doc Gov | Sup | Manual | No |
| `docs/08-deployment-runbook.md` | CI/CD & Ops | Ops | Sup | `guard:pr-impact` | Yes |
| `docs/10-archive-policy.md` | Doc Lifecycle Policy | Doc Gov | Sup | `docs:lint` | Yes |
| `docs/11-security-compliance.md` | Security & Fraud Rules | Security | L3 | Manual | No |
| `ai-governance/SSOT.md` | AI Behavior SSOT | AI Gov | L5 | `guard:ai-ssot` | Yes |
| `ai-governance/SOP.md` | AI Execution SOP | AI Gov | L5 | Manual | No |

## Governance Rules

1. **One Topic = One File**: Do not create parallel documentation for the same domain.
2. **Registry Mandatory**: Every new document must be added to this registry.
3. **No "Final" Suffixes**: Filenames like `final`, `latest`, `updated`, or `copy` are strictly banned.
4. **Update-In-Place**: Always edit the canonical file. Never create a "v2" copy.
5. **Validated By**: Every critical rule must link to a validator in the [Enforcement Matrix](07-enforcement-matrix.md).
6. **CI Enforced**: Any rule with "Yes" in CI Enforced is a blocker for merging.
