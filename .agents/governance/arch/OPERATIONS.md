# Governance Operations

**Module**: 6 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13

> This document operationalizes the governance framework: who owns which responsibilities, how the repository measures its governance maturity over time, how exceptions are lifecycle-managed, and how review schedules interact with the risk register.

---

## 1. Governance Ownership Matrix

Even in a solo-maintained repository, explicitly separating roles ensures that architectural review is distinct from day-to-day implementation. As the engineering team expands, these roles map directly to team leads.

| Role | Primary Responsibilities | Authority & Gates |
|---|---|---|
| **Architecture Owner** | Owns `PRINCIPLES.md`, `STANDARDS.md`, and `.agents/decisions/` (ADRs). Evaluates bounded-context extractions and exception requests. | Approves or rejects new ADRs (`ADR-006`). Signs off on `PASS WITH OBSERVATIONS` or `FAIL` audit outcomes. |
| **Platform Owner** | Owns `ENFORCEMENT.md`, CI/CD pipelines, `.dependency-cruiser.js`, `tsconfig.json`, and build performance. | Maintains automated gates (`guard:dependencies`, `guard:circular`, `type-check`). Rejects PRs that bypass CI controls. |
| **Domain Owner** | Owns `@esparex/core` services, models, queues, and domain hygiene. | Monitors internal domain complexity (`S5`). Proposes bounded context extractions (`R-002`, `R-003`). |
| **Release Owner** | Owns release readiness, versioning, and deployment verification. | Enforces that no open `FAIL` audit outcome or expired exception (`EX-NNN`) crosses a release gate. |
| **Security Owner** | Owns dependency audits, secret scanning, and vulnerability remediation. | Maintains security audit cadence (`Phase 8`) and tracks vulnerability risk items (`R-005`). |

---

## 2. Governance Maturity Model

The Governance Maturity Model defines progressive levels of engineering control. The repository reports its current maturity level against this scale during every periodic audit.

| Level | Name | Description | Key Indicators |
|---|---|---|---|
| **L1** | **Ad-Hoc** | Code compiles and runs, but boundaries exist only in developer memory. | No automated checks beyond basic build. High drift risk. |
| **L2** | **Automated Boundaries** | Import rules and package directionality are enforced by CI. | `dependency-cruiser` active (`E-001`–`E-005`), `madge` circular checks (`E-006`), strict TypeScript (`E-007`). |
| **L3** | **Intentional Architecture** | Structural decisions and design philosophies are explicitly documented before or during change. | `PRINCIPLES.md` established, `ADR-006` lifecycle active, all top-level directories classified (`S1`). |
| **L4** | **Enforced Governance** | Audits run on standardized schedules; exceptions have mandatory expiry dates; quantitative triggers replace subjective feelings. | `AUDIT_PROCESS.md` active, composite complexity triggers (`S5`), exception register (`EX-NNN`), risk register (`R-NNN`). |
| **L5** | **Continuous Fitness** | Architecture is continuously measured against future evolution; telemetry drives performance audits; zero unmanaged architectural debt. | Automated trend analysis on complexity (`Phase 6`), runtime performance telemetry (`Phase 9`), automated drift reporting. |

### Current Repository Maturity Assessment (as of 2026-07-13)

```
Level: L4.6 (Enforced Governance with Partial Strategic Automation)
Target: L5.0
```

**Score Breakdown**:
- **L1 (Ad-Hoc)**: `1.0 / 1.0` (Verified clean builds across 5 workspaces)
- **L2 (Automated Boundaries)**: `1.0 / 1.0` (Cruiser, Madge, TSC fully blocking in CI)
- **L3 (Intentional Architecture)**: `1.0 / 1.0` (Principles, Standards, ADRs 001–006 complete)
- **L4 (Enforced Governance)**: `1.0 / 1.0` (Modular framework, composite triggers, active risk/exception ledgers)
- **L5 (Continuous Fitness)**: `0.6 / 1.0` (Fitness review structure active (`Phase 6`); missing runtime telemetry (`Phase 9`) and automated historical trend graphing)

---

## 3. Exception & Risk Lifecycle Operations

### Operationalizing Exceptions (`EX-NNN`)
1. **Creation**: Any Standard (`S1`–`S5`) violation that cannot be immediately remediated must be assigned an `EX-NNN` ID in `AUDIT_STATUS.md`.
2. **Mandatory Expiry**: An exception without an explicit trigger condition or calendar expiry is invalid and treated as an audit `FAIL`.
3. **Release Gate Audit**: At every major release, the Release Owner checks `AUDIT_STATUS.md`. If an exception's expiry date has passed without remediation or formal renewal via ADR, the release is blocked.

### Operationalizing the Risk Register (`R-NNN`)
1. **Integration**: The Architectural Risk Register (`../ARCHITECTURE_RISK_REGISTER.md`) tracks structural debt that is currently acceptable (`PASS WITH OBSERVATIONS`) but possesses likelihood/impact of future degradation.
2. **Audit Bridge**: Whenever an audit phase outputs `PASS WITH OBSERVATIONS`, every new observation must either be resolved immediately or logged as an `R-NNN` item in the Risk Register.
3. **Trigger Monitoring**: Domain Owners and the Platform Owner monitor the quantitative trigger thresholds (`S5`) associated with each open risk (`R-001` through `R-005`). When a trigger fires, the risk is escalated to an active refactoring initiative.

---

## 4. Operational Review Cadence Summary

| Frequency | Activity | Responsible Owner | Deliverable / Artifact Updated |
|---|---|---|---|
| **Continuous / PR** | CI Enforcement (`E-001`–`E-011`) | Platform Owner | CI Build Status / PR Merge Gate |
| **Per Major Feature** | Check composite triggers (`S5`) & ADR requirement (`S4`) | Domain Owner / Architecture Owner | `ADR-NNN.md` (if required) |
| **Quarterly** | Review active exceptions (`EX-NNN`) & high-priority risks (`R-005`) | Architecture Owner / Security Owner | `AUDIT_STATUS.md` & `ARCHITECTURE_RISK_REGISTER.md` |
| **Semi-Annual** | Architectural Fitness Audit (`Phase 6`) & Security Audit (`Phase 8`) | Architecture Owner / Security Owner | `AUDIT_STATUS.md` / Fitness Audit Report |
| **Annual** | Principles (`PRINCIPLES.md`) & Deployment Audit (`Phase 10`) | Architecture Owner / Release Owner | Modular Framework Review |
