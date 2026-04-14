# Esparex Engineering Documentation Index

Welcome to the Esparex Canonical Documentation.

This directory is the **Single Source of Truth (SSOT)** for all platform architecture, product logic, lifecycle governance, and engineering implementation standards.

All backend engineers, frontend engineers, DevOps operators, AI code agents, QA engineers, and platform architects are required to follow this documentation hierarchy.

No engineering decision, implementation, or architectural change is considered valid if it contradicts these documents.

---

## 📚 Documentation Hierarchy

To maintain architectural consistency and eliminate duplication, all platform development must reference only the following authoritative documents:

### [00_README_ARCHITECTURE.md](./00_README_ARCHITECTURE.md)

**Documentation Entry Point**
Defines documentation philosophy, ownership responsibility, update protocol, and structural conventions.

### [01_PLATFORM_BLUEPRINT.md](./01_PLATFORM_BLUEPRINT.md)

**Marketplace Product Logic**
Defines business rules, monetization mechanics, user journeys, platform guarantees, and marketplace behavioral contracts.

### [02_ENGINEERING_GOVERNANCE.md](./02_ENGINEERING_GOVERNANCE.md)

**Implementation Governance & Safety Controls**
Defines coding standards, architectural layering rules, audit procedures, security enforcement, deployment discipline, and change-impact protocols.

### [03_ENUM_GOVERNANCE_ROLLOUT.md](./03_ENUM_GOVERNANCE_ROLLOUT.md)

**Lifecycle Enum Centralization Strategy**
Defines enum extraction phases, migration freeze procedures, incremental adoption sequencing, telemetry monitoring, and stabilization criteria.
This document remains operationally authoritative until canonical enum adoption is fully completed.

### [04_ADMIN_SYSTEM_ARCHITECTURE.md](./04_ADMIN_SYSTEM_ARCHITECTURE.md)

**Moderation & Platform Operations Architecture**
Defines moderation lifecycle controls, dashboard aggregation rules, approval workflows, operational safeguards, and administrative analytics integrity.

### [05_API_CONTRACTS.md](./05_API_CONTRACTS.md)

**Backend Interface & Contract Standards**
Defines API response schemas, error contracts, versioning strategy, backward-compatibility guarantees, and endpoint governance rules.

### [06_DATA_LIFECYCLE_RULES.md](./06_DATA_LIFECYCLE_RULES.md)

**Canonical State Machine Definitions**
Defines lifecycle transitions for Ads, Businesses, and Users, including cron-driven transitions, mutation constraints, and timeline invariants.

### [07_FRONTEND_SYSTEM_RULES.md](./07_FRONTEND_SYSTEM_RULES.md)

**Frontend Engineering Governance**
Defines UI architecture standards, form validation discipline, state management boundaries, SSR/client execution rules, and rendering consistency requirements.

---

## ⚠️ Governance Enforcement Policy

### No Shadow Documentation

New documentation files must not be created outside this hierarchy without explicit Principal Architect approval.

### SSOT Priority Rule

If platform behavior or business logic changes, the relevant documentation must be updated and reviewed **before any production code change is merged or deployed.**

### Deviation Handling

Any code implementation that contradicts these documents is treated as a platform defect and must be refactored through governed change procedures.

### Migration Phase Governance

During controlled migration initiatives (such as lifecycle enum centralization), temporary enforcement rules defined in the migration document take operational precedence.

### Version Control Discipline

All documentation updates affecting platform architecture must include:

• change rationale
• affected system areas
• migration or rollback considerations
• architectural review confirmation

### Repository Operational Companion

The repo folder `ai-governance/` is the operational companion for AI-assisted editing.

It consolidates AI-specific execution guidance into:

- `ai-governance/SSOT.md`
- `ai-governance/SOP.md`
- `ai-governance/AI_CONTEXT.json`
- `ai-governance/PROMPT_TEMPLATE.md`

It does not override this hierarchy. If there is any conflict, the canonical documents in `docs/` and `SYSTEM_CONSTITUTION.md` remain authoritative.

---

This documentation hierarchy ensures Esparex maintains a stable, scalable, and enterprise-grade engineering foundation while enabling controlled platform evolution.
