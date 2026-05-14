# Governance Enforcement Matrix

This matrix maps every documented governance rule to its corresponding automated enforcement script and CI/CD status.

| Rule Name | Severity | Canonical Document | Enforcement Script | package.json Command | CI Status | Coverage | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Doc Registry** | High | `docs/00-index.md` | `check-doc-duplicates.js` | `docs:lint` | Active | Documented & Enforced | Doc Gov |
| **Banned Filenames** | High | `SSOT.md` | `check-doc-duplicates.js` | `docs:lint` | Active | Documented & Enforced | Doc Gov |
| **Naming Conventions** | Medium | `SSOT.md` | `enforce-file-naming-conventions.js` | `guard:naming` | Active | Documented & Enforced | Engineering |
| **ObjectId Validation** | Critical | `SSOT.md` | `enforce-objectid-validation.js` | `guard:objectid` | Active | Documented & Enforced | Engineering |
| **No DB Mutation in scripts**| Critical | `SSOT.md` | `guard-platform-governance.js` | `guard:platform-governance`| Active | Documented & Enforced | Architecture |
| **No sonner/toast** | Low | `SSOT.md` | `enforce-notification-governance.js` | `guard:notification-governance`| Active | Documented & Enforced | Frontend |
| **Ad Ownership (sellerId)** | Critical | `docs/05-database...` | `enforce-ad-ssot-guard.js` | `guard:ad-ssot` | Active | Documented & Enforced | Engineering |
| **GeoJSON Coordinates** | Medium | `docs/05-database-schema-ssot.md` | `enforce-ad-ssot-guard.js` | `guard:ad-ssot` | Active | Documented & Enforced | Engineering |
| **GeoJSON 2dsphere Index** | Critical | `docs/05-database-schema-ssot.md` | `enforce-ad-ssot-guard.js` | `guard:ad-ssot` | Active | Documented & Enforced | Engineering |
| **API Boundary** | High | `SSOT.md` | `enforce-component-api-boundary.js` | `guard:component-api-boundary`| Active | Documented & Enforced | Architecture |
| **Compatibility Baseline** | Medium | `docs/02-eng-gov...` | `enforce-compatibility-markers-baseline.js` | `guard:compatibility-markers`| Active | Documented & Enforced | Architecture |
| **Admin Status Literals** | Low | `docs/06-frontend...` | `enforce-admin-status-literals.js` | `guard:admin-status-literals`| Active | Documented & Enforced | Frontend |
| **Single SW Strategy** | Low | `docs/02-eng-gov...` | `guard-platform-governance.js` | `guard:platform-governance`| Active | Documented & Enforced | Engineering |
| **Single Shared UI Ownership** | High | `docs/06-frontend-admin-standards.md` | `apps/admin/tests/ui-composition.spec.ts` | `test:ui` | Active | Documented & Enforced | Frontend |
| **Contract Compatibility** | Critical | `SSOT.md` | `apps/admin/scripts/moderation-regression.mjs` | `test:moderation-regression` | Active | Documented & Enforced | Engineering |

## Legend

- **Documented and Enforced**: Rule is in a `.md` file AND a CI script checks it.
- **Documented Only**: Rule exists in text but has no automated check.
- **Enforced Only**: A script exists but the policy is not documented.
- **Missing**: Critical rule with neither documentation nor script.
