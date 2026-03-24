import { apiClient, EsparexRequestConfig } from '@/lib/api/client';
import { toApiResult } from '@/lib/api/result';
import { API_ROUTES, API_V1_BASE_PATH, DEFAULT_LOCAL_API_ORIGIN } from '../routes';
import { type Ad } from '@/schemas';
import { User } from "@/types/User";
import { toSafeImageSrc } from '@/lib/image/imageUrl';
import { normalizeAd } from './ads';

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



/**
 * Get saved ads for the current user
 */
export const getSavedAds = async (): Promise<Ad[]> => {
    const { data: result } = await toApiResult<Ad[]>(apiClient.get(API_ROUTES.USER.USERS_SAVED_ADS));
    return Array.isArray(result) ? result : [];
};

export type WalletSummary = {
    adCredits: number;
    monthlyFreeAdsUsed: number;
    spotlightCredits: number;
    smartAlertSlots: number;
};

export type SellerReputation = {
    score: number;
    adsPosted: number;
    responseRate: number;
    averageResponseTime: number;
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
    reputation: SellerReputation;
    ads: Ad[];
};

type ServerFetchOptions = RequestInit & {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

const USER_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

const buildUserApiUrl = (endpoint: string): string => {
    const base = USER_API_BASE_URL.endsWith('/') ? USER_API_BASE_URL : `${USER_API_BASE_URL}/`;
    return new URL(endpoint.replace(/^\//, ''), base).toString();
};

const fetchUserApiJson = async (
    endpoint: string,
    fetchOptions?: ServerFetchOptions
): Promise<unknown> => {
    const response = await fetch(buildUserApiUrl(endpoint), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...((fetchOptions?.headers as Record<string, string> | undefined) ?? {}),
        },
        ...fetchOptions,
    });

    if (!response.ok) {
        return null;
    }

    return response.json().catch(() => null);
};

export const getWalletSummary = async (): Promise<WalletSummary | null> => {
    const { data } = await toApiResult<WalletSummary>(apiClient.get(API_ROUTES.USER.USERS_WALLET));
    return data || null;
};

export const getUserReputation = async (userId: string | number): Promise<SellerReputation | null> => {
    const { data } = await toApiResult<SellerReputation>(
        apiClient.get(API_ROUTES.USER.USERS_REPUTATION(userId), { silent: true })
    );
    return data || null;
};

export const getUserProfile = async (
    userId: string | number,
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<SellerProfilePayload | null> => {
    const route = API_ROUTES.USER.USERS_PROFILE(userId);
    const { data } =
        typeof window === 'undefined'
            ? await toApiResult<{ user?: SellerPublicUser; reputation?: SellerReputation; ads?: unknown[] }>(
                Promise.resolve(fetchUserApiJson(route, options?.fetchOptions))
            )
            : await toApiResult<{ user?: SellerPublicUser; reputation?: SellerReputation; ads?: unknown[] }>(
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

    const reputation: SellerReputation = data.reputation || {
        score: 0,
        adsPosted: 0,
        responseRate: 0,
        averageResponseTime: 0
    };

    const ads = Array.isArray(data.ads) ? data.ads.map(normalizeAd) : [];

    return {
        user: normalizedUser,
        reputation,
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
    await toApiResult<void>(apiClient.post(API_ROUTES.USER.USERS_SAVED_ADS, { adId }));
};

/**
 * Unsave an ad
 */
export const unsaveAd = async (adId: string | number): Promise<void> => {
    await toApiResult<void>(apiClient.delete(API_ROUTES.USER.USERS_SAVED_AD_DETAIL(String(adId))));
};
