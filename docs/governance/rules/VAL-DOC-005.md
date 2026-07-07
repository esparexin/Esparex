# VAL-DOC-005

Secret & Credential Detection

---

## Purpose

Scans markdown documentation files for hardcoded API keys, secrets, or certificates.

---

## Description

This rule enforces repository consistency and compliance in the SECURITY domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Inspects API router definitions to verify that all endpoints matching security patterns are wrapped in security middleware.

---

## Severity

**CRITICAL**

This severity was assigned to ensure appropriate action based on the risk level. Higher severity rules indicate potential blocker risks to build or deployment stability.

---

## CI Policy

**WARN**

Violations are logged as warnings and do not fail the build, but they must be reviewed before final merge.

---

## Owner

Security Guild

---

## Category

SECURITY

---

## Examples

### ✅ Compliant

```
import { rbacMiddleware } from '@/middleware/rbac';

router.get('/admin/users', rbacMiddleware(['admin']), controller.list);
```

### ❌ Non-Compliant

```
router.get('/admin/users', controller.list);

*Violates: Endpoint is exposed without validation or authorization middleware check.*
```

---

## Common False Positives

None identified.

---

## Remediation

Remove the hardcoded secret from documentation. Use environment configurations.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the SECURITY category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 2.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
