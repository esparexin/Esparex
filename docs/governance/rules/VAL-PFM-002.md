# VAL-PFM-002

Avoid Render-Blocking Imports

---

## Purpose

Prevents synchronous scripts and blocking imports in index templates.

---

## Description

This rule enforces repository consistency and compliance in the PERFORMANCE domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Analyzes HTML templates and import graphs to flag unoptimized font links or synchronous blocking scripts.

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

Platform Team

---

## Category

PERFORMANCE

---

## Examples

### ✅ Compliant

```
// Preload critical font using Next.js font loader
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
```

### ❌ Non-Compliant

```
<link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet" />

*Violates: Standard external font link causes render-blocking layout shift.*
```

---

## Common False Positives

None identified.

---

## Remediation

Add defer or async attributes to script elements, and load non-critical resources asynchronously.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the PERFORMANCE category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
