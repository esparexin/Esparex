---
name: ARCH-001 Split CatalogSearchGovernanceService.ts
about: Decompose the 1,846-line catalog search governance service into 5 modules
title: "ARCH-001: Split CatalogSearchGovernanceService"
labels: refactor, arch, core
assignees: ""
---

## Scope

Only this file:
```
core/src/services/catalog/CatalogSearchGovernanceService.ts
```

## Current State

- **1,846 lines** — largest file in the repository
- **Estimated complexity: 938** — highest in the repository
- **Maintainability score: 0/100**
- Contains: Telugu transliteration map, 20+ interfaces, telemetry, ranking algorithms, search pipeline, Atlas search, autocomplete, SEO evaluation, duplicate detection, experiment quality evaluation
- 37 interface/type exports + 60 constant/function exports

## Target Architecture

New folder: `core/src/services/catalogSearch/`

| Module | Contents | Est. Lines |
|--------|----------|------------|
| `types.ts` | All 20+ interfaces and type aliases | ~170 |
| `transliteration.ts` | TELUGU_TRANSLITERATION_MAP, normalizeCatalogSearchText(), compact(), getTransliterationConfidence() | ~100 |
| `telemetry.ts` | Telemetry snapshot, recordBehavioralSearchTelemetry(), recordCatalogSearchTelemetry(), shouldSuppressAutocomplete() | ~120 |
| `ranking.ts` | All ranking/scoring functions (~20 functions) | ~700 |
| `search.ts` | buildSearchVariants(), buildRegexSearchClauses(), tryAtlasCatalogSearch(), buildSeoCanonicalPath(), evaluateSeoCrawlDecision(), isSuspiciousQueryPattern() | ~450 |

Original file becomes barrel:
```ts
export * from './catalogSearch/types';
export * from './catalogSearch/transliteration';
export * from './catalogSearch/telemetry';
export * from './catalogSearch/ranking';
export * from './catalogSearch/search';
```

## API Compatibility

All consumers import from `@esparex/core/services/catalog/CatalogSearchGovernanceService` or through `@esparex/core/services` barrel. Since the original file still exists (now a barrel re-export), **zero import changes are needed**.

## Consumers (unaffected by barrel)

- `core/src/utils/contentHandler.ts`
- `core/src/services/catalogRequestApprovalService.ts`
- `backend/api/src/controllers/admin/catalog/catalogBrandModelController.ts`
- Test spec file

## Acceptance Criteria

- [ ] File <500 LOC
- [ ] No public API changes
- [ ] Barrel exports maintained
- [ ] No consumer import changes
- [ ] Type-safe (`npm run type-check` passes)
- [ ] Tests pass (`npm run test` passes)
- [ ] No lint errors (`npm run lint` passes)
- [ ] No duplicate implementations
- [ ] No circular dependencies
- [ ] No dead code introduced

## Pre-Implementation Verification

Before starting:
- [ ] Verify no duplicate helpers already exist in `core/src/utils/`
- [ ] Verify no duplicate types in `shared/src/types/`
- [ ] Verify `core/src/services/index.ts` still re-exports the file path correctly
- [ ] Confirm git working tree is clean
