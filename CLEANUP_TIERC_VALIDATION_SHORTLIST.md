# Cleanup Tier-C Validation Shortlist

Date: 2026-04-09
Scope: `audit:orphans` Tier-C candidates only (conservative review, no deletions applied in this patch).

## Patch Set Included

- Dead-import cleanup applied across backend TypeScript files.
- Verification:
  - `npm run type-check -w backend` passed.
  - `unused-imports/no-unused-imports` errors reduced to `0`.
- Behavior impact: none intended (import-only removals).

## Tier-C Candidates (Validation Shortlist)

Legend:
- `KEEP` = retain for now (likely operational/manual script or compatibility surface).
- `REVIEW` = validate ownership/usages, then remove only if all gates pass.

| Path | Status | Why It Is Tier-C | Validation Gate Before Removal |
|---|---|---|---|
| `backend/src/models/SellerReputation.ts` | REVIEW | No import-graph roots | Confirm no runtime model registration usage and no collection dependency in production data paths |
| `backend/src/scripts/migrations/add_unified_listing_indexes.ts` | KEEP | Migration entrypoint not rooted by app imports | Keep until indexed by `package.json` script and runbook |
| `backend/src/scripts/migrations/cleanupCategoryType.ts` | KEEP | Migration entrypoint not rooted by app imports | Keep; add explicit dry-run/apply guard before any future execution |
| `backend/src/scripts/migrations/migrateServiceDeviceType.ts` | KEEP | Migration entrypoint not rooted by app imports | Keep; add explicit dry-run/apply guard before any future execution |
| `backend/src/scripts/migrations/migrate_location_path_population.ts` | KEEP | Migration entrypoint not rooted by app imports | Keep while location data migrations remain in ops runbook |
| `backend/src/scripts/migrations/remediate_feed_visibility_integrity.ts` | KEEP | Manual remediation script | Keep (already used in dry-run audit) |
| `backend/src/scripts/migrations/remediate_listing_type_drift.ts` | KEEP | Manual remediation script | Keep (already used in dry-run audit) |
| `backend/src/scripts/migrations/remediate_moderation_status_enum.ts` | KEEP | Manual remediation script | Keep (already used in dry-run audit) |
| `backend/src/scripts/migrations/repairLegacyCatalogRelations.ts` | KEEP | Manual remediation script | Keep; add dry-run mode before production use |
| `backend/src/utils/ErrorResponseBuilder.ts` | REVIEW | Unreferenced utility | Search direct imports + remove only after backend type-check and smoke API tests pass |
| `backend/src/utils/errorHelpers.ts` | REVIEW | Unreferenced utility | Search direct imports + remove only after backend type-check and smoke API tests pass |
| `backend/src/validators/promotion.validator.ts` | REVIEW | Unreferenced validator module | Confirm no dynamic schema loading or route wiring uses this file |
| `frontend/src/components/common/AppErrorBanner.tsx` | REVIEW | Unreferenced component | Confirm no dynamic import or CMS route points to this component |
| `frontend/src/components/ui/CompletedFieldCard.tsx` | REVIEW | Unreferenced component | Confirm no pending feature branch still mounts this component |
| `frontend/src/components/user/profile/tabs/MyAdsTab.tsx` | REVIEW | Unreferenced profile tab | Confirm profile tab routing and lazy imports |
| `frontend/src/components/user/wizard/WizardModalShell.tsx` | REVIEW | Unreferenced wizard shell | Confirm no modal registry references |
| `frontend/src/hooks/useMyAds.ts` | REVIEW | Unreferenced hook | Confirm no barrel re-export consumption |
| `frontend/src/lib/auth/session.ts` | REVIEW | Unreferenced auth utility | Confirm no server action uses this helper |
| `frontend/src/lib/errors/errorToPopup.ts` | REVIEW | Unreferenced error mapper | Confirm no shared toast adapter imports |
| `frontend/src/lib/listings/browseServerPage.tsx` | REVIEW | Unreferenced listing helper | Confirm no SSR entrypoint imports |
| `frontend/src/lib/listings/listingPriceAdapter.ts` | REVIEW | Unreferenced adapter | Confirm no catalog/listing normalization imports |
| `frontend/src/schemas/sparePartListingPayload.schema.ts` | REVIEW | Unreferenced schema | Confirm no form resolver uses this schema indirectly |
| `shared/constants/businessConstants.ts` | REVIEW | Unreferenced shared constants | Confirm no runtime alias import paths bypass static graph |
| `shared/constants/serviceTypes.ts` | REVIEW | Unreferenced shared constants | Confirm no shared barrel or generated import path uses it |
| `shared/enums/index.ts` | REVIEW | Unreferenced enum barrel | Confirm no package consumer imports barrel path |
| `shared/enums/physicalStatus.ts` | REVIEW | Unreferenced enum | Confirm no validation schema or mapper imports |
| `shared/enums/serviceType.ts` | REVIEW | Unreferenced enum | Confirm no service payload parser imports |
| `shared/location-engine/index.ts` | REVIEW | Unreferenced shared index | Confirm no dynamic require/import in backend location services |
| `shared/utils/categoryFilters.ts` | REVIEW | Unreferenced shared utility | Confirm no frontend filter utility imports by alias |
| `shared/validators/serviceType.validator.ts` | REVIEW | Unreferenced shared validator | Confirm no runtime validator registry references |

## Safe Removal Workflow (For REVIEW Items)

1. Search references:
   - `rg -n "<symbol-or-path-stem>" backend frontend admin-frontend shared`
2. Remove in very small batches (1-3 files max).
3. Validate each batch:
   - `npm run type-check -w backend`
   - `npm run type-check -w frontend`
   - `npm run type-check -w admin-frontend`
4. Run smoke checks for login + core list pages before merging.

