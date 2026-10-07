import type { Ad } from '../../listings/schema/ad.schema';

/**
 * Phase 3a (§5) — canonical seller-profile DTOs.
 *
 * `SellerPublicUser` was an identical duplicate declared in both
 * `apps/web/src/lib/api/user/users.ts:60` and
 * `core/src/domains/identity/application/users/UserProfileService.ts:16` —
 * now canonicalized here; both files import it.
 *
 * CONFLICT (recorded, not merged — DECISION-GATE §10 forbids silent merges):
 * two same-named local `SellerProfilePayload` declarations with different shapes:
 * - `apps/web/src/lib/api/user/users.ts:73` — client view
 *   { user, listingSummary: SellerListingSummary, ads: Ad[] }
 * - `core/src/domains/identity/application/users/UserProfileService.ts:29` —
 *   service result { user, listingSummary: inline, ads: Array<Record<string, unknown>> }
 * Canonicalized under distinct names below; each local file re-exports its
 * historic name as an alias. A future gate decision may unify them.
 */
export interface SellerPublicUser {
    id: string;
    name?: string;
    profilePhoto?: string;
    createdAt?: string;
    isVerified?: boolean;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
}

export interface SellerListingSummary {
    totalActive: number;
    visibleCount: number;
    hasMore: boolean;
}

export interface SellerProfileResponse {
    user: SellerPublicUser;
    listingSummary: SellerListingSummary;
    ads: Ad[];
}

export interface SellerProfileServiceResult {
    user: SellerPublicUser;
    listingSummary: SellerListingSummary;
    ads: Array<Record<string, unknown>>;
}
