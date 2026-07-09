---
name: ARCH-002 Split CatalogHierarchyService.ts
about: Decompose the 1,180-line catalog hierarchy service into 4 modules
title: "ARCH-002: Split CatalogHierarchyService"
labels: refactor, arch, core
assignees: ""
---

## Scope

Only this file:
```
core/src/services/catalog/CatalogHierarchyService.ts
```

## Current State

- **1,180 lines**
- **Complexity: 192**
- **Maintainability: 37/100**
- Contains: runtime integrity checks, repair helpers, tree building, cycle detection, dependency checks, bulk write operations for 6+ entity types
- 8+ interface/types + 15+ function exports

## Target Architecture

New folder: `core/src/services/catalogHierarchy/`

| Module | Contents | Est. Lines |
|--------|----------|------------|
| `types.ts` | All interfaces/types (HierarchyIssue, HierarchyReport, RepairSummary, etc.) | ~80 |
| `validation.ts` | validateModelHierarchyMutation(), getLineageKey(), normalizeId(), getEffectiveParentId(), MAX_MODEL_TREE_DEPTH | ~180 |
| `tree.ts` | scanHierarchyIntegrity(), getHierarchyTree(), getModelDeletionImpact(), repairStaleModelHierarchy(), buildActivateOps(), activateValidRecords() | ~480 |
| `mutation.ts` | updateModelHierarchyTransactionally(), hasHierarchyMutation(), buildDescendantCascadeOps(), repairHierarchy(), hierarchy telemetry | ~440 |

Original file becomes barrel.

## API Compatibility

Zero import changes needed — barrel re-export preserves all paths.

## Acceptance Criteria

Same as ARCH-001.

## Pre-Implementation Verification

- [ ] Verify no duplicate hierarchy helpers in `core/src/utils/catalogGovernance.ts`
- [ ] Verify `CatalogValidationService.ts` doesn't duplicate any types
- [ ] Confirm git working tree is clean
