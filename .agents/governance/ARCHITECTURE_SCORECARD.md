# Architecture Scorecard & Telemetry Standards

**Module**: 6C of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md)

---

## 1. Automated Telemetry Scorecard

To ensure long-term visibility and catch boundary decay, we aggregate and monitor release-on-release trend telemetry. Rather than relying on static snapshots, we analyze architectural health as a moving trend.

### Historical Trend Database

| Release | Domain Coupling | Circular Deps | Bounded Domains | Public API Violations | Manifest Coverage | Violations per Sprint |
|---|---|---|---|---|---|---|
| **2026.1** | 4.1% | 0 | 8 | 2% | 90% | 3 |
| **2026.2** | 3.7% | 0 | 9 | 0% | 100% | 0 |

---

## 2. Operational Metrics Index

In addition to static build checks, we continuously evaluate the codebase against operational and team complexity metrics:

| Metric | Target | Description | Primary Verification Tool |
|---|---|---|---|
| **Deep Domain Imports** | `0` | Prohibits cross-domain imports that bypass root barrels (`index.ts`). | `dependency-cruiser` |
| **Circular Dependencies** | `0` | Prohibits loops between core files or workspaces. | `madge` / `dependency-cruiser` |
| **Domain Coupling Ratio** | `< 5%` | Direct dependencies between bounded contexts. | `verify-domain-coupling.ts` |
| **Manifest Coverage** | `100%` | Bounded contexts with a valid `manifest.yaml`. | `verify-manifests.ts` |
| **Average Domain Size** | `< 40 files` | Average number of files in a single domain context. | Custom script |
| **Largest Domain Size** | `< 80 files` | Restricts runaway single-domain growth. | Custom script |
| **PR Overlap Ratio** | `< 10%` | Ratio of PRs touching the same domain folders simultaneously. | Git history analysis script |
| **Cross-Domain Commits** | `< 15%` | Commits affecting more than one domain folder. | Git log analysis script |

---

## 3. Architectural Decision Budget

To prevent the gradual accumulation of architectural debt, the Architecture Owner and Domain Owners enforce an **Architectural Decision Budget** evaluated during every sprint planning session:

- **New Technical Debt Created**: Budget = Max 1 exception per sprint (must be logged as `EX-NNN` and approved by the Architecture Owner).
- **Technical Debt Removed**: Target = Minimum 3 files migrated/aligned to the target architecture per sprint.
- **Domains Affected**: Monitored to prevent a single PR from altering rules across more than 2 domains.
- **Boundary Violations Introduced**: Must be `0`. A build containing an unmitigated boundary violation is blocked from merging.
- **ADR Updates Required**: Evaluated to retire stale decisions or update rules when pattern changes occur.
