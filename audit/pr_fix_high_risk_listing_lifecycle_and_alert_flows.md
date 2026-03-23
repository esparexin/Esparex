# PR Draft

## Title

Fix high-risk listing lifecycle and smart alert moderation flows

## Base / Head

- Head: `fix-high-risk-remediations-clean`
- Commits:
  - `5d1cb29` Fix high-risk listing lifecycle and alert flows
  - `e0ba2a5` Fix moderation serializer extend action typing
- Recommended base: `origin/main`

## Description

```md
## Summary

This PR closes the high-risk audit findings around listing lifecycle mutations, smart alert semantics, and admin moderation contract drift.

It fixes status-transition bypasses, aligns unified listing edit behavior with the canonical `AdService` policy, restores dropped service location updates, splits smart-alert toggle vs delete semantics, removes legacy moderation aliases from the shared admin route contract, and refreshes the endpoint-action audit matrices to match the final code.

## What Changed

- Fixed service location edits not persisting in `serviceMutationController`
- Routed admin listing extend (`expired -> live`) through `mutateStatus` with moderation metadata instead of direct status patching
- Changed `DELETE /api/v1/smart-alerts/:id` to true delete semantics
- Added dedicated `PATCH /api/v1/smart-alerts/:id/toggle-status` for activation/deactivation
- Updated frontend smart-alert API usage to call the new toggle endpoint
- Aligned `/api/v1/listings/:id/edit` with canonical `AdService.updateAd` lifecycle rules
- Removed legacy `/ads*`, `/services*`, and `/spare-part-listings*` moderation aliases from the shared admin route contract
- Updated audit exports:
  - `audit/esparex_endpoint_action_matrix.csv`
  - `audit/esparex_endpoint_action_matrix_canonical.csv`
- Fixed admin-frontend plan form schema typing
- Updated stale admin regression guard scripts to validate the current canonical moderation/settings file layout

## Validation

- `npm run type-check`
- `npm run contract:api`
- `npm run ci:admin-guardrails`

All passed locally.

## Risk / Notes

- Smart alert delete and toggle are now explicitly separated, so any consumers must use:
  - `DELETE /api/v1/smart-alerts/:id` for removal
  - `PATCH /api/v1/smart-alerts/:id/toggle-status` for activation/deactivation
- The audit matrices were updated to reflect corrected endpoint semantics and deduplicated endpoint-action rows.
```

## Push / PR Commands

```bash
git push -u origin fix-high-risk-remediations-clean
```
