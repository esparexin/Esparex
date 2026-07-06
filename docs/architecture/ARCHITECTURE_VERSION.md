# Architecture Version Registry

This document is the authoritative record of all architecture versions for the Esparex monorepo.

---

## Current Version

| Field | Value |
| --- | --- |
| **Architecture Version** | v1.1.0 |
| **Status** | Active |
| **Date Activated** | 2026-07-06 |
| **Owner** | Platform Team |
| **Package Contract** | v1.0.0 (Stable) |

---

## Version History

### v1.1.0 — Architecture Governance (Active)

**Activated:** 2026-07-06  
**Status:** Active  
**ADR:** [ADR-007](adr/ADR-007-architecture-enforcement.md)

**Deliverables:**
- Architecture Dependency Matrix (`scripts/architecture/matrix.js`) — single source of truth for all dependency rules
- Dependency Cruiser enforcement (`.dependency-cruiser.cjs`) — generated from matrix
- ESLint Boundaries enforcement (warn mode) — generated from matrix
- Composite `architecture:check` CI command
- ADR-006 and ADR-007 governance records
- `ARCHITECTURE_VERSION.md` (this file)

**Changes from v1.0.0:**
- Added `dependency-cruiser` enforcement of the namespace dependency matrix
- Added `eslint-plugin-boundaries` enforcement (warn mode, to be promoted to error once baseline is clean)
- Added `scripts/architecture/matrix.js` as the single source of truth for all boundary rules
- Added `architecture:check` and `architecture:report` npm scripts
- Added `architecture:check` as a mandatory CI step

---

### v1.0.0 — Namespace Lockdown (Frozen)

**Activated:** 2026-07-06  
**Status:** Frozen (superseded by v1.1.0)  
**ADR:** [ADR-006](adr/ADR-006-namespace-governance.md)

**Deliverables:**
- 14 canonical public namespaces in `@esparex/core`
- Wildcard exports removed from `core/package.json`
- Wildcard TypeScript path mappings removed from all tsconfigs
- 182 consumer files migrated to namespace imports
- `scripts/verify-public-api.js` public API validation script
- `docs/architecture/PUBLIC_API.md` governance documentation
- All 8 verification gates passing

**Key namespace contract:**
```
@esparex/core
@esparex/core/models    @esparex/core/services    @esparex/core/events
@esparex/core/utils     @esparex/core/config       @esparex/core/types
@esparex/core/infrastructure               @esparex/core/tooling
@esparex/core/validators  @esparex/core/jobs        @esparex/core/queues
@esparex/core/workers     @esparex/core/domain
```

---

## Versioning Policy

| Change Type | Version Bump | Process |
| --- | --- | --- |
| Documentation clarification | Patch (e.g. v1.1.0 → v1.1.1) | Update this file and relevant ADR |
| New enforcement rule or namespace | Minor (e.g. v1.1.0 → v1.2.0) | New ADR required; update matrix.js and regenerate configs |
| Breaking package contract change | Major (e.g. v1.x → v2.0.0) | Full governance review; consumer migration plan required |

---

## Governance Contacts

Architecture decisions require consensus from the Platform Team. For questions, open a discussion referencing the relevant ADR number.
