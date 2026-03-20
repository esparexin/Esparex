# ESPAREX System Constitution

Version: 1.0.0  
Effective Date: 2026-03-04  
Status: Active (Production Governance Baseline)

## Sign-Off
- Owner: ____________________
- Approver: ____________________
- Last Reviewed: ____________________

## SECTION 1 - Core System Principles

### 1.1 Single Source of Truth (SSOT)
Rule:
- Every business entity has one canonical owner module for schema, validation, and status semantics.
- Frontend mirrors contract, never invents alternate fields.

Rationale:
- Prevents drift (`categoryId` vs `categories`, `sparePart` vs `spareParts`).

Forbidden patterns:
- Duplicate DTO shapes for same endpoint in multiple files.
- Parallel status enums with same meaning but different values.

Verification checklist:
- One canonical type per entity in shared or backend schema.
- Frontend request builders import canonical type helpers.

### 1.2 No Silent Failures
Rule:
- Any recoverable API/validation failure must surface explicit error state and log context.

Forbidden patterns:
- `catch { return []; }` on data critical endpoints.
- Swallowing validation errors during submit.

Verification checklist:
- Error logs include request id + endpoint + actor type.
- UI shows user-safe error copy.

### 1.3 No Contract Drift
Rule:
- API payload and response contracts are immutable unless versioned.

Forbidden patterns:
- Optional alternate payload branches for same field.
- Different response wrappers per controller for same resource family.

Verification checklist:
- Contract tests for create/read/update flows.
- Shared schema snapshot checks in CI.

### 1.4 Deterministic Payload Rules
Rule:
- Same logical input always produces same outbound payload shape.

Forbidden patterns:
- Runtime branch selecting incompatible location formats.

Verification checklist:
- Submit hook logs final payload in non-prod during QA runs.

### 1.5 Strict Separation of Concerns
Rule:
- Routing: auth + policy + validation + controller binding only.
- Controller: transport concerns only.
- Service: business logic + transactions.
- Model: persistence constraints and indexes only.

Forbidden patterns:
- Controller-owned transaction orchestration.
- Validation rules duplicated across controller and service.

Verification checklist:
- Each layer has test coverage for its responsibilities.

## SECTION 2 - Authentication Governance Rules

### 2.1 JWT Handling Rules
Allowed:
- Short-lived access token + refresh token rotation.
- JWT includes `sub`, `role`, `tokenVersion`, `iat`, `exp`.

Forbidden:
- Trusting token without tokenVersion re-check.
- Accepting JWT from query string.

### 2.2 tokenVersion Invalidation
Allowed:
- Increment `tokenVersion` on password reset, OTP reset, forced logout, role/security event.

Forbidden:
- Cache-only invalidation with no persistent source-of-truth update.

### 2.3 Cookie Policy
Allowed:
- `httpOnly`, `secure` in production, `sameSite` set explicitly.

Forbidden:
- Client JS access to auth token cookies.

### 2.4 Rate Limiting Policy
Rule:
- OTP issue/verify endpoints must have IP + identifier throttles.

Forbidden:
- Unlimited OTP attempts.

### 2.5 OTP Hashing Rules
Allowed:
- Store hash only, never plaintext OTP.
- TTL expiration enforced server-side.

Forbidden:
- Reusable OTP after successful verification.

### 2.6 Lock Logic Rules
Rule:
- Lockouts are deterministic with cooldown and audit event.

Forbidden:
- Per-process in-memory lock counters in multi-instance production.

### 2.7 Cache Validation Policy
Rule:
- Auth cache never overrides DB truth for tokenVersion.

Forbidden:
- Accepting cached session state when DB says invalid.

Verification checklist:
- Revoke token test invalidates immediately.
- Cross-instance logout test passes.

## SECTION 3 - API Contract Rules

### 3.1 Response Shape Standard
Rule:
- Use one envelope style per API domain (`success`, `message`, `data`, optional `meta`).

### 3.2 Error Shape Standard
Rule:
- Standard error object: `success=false`, `message`, `error.code`, `error.details[]`, `requestId`.

### 3.3 Status Code Policy
Rule:
- `200/201` success, `400` validation, `401` unauthenticated, `403` unauthorized/CSRF, `404` not found, `409` conflict, `422` semantic validation, `500` server failure.

### 3.4 ObjectId Validation Policy
Rule:
- Validate all incoming ObjectId fields before DB query.
- Reject invalid ids with `400` and field-level details.

Forbidden:
- Letting invalid ids reach Mongoose cast errors.

### 3.5 Query Param Whitelist Policy
Rule:
- Explicitly whitelist allowed query params and types.

Forbidden:
- Passing raw `req.query` into DB filter.

### 3.6 No Mass Assignment Policy
Rule:
- Build safe payload whitelist in service/controller.

Forbidden:
- `Model.create(req.body)` for privileged resources.

### 3.7 No Silent Empty Array Fallback
Rule:
- Data fetch failure must return proper error, not fake empty result.

Verification checklist:
- API tests assert error shape for failure modes.

## SECTION 4 - Master Data Governance Rules

### 4.1 Relational Contract
Rule:
- Category -> Brand -> Model -> SparePart -> ScreenSize must maintain referential integrity.

### 4.2 Status Enum Unification
Rule:
- Status semantics standardized per entity family and documented centrally.
- Public visibility uses explicit policy mapping, not ad hoc string checks.

Forbidden:
- Mixing `active` and `approved` semantics without translation layer.

### 4.3 Public Visibility Rules
Rule:
- Public catalog endpoints return only policy-approved and active records.

### 4.4 Admin Assignment Restrictions
Rule:
- Admin cannot assign children to inactive/blocked parents unless explicitly allowed by policy.

### 4.5 No Orphan Relationship Rule
Rule:
- No orphan brands/models/spare parts in production datasets.

### 4.6 Approval Flow Rules
Rule:
- Suggestion to approval transitions are explicit, auditable, and reversible.

Verification checklist:
- Nightly integrity scan for orphan and status mismatch counts.

## SECTION 5 - Post Ad Payload Contract

### 5.1 Canonical Payload Rules
Rule:
- `spareParts`: ObjectId[] only.
- `location`: GeoJSON Point only.
- Images required per business rule with deterministic ordering.

### 5.2 Price Rules
Rule:
- Numeric, validated bounds, currency policy fixed by marketplace config.

### 5.3 No Partial Payload Branching
Rule:
- Single request builder path for submit/edit flows.

Forbidden:
- Alternate shape toggled by local state quirks.

### 5.4 Idempotency Handling
Rule:
- Post create endpoints support dedupe by idempotency key where applicable.

Verification checklist:
- Payload contract tests for create/edit and invalid-object-id rejection.

## SECTION 6 - Location Contract Rules

### 6.1 GeoJSON Only
Rule:
- `location: { type: "Point", coordinates: [lng, lat] }`

Forbidden:
- Flat `{ lat, lng }` object.
- Reversed coordinates.

### 6.2 No Mixed Location Contract
Rule:
- Do not send conflicting location representations in same payload.

### 6.3 Coordinate Validation
Rule:
- `lng` in `[-180, 180]`, `lat` in `[-90, 90]`, both finite numbers.

Verification checklist:
- Submit blocked if location missing or invalid.

## SECTION 7 - Database and Index Policy

### 7.1 Required Index Governance
Rule:
- All list filters/sorts in production endpoints must be backed by indexes.

### 7.2 IXSCAN Requirement
Rule:
- High-volume admin queries must be explain-verified (`IXSCAN`, no `COLLSCAN`).

### 7.3 Count Policy
Rule:
- Avoid unbounded `countDocuments({})` on large collections for hot paths.

### 7.4 Transaction Safety Rules
Rule:
- Single owner for transaction lifecycle.
- Abort/commit exactly once.

Forbidden:
- Double `abortTransaction`.
- Session re-use across conflicting concurrent flows.

Verification checklist:
- Query plans archived for critical endpoints.

## SECTION 8 - Cache Policy

### 8.1 Cache Eligibility
Allowed:
- Stable read-heavy master data and derived admin lists with short TTL.

Forbidden:
- Caching mutable auth truth without invalidation hooks.

### 8.2 TTL Rules
Rule:
- TTL set per data volatility (for example, 5 minutes for state lists).

### 8.3 Invalidation Triggers
Rule:
- Invalidate cache on create/update/status change/delete.

### 8.4 tokenVersion Cache Invalidation
Rule:
- Any tokenVersion mutation triggers immediate auth cache purge.

### 8.5 No Stale Auth Cache
Rule:
- On mismatch, deny and refresh state from DB.

Verification checklist:
- Cache hit/miss and stale-deny metrics are monitored.

## SECTION 9 - UI and UX Governance Rules

### 9.1 Search Guardrails
Rule:
- Minimum 2 characters before remote search.

### 9.2 Dropdown Performance Rule
Rule:
- No full dataset dumps in dropdowns.

### 9.3 No Silent API Failure UI
Rule:
- Always show explicit empty/error/loading states.

### 9.4 Dropdown Accessibility and Size
Rule:
- Scrollable and keyboard navigable dropdowns.

### 9.5 No Status Leakage
Rule:
- Internal moderation status not exposed in user-facing copy unless policy allows.

Verification checklist:
- UX acceptance tests cover loading/empty/error states.

## SECTION 10 - Deployment and Startup Rules

### 10.1 Build Order
Rule:
- Shared -> backend -> frontend -> admin-frontend.

### 10.2 Environment Verification
Rule:
- Startup fails fast if required env vars are missing or malformed.

### 10.3 Redis Reset Rules
Rule:
- Controlled flush policy for non-production only; production requires scoped invalidation.

### 10.4 DB Integrity Verification
Rule:
- Run integrity and migration checks before serving traffic.

### 10.5 Health Endpoint Verification
Rule:
- Health checks include DB, Redis, and dependency readiness.

### 10.6 Index Verification
Rule:
- Index sync and explain checks during release validation.

### 10.7 Smoke Test Checklist
Rule:
- Auth, post-ad create/edit, admin moderation, master data reads, and location flows must pass.

## SECTION 11 - Incident Prevention Matrix

| Historical Failure | Violated Rule | Preventive Control |
|---|---|---|
| Token invalidation bypass | Auth cache validation | tokenVersion DB truth check + cache purge on mutation |
| Empty dropdown for spare parts | Master data relational contract | Category mapping + status visibility integrity scan |
| ObjectId validation failures | API ObjectId contract + Post Ad payload contract | Frontend canonical payload + backend strict pre-check |
| Double abort transaction errors | DB transaction safety | Single transaction owner and once-only commit/abort guard |
| Status mismatch across entities | Status enum unification | Shared status map and contract tests |
| Slow query on admin locations | DB index policy | Required indexes + explain IXSCAN gate |

## SECTION 12 - Enforcement Checklist (25-Point Pre-Production Gate)

1. Shared schemas build and version checks pass.
2. Backend build passes with zero unresolved imports.
3. Frontend build passes with zero type errors.
4. Admin frontend build passes with zero type errors.
5. Auth middleware validates JWT + tokenVersion on protected routes.
6. Logout/password-reset invalidates tokenVersion and cache.
7. OTP stored hashed and TTL enforced.
8. OTP attempt rate limits active in production config.
9. CSRF protection enabled and token refresh flow verified.
10. Standard error envelope returned for validation failures.
11. ObjectId validation runs before DB access on all id params.
12. Query params are whitelist-validated on list endpoints.
13. No mass assignment in admin create/update handlers.
14. Category-brand-model-sparepart relations pass integrity scan.
15. No orphan records in master-data chain.
16. Public master data endpoints enforce status + active filters.
17. Post Ad payload uses canonical location GeoJSON only.
18. Post Ad submit rejects missing/invalid location before request.
19. Spare parts payload is ObjectId[] and category-compatible.
20. Hot admin list queries show IXSCAN in explain plans.
21. No unbounded countDocuments on hot large collections.
22. Redis cache keys and TTLs documented and tested.
23. Cache invalidation triggers verified on write events.
24. SLOW_QUERY and SLOW_API thresholds/logging enabled.
25. End-to-end smoke tests pass for auth, post ad, moderation, and admin master data.

## SECTION 13 - Naming Constitution

### 13.1 Report Actor Field
Rule:
- Use `reporterId` as canonical report actor field.

Forbidden:
- Introducing new writer paths that only populate `reportedBy`.

### 13.2 Report Target Contract
Rule:
- Use `targetType` + `targetId` as canonical report target pair.

Forbidden:
- New report flows keyed only by legacy `adId`.

### 13.3 Enum Source Integrity
Rule:
- Import enums from `shared/enums/*` only.

Forbidden:
- Inline enum literals duplicated inside model/controller files.

### 13.4 Feed Safety Guard
Rule:
- Feed filtering must include explicit guardrails (visibility + user safety filters such as block relationships).

Forbidden:
- Direct feed queries that bypass guard helpers/services.

## Enforcement
- Any failed checklist item blocks production deployment.
- Any exception requires documented risk acceptance by Owner and Approver.

## Change Control
- Amendments require PR review by backend + frontend owners.
- Constitution version must be bumped on rule changes.

## Sign-Off (Release)
- Owner: ____________________
- Approver: ____________________
- Last Reviewed: ____________________
