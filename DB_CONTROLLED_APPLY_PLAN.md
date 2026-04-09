# DB Controlled Apply Plan (With Checkpoints)

Date: 2026-04-09  
Mode: controlled apply, idempotent scripts only, explicit checkpoint after each step.

## Baseline From Dry-Run (Current)

- `report-unify-backfill`: `plannedOps=11`, `unresolved=0`
- `report-orphan-remediate`: no actions
- `location-status-backfill`: no actions
- `remediate_listing_type_drift`: `wouldUpdate=3`
- `remediate_moderation_status_enum`: `wouldUpdate=0`
- `remediate_feed_visibility_integrity`: `liveButDeleted=2`
- `lifecycle-integrity-sweep`: `liveMissingHistory=3`
- `ad-listingtype-backfill`: no actions

## Change Window Preconditions

1. Enable maintenance/read-only admin window if possible.
2. Create backup:
   - `npm run backup -w backend`
3. Confirm DB connectivity and health:
   - `npm run ops -w backend -- location-coverage-audit`
4. Re-run dry-runs immediately before apply to ensure counts are unchanged.

Stop rule: if dry-run counts drift upward unexpectedly, stop and re-audit before write operations.

## Apply Order (Low Risk to Higher Risk)

### Phase 1: Report Field Normalization

Apply:
- `npm run ops -w backend -- report-unify-backfill --apply`

Checkpoint (must pass):
- Re-run: `npm run ops -w backend -- report-unify-backfill --dry-run`
- Expectation: `plannedOps=0`, `unresolved.targetType=0`, `unresolved.targetId=0`, `unresolved.reporterId=0`

### Phase 2: Feed Visibility Integrity

Apply:
- `node -r ts-node/register/transpile-only -r tsconfig-paths/register src/scripts/migrations/remediate_feed_visibility_integrity.ts --apply` (run from `backend`)

Checkpoint (must pass):
- Re-run dry-run command with `--dry-run`
- Expectation: `liveButDeleted=0`, `spotlightOnNonLive=0`, `boostedOnNonLive=0`, `feedVisibilityMismatch=0`

### Phase 3: Listing Type Drift

Apply:
- `node -r ts-node/register/transpile-only -r tsconfig-paths/register src/scripts/migrations/remediate_listing_type_drift.ts --apply` (run from `backend`)

Checkpoint (must pass):
- Re-run dry-run command with `--dry-run`
- Expectation: `wouldUpdate=0`

### Phase 4: Lifecycle Integrity History

Apply:
- `npm run migrate:lifecycle-integrity-sweep -w backend -- --apply`

Checkpoint (must pass):
- Re-run dry-run: `npm run migrate:lifecycle-integrity-sweep -w backend -- --dry-run`
- Expectation: `liveMissingHistory=0`, `liveMissingApprovedAt=0`, `invalidExpiryChronology=0`, `spotlightOnExpired=0`

### Phase 5: Optional Location/Report Finalizers

Apply only if corresponding dry-run shows pending work:
- `npm run ops -w backend -- location-status-backfill --apply`
- `npm run ops -w backend -- report-orphan-remediate --apply`

Checkpoint:
- Re-run each in `--dry-run`; expect no pending actions.

## Duplicate Rollout Gate (Do Not Force)

Current strict gate check fails because rollout artifacts are missing:
- `ENABLE_STRICT_DUPLICATE_INDEX=true node -r dotenv/config scripts/check-duplicate-rollout-readiness.js dotenv_config_path=.env`

Required before enabling strict duplicate index mode:
1. Backfill migration report document exists for migration tag.
2. `strictIndexCreated=true`
3. `strictIndexExists=true`
4. unresolved conflicts `0`

## Post-Apply Verification Pack

1. Integrity scans:
   - `npm run scan:master-data-integrity -w backend`
   - `npm run ops -w backend -- location-coverage-audit`
2. API smoke:
   - health route
   - admin login flow (`/api/v1/admin/login` then `/api/v1/admin/me`)
3. Observability:
   - watch for new `SLOW_QUERY` spikes
   - watch auth `401` error rate for `/api/v1/admin/me`

## Rollback Decision Points

Rollback immediately if any phase fails checkpoint with regression in core auth/data paths.

Rollback actions:
1. Stop writes (maintenance mode ON).
2. Restore from backup:
   - `npm run restore -w backend`
3. Re-run preflight dry-runs to verify restored state.

