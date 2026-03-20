# Esparex Ops Platform Convergence

## Canonical Direction

- Domain logic SSOT: `backend/src/services/**/*.ts`
- Migration SSOT: `backend/migrations/*.js` (migrate-mongo tracked)
- Operational command SSOT: `backend/src/scripts/ops/*.ts`
- Legacy JavaScript script debt is tracked in:
  `scripts/policy/legacy-js-risk-allowlist.json`

## Canonical Ops Entry Point

From `backend/`:

```bash
npm run ops -- geo-repair --dry-run
npm run ops -- geo-repair --apply --yes

npm run ops -- report-unify-backfill --dry-run
npm run ops -- report-unify-backfill --apply --yes

npm run ops -- report-orphan-remediate --dry-run
npm run ops -- report-orphan-remediate --apply --yes
```

## Execution Safety Contract

- Dry-run is default.
- Apply mode requires explicit `--apply`.
- High blast radius commands require `--yes`.
- Every run writes a structured artifact to:
  `backend/logs/ops/*.json`

## Deprecation Notes

- Legacy wrappers remain in `backend/scripts` for backward compatibility:
  - `migrate_user_geo.js`
  - `migrate_reports_unify.js`
  - `remediate_orphan_reports.js`
- These wrappers forward to the TypeScript ops CLI.
- Net-new data mutation JS scripts are blocked by
  `scripts/guard-platform-governance.js`.

