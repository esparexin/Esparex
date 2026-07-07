# ADR Number Gap

ADR Number Gap

---

## Purpose

Checks for gaps in ADR numbering sequence.

---

## Description

This rule enforces repository consistency and compliance in the DOCUMENTATION domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Scans files inside the decisions directory and validates compliance with ADR naming, metadata, and index matching rules.

---

## Severity

**WARNING**

This severity was assigned to ensure appropriate action based on the risk level. Higher severity rules indicate potential blocker risks to build or deployment stability.

---

## CI Policy

**WARN**

Violations are logged as warnings and do not fail the build, but they must be reviewed before final merge.

---

## Owner

Documentation Team

---

## Category

DOCUMENTATION

---

## Examples

### ✅ Compliant

```
<!-- metadata frontmatter table in docs/decisions/ADR-001-booking.md -->
| Status | Date | Authors | Related Documents |
| --- | --- | --- | --- |
| Proposed | 2026-07-03 | Platform Team | [REPOSITORY_POLICY.md] (../governance/REPOSITORY_POLICY.md) |
```

### ❌ Non-Compliant

```
| Status | Date | Authors |
| --- | --- | --- |
| Proposed | 2026-07-03 | Platform Team |

*Violates: Missing "Related Documents" metadata header inside ADR.*
```

---

## Common False Positives

None identified.

---

## Remediation

Ensure ADR numbers are consecutive.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the DOCUMENTATION category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
