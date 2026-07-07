# VAL-DOC-002

Absolute Local Filesystem Path Detection

---

## Purpose

Enforces relative links instead of absolute root-relative filesystem paths.

---

## Description

This rule enforces repository consistency and compliance in the HYGIENE domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Checks frontmatter properties on document files.

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

Architecture Review Board

---

## Category

HYGIENE

---

## Examples

### ✅ Compliant

```
---
Owner: Architecture Review Board
Last Updated: 2026-07-03
---
# Policy Page
```

### ❌ Non-Compliant

```
# Policy Page

*Violates: Missing mandatory owner/date metadata block.*
```

---

## Common False Positives

None identified.

---

## Remediation

Change absolute paths to relative paths.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the HYGIENE category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 2.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
