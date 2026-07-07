# ADR-003: Governance Status Semantics & Architecture Specification

## Metadata
- **Status**: Proposed
- **Decision Type**: Architecture
- **Implementation Status**: Not Implemented
- **Date**: 2026-07-02
- **Authors**: Principal Software Architect, Governance Engine Architect
- **Reviewers**: Repository Governance Owner, Architecture Review Board
- **Decision Category**: Governance
- **Related Documents**: [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md), [AGENTS.MD](../../AGENTS.MD)
- **Related GitHub Issues**: None
- **Related Pull Requests**: None
- **Supersedes**: None
- **Superseded By**: None

---

## Context
The MAD Entertrainment Governance Engine indexes, reconciles, and gates codebase violations using a findings database represented by JSON files under `.governance/findings/`. The system defines ten lifecycle statuses in `FindingStatus` (`NEW`, `CONFIRMED`, `FALSE_POSITIVE`, `VERIFIED`, `DOCUMENTED`, `IMPLEMENTED`, `INTENTIONAL`, `IGNORED`, `CLOSED`, `REGRESSION`).

While automated statuses (e.g. `NEW`, `CLOSED`, `REGRESSION`) are reconciled dynamically in code, the manual override statuses (`INTENTIONAL`, `DOCUMENTED`, `IMPLEMENTED`) have undefined semantics, inconsistent gating bypass behavior in code, and are completely unmanaged by the reconciliation transition rules.

---

## Problem Statement
The absence of a formal contract for finding statuses leads to several codebase risks:
1. **Dormant Gating Inconsistencies**: `AuditEngine` and `ReportEngine` filter out overrides before gating checks, but `ConfidenceEngine.evaluate()` does not. If evaluated directly, overrides fail builds.
2. **Reconciliation Leaks**: `LifecycleManager` ignores override statuses. If an overridden violation is fixed in code, it stays permanently marked as `INTENTIONAL` or `DOCUMENTED` instead of closing, polluting the database.
3. **Audit Trail Gaps**: There is no documented record defining who can assign overrides, how long they last, or whether they should impact health scores.

---

## Decision

This section defines the architectural responsibilities and interaction model for governance statuses. The selected governance policy (CI behavior, metrics participation, reconciliation rules, ownership, etc.) is defined as part of this architecture and will become authoritative only after ADR approval.

### Governance Status Contract

| Status | Active | CI Gating | Metrics Deduct | Reconciliation | Assignment / Scope |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `NEW` | Yes | Yes (FAIL/WARN) | Yes | Yes | Automated; newly detected scan violation. |
| `CONFIRMED` | Yes | Yes (FAIL/WARN) | Yes | Yes | Manual; reviewer acknowledges violation. |
| `REGRESSION` | Yes | Yes (FAIL/WARN) | Yes | Yes | Automated; closed violation re-detected. |
| `FALSE_POSITIVE` | No | Bypassed (INFO) | No | Yes | Manual; validated scanner exception. |
| `IGNORED` | No | Bypassed (INFO) | No | Yes | Manual; accepted risk exception. |
| `VERIFIED` | No | Bypassed (INFO) | No | Yes | Manual; verified code resolution. |
| `CLOSED` | No | Bypassed (INFO) | No | Yes | Automated; violation resolved. |
| `INTENTIONAL` | No | Bypassed (INFO) | No | Yes | Manual (Owner); design-justified override. |
| `DOCUMENTED` | No | Bypassed (INFO) | No | Yes | Manual (Owner); tracked in external ticket/backlog. |
| `IMPLEMENTED` | No | Bypassed (INFO) | No | Yes | Manual (Owner); completed design migration. |

This ADR defines the target architecture only. It does not modify repository behavior. Implementation will occur in a later PR after approval.

### Component Impact Matrix

| Component | Current Behavior | Expected Architecture | Implementation Phase |
| :--- | :--- | :--- | :--- |
| **ConfidenceEngine** | Only bypasses `CLOSED`, `FALSE_POSITIVE`, `VERIFIED`, `IGNORED`. | Bypasses `CLOSED`, `FALSE_POSITIVE`, `VERIFIED`, `IGNORED`, `INTENTIONAL`, `DOCUMENTED`, `IMPLEMENTED`. | Phase 3 |
| **LifecycleManager** | Ignores `INTENTIONAL`, `DOCUMENTED`, `IMPLEMENTED`. | Automatically closes override findings if they are resolved (not detected). Reverts them to `NEW` if re-introduced. | Phase 3 |
| **AuditEngine** | Filters gating candidates in `activeFindings` check. | Gating check candidates list aligned with `ConfidenceEngine` status contract. | Phase 3 |
| **ReportEngine** | Omit overrides in report statistics. | Properly classifies overrides as bypassed in governance dashboard reports. | Phase 3 |
| **MetricsEngine** | Does not deduct score for overrides. | Explicitly excludes overrides from score deductions. | Phase 3 |
| **FindingManager** | Persists files; pads indices. | Continues to serialize statuses; rejects invalid statuses. | Phase 3 |
| **RuleRegistry** | Provides rule metadata. | No change. | Phase 3 |

---

## Alternatives Considered

### Alternative A: Centralized Gating Ignore List
Maintain an array of ignored finding IDs inside `governance.config.ts`.
- *Pros*: Simple, config-based gating bypass.
- *Cons*: Does not resolve lifecycle transitions or metrics calculations; separates findings history from code overrides.

### Alternative B: Status-Level Semantics Contract (Selected)
Define a formal, unified status contract that all parts of the Governance Engine must implement.
- *Pros*: Self-contained findings data, clean transitions, unified metrics, and clear gating policies.
- *Cons*: Requires updating multiple engine modules and tests concurrently.

---

## Consequences

- **Pros**:
  - Unified source of truth for all Governance Engine status behaviors.
  - Automated database cleanup of resolved manual overrides.
  - Consistent build gating checks preventing false-positive overrides failures.
- **Cons**:
  - Requires coordinated updates across multiple code modules and unit/integration tests.

---

## Technical & Operational Impact

### Migration Strategy
Existing findings database JSON records will remain unchanged. Once the new engine behavior is implemented, the next scan will automatically reconcile existing overrides (e.g. closing them if resolved).

### Operational Impact
Improves repository hygiene by automatically cleaning up stale override findings from the `.governance/` database. Expected implementation work following ADR approval: `ConfidenceEngine`, `LifecycleManager`, `AuditEngine`, `ReportEngine`, `MetricsEngine`, Governance documentation, Governance test suite.

### Security Impact
Only repository Codeowners / Governance Owners are authorized to manually assign override statuses in findings JSON files.

### Performance Impact
No impact. Status lookup checks are fast in-memory map comparisons.

### Testing Strategy
Unit tests in `confidence_engine.test.ts` and `lifecycle_manager.test.ts` will be updated to assert the new transition and gating contracts.

### Rollback Strategy
If the implemented changes cause CI or gating issues, revert the changes in ConfidenceEngine and LifecycleManager to restore current bypass and reconciliation behaviors.

---

## Future Considerations
Evaluate potential transitions of other automated statuses as rules and requirements change.

### Implementation Prerequisites
Before Phase 3 begins, we must confirm:
- [ ] ADR-003 approved and merged.
- [ ] Regression test suite passing with 0 failures.
- [ ] No outstanding Governance Engine defects.
- [ ] Governance documentation synchronized.

### Future Implementation Roadmap
1. Update `ConfidenceEngine` bypass list to match status contract.
2. Update `LifecycleManager` reconciliation transitions to support overrides.
3. Update `AuditEngine` and `ReportEngine` candidate filtering.
4. Update unit and integration tests to validate new behaviors.

### ADR Approval Criteria
- [x] Governance overrides semantics are fully defined.
- [x] Component responsibilities are documented.
- [x] Lifecycle transitions are specified.
- [x] CI behavior is specified.
- [x] Metrics behavior is specified.
- [x] Ownership rules are specified.
- [x] Migration path is documented.

---

## References
- [AGENTS.MD](../../AGENTS.MD) — Section on Manual Verification Gate & Single Source of Truth
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
