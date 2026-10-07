import type { DeleteAccountReason } from '../schema/userProfile.schema';

/**
 * Phase 3a (§5) — canonical delete-account payload.
 *
 * Relocated from `apps/web/src/components/user/profile/types.ts:83`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3 — unique
 * API payload with no contract home). `DeleteAccountReason` /
 * `DELETE_ACCOUNT_REASONS` already live canonically in
 * `../schema/userProfile.schema` and are imported, not redeclared.
 */
export interface DeleteAccountPayload {
    reason: DeleteAccountReason;
    feedback?: string;
}
