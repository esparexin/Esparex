# VAL-ARC-003

App Router Layout Safety

---

## Purpose

Verifies Next.js app router layout structure and limits nesting complexity.

---

## Description

This rule enforces repository consistency and compliance in the ARCHITECTURE domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Scans TypeScript source code to check for prohibited global object references (e.g. console, Axios) outside of designated library boundary wrappers.

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

Platform Team

---

## Category

ARCHITECTURE

---

## Examples

### ✅ Compliant

```
import { logger } from '@/lib/logger';
logger.info('User action registered');
```

### ❌ Non-Compliant

```
console.log('User action registered');

*Violates: Use of raw console.log output bypassing central logger subsystem.*
```

---

## Common False Positives

None identified.

---

## Remediation

Restructure layout layers to prevent excessive route nesting.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the ARCHITECTURE category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
