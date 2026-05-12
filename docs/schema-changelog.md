# Schema Changelog

## 2026-05-12 — Device Taxonomy SSOT Production Remediation

### Lifecycle
- Enforced canonical taxonomy lifecycle fields (`approvalStatus`, `isActive`, `deletedAt`, `isDeleted`).
- Removed taxonomy lifecycle dependence on legacy `status`/`isLive` fallbacks in shared schema exposure.

### Category Mapping
- Enforced canonical plural category relation (`categoryIds`) for plural taxonomy entities.
- Removed `categoryId` alias compatibility from plural query construction.

### New/Required Collections
- `variants`
- `attributes`
- `taxonomyAliases`
- `taxonomySynonyms`

### Required Indexes
- `brands(categoryIds, slug)` unique partial
- `models(brandId, slug)` unique partial
- `variants(modelId, slug)` unique partial

### Migration Notes
- Applied taxonomy remediation migrations on `esparex_user`.
- Hardened migration idempotency for pre-existing index-name drift.
