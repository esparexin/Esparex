# Esparex Master Documentation Registry

This is the Single Source of Truth for all active documentation in the Esparex platform. Any document not listed here is considered non-authoritative or legacy.

| File Path | Purpose | Owner | Authority | Validated By | CI Enforced |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `README.md` | Platform Overview & Setup | Engineering | L1 | Manual | No |
| `docs/00-index.md` | Master Registry | Doc Gov | L0 | `docs:lint` | Yes |
| `docs/01-business-blueprint.md` | Business Goals & Strategy | Product | L1 | Manual | No |
| `docs/02-engineering-governance.md` | Global Policies & Guardrails | Arch | L1 | `guard:platform-gov`| Yes |
| `docs/03-developer-standards.md` | Coding & Naming Standards | Engineering | L2 | `guard:naming` | Yes |
| `docs/04-api-connectivity-map.md` | API & Env Connectivity | Arch | L1 | `guard:api-surface` | Yes |
| `docs/05-database-schema-ssot.md` | Database Schema & Indexes | Data | L1 | `guard:ad-ssot` | Yes |
| `docs/06-frontend-admin-standards.md` | UI/UX & Component Rules | Frontend | L2 | `guard:component-api`| Yes |
| `docs/07-enforcement-matrix.md` | Rule-to-Script Mapping | Doc Gov | L1 | Manual | No |
| `docs/08-deployment-runbook.md` | CI/CD & Ops | Ops | L1 | `guard:pr-impact` | Yes |
| `docs/09-ai-governance.md` | AI SSOT & SOP Bridge | AI Gov | L1 | Manual | No |
| `docs/10-archive-policy.md` | Doc Lifecycle Policy | Doc Gov | L1 | `docs:lint` | Yes |
| `docs/11-security-compliance.md` | Security & Fraud Rules | Security | L1 | Manual | No |
| `ai-governance/SSOT.md` | AI Behavior SSOT | AI Gov | L1 | `guard:ai-ssot` | Yes |
| `ai-governance/SOP.md` | AI Execution SOP | AI Gov | L1 | Manual | No |

## Governance Rules

1. **One Topic = One File**: Do not create parallel documentation for the same domain.
2. **Registry Mandatory**: Every new document must be added to this registry.
3. **No "Final" Suffixes**: Filenames like `final`, `latest`, `updated`, or `copy` are strictly banned.
4. **Update-In-Place**: Always edit the canonical file. Never create a "v2" copy.
5. **Validated By**: Every critical rule must link to a validator in the [Enforcement Matrix](07-enforcement-matrix.md).
6. **CI Enforced**: Any rule with "Yes" in CI Enforced is a blocker for merging.
