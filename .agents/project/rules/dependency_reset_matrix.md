---
id: dependency-reset-matrix
owner: product
type: business-rule
version: 1.2
status: approved-with-pending-rules
approved_by: user
approved_on: 2026-07-13
applies_to: [post-ad, post-spare-part]
category: form-behavior
---

# Dependency Reset Matrix — Post Ad Flow

**Status:** APPROVED BUSINESS RULE
**Version:** 1.2
**Pending Rules:** BR-010 (needs catalog verification), BR-015 (awaiting business approval)
**Scope:** Any flow that contains the Category → Brand → Model → Screen Size → Device Condition → Spare Parts dependency chain.

This document is the Single Source of Truth for cascade reset behavior. It governs frontend form behavior, backend validation, and QA test cases. Any implementation that contradicts this matrix is incorrect.

---

## Business Rule ID Registry

Every rule in this document has a unique Business Rule ID (BR-NNN). These IDs must be referenced in:
- Audit findings (`dependency_reset_audit.md`)
- Implementation commits (`fix(scope): implement BR-NNN`)
- Pull request descriptions (Business Rules Fixed / Business Rules Remaining)
- QA test cases

| Rule ID | Business Rule |
|---------|---------------|
| BR-001 | Category resets Brand |
| BR-002 | Category resets Model |
| BR-003 | Category resets Screen Size |
| BR-004 | Category resets Device Condition |
| BR-005 | Category resets Spare Parts |
| BR-006 | Brand resets Model |
| BR-007 | Brand resets Screen Size |
| BR-008 | Brand resets Device Condition |
| BR-009 | Brand resets Spare Parts |
| BR-010 | Model resets Screen Size |
| BR-011 | Model resets Device Condition |
| BR-012 | Model resets Spare Parts |
| BR-013 | Screen Size resets Spare Parts |
| BR-014 | Device Condition resets nothing |
| BR-015 | Confirmation dialog shown before any destructive reset |

---

## Dependency Hierarchy

```
Category
    │
    ▼
Brand
    │
    ▼
Model
    │
    ▼
Screen Size
    │
    ▼
Device Condition
    │
    ▼
Available Spare Parts
```

Each level depends on the one above it. When a parent field changes, all descendants that were selected under the previous value may no longer be valid and must be cleared.

---

## Reset Rules

### Rule 1 — Category changes (BR-001 · BR-002 · BR-003 · BR-004 · BR-005)

When the user changes Category, everything below Category may no longer be valid.

**Reset:**
- ✅ Brand — **BR-001**
- ✅ Model — **BR-002**
- ✅ Screen Size — **BR-003**
- ✅ Device Condition — **BR-004**
- ✅ Available Spare Parts (selected items) — **BR-005**

**Do NOT reset:**
- ❌ Title
- ❌ Description
- ❌ Images
- ❌ Location
- ❌ Price

**Reason:** Title, Description, Images, Location, and Price are independent of the device identity hierarchy. Clearing them on category change would destroy user content without justification.

---

### Rule 2 — Brand changes (BR-006 · BR-007 · BR-008 · BR-009)

When the user changes Brand, everything below Brand may no longer be valid.

**Reset:**
- ✅ Model — **BR-006**
- ✅ Screen Size — **BR-007**
- ✅ Device Condition — **BR-008**
- ✅ Available Spare Parts (selected items) — **BR-009**

**Do NOT reset:**
- ❌ Category
- ❌ Title
- ❌ Description
- ❌ Images
- ❌ Location
- ❌ Price

---

### Rule 3 — Model changes (BR-010 · BR-011 · BR-012)

When the user changes Model, everything below Model may no longer be valid.

**Reset:**
- ✅ Screen Size — **BR-010**
- ✅ Device Condition — **BR-011**
- ✅ Available Spare Parts (selected items) — **BR-012**

**Do NOT reset:**
- ❌ Category
- ❌ Brand
- ❌ Title
- ❌ Description
- ❌ Images
- ❌ Location
- ❌ Price

---

### Rule 4 — Screen Size changes (BR-013)

When the user changes Screen Size, compatible spare parts may no longer be valid.

**Reset:**
- ✅ Available Spare Parts (selected items) — **BR-013**

**Do NOT reset:**
- ❌ Device Condition
- ❌ Category
- ❌ Brand
- ❌ Model
- ❌ Title
- ❌ Description
- ❌ Images
- ❌ Location
- ❌ Price

**Reason:** Device Condition is independent of Screen Size. A device in "Power Off" condition is still in "Power Off" condition regardless of screen size selection.

---

### Rule 5 — Device Condition changes (BR-014)

**Reset:** Nothing — **BR-014**

**Reason:** Changing Device Condition (e.g., Power On → Power Off) does not affect Category, Brand, Model, Screen Size, or the list of compatible Spare Parts. Only the condition selection itself changes.

---

## Dependency Reset Matrix (Summary Table)

| Rule IDs | User Changes | Must Reset | Must NOT Reset |
|----------|-------------|------------|----------------|
| BR-001–005 | Category | Brand, Model, Screen Size, Device Condition, Spare Parts | Title, Description, Images, Location, Price |
| BR-006–009 | Brand | Model, Screen Size, Device Condition, Spare Parts | Category, Title, Description, Images, Location, Price |
| BR-010–012 | Model | Screen Size, Device Condition, Spare Parts | Category, Brand, Title, Description, Images, Location, Price |
| BR-013 | Screen Size | Spare Parts | Category, Brand, Model, Device Condition, Title, Description, Images, Location, Price |
| BR-014 | Device Condition | Nothing | Everything else |
| BR-015 | Any destructive reset | Show confirmation dialog | — |

---

## UX Confirmation Requirement (BR-015)

Whenever a parent field changes and dependent selections will be cleared, the system must show a confirmation dialog **before** performing any reset.

**Rule ID: BR-015**

**Required dialog format:**

```
Changing [Field Name] will clear:

• [Dependent Field 1]
• [Dependent Field 2]
• ...

Continue?

[ Cancel ]   [ Change {Field Name} ]
```

**Examples:**

Changing Category:
> Changing the Category will clear: Brand, Model, Screen Size, Device Condition, Selected Spare Parts. Continue?

Changing Brand:
> Changing the Brand will clear: Model, Screen Size, Device Condition, Selected Spare Parts. Continue?

Changing Model:
> Changing the Model will clear: Screen Size, Device Condition, Selected Spare Parts. Continue?

Changing Screen Size:
> Changing the Screen Size will clear: Selected Spare Parts. Continue?

**If the user cancels:** The parent field does NOT change. All downstream fields remain as they were.
**If the user confirms:** The parent field changes. All dependent fields are cleared immediately.

**Condition for skipping the dialog:** If all dependent fields are already empty, no confirmation is needed. The cascade reset is a no-op and the dialog would be unnecessary friction.

---

## Layer Enforcement

This business rule must be enforced at every applicable layer:

| Layer | Enforcement |
|-------|-------------|
| UI | Cascade reset on field change; confirmation dialog before reset |
| API | Schema must not accept a `brandId` that does not belong to the submitted `categoryId` |
| Backend | Service must validate the full dependency chain before creating a listing |
| Database | No constraint enforced at DB level (validated at service layer) |
| Admin | Admin edit of a listing must respect the same reset rules |

---

## QA Test Cases

| Rule ID | Test | Action | Expected Result |
|---------|------|--------|-----------------|
| BR-001–005 | Category → all dependents | Change to different category | Brand, Model, Screen Size, Device Condition, Spare Parts cleared |
| BR-001–005 | Category does not clear content | Change category | Title, Description, Images, Location, Price unchanged |
| BR-006–009 | Brand → all dependents | Change brand | Model, Screen Size, Device Condition, Spare Parts cleared |
| BR-006 | Brand does not clear category | Change brand | Category unchanged |
| BR-010–012 | Model → all dependents | Change model | Screen Size, Device Condition, Spare Parts cleared |
| BR-013 | Screen Size → Spare Parts | Change screen size | Spare Parts cleared; Device Condition unchanged |
| BR-014 | Device Condition → nothing | Change device condition | No other field changes |
| BR-015 | Cancel confirmation | Trigger Brand change, click Cancel | Brand unchanged; downstream fields unchanged |
| BR-015 | Confirm cascade | Trigger Brand change, click Confirm | Brand updates; Model, Screen Size, Device Condition, Spare Parts cleared |
| BR-015 | Skip dialog when empty | Change Brand when Model/ScreenSize/Condition/SpareParts are all empty | No confirmation dialog shown; Brand updates immediately |

