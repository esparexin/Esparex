# Pattern Document Schema

This file defines the canonical template for all UX pattern documents in `docs/design-system/patterns/`.

Every pattern document **must** include all required sections in the order listed below.
Optional sections may be omitted only when genuinely not applicable.

---

## Frontmatter Specification

```yaml
---
id: UX-CATEGORY-NNN          # Stable, immutable pattern ID — never reassigned
title: Pattern Name
status: draft                 # draft | approved | enforced | deprecated
priority: high                # critical | high | medium | low
pattern-version: 1.0.0        # Semantic version — independent of design system version
owner: Platform               # Team or role responsible for this pattern
since: "1.5.0"                # Design system version when this pattern was first published
last-reviewed: YYYY-MM-DD
review-frequency: quarterly   # quarterly | major-release | annually
related-journeys:
  - JRN-CATEGORY-NNN
related-patterns:
  - UX-CATEGORY-NNN
related-components:           # @mad/ui components — Phase 4 will validate these exist
  - ComponentName
---
```

**Notes:**
- `pattern-version` increments independently. A patch to wording is `1.0.1`; a new required state is `1.1.0`; a breaking change to governance rules is `2.0.0`.
- `status: enforced` is set only when Phase 4 tooling validates this pattern automatically.
- `related-components` must list only components confirmed in the `@mad/ui` stable public barrel.

---

## Required Sections (in order)

### 1. Overview
Describe the pattern in 2–4 sentences: what it is, when it is used, and which surfaces implement it.

---

### 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/route` | Description |
| Admin | `/route` | Description |

---

### 3. Source of Truth
List the canonical implementation files this document was authored against. Future audits compare this document against these files to detect drift.

---

### 4. Evidence Reviewed
List every artifact reviewed during authoring (source files, PRs, ADRs).

---

### 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `ComponentName` | `@mad/ui` | What it does in this pattern |

---

### 6. State Diagram
Text-based state machine. Include all error and recovery paths.

```
Idle → State A → State B → Success
                          └→ Error → retry → State A
```

---

### 7. Required States
States that MUST be implemented. Non-implementation is a governance violation.

| State | Description | Component Used |
|---|---|---|
| `idle` | Initial resting state | — |

---

### 8. Optional States
States that MAY be implemented.

| State | Description |
|---|---|
| `empty` | No data available |

---

### 9. Keyboard & Accessibility
- **Focus management**: Where focus lands on mount and after transitions.
- **Keyboard navigation**: Tab order, Enter/Space, Escape.
- **ARIA**: Required roles, labels, live regions.
- **WCAG AA criteria**: Specific criteria this pattern must satisfy.
- **Touch targets**: Minimum 44×44px for all interactive elements.

---

### 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-CATEGORY-NNN` | Name | How it is used |

---

### 11. Implementation Checklist

```
☐ Uses <ComponentName> from @mad/ui
☐ Implements all required states
☐ Error messages use ErrorState (not custom div)
☐ Loading uses LoadingState or Skeleton (not custom spinner)
☐ All interactive elements have min 44px touch targets
☐ Focus managed on state transitions
☐ ARIA live regions present for dynamic content
☐ Uses design tokens (no hard-coded colors)
☐ No local duplicate implementation
```

---

### 12. Governance Rules

#### Required
```
✓ Rule description
```

#### Forbidden
```
✗ Rule description
```

---

### 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Why X over Y | ADR-NNN | Brief summary |

---

### 14. Backlog Gaps
Each gap must also be registered in `docs/design-system/backlog/BACKLOG.md`.

| ID | Description | Impact |
|---|---|---|
| `BL-NNN` | Description | How it limits the pattern |

---

### 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | YYYY-MM-DD | Initial publication |

---

## Reference Implementation

See `AUTHENTICATION.md` (UX-AUTH-001) for a complete example of this schema applied to a real pattern.
