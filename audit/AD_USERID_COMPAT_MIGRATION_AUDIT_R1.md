# Ad.userId Compatibility Migration Audit (R1)

## Scope
- Domain: `Ad` ownership contract only
- Goal: remove deprecated `Ad.userId` compatibility safely, keep `sellerId` as single source of truth
- Baseline audited: `origin/main` at commit `299eeea` (2026-04-13)
- Out of scope: generic account `userId` usage in unrelated domains (notifications, wallet, chat read states, invoices)

## Executive Findings
- `sellerId` is already the canonical owner key in the `Ad` model and most business logic.
- `userId` compatibility is still active in multiple layers, so direct removal will break runtime behavior and tooling.
- The migration is blocked by contract surfaces, not by database schema alone.
- High-risk breakpoints exist in:
  - model serialization aliasing
  - request alias coercion
  - shared schema contract
  - frontend listing normalization
  - ops script that still writes `userId` when creating `Ad`

## Current Compatibility Map

### 1) Backend model aliasing (hard dependency)
- [backend/src/models/Ad.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/models/Ad.ts:77)
  - `IAd` still declares `userId?: Types.ObjectId`
- [backend/src/models/Ad.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/models/Ad.ts:245)
  - `toJSON` transform emits `json.userId = json.sellerId`
- [backend/src/models/Ad.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/models/Ad.ts:543)
  - virtual `userId` getter/setter mirrors `sellerId`

Risk: `High`  
Reason: removing these without coordinated client/schema updates changes response contract and write behavior.

### 2) Backend request aliasing (hard dependency)
- [backend/src/controllers/ad/adMutationController.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/controllers/ad/adMutationController.ts:41)
  - create path resolves `sellerId || userId || authUserId`
- [backend/src/controllers/ad/adMutationController.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/controllers/ad/adMutationController.ts:89)
  - update path resolves `sellerId || userId || authUserId`
- [backend/src/validators/ad.validator.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/validators/ad.validator.ts:62)
  - query schema accepts `userId`
- [backend/src/validators/ad.validator.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/validators/ad.validator.ts:86)
  - coercion maps `userId -> sellerId`

Risk: `High`  
Reason: old clients and automation can still send `userId`; hard removal becomes a silent breaking API change.

### 3) Shared API schema contract (hard dependency)
- [shared/schemas/ad.schema.ts](/Users/admin/Desktop/EsparexAdmin/shared/schemas/ad.schema.ts:29)
  - canonical `sellerId` exists
- [shared/schemas/ad.schema.ts](/Users/admin/Desktop/EsparexAdmin/shared/schemas/ad.schema.ts:30)
  - `userId` still published as legacy alias
- [shared/schemas/ad.schema.ts](/Users/admin/Desktop/EsparexAdmin/shared/schemas/ad.schema.ts:31)
  - `ownerId` also present as future key

Risk: `High`  
Reason: three ownership keys in one contract causes transition ambiguity and consumer drift.

### 4) Frontend compatibility consumers (hard dependency)
- [frontend/src/lib/api/user/listings/normalizer.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/lib/api/user/listings/normalizer.ts:142)
  - still reads `record.userId`
- [frontend/src/lib/api/user/listings/normalizer.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/lib/api/user/listings/normalizer.ts:221)
  - fallback sets listing `userId` from `record.userId ?? record.sellerId`
- [frontend/tests/listing-chat-smoke.spec.ts](/Users/admin/Desktop/EsparexAdmin/frontend/tests/listing-chat-smoke.spec.ts:59)
  - test logic still tolerates `item.userId` fallback

Risk: `Medium`  
Reason: frontend mostly uses `sellerId` for ownership, but still propagates `userId` compatibility in normalization/testing.

### 5) Ops/script blocker (immediate break)
- [backend/src/scripts/ops/commands/catalogPromotionE2eTest.command.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/scripts/ops/commands/catalogPromotionE2eTest.command.ts:139)
  - creates `Ad` with `userId` field, not `sellerId`

Risk: `High`  
Reason: once alias is removed, this script will fail compile/runtime depending on sequence.

### 6) Ownership abstraction status
- [frontend/src/lib/logic/ownership.ts](/Users/admin/Desktop/EsparexAdmin/frontend/src/lib/logic/ownership.ts:33)
  - ownership checks are already canonical (`sellerId`)
- [backend/src/utils/controllerUtils.ts](/Users/admin/Desktop/EsparexAdmin/backend/src/utils/controllerUtils.ts:32)
  - backend ownership checks use `sellerId`

Risk: `Low`  
Reason: core ownership policy itself is already on canonical key.

## Why Direct Removal Is Unsafe Right Now
1. API accepts and emits `userId` aliases in multiple places.
2. Shared schema still advertises `userId` and `ownerId`, so consumers are encouraged to keep using aliases.
3. At least one operational script still writes `Ad.userId`.
4. Frontend normalizer still mutates payload into a `userId`-present shape.

## Dedicated Migration Strategy (No-Drama, SSOT-Preserving)

### Phase 0 — Instrumentation and policy freeze
- Add deprecation telemetry where request query/body contains `userId` for ad endpoints.
- Add one warning logger in ad mutation/query entrypoints when legacy alias is used.
- Keep behavior unchanged in this phase.

Exit criteria:
- 7-14 days of usage data for `userId` alias frequency.

### Phase 1 — Consumer canonicalization first
- Update frontend listing normalizer to stop writing `record.userId` and fallback output `userId`.
- Keep `sellerId` only in normalized listing shape.
- Update smoke tests and any UI usage relying on `item.userId` fallback.

Exit criteria:
- Frontend type-check and listing tests pass with `sellerId`-only expectation.

### Phase 2 — Writer path canonicalization
- Update backend ops script to write `sellerId` (not `userId`) in ad creation payload.
- Ensure any ad creation helpers in scripts/tools use canonical ownership field.

Exit criteria:
- Ops command test path runs with canonical field only.

### Phase 3 — Request alias deprecation gate
- In ad validators/controllers:
  - keep temporary backward compatibility, but return explicit deprecation metadata if `userId` is sent.
  - optionally reject `userId` in write payloads first, keep read-query fallback temporarily if required.
- Announce removal date in changelog/release notes.

Exit criteria:
- No production usage of `userId` request alias over defined observation window.

### Phase 4 — Remove response aliasing from model
- Remove `json.userId = json.sellerId` from `Ad` `toJSON`.
- Remove `AdSchema.virtual('userId')`.
- Remove `userId?: Types.ObjectId` from `IAd`.

Exit criteria:
- Backend tests and integration clients pass without `userId` in ad payloads.

### Phase 5 — Contract cleanup
- Remove `userId` from [shared/schemas/ad.schema.ts](/Users/admin/Desktop/EsparexAdmin/shared/schemas/ad.schema.ts:30).
- Decide `ownerId` policy:
  - either remove now for strict SSOT, or
  - keep with explicit migration RFC and target date.

Exit criteria:
- Single ownership key documented and enforced (`sellerId`).

## Test Matrix Required Before Alias Removal

### Backend
- create ad accepts canonical `sellerId` path and no `userId` dependency
- update ad ownership and visibility paths remain intact
- ad query filters still work with `sellerId` only
- catalog promotion ops script passes with canonical field

### Frontend
- listing normalization produces stable model with `sellerId` only
- listing detail ownership checks remain true for owner and false for non-owner
- chat/listing smoke tests run without `item.userId` fallback

### Contract
- shared schema parse succeeds for canonical ad payloads
- no generated payload includes `userId` for ads

## Risk Register
- `High`: backend model alias removal without schema/client coordination
- `High`: request alias hard-cut without telemetry window
- `High`: unpatched ops script writing `userId`
- `Medium`: frontend normalizer still populating `userId`
- `Medium`: unresolved `ownerId` contract ambiguity in shared schema

## Recommended PR Slicing
1. PR-A: telemetry + deprecation warnings (no behavior change)
2. PR-B: frontend normalization/test cleanup (`sellerId` only)
3. PR-C: script and tooling writer cleanup (`sellerId` only)
4. PR-D: remove request alias acceptance (`userId`)
5. PR-E: remove model alias + shared schema legacy field

## Hard Stop Rule
- Do not push direct `Ad.userId` alias removal from dirty local `main`.
- Execute through isolated PR slices above, with green checks per slice.
