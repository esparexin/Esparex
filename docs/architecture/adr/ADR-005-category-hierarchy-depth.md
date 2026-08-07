# ADR-005: CATEGORY HIERARCHY TREE DEPTH CONSTRAINT

**Status:** Proposed / Under Architectural Review  
**Date:** 2026-07-27  
**Deciders:** Core Architecture Team, Product Ownership  
**Technical Area:** Catalog Domain (`Category` Model & Hierarchy Service)

---

## 1. Context and Problem Statement

The Esparex Device Catalog utilizes a self-referencing `parentId: ObjectId` field in `Category.ts` to construct hierarchy trees. 

Currently:
- The database schema does not restrict maximum nesting depth.
- `CatalogCategoryService.ts` limits recursive descendant collection to `depth < 5`.
- Product design specifications recommend a standardized **3-Level Bounded Hierarchy**:
  ```
  Level 0: Root Category (e.g. Mobile & Tablets)
     └── Level 1: Sub Category (e.g. Smartphones)
            └── Level 2: Child / Leaf Category (e.g. Refurbished iPhones)
  ```

Should Esparex enforce a hard schema constraint limiting category hierarchy to exactly 3 levels (`treeDepth: 0 | 1 | 2`), or maintain unbounded self-referencing categories with depth guards in application services?

---

## 2. Decision Drivers

- **UI/UX Consistency**: Deeply nested category trees (>3 levels) degrade breadcrumb navigation, mobile filter drawers, and megamenu rendering.
- **Query Performance**: Unbounded recursive graph queries introduce latency risks during search filter aggregation.
- **Domain Flexibility**: Certain potential future verticals (e.g. industrial equipment or auto spare parts cataloging) might require specialized 4th-level sub-classifications.
- **Separation of Concerns**: Enforcing a business rule at the database level vs service application layer.

---

## 3. Options Considered

### Option A: Enforce Hard 3-Level Constraint at Schema Level (Recommended)
- Restrict `treeDepth` on `Category.ts` to `enum: [0, 1, 2]`.
- Prevent creation of categories where `parent.treeDepth === 2`.
- **Pros**: Guaranteed UI/UX simplicity, fast bounded queries, zero deep recursion bugs.
- **Cons**: Requires product sign-off confirming no domain vertical will need 4+ levels.

### Option B: Maintain Unbounded Schema with Application-Level Depth Bounding (Status Quo)
- Retain flexible `parentId` self-reference without schema-level `treeDepth` validation.
- Continue capping traversal at depth 5 inside `CatalogCategoryService.ts`.
- **Pros**: Maximum database schema flexibility.
- **Cons**: Risks inconsistent depth creation in Admin UI if admin users create sub-sub-sub categories without constraint.

---

## 4. Proposed Decision & Governance Gate

**Recommendation**: Transition to **Option A (Hard 3-Level Constraint)** upon formal Product Owner sign-off.

### Next Steps & Decision Gate
1. Product Management must review existing category tree depth across all live verticals (`Mobiles`, `Vehicles`, `Services`, `Spare Parts`) to verify max depth is currently $\le 2$.
2. Once verified and approved, schema validation bounds will be applied to `Category.ts`.
