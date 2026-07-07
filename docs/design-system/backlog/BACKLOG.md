# UX Pattern Backlog Registry

This file is the canonical registry of capability gaps discovered during Phase 3 pattern authoring.

**Rules:**
- Every gap documented in a pattern's "Backlog Gaps" section must have a corresponding entry here.
- IDs are immutable — never reassigned.
- Status transitions: `Open → Planned → In Progress → Resolved → Closed`.
- Resolved items keep their entry; the `Resolved In` column records the version.

---

## Registry

| ID | Title | Raised In | Priority | Status | Resolved In |
|---|---|---|---|---|---|
| BL-001 | `Pagination` primitive in `@mad/ui` | `UX-FORM-005` | high | Planned | — |
| BL-002 | `SearchInput` primitive in `@mad/ui` | `UX-FORM-002` | medium | Open | — |
| BL-003 | `DateRangePicker` primitive in `@mad/ui` | `UX-FORM-003` | medium | Open | — |
| BL-005 | `NumericStepper` primitive in `@mad/ui` | `UX-BOOK-001` | medium | Open | — |

> [!NOTE]
> **BL-004 was raised and immediately closed.** Initial Phase 3 authoring incorrectly asserted that `FormField` was missing from `@mad/ui`. Verification confirmed `FormField` exists as a stable composite (`packages/ui/src/composites/FormField/`) and is exported from the public barrel. The finding was reclassified as an **adoption/compliance gap** and is tracked in the Phase 3.5 compliance matrix, not here.

---

## Detail

### BL-001 — `Pagination` primitive in `@mad/ui`

**Raised in:** `UX-FORM-005` (Pagination Pattern)  
**Priority:** High  
**Status:** Planned  
**Description:** No `Pagination` component exists in `@mad/ui`. Admin table views implement ad-hoc pagination controls locally. This prevents standardization of page-size selection, URL sync, and boundary behavior.  
**Impact:** `UX-FORM-005` can specify the behavior but cannot reference a shared component implementation. Admin tables cannot be migrated to the standard until this primitive exists.

---

### BL-002 — `SearchInput` primitive in `@mad/ui`

**Raised in:** `UX-FORM-002` (Search Pattern)  
**Priority:** Medium  
**Status:** Open  
**Description:** No `SearchInput` component exists in `@mad/ui`. Search fields across admin use bare `<input>` elements with varying debounce implementations.  
**Impact:** Debounce timing and clear-button behavior cannot be standardized without a shared primitive.

---

### BL-003 — `DateRangePicker` primitive in `@mad/ui`

**Raised in:** `UX-FORM-003` (Filtering Pattern)  
**Priority:** Medium  
**Status:** Open  
**Description:** No `DateRangePicker` component exists in `@mad/ui`. Date range filtering in admin uses inconsistent native `<input type="date">` pairs with no shared range validation.  
**Impact:** The Filtering pattern cannot specify a standard date range control.

---

### BL-005 — `NumericStepper` primitive in `@mad/ui`

**Raised in:** `UX-BOOK-001` (Booking Pattern)  
**Priority:** Medium  
**Status:** Open  
**Description:** Quantity stepper controls (increment/decrement buttons + number input value) are implemented with custom styles and behaviors in the ticket selection overlay.  
**Impact:** Prevents unified focus navigation rules and touch-target sizes for numeric inputs across checkout and ticket management.
