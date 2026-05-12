# Device Taxonomy SSOT Architecture (Production Baseline)

Last updated: May 12, 2026

## Scope
This document defines the canonical lifecycle and identity model for Device Taxonomy entities:
- `categories`
- `brands`
- `models`
- `spareparts`
- `servicetypes`
- `screensizes`
- `variants`
- `attributes`

## Canonical Lifecycle Rule
A taxonomy record is publicly visible only when all conditions are true:
- `approvalStatus === "approved"`
- `isActive === true`
- `deletedAt === null`
- `isDeleted !== true`

Canonical query fragment:
- `TAXONOMY_PUBLIC_VISIBILITY_QUERY` in `core/src/services/catalog/taxonomySsot.ts`

## Lifecycle Field Policy
Canonical lifecycle fields:
- `approvalStatus` (`pending|approved|rejected`)
- `isActive`
- `isDeleted`
- `deletedAt`

Deprecated for taxonomy lifecycle decisions:
- `status`
- `isLive`

`status` may still exist historically on documents but must not be used as taxonomy visibility truth.

## Category Relationship Policy
Plural taxonomy entities (`brands`, `models`, `spareparts`, `servicetypes`, `variants`) use canonical `categoryIds`.

Compatibility behavior removed:
- `CategoryQueryBuilder.forPlural()` no longer accepts singular `categoryId` alias input.

## API Namespace Contract
Admin taxonomy routes are mounted under:
- `/api/v1/admin/catalog/*`

Mounted by:
- `backend/user/src/app.ts`
- `backend/user/src/routes/adminCatalogRoutes.ts`

## Duplicate Logic Policy
Taxonomy-critical modules must remain clone-free under jscpd scans:
- `core/src/controllers/admin/catalog`
- `core/src/services/catalog`
- `apps/admin/src/app/(protected)/(catalog)`
- `apps/admin/src/components/catalog`

## Required Taxonomy Infrastructure
Collections:
- `variants`
- `attributes`
- `taxonomyAliases`
- `taxonomySynonyms`

Indexes:
- `brands(categoryIds, slug)` unique partial
- `models(brandId, slug)` unique partial
- `variants(modelId, slug)` unique partial

## Governance Guard
Schema/lifecycle changes under `core/src/models` or `shared/src/schemas` must include migration/runbook evidence enforced by:
- `scripts/enforce-schema-migration-gate.sh`
