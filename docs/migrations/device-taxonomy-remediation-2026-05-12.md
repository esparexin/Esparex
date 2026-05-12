# Device Taxonomy Remediation Migrations

Execution date: May 12, 2026
Target DB: `esparex_user`

## Applied Migrations
- `20260314120000-add-expiresAt-indexes-to-services-and-spl.js`
- `20260316000000-standardize-index-names.js`
- `20260320090000-normalize-business-status-live.js`
- `20260512000100-create-taxonomy-support-collections-and-indexes.js`
- `20260512000200-backfill-taxonomy-approval-status.js`
- `20260512180000-ensure-taxonomy-support-collections-and-indexes-v2.js`

## Idempotency Hardening
`20260314120000-add-expiresAt-indexes-to-services-and-spl.js` was hardened to:
- Skip creation when equivalent indexes already exist under legacy names.
- Skip missing collections instead of failing migration batches.

Taxonomy index migrations were hardened to:
- Treat equivalent key-pattern indexes as satisfied even when names differ.

## Post-run Verification
- `npm run migrate:status -w @esparex/backend-user` shows no pending entries.
- Required taxonomy collections exist.
- Required taxonomy compound indexes exist.
- Live taxonomy records have `approvalStatus` populated.
