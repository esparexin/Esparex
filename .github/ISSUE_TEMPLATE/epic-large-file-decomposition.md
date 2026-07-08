---
name: "Repository Modernization — Large File Decomposition Program"
about: Epic tracking all ARCH issues for reducing files >800 LOC
title: "Repository Modernization — Large File Decomposition Program"
labels: epic
assignees: ""
---

## Background

The TypeScript Quality Audit (TS_QUALITY_AUDIT_REPORT.md) identified **5 files >800 LOC** and **31 files >500 LOC** across the Esparex monorepo. These files violate single-responsibility principles, increase cognitive load, slow CI, and create merge conflict risk. This epic tracks the systematic decomposition of all oversized files.

## Goals

- Zero files >800 LOC
- Zero files >500 LOC
- Zero public API regressions
- Zero consumer import changes
- Zero circular dependencies introduced
- Zero duplicate implementations created
- 100% test pass rate maintained

## Risks

- Circular dependencies from module extraction
- Import path breakage
- Barrel export conflicts
- Test mocking path changes
- CI timeout increases from additional files

## Validation Strategy

Every PR must pass:
- `npm run type-check`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run guard:duplicate-code`
- `npm run guard:dead-code`
- `npm run guard:circular`

## Rollback Strategy

Each PR is a single-commit revert. If a decomposition causes issues, the entire PR is reverted as one commit.

## EEIRS Compliance

- One issue → one branch → one PR → merge → next
- Never combine multiple files in one PR
- Barrel re-exports preserve all public APIs
- No consumer import changes

## PR Sequencing

| PR | Issue | File | Est. New Files |
|----|-------|------|---------------|
| PR-001 | ARCH-001 | CatalogSearchGovernanceService.ts (1,846 LOC) | 5 |
| PR-002 | ARCH-002 | CatalogHierarchyService.ts (1,180 LOC) | 4 |
| PR-003 | ARCH-003 | AdAggregationService.ts (918 LOC) | 4 |
| PR-004 | ARCH-004 | CatalogUiPrimitives.tsx (841 LOC) | 24 |
| PR-005 | ARCH-005 | catalogBrandModelController.ts (899 LOC) | 3 |

## Success Metrics

- [ ] 5 files reduced below 800 LOC
- [ ] 40+ new well-named module files created
- [ ] Zero regression test failures
- [ ] Zero type-check errors
- [ ] Zero lint errors
- [ ] Zero circular dependencies
- [ ] Zero public API changes
