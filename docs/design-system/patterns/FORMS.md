---
id: UX-FORM-001
title: Forms Pattern
status: approved
priority: high
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-AUTH-001
  - JRN-BOOK-001
  - JRN-ADMIN-001
related-patterns: []
related-components:
  - FormField
  - Input
  - Textarea
  - Label
  - Button
---

# UX-FORM-001 — Forms Pattern

## 1. Overview

The Forms pattern governs form layouts, validation messaging, field alignments, error display timings (on-blur vs on-submit), and input controls. It dictates how raw inputs must be composed into high-quality, accessible interfaces.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/login` | Email and OTP forms |
| Web | `/checkout/[bookingId]` | Guest details and billing input forms |
| Admin | All pages | Create event forms, coupon forms, etc. |

---

## 3. Source of Truth

```
packages/ui/src/composites/FormField/FormField.tsx — Unified wrapper for labels, inputs, hints, and error strings
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - packages/ui/src/composites/FormField/FormField.tsx
  - packages/ui/src/primitives/Input/Input.tsx
  - packages/ui/src/primitives/Label/Label.tsx
  - apps/web/src/components/auth/ProfileCompletionForm.tsx
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `FormField` | `@mad/ui` | Layout wrapper associating input with label, helper text, and error indicators |
| `Input` | `@mad/ui` | Standard text input field |
| `Textarea` | `@mad/ui` | Large text input block |
| `Label` | `@mad/ui` | Descriptive label element |
| `Button` | `@mad/ui` | Action submit buttons |

---

## 6. State Diagram

```
Idle (Form ready)
 ├── [focus input] → Focused (focus ring active)
 ├── [user types] → Dirty (client-side validations may trigger on-blur)
 ↓ [click submit]
Validating (Zod schema checking)
 ├── [validation fail] → Error (displays field error messages, focus moves to first error)
 └── [validation success] → Submitting (action mutation in flight)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `idle` | Input is ready for user actions | `Input` |
| `error` | Invalid value provided | `FormField error="Error message"` |
| `disabled` | Field is non-interactive during loading | `Input disabled={isPending}` |

---

## 8. Optional States

| State | Description |
|---|---|
| `focused` | Highlight ring active around field |

---

## 9. Keyboard & Accessibility

- **Labels and Inputs Linkage**: All form fields must programmatically link labels and inputs using `htmlFor` on labels and `id` on inputs.
- **Aria Describedby**: Hints or helper descriptions must link to inputs via `aria-describedby="hint-id"`.
- **Keyboard Tab Order**: Tab traversal must follow a logical, visual order through form fields. Pressing Enter inside inputs must trigger form submission.
- **WCAG AA criteria**:
  - **1.3.1 Info and Relationships**: Form controls programmatically labeled.
  - **3.3.1 Error Identification**: Input fields with validation errors clearly identified.
  - **3.3.2 Labels or Instructions**: Required fields explicitly marked.

---

## 10. Cross-Pattern Dependencies

There are no direct pattern dependencies.

---

## 11. Implementation Checklist

```
☐ Form composition uses FormField composite wrapper from @mad/ui
☐ Validation schemas are defined in shared @mad/validations package
☐ Error fields display message strings underneath the input (not inside raw alert popups)
☐ Focus moves programmatically to first invalid element on submit failures
☐ Inputs are disabled while submission loading mutation is pending
☐ Submit buttons use Button from @mad/ui with isLoading props
☐ Keyboard focus rings meet WCAG 4.5:1 contrast ratio against the background
```

---

## 12. Governance Rules

#### Required
```
✓ Input validation schema definitions must exist inside @mad/validations (no duplicate local schemas)
✓ Standard form compositions must use @mad/ui FormField to wrap label, input, and errors
✓ Required inputs must be explicitly indicated in UI using visual labels and aria-required
```

#### Forbidden
```
✗ Custom, duplicate validation schemas within app component files
✗ Native browser tooltip error popups — validation messages must be integrated inline
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Shared validation schemas | ADR (to be linked) | Decoupling schemas from UI ensures API endpoints and client forms enforce identical constraints |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
