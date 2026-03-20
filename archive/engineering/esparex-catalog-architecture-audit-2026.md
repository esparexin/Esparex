# Current Catalog Architecture Audit (ESPAREX)

**Status**: AS-IS Assessment (Post-Refactor 2026-03-18)  
**Auditor**: Principal Enterprise Architect AI

---

## 🏗️ CURRENT ARCHITECTURE NAME
> **"Identity-Capability Overlay Architecture"**

The system employs a dual-authority model where a category's **Identity** (what it *is*) is defined by a singular `type` field, and its **Capabilities** (what a user can *do* with it) are defined by a plural `listingType` array.

---

## 📦 CURRENT CATEGORY SCHEMA (Exact Fields)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `String` | Human-readable name (Mandatory) |
| `slug` | `String` | URL-safe identifier (Mandatory) |
| `type` | `Enum` | `AD`, `SERVICE`, `SPARE_PART`, `OTHER` (Identity Authority) |
| `listingType` | `Array[Enum]` | `postad`, `postservice`, `postsparepart` (Capability Authority) |
| `parentId` | `ObjectId` | Reference to parent category (Hierarchy) |
| `filters` | `Array[Mixed]` | Runtime attribute schema for dynamic forms |
| `isActive` | `Boolean` | Visibility flag |
| `isDeleted` | `Boolean` | Soft-delete flag (Mastered by `CatalogOrchestrator`) |

---

## 🔄 CURRENT ROUTING & WORKFLOW LOGIC

### 1. Routing Authority
Routing is primarily **Capability-Driven**:
*   **Marketplace Discovery**: Controlled by `listingType: ['postad']`.
*   **Service Directory Discovery**: Controlled by `listingType: ['postservice']`.
*   **Spare Parts Visibility**: Controlled by `listingType: ['postsparepart']`.

### 2. Workflow Engine
**Full Chain Flow (Post Ad Wizard):**
1.  **Frontend**: `usePostAdCategories` fetches all categories but filters locally: `categories.filter(cat => cat.listingType?.includes('postad'))`.
2.  **Selection**: User selects a category.
3.  **Dynamic Rendering**: Frontend checks `cat.listingType.includes('postsparepart')` to enable the "Spare Parts" selection sub-wizard.
4.  **Backend Validation**: `CatalogValidationService.validateSparePartRelations` enforces that the selected `categoryId` has `listingType: 'postsparepart'`.

---

## 🔗 CURRENT BRAND RELATION MODEL
> **"Flattened Many-to-Many Relational Model"**

*   **Mapping**: `Brand` schema uses `categoryIds: Types.ObjectId[]`. 
*   **Query Behavior**: Brands are fetched using the `$in` operator against `categoryIds`.
*   **Constraint**: The `Brand` model query in `getSpareParts` and `getBrands` was recently hardened to use plural aware queries (`categoryIds: categoryId`).
*   **Visibility**: Brand visibility is **NOT** directly tied to `category.type`, but is filtered by `categoryId` at the controller level during discovery.

---

## 🧠 CURRENT ADMIN MENTAL MODEL
Admin must manage two distinct but coupled concepts:
1.  **Taxonomy Position**: Where does it sit in the tree (`parentId`)?
2.  **Domain Policy**: Is it for Selling (`postad`), Servicing (`postservice`), or is it a Hardware component (`postsparepart`)?

**The "Paradox Prevention" Rule**:
System-level Zod validation prevents creating a category where `type` contradicts `listingType` (e.g., Type=SERVICE cannot have ONLY `listingType: ['postad']`).

---

## ⚠️ LIST OF ARCHITECTURAL RISKS

### 1. The Paradox Risk (Dual Authority)
While currently enforced by Zod, the existence of both `type` and `listingType` creates a risk of **"Functional Drift"**. If an admin updates a category directly in the DB bypassing the validator, the ID could say "AD" but the behavior could be "SERVICE", confusing the frontend-backend contract.

### 2. Validation Complexity
As the system scales, every new "action" requires updating the `listingType` enum AND the `type` mapping logic in the `CatalogValidationService`.

### 3. Query Performance
Indexing plural `categoryIds` in the `Brand` model is efficient but requires careful `partialFilterExpression` management to keep index sizes small (already implemented).

---

## 🚦 MIGRATION COMPLEXITY LEVEL
> **MEDIUM**

The system is already "Capability-Aware". Transitioning to a pure capability model (removing `type` entirely) would only require migrating existing `type` checks to `listingType` checks in the backend, as the frontend is already capability-primary.
