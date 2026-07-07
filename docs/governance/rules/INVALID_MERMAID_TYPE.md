# Invalid Mermaid Diagram Type

Invalid Mermaid Diagram Type

---

## Purpose

Validates that the mermaid block declares a supported diagram type.

---

## Description

This rule enforces repository consistency and compliance in the DOCUMENTATION domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Validates syntax structure of all embedded Mermaid diagram blocks.

---

## Severity

**ERROR**

This severity was assigned to ensure appropriate action based on the risk level. Higher severity rules indicate potential blocker risks to build or deployment stability.

---

## CI Policy

**FAIL_BUILD**

Violations of this rule will fail the CI build pipeline immediately.

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
```mermaid
flowchart TD
  A --> B
```
```

### ❌ Non-Compliant

```text
flowchart TD
  A -> B

*Violates: Flowchart connection arrow syntax uses -> instead of standard -->.*
```

---

## Common False Positives

None identified.

---

## Remediation

Ensure the first declaration inside the mermaid block is a supported type (e.g. flowchart TD).

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the DOCUMENTATION category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
