---
name: ARCH-003 Split AdAggregationService.ts
about: Decompose the 918-line ad aggregation service into 4 modules
title: "ARCH-003: Split AdAggregationService"
labels: refactor, arch, core
assignees: ""
---

## Scope

Only this file:
```
core/src/services/ad/AdAggregationService.ts
```

## Current State

- **918 lines**
- **Complexity: 46**
- Contains: metadata hydration, getAds pipeline assembly, geo/location fallback logic, ranking telemetry
- Exports: getAds(), getOwnerListings(), hydrateAdMetadata(), getListingSuggestions()

## Target Architecture

New folder: `core/src/services/adAggregation/`

| Module | Contents | Est. Lines |
|--------|----------|------------|
| `metadata.ts` | fetchMetadataWithCache(), hydrateAdMetadata(), getOwnerListings(), HydratedAd interface | ~180 |
| `pipeline.ts` | Main getAds() function (~500 lines of pipeline logic) | ~500 |
| `locationFallback.ts` | L1→L2→L3→L4 location intelligence fallback | ~120 |
| `telemetry.ts` | Ranking telemetry logging, getListingSuggestions() shim | ~100 |

## API Compatibility

Zero import changes needed. Key consumers:
- `AdDetailService.ts` imports `hydrateAdMetadata`
- `ListingModerationQueryService.ts` imports `getAds`
- `SavedAdService.ts` imports `hydrateAdMetadata`
- `UserProfileService.ts` imports `getAds`
- `getListings.controller.ts` imports via namespace
- `stats.controller.ts` imports via namespace
- 4 spec files mock the original path

## Acceptance Criteria

Same as ARCH-001.

## Pre-Implementation Verification

- [ ] Verify the `_shared/adServiceBase.ts` barrel doesn't already re-export what we're splitting
- [ ] Check `adFilterHelpers.ts` doesn't duplicate pipeline logic
- [ ] Confirm git working tree is clean
