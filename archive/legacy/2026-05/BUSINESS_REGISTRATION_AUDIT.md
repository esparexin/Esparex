# 1. Component Audit

- **Mapping Disconnect**: `BusinessProfileFlow.tsx` manually maps frontend fields to backend payloads (`businessName` ↔ `name`, `fullAddress` ↔ `address`, `contactNumber` ↔ `mobile`). This violates SSOT.
- **Parallel Flow Handling**: `useBusinessProfileWizardController` creates complex legacy mappings using `legacyFormData`.
- **Parallel State**: The frontend manually computes `normalizeBusinessStatus` and checks for `pending` vs `live` rather than relying on a definitive backend computed enum.

# 2. API Audit

- **Duplicate Namespaces**: API routes exist in both `/api/v1/businesses` and `/api/v1/admin/businesses` with conflicting endpoint responsibilities.
- **Inconsistent Contracts**: Responses wrap standard data, but error handling via `resolveDuplicateBusinessMessage` creates fragmented error payloads instead of a single SSOT error handler.

# 3. Route Audit

- **Duplicate Admin Routes**: 
  - `PATCH /businesses/:id/approve`
  - `PATCH /businesses/:id/status` (with status: 'live')
  Both exist and execute parallel logic flows in `adminRoutes.ts`.
- **Method Duplication**: `listings` moderation allows both `POST` and `PATCH` for identical endpoints for "compatibility", introducing redundant API surface.

# 4. Controller Audit

- **`businessMutationController.ts`**:
  - Contains duplicate coordinate validation (lines 115-127) which should be centralized in Zod or Mongoose schemas.
  - Edits to pending businesses do not consistently reset approval workflows correctly. 
- **`adminBusinessController.ts`**:
  - `updateBusinessStatus` acts as a shadow controller, simply calling `approveBusinessAccount` or `rejectBusinessAccount` under the hood.

# 5. Service Audit

- **Service Fragmentation**: `core/src/services/BusinessService.ts` is a 193-byte file that merely re-exports `BusinessCoreService`, `BusinessSearchService`, etc. This leads to import confusion.
- **Admin vs Core Drift**: `AdminBusinessService` and `BusinessCoreService` maintain parallel, sometimes conflicting, status mutation logic rather than a unified State Machine.

# 6. Schema & Validation Audit

- **Validation Mismatch**: `businessRegistration.schema.ts` requires `{ type: "Point", coordinates: [...] }` strictly, but Mongoose `Business.ts` allows missing coordinates or has redundant validation.
- **Naming Mismatch**: Frontend schema uses `businessName`, `businessDescription`, `contactNumber`, `fullAddress`, while backend uses `name`, `description`, `mobile`, `address`.

# 7. Database Audit

- **Parallel Status Flags**: `isVerified` (boolean) exists alongside `status` (string enum: pending/live/rejected/suspended). This creates invalid states (e.g., `status: 'suspended'` but `isVerified: true`).
- **Data Duplication**: `locationId` (reference) is stored alongside flat `location` fields (`city`, `state`, `coordinates`).
- **Legacy Fields**: `phone` is kept as a virtual field for `mobile`, creating confusion.
- **Index Redundancy**: `idx_business_status_createdAt` and `idx_business_active_freshness_partial` overlap significantly.

# 8. Admin Audit

- **Admin Redundancy**: `adminBusinessController.ts` duplicates logic for status updates. Admin frontends likely use the `/status` endpoint while legacy features use `/approve`.
- **Status Override Risk**: Admins can mutate `isVerified` independently of `status`.

# 9. Security Audit

- **MIME Validation Bypass Risk**: Backend controllers like `updateBusiness` do not rigorously validate file types for `images` and `documents`, relying almost entirely on frontend Zod schemas and `processImages`.
- **Mobile Overwrite Hack**: `businessMutationController` forces `mobile` to the user's verified phone, but accepts the payload blindly otherwise. 

# 10. Upload & Document Audit

- **Orphan Files**: In `BusinessCoreService.ts`, if S3 upload fails or partial update crashes, `cleanupRemovedS3Objects` acts asynchronously, which can lead to orphan files or race conditions if the app crashes.
- **Parallel Document Handling**: Images are arrays of strings, but documents are subdocuments with versioning and types, leading to inconsistent media handling.

# 11. Duplicate Logic Report

- **Controller Status Routes**: `/businesses/:id/approve` vs `/businesses/:id/status`.
- **Coordinate Validation**: Present in Zod, `businessMutationController`, and Mongoose Schema.
- **Location DB Storage**: `locationId` reference vs flat `location.city`/`location.coordinates`.
- **Phone Fields**: `mobile` vs `phone` (virtual).

# 12. Dead Code Report

- `phone` virtual field in Mongoose Schema.
- `BusinessService.ts` index re-exports.
- Legacy `isActive` / `isVerified` checks where `status` should be the sole source of truth.

# 13. Naming Conflict Report

| UI Field | Backend Field | DB Field |
| --- | --- | --- |
| `businessName` | `name` | `name` |
| `contactNumber` | `mobile` | `mobile` |
| `fullAddress` | `address` | `location.address` |
| `currentLocationCity` | `city` | `location.city` |

# 14. Performance Report

- **N+1 Queries**: Mongoose `populate('userId')` in admin lists without `.lean()` on large datasets causes massive overhead.
- **Index Bloat**: Five different unique partial indexes checking `isDeleted: false` slow down inserts.

# 15. Root Cause Findings

- **No Single Source of Truth for Status**: The inclusion of `isVerified` alongside a `status` enum breaks the state machine.
- **Disconnected Data Contracts**: Frontend builds payloads that require manual mapping (`buildBusinessPayloadBase`) because DTOs do not match UI schemas.
- **Shadow Controllers**: Admin API evolved to use RESTful status endpoints while retaining legacy action endpoints.

# 16. Impact Analysis

- **High Impact**: Parallel status flags (`isVerified` vs `status`) can result in businesses appearing "verified" but functionally "suspended".
- **Medium Impact**: Orphan files accumulating in S3 due to unhandled async cleanup failures.
- **High Impact**: UI to API mapping creates fragile code that breaks easily when adding new fields.

# 17. Minimal Safe Fix Plan

- **DB Layer**: Deprecate `isVerified`. Enforce `BUSINESS_STATUS` as the only source of truth. Remove `phone` virtual.
- **API Layer**: Remove `/approve`, `/reject` endpoints in favor of the unified `/status` endpoint.
- **UI Layer**: Rename Zod schema fields (`businessName` -> `name`, `contactNumber` -> `mobile`) to eliminate `buildBusinessPayloadBase` mapping.
- **Validation Layer**: Move coordinate validation strictly into a centralized schema validator shared by both UI and API.

# 18. Regression Risk Analysis

- **Status Migration**: Removing `isVerified` requires a one-time migration to ensure no `status: pending` business is accidentally granted access because `isVerified` was `true`.
- **API Clients**: Mobile apps relying on `/approve` or `businessName` in response payloads will break unless appropriately versioned.

# 19. SSOT Compliance Report

- **FAIL**: Multiple DTO mappings.
- **FAIL**: Duplicate location storage (normalized vs denormalized).
- **FAIL**: Duplicate state enums (`isVerified` flag).

# 20. Final Confirmation

Audit completed according to strict ESPAREX governance policy. Root causes identified. No modifications made. Ready for targeted PRs.
