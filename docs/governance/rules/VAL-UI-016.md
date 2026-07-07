# VAL-UI-016

Dead Style File

---

## Purpose

Identifies css/scss files that are not imported anywhere.

---

## Description

This rule enforces repository consistency and compliance in the UI domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Scans TSX files for raw HTML tags (such as <button> or <table>) where a shared equivalent component exists.

---

## Severity

**WARNING**

This severity was assigned to ensure appropriate action based on the risk level. Higher severity rules indicate potential blocker risks to build or deployment stability.

---

## CI Policy

**INFO_ONLY**

Violations are logged as warnings and do not fail the build, but they must be reviewed before final merge.

---

## Owner

Platform Team

---

## Category

UI

---

## Examples

### ✅ Compliant

```
import { Button } from '@mad/ui';

export function Component() {
  return <Button onClick={handleClick}>Submit</Button>;
}
```

### ❌ Non-Compliant

```
export function Component() {
  return <button onClick={handleClick}>Submit</button>;
}

*Violates: Direct usage of raw HTML button tag instead of shared component.*
```

---

## Common False Positives

None identified.

---

## Remediation

Remove the unused style file.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the UI category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
