# Device Taxonomy Production Readiness Checklist

Checklist date: May 12, 2026

## 1. Migration State
- [ ] `npm run migrate:status -w @esparex/backend-user`
- [ ] Confirm zero `PENDING` rows.

## 2. Backup Before Deployment
- [ ] `npm run backup -w @esparex/backend-user -- --db=user`
- [ ] `npm run verify-backup -w @esparex/backend-user -- --file=<ABSOLUTE_BACKUP_PATH.gz>`

## 3. Deploy + Migrate
- [ ] Deploy backend build.
- [ ] `npm run migrate:up -w @esparex/backend-user`
- [ ] Re-run `migrate:status` and confirm zero pending rows.

## 4. Runtime Contract Checks
- [ ] Verify taxonomy admin routes resolve under `/api/v1/admin/catalog/*`.
- [ ] Verify public taxonomy endpoints only return approved+active records.

## 5. Test Gates
- [ ] `npm run test -w @esparex/core -- --runInBand`
- [ ] `npm run build -w @esparex/backend-user`
- [ ] `npm run test -w @esparex/backend-user -- --runInBand`
- [ ] `npm run test -w @esparex/apps-web -- --run`
- [ ] `npm run type-check -w @esparex/apps-web`
- [ ] `npm run type-check -w @esparex/apps-admin`
- [ ] `npm run test:moderation-regression -w @esparex/apps-admin`
- [ ] `npm run test:settings-regression -w @esparex/apps-admin`
- [ ] `npm run contract:api`

## 6. Duplication Guard
- [ ] Run taxonomy-targeted jscpd scan and confirm `Found 0 clones`.

## 7. Rollback Procedure
1. Put write operations in maintenance mode.
2. Verify backup archive exists and passes `verify-backup`.
3. Dry run restore:
   - `npm run restore -w @esparex/backend-user -- --file=<ABSOLUTE_BACKUP_PATH.gz> --db=user --dry-run`
4. If rollback required, run restore without `--dry-run`.
5. Re-run smoke checks and API contracts.
