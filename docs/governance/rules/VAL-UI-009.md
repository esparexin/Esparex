# VAL-UI-009

Interactive Element Touch Target

---

## Purpose

Enforces minimum touch target size of 44px for interactive components.

---

## Description

This rule enforces repository consistency and compliance in the ACCESSIBILITY domain. It performs static validation checks to maintain quality standards across all modules.

---

## Why This Rule Exists

Without this rule, development teams may introduce inconsistent implementations, security vulnerabilities, or broken documentation references, resulting in regression overhead, manual review bottlenecks, and repository drift.

---

## Detection Logic

Parses AST elements of overlay or dialog containers and verifies necessary ARIA attributes are attached.

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

UI UX Guild

---

## Category

ACCESSIBILITY

---

## Examples

### ✅ Compliant

```
<dialog aria-labelledby="dialog-title" role="dialog">
  <h2 id="dialog-title">Modal Title</h2>
</dialog>
```

### ❌ Non-Compliant

```
<div className="modal-overlay">
  <h2>Modal Title</h2>
</div>

*Violates: Missing standard ARIA role="dialog" and labelling attributes.*
```

---

## Common False Positives

None identified.

---

## Remediation

Ensure buttons and links have a minimum clickable area of 44px by 44px.

---

## Related Rules

Refer to the main [REGISTRY.md](../REGISTRY.md) for related rules in the ACCESSIBILITY category.

---

## Version History

| Version | Date | Summary of changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-07-03 | Rule registered in the centralized rule registry |
