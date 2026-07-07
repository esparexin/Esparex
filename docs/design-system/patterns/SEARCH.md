---
id: UX-FORM-002
title: Search Pattern
status: approved
priority: medium
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-BOOK-001
  - JRN-ADMIN-001
related-patterns:
  - UX-STATE-001
  - UX-STATE-002
related-components:
  - Input
---

# UX-FORM-002 — Search Pattern

## 1. Overview

The Search pattern covers text-based input queries (such as looking up events, bookings, or user details). It outlines debounce timing standards, search execution, clearing mechanisms, and zero-results feedback displays.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/events` | Search event titles or venues |
| Admin | `/bookings` | Look up booking reference ID, customer email, or customer name |
| Admin | `/events` | Look up created events by title |

---

## 3. Source of Truth

```
apps/admin/src/app/bookings/page.tsx — Page implementation managing search keyword query states
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/admin/src/app/bookings/page.tsx
  - apps/admin/src/app/events/page.tsx (audited local search inputs)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Input` | `@mad/ui` | Form input element for the search query |

> [!NOTE]
> **Backlog Gap BL-002**: No `SearchInput` primitive exists in `@mad/ui`. Search fields across admin pages use bare `Input` elements with varying debounce and reset implementations.

---

## 6. State Diagram

```
Search Idle (Input empty)
 ├── [user types character] → Query Entered (submit disabled, debouncer starts)
 │                              ↓ [duration = 300ms elapsed]
 │                             Query Executed (API request in flight)
 │                              ├── [results found] → Results Displayed
 │                              └── [0 results found] → Zero Results (EmptyState rendered)
 └── [user clicks clear X] → Search Idle (query reset, API query cleared)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `searching` | API request active with search term | Query key refetch triggers loader |
| `results-found` | Rendered rows matching query term | Table rows list |
| `no-results` | No results match search term | `EmptyState` composite |

---

## 8. Optional States

| State | Description |
|---|---|
| `debouncing` | Awaiting typing pauses before initiating API queries |

---

## 9. Keyboard & Accessibility

- **Search Landmark**: The search block must be wrapped in a container with `role="search"`.
- **Labels**: Search inputs must have visible labels or an explicit `aria-label` (e.g. `aria-label="Search bookings"`).
- **Clear button**: Clear inputs (the "X" icon button) must be fully keyboard accessible, focusable, and contain an `aria-label="Clear search input"`.
- **WCAG AA criteria**:
  - **4.1.2 Name, Role, Value**: The input element role is set to `search` or explicitly labeled.
  - **4.1.3 Status Messages**: Live updates when result counts change are announced (e.g. "5 results found").

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-STATE-001` | Empty States | Renders "no results found" illustration card |
| `UX-STATE-002` | Loading States | Displays skeletons while query fetches |

---

## 11. Implementation Checklist

```
☐ Search input is wrapped inside role="search" element
☐ Debounce mechanism delays query execution by at least 300ms
☐ Includes a visible "Clear Search" icon button (X) when search query is dirty
☐ Clearing search input immediately resets query parameters and triggers refetch
☐ Zero results returned renders EmptyState from @mad/ui
☐ Input element uses Input from @mad/ui
☐ Backlog ID BL-002 registered for unified SearchInput composite
```

---

## 12. Governance Rules

#### Required
```
✓ Search key inputs must be debounced by a minimum of 300ms before dispatching API queries
✓ Must render the standard EmptyState composite when query results return empty
```

#### Forbidden
```
✗ Dispatching API search queries on every individual keystroke (no immediate submit without debounce)
✗ Silently failing on empty results — always display explicit feedback to user
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| 300ms search query debounce | ADR (to be linked) | Balances user feedback expectations against backend API query loads |

---

## 14. Backlog Gaps

| ID | Description | Impact |
|---|---|---|
| `BL-002` | No `SearchInput` component in `@mad/ui` | Search inputs across admin are raw inputs with divergent clear-action and icon positioning |

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
