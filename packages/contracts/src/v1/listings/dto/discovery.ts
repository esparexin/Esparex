import type { Ad } from '../schema/ad.schema';

/**
 * Phase 3a (§5) — canonical listing-discovery DTOs.
 *
 * Relocated from `apps/web/src/lib/api/user/listings/listingDiscoveryAPI.ts`
 * (`HomeAdsPayload:49`, `TrendingAdsPayload:72`) and
 * `apps/web/src/lib/api/user/listings/userListingsAPI.ts:39`
 * (`ListingStatsResponse`), plus `HomeFeedCursor` / `HomeFeedRequest` from
 * `core/src/domains/discovery/application/services/feed/FeedCursorService.ts:10`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3 — unique
 * API payloads with no contract home).
 *
 * Note: the web discovery client extends `HomeAdsPayload` locally with
 * fetch-state fields (`isFallback`, `aborted`) and the normalized
 * `UserListing[]` item type — that extension is a client view derived from
 * this canonical wire shape, not a shadow contract.
 */
export interface HomeAdsPayload {
    ads: Ad[];
    nextCursor: {
        createdAt: string;
        id: string;
    } | null;
    hasMore: boolean;
}

export interface TrendingAdsPayload {
    ads: Ad[];
}

export type ListingStatsResponse = Record<string, Record<string, number>>;

export interface HomeFeedCursor {
    createdAt: string;
    id: string;
}

export type HomeFeedLevel = 'country' | 'state' | 'district' | 'city' | 'area' | 'village';

export interface HomeFeedRequest {
    cursor?: string | Partial<HomeFeedCursor>;
    limit?: number;
    location?: string;
    locationId?: string;
    level?: HomeFeedLevel;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    categoryId?: string;
    listingType?: string;
}
