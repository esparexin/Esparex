# Audit Process

**Module**: 4 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Change Cadence**: Low — the process itself is stable; only the schedule or exit criteria change

> This document defines **how** audits are conducted. It does not record current audit results — those live in [AUDIT_STATUS.md](./AUDIT_STATUS.md).

---

## Audit vs. Governance Control

| Governance Control | Audit |
|---|---|
| Runs automatically on every commit | Runs periodically or on-demand |
| Prevents a violation from entering the codebase | Detects drift that has already entered the codebase |
| Binary pass/fail | Graded outcome with observations |
| Defined in [ENFORCEMENT.md](./ENFORCEMENT.md) | Defined here |

---

## Audit Schedule

| Phase | Audit | Cadence | Trigger |
|---|---|---|---|
| 1 | Repository Topology Audit | Per major structural change | New package, new directory, new workspace |
| 2 | Dependency Boundary Audit | Per major structural change | Above, plus any change to `dependency-cruiser.js` |
| 3 | Architecture Justification & Responsibility Audit | Per major structural change | Above, plus any new ADR or package boundary change. Evaluates Single Responsibility and Platform Neutrality (`P4`). |
| 4 | Future-State Architecture Review | Per major structural change | Above |
| 5 | Architectural Complexity Audit | Per major structural change | Above |
| 6 | Architectural Fitness Audit | Every 6–12 months | Calendar + any fitness trigger threshold crossed (see [STANDARDS.md §S5](./STANDARDS.md)) |
| 7 | Implementation Audit | Per feature, per commit | Included in pre-commit and code review |
| 8 | Security Audit | Every 6 months | Calendar + any critical Dependabot advisory |
| 9 | Performance Audit | When runtime telemetry is available | Baseline established + performance regression |
| 10 | Deployment Audit | Every 12 months | Calendar + new deployment unit |

---

## Audit Entry Requirements

Before beginning an audit, the auditor must:

1. Run all CI controls (`guard:dependencies`, `guard:circular`, `type-check`, `lint`). A failing CI control must be resolved before the audit begins.
2. Inspect the live repository state. Do not rely on previous audit reports or documentation as evidence of current state.
3. Record the commit SHA at the time of audit start.

---

## Audit Exit Criteria

Every audit concludes with one of four standardized outcomes:

| Outcome | Definition | Effect |
|---|---|---|
| **PASS** | All checks satisfied. No observations. | Audit closed. |
| **PASS WITH OBSERVATIONS** | All critical checks satisfied. Non-blocking findings documented. | Audit closed. Observations tracked in [AUDIT_STATUS.md](./AUDIT_STATUS.md) and, where applicable, the [Risk Register](../ARCHITECTURE_RISK_REGISTER.md). |
| **FAIL** | One or more critical checks failed. | Audit open. Must be resolved before the next release gate. |
| **BLOCKED** | Cannot complete audit due to missing access, evidence, or tooling. | Audit suspended. Reason documented. Unblocking condition stated. |

A "critical check" is any finding that violates a Principle (not just a Standard). Standard violations that have a defined exception on file are non-blocking.

---

## Exception Process

When a Standard must be violated for a valid reason:

```
Standard violation identified
        ↓
Exception Request documented
  (reason, scope, duration, alternative mitigations)
        ↓
Architecture Review
  (evaluate whether the Standard should be revised instead)
        ↓
  ┌─────────────┬──────────────────────────────────┐
  │ Standard    │ Temporary Exception              │
  │ revised     │ - ADR created                    │
  │ (ADR req'd) │ - Expiry date set                │
  │             │ - Risk Register entry created    │
  └─────────────┴──────────────────────────────────┘
        ↓
Exception added to AUDIT_STATUS.md
        ↓
Expiry review — resolve, extend, or convert to Standard revision
```

**What does not qualify as an exception**: Convenience, time pressure, or "we'll fix it later" without a defined expiry date. Every exception must have an expiry date or a clearly stated trigger condition for review.

---

## Audit Evidence Standards

All audit findings must be supported by one of the following evidence types:

| Evidence type | Examples | Acceptable for |
|---|---|---|
| Direct code observation | File contents, import graph, line count | All findings |
| Tool output | `dependency-cruiser` report, `tsc` output, `knip` report | Automated findings |
| Git history | Commit message, author, diff, date | Historical intent claims |
| CI output | Build logs, test results | Verification claims |
| ADR | Written decision record | Intentionality claims |

A finding stated without evidence of one of these types is **an assumption, not a finding**.
