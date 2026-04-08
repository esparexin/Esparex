Manual-only scripts are quarantined here.

Execution policy:
- These scripts are not part of normal build/test/dev workflows.
- To execute any script in this folder, set `ALLOW_MANUAL_SCRIPT=true`.
- Run only with explicit operator intent and scoped runtime environment.

Example:
`ALLOW_MANUAL_SCRIPT=true node scripts/manual-only/test_payment_flow.js`

Production smoke check:
`ALLOW_MANUAL_SCRIPT=true bash scripts/manual-only/prod-smoke-check.sh`

Additional manual checks:
`ALLOW_MANUAL_SCRIPT=true bash scripts/manual-only/health-check.sh`
`ALLOW_MANUAL_SCRIPT=true bash scripts/manual-only/verify-admin-routes.sh`
`ALLOW_MANUAL_SCRIPT=true bash scripts/manual-only/pre-deployment-verification.sh`
