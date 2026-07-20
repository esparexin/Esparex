---
id: architecture-governance-master
owner: architecture
type: governance
version: 2.0
last_updated: 2026-07-13
status: active
review_frequency: semi-annual
---

# Architecture Governance Framework (Master Index)

**Version**: 2.0 (Modular Architecture)
**Last Updated**: 2026-07-13
**Status**: Active

---

## Modular Separation of Policy, Standards, and State

To ensure that timeless architectural philosophy remains stable while transient audit results and enforceable thresholds evolve naturally, the Esparex Architecture Governance Framework is strictly separated into six purpose-specific modules:

```text
Architecture Governance
├── GOVERNANCE.md               ← General Agent Policy & Discipline (Timeless)
├── ARCHITECTURE_GOVERNANCE.md  ← Master Architecture Index (This File)
├── PRINCIPLES.md               ← Module 1: Immutable Design Philosophy
├── STANDARDS.md                ← Module 2: Enforceable Rules & Versioned Standards (Merged)
├── ENFORCEMENT.md              ← Module 3: CI/CD Controls & Automation Catalog (Merged)
├── AUDIT_PROCESS.md            ← Module 4: Audit Cadence, Exceptions & Evidence Rules
├── AUDIT_STATUS.md             ← Module 5: Current Repository State & Active Ledger
└── OPERATIONS.md               ← Module 6: Ownership Matrix, Maturity Model & Lifecycle
```

---

## Overview of the Six Modules

### [Module 1: Architecture Principles](./PRINCIPLES.md)
**Nature**: Immutable design philosophy (`P1`–`P6`).
**Purpose**: Defines the fundamental laws of the architecture without referencing specific package names, frameworks, or file paths. Principles take precedence over Standards whenever a conflict occurs.
- **Key Principles**: Dependencies Flow Inward (`P1`), Domain Must Not Depend on Delivery (`P2`), UI Must Not Depend on Backend Infrastructure (`P3`), Shared Packages Remain Platform-Neutral (`P4`).

### [Module 2: Architecture Standards](./STANDARDS.md)
**Nature**: Enforceable rules (`S1`–`S10`), independently versioned.
**Purpose**: Translates Principles into concrete, repository-specific rules referencing tools, paths, and quantitative thresholds.
- **Active Standards**: Package Ownership (`S1 v1.0`), Import Boundary (`S2 v1.1`), Package Content (`S3 v1.1`), ADR Requirement (`S4 v1.0`), Composite Complexity Triggers (`S5 v1.0`), Hexagonal Suffixes (`S6 v1.0`), Shared Kernel (`S7 v1.0`), Bounded Context Events (`S8 v1.0`), Domain Manifest (`S9 v1.0`), Core Architectural Patterns (`S10 v1.0`).

### [Module 3: CI Enforcement Catalog](./ENFORCEMENT.md)
**Nature**: Automated CI controls (`E-001`–`E-011`).
**Purpose**: Inventories all automated checks that run on every commit and block PR merges upon failure (`dependency-cruiser`, `madge`, `tsc`, `eslint`, `jscpd`, `knip`). Documents current coverage gaps and the enforcement evolution roadmap.

### [Module 4: Audit Process](./AUDIT_PROCESS.md)
**Nature**: Stable evaluation methodology across 10 audit phases.
**Purpose**: Defines how audits run, entry requirements, evidence standards, and standardized exit criteria (`PASS`, `PASS WITH OBSERVATIONS`, `FAIL`, `BLOCKED`). Establishes the formal Exception Request workflow (`EX-NNN`).

### [Module 5: Audit Status & Repository Health](./AUDIT_STATUS.md)
**Nature**: Transient, mutable repository state evaluated against the 10 audit phases.
**Purpose**: Records the latest audit ledger, active exceptions register (`EX-001`, `EX-002`), and summary of open architectural observations evaluated at commit `6c062ce1` (2026-07-13).

### [Module 6: Governance Operations](./OPERATIONS.md)
**Nature**: Operational execution and lifecycle management.
**Purpose**: Establishes the Governance Ownership Matrix (Architecture, Platform, Domain, Release, and Security Owners), the L1–L5 Governance Maturity Model (currently reporting **L4.6**, targeting **L5.0**), exception/risk lifecycle mechanics, and the operational review cadence.

---

## Bridge to Decision Records & Risk Register

- **Architectural Decision Records (ADRs)**: Stored in `.agents/decisions/`. Govern when and why structural changes occur per [ADR-006: Architecture Decision Lifecycle](../decisions/ADR-006-adr-decision-lifecycle.md).
- **Architectural Risk Register**: Stored at [.agents/governance/ARCHITECTURE_RISK_REGISTER.md](./ARCHITECTURE_RISK_REGISTER.md). Tracks known structural risks (`R-001`–`R-005`), quantitative trigger thresholds, likelihood/impact ratings, and resolution traceability.
