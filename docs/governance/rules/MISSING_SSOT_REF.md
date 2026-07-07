# Missing SSOT Reference

Missing SSOT Reference

---

## Purpose

Checks if an SSOT document lacks references from incoming nodes.

---

## Description

This rule enforces repository consistency and compliance in the DOCUMENTATION domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Verifies that markdown links resolve to existing files and valid anchors in the workspace.

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
[Repository Policy] (./REPOSITORY_POLICY.md)
```

### ❌ Non-Compliant

```
[Repository Policy] (file-protocol-slash-slash-C-drive-path-User-Desktop-REPOSITORY_POLICY.md)

*Violates: Local absolute path makes links broken on other machines.*
```

---

## Common False Positives

None identified.

---

## Remediation

Link to this SSOT document from relevant workspace files.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the DOCUMENTATION category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
