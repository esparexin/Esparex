import { apiClient, EsparexRequestConfig } from '@/lib/api/client';
import { toApiResult } from '@/lib/api/result';
import { API_ROUTES } from '../routes';
import { type Listing as Ad, normalizeListing as normalizeAd } from './listings';
import { User } from "@/types/User";
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

export type SellerListingSummary = {
    totalActive: number;
    visibleCount: number;
    hasMore: boolean;
};

export type SellerPublicUser = {
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
};

export type SellerProfilePayload = {
    user: SellerPublicUser;
    listingSummary: SellerListingSummary;
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
