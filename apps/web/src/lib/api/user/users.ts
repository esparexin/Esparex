import { apiClient, EsparexRequestConfig } from '@/lib/api/client';
import { toApiResult } from '@/lib/api/result';
import { API_ROUTES } from '@esparex/shared';
import { type UserListing as Ad, normalizeListing as normalizeAd } from './listings';
import { User } from "@esparex/contracts";
import type {
    SellerPublicUser,
    SellerListingSummary,
    SellerProfileResponse,
} from "@esparex/contracts";
import { toSafeImageSrc } from '@/lib/image/imageUrl';
import { fetchUserApiJson, type ServerFetchOptions } from './server';

// --- Types ---

// --- API Functions ---

/**
 * Get current user profile
 */
export const getMe = async (options?: EsparexRequestConfig): Promise<User | null> => {
    const { data } = await toApiResult<User>(apiClient.get(API_ROUTES.USER.USERS_ME, options));
    if (!data) return null;
    return {
        ...data,
        profilePhoto: toSafeImageSrc(data.profilePhoto, '')
    };
};



// An Ad enriched with the timestamp it was saved by the user
export type SavedAd = Ad & { _savedAt?: string };

/**
 * Get saved ads for the current user.
 * Preserves `_savedAt` from the raw API payload before the listing normalizer
 * discards it (normalizeAd maps to the Zod Ad schema which does not include it).
 */
export const getSavedAds = async (): Promise<SavedAd[]> => {
    const { data: result } = await toApiResult<unknown[]>(apiClient.get(API_ROUTES.USER.USERS_SAVED_ADS));
    if (!Array.isArray(result)) return [];
    return result.map((raw) => {
        const rawRecord = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
        const savedAt = typeof rawRecord._savedAt === 'string' ? rawRecord._savedAt : undefined;
        const normalized: SavedAd = normalizeAd(raw);
        if (savedAt) normalized._savedAt = savedAt;
        return normalized;
    });
};

export type WalletSummary = {
    adCredits: number;
    monthlyFreeAdsUsed: number;
    spotlightCredits: number;
    smartAlertSlots: number;
};

/**
 * Phase 3a (§5): `SellerPublicUser` / `SellerListingSummary` were identical
 * duplicates of the canonical symbols in `@esparex/contracts` — now imported.
 * `SellerProfilePayload` derives from the canonical `SellerProfileResponse`;
 * `ads` keeps the client-normalized `UserListing` item type (the card grid
 * consumes normalized listings), so this is a derived client view, not a
 * shadow contract.
 *
 * CONFLICT (recorded, not merged): this `SellerProfilePayload`
 * (client view, `ads: UserListing[]`) collides by name with the core service's
 * `SellerProfilePayload`
 * (`core/src/domains/identity/application/users/UserProfileService.ts:29`,
 * service result, `ads: Array<Record<string, unknown>>`). The canonical names
 * are `SellerProfileResponse` (this file's historic shape) and
 * `SellerProfileServiceResult` (core's shape). A future gate decision may
 * unify them. Deletion of this shim is Phase 4 (§10).
 */
export type { SellerPublicUser, SellerListingSummary };
export type SellerProfilePayload = Omit<SellerProfileResponse, "ads"> & {
    ads: Ad[];
};

export const getWalletSummary = async (): Promise<WalletSummary | null> => {
    const { data } = await toApiResult<WalletSummary>(apiClient.get(API_ROUTES.USER.USERS_WALLET));
    return data || null;
};

export const getUserProfile = async (
    userId: string | number,
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<SellerProfilePayload | null> => {
    const route = API_ROUTES.USER.USERS_PROFILE(userId);
    const { data } =
        typeof window === 'undefined'
            ? await toApiResult<{ user?: SellerPublicUser; listingSummary?: SellerListingSummary; ads?: unknown[] }>(
                Promise.resolve(fetchUserApiJson(route, options?.fetchOptions, { returnNullOnHttpError: true }))
            )
            : await toApiResult<{ user?: SellerPublicUser; listingSummary?: SellerListingSummary; ads?: unknown[] }>(
                apiClient.get(route, { silent: true })
            );

    if (!data || typeof data !== 'object') {
        return null;
    }

    const user = data.user;
    if (!user || typeof user !== 'object' || typeof user.id !== 'string') {
        return null;
    }

    const normalizedUser: SellerPublicUser = {
        ...user,
        profilePhoto: toSafeImageSrc(user.profilePhoto, '')
    };

    const listingSummary: SellerListingSummary = data.listingSummary || {
        totalActive: 0,
        visibleCount: 0,
        hasMore: false,
    };

    const ads = Array.isArray(data.ads) ? data.ads.map(normalizeAd) : [];

    return {
        user: normalizedUser,
        listingSummary,
        ads
    };
};

/**
 * Update current user profile
 */
export const updateProfile = async (
    userData: (Partial<User> & { notificationSettings?: unknown }) | FormData,
    options?: EsparexRequestConfig
): Promise<User | null> => {
    const { data } = await toApiResult<User>(
        apiClient.patch(API_ROUTES.USER.USERS_ME, userData, options)
    );
    if (!data) return null;
    return {
        ...data,
        profilePhoto: toSafeImageSrc(data.profilePhoto, '')
    };
};

/**
 * Save an ad
 */
export const saveAd = async (adId: string | number): Promise<void> => {
    const { error } = await toApiResult<void>(
        apiClient.post(API_ROUTES.USER.USERS_SAVED_ADS, { adId }, { silent: true })
    );
    if (error) throw error;
};

/**
 * Unsave an ad
 */
export const unsaveAd = async (adId: string | number): Promise<void> => {
    const { error } = await toApiResult<void>(
        apiClient.delete(API_ROUTES.USER.USERS_SAVED_AD_DETAIL(String(adId)), { silent: true })
    );
    if (error) throw error;
};
