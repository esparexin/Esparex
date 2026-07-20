# Documentation Mapping Matrix

This matrix serves as the authoritative record of the documentation and governance consolidation project (July 2026). It maps the old file paths, the actions taken, the new file paths, and their final status.

| Old File Path | Action | New File Path | Status | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `CHANGELOG.md` (root) | Merge | `CHANGELOG.md` (root) | Keep | Authoritative platform changelog. |
| `docs/Esparex_Core/CHANGELOG.md` | Merge | `CHANGELOG.md` (root) | Delete (Archive) | Duplicated release notes. |
| `.agents/governance/arch/STANDARDS.md` | Merge | `.agents/governance/arch/STANDARDS.md` | Keep | Consolidated monorepo standards. |
| `.agents/governance/arch/ARCHITECTURE_STANDARD.md` | Merge | `.agents/governance/arch/STANDARDS.md` | Delete (Archive) | Duplicated technical architecture rules. |
| `.agents/governance/arch/ENFORCEMENT.md` | Merge | `.agents/governance/arch/ENFORCEMENT.md` | Keep | Consolidated CI controls catalog. |
| `.agents/governance/arch/ARCHITECTURE_CI.md` | Merge | `.agents/governance/arch/ENFORCEMENT.md` | Delete (Archive) | Duplicated CI scripts mapping. |
| `docs/DELETION_GATE.md` | Relocate | `docs/governance/DELETION_GATE.md` | Keep | Moved to `docs/governance/` to group rules. |
| `docs/Esparex_Core/PROJECT_PRINCIPLES.md` | Relocate | `docs/governance/PROJECT_PRINCIPLES.md` | Keep | Separates product principles from technical. |
| `docs/Esparex_Core/PROJECT_SPECIFICATION.md` | Relocate | `docs/development/PROJECT_SPECIFICATION.md` | Keep | Cleaned up and moved to `development/`. |
| `docs/Esparex_Core/MASTER_ROADMAP.md` | Relocate | `docs/development/MASTER_ROADMAP.md` | Keep | High-level roadmap moved to `development/`. |
| `docs/Esparex_Core/PROJECT_STATUS.md` | Relocate | `docs/development/PROJECT_STATUS.md` | Keep | Status board moved to `development/`. |
| `docs/Esparex_Core/SELLER_EXPERIENCE_BRD.md` | Relocate | `docs/development/SELLER_EXPERIENCE_BRD.md` | Keep | Product BRD moved to `development/`. |
| `docs/Esparex_Core/POST_AD_2.0_AUDIT.md` | Relocate | `docs/reports/POST_AD_2.0_AUDIT.md` | Keep | Completed audit moved to `reports/`. |
| `docs/performance-audit-2026-07.md` | Relocate | `docs/reports/performance-audit-2026-07.md` | Keep | Performance audit moved to `reports/`. |
| `tech-debt-insights.md` (root) | Relocate | `docs/reports/tech-debt-insights-2026-07.md` | Keep | Tech debt snapshot moved to `reports/`. |
| `docs/architecture/adr/ADR-001-packages-kernel-dormant.md` | Relocate | `.agents/decisions/ADR-001-packages-kernel-dormant.md` | Keep | Moved to decisions folder; kept number `ADR-001`. |
| `docs/architecture/Enterprise-Architecture-v1.md` | Archive | `docs/archive/Enterprise-Architecture-v1.md` | Keep | Historical architectural blueprint. |
| `docs/reports/Repository-Baseline-v1.md` | Archive | `docs/archive/Repository-Baseline-v1.md` | Keep | Historical quality metrics baseline. |
| `docs/migrations/contracts/AUDIT.md` | Archive | `docs/archive/contracts-migration-v1.0/AUDIT.md` | Keep | Historical contracts migration audit. |
| `docs/migrations/contracts/DESIGN.md` | Archive | `docs/archive/contracts-migration-v1.0/DESIGN.md` | Keep | Historical contracts migration design. |
| `docs/migrations/contracts/PHASE_4_1_REPORT.md` | Archive | `docs/archive/contracts-migration-v1.0/PHASE_4_1_REPORT.md` | Keep | Historical contracts migration report. |
| `docs/Esparex_Core/README.md` | Archive/Delete | `docs/archive/esparex-core/README.md` | Archive | Obsolete docs index; archived first. |
| `docs/Esparex_Core/08_Templates/Repository_Discovery_Prompt.md` | Archive/Delete | `docs/archive/esparex-core/08_Templates/Repository_Discovery_Prompt.md` | Archive | Obsolete LLM prompt; archived first. |
| `docs/Esparex_Core/DECISIONS.md` | Archive/Delete | `docs/archive/esparex-core/DECISIONS.md` | Archive | Redundant ADR index; archived first. |
| `docs/reports/walkthrough.md` | Delete | — | Delete | Redundant temporary walkthrough log. |
| `docs/reports/Startup-Failure-Investigation.md` | Delete | — | Delete | Duplicate of `Forensic-Audit-Startup-Failure.md`. |
| `docs/architecture/dependency-recommendations.md` | Delete | — | Delete | Outdated review observations. |
| `docs/architecture/domain-migration-guide.md` | Delete | — | Delete | Outdated domain migration guide. |
| `.agents/governance/arch/PRINCIPLES.md` | Relocate | `.agents/governance/PRINCIPLES.md` | Keep | Unifying governance under `.agents/governance/`. |
| `.agents/governance/arch/AUDIT_PROCESS.md` | Relocate | `.agents/governance/AUDIT_PROCESS.md` | Keep | Unifying governance under `.agents/governance/`. |
| `.agents/governance/arch/AUDIT_STATUS.md` | Relocate | `.agents/governance/AUDIT_STATUS.md` | Keep | Unifying governance under `.agents/governance/`. |
| `.agents/governance/arch/OPERATIONS.md` | Relocate | `.agents/governance/OPERATIONS.md` | Keep | Unifying governance under `.agents/governance/`. |
| `.agents/governance/arch/ARCHITECTURE_SCORECARD.md` | Relocate | `.agents/governance/ARCHITECTURE_SCORECARD.md` | Keep | Unifying governance under `.agents/governance/`. |
| `.agents/governance/arch/IMPLEMENTATION_GUIDE.md` | Relocate | `.agents/governance/IMPLEMENTATION_GUIDE.md` | Keep | Unifying governance under `.agents/governance/`. |
| `.agents/governance/arch/DDD_CORE_CONSOLIDATION_PLAN.md` | Relocate | `.agents/governance/DDD_CORE_CONSOLIDATION_PLAN.md` | Keep | Unifying governance under `.agents/governance/`. |

## Archive Strategy Policy
* Any file marked as `Archive` in the list above will be moved to `docs/archive/` (or `docs/archive/esparex-core/` for the Esparex Core directory items). 
* These files will remain in `docs/archive/` for one release cycle before they are permanently purged from the git working tree. This prevents accidental loss of any history or unique data.
