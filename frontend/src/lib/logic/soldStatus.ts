import logger from "@/lib/logger";

/**
 * Consolidated logic for determining if an Ad is considered "Sold".
 * 
 * Sources of truth (in order of precedence):
 * 1. Backend status in the Ad object (`ad.status === 'sold'`)
 * 2. Local Storage (`esparex_sold_ads` array)
 * 3. Component-level state overrides (passed as optional argument)
 * 
 * @param ad - The ad object to check
 * @param localOverride - Optional boolean to override status (used for instant optimistic UI updates)
 * @returns boolean - True if the ad is sold
 */

export interface CheckSoldParams {
    ad: {
        id?: string | number;
        status?: string;
        soldAt?: string;
        soldPlatform?: string;
    };
    localOverride?: boolean;
}

export const isAdSold = ({ ad, localOverride }: CheckSoldParams): boolean => {
    // 0. Immediate local override (for optimistic UI updates before state/backend sync)
    if (localOverride === true) return true;

    if (!ad) return false;

    // 1. Backend Status
    if (ad.status === 'sold') {
        return true;
    }

    // 2. Local Storage Persistence (for "mark as sold" actions not yet synced to backend but persisted locally)
    if (typeof window !== 'undefined') {
        try {
            const soldAds = JSON.parse(localStorage.getItem("esparex_sold_ads") || "[]") as Array<{ adId?: string | number }>;
            const isLocallySold = soldAds.some((item) =>
                String(item.adId) === String(ad.id)
            );
            if (isLocallySold) return true;
        } catch (e) {
            logger.warn("Failed to value parse esparex_sold_ads from localStorage", e);
        }
    }

    return false;
};

/**
 * Returns metadata about the sale if available.
 */
export const getSoldDetails = (ad: CheckSoldParams["ad"]) => {
    if (!ad) return null;

    // Prefer backend data (hypothetical)
    if (ad.soldAt) {
        return {
            soldPlatform: ad.soldPlatform || 'Unknown',
            soldAt: ad.soldAt
        };
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
        try {
            const soldAds = JSON.parse(localStorage.getItem("esparex_sold_ads") || "[]") as Array<{ adId?: string | number; soldAt?: string; soldPlatform?: string }>;
            const localDetail = soldAds.find((item) =>
                String(item.adId) === String(ad.id)
            );
            if (localDetail) {
                return {
                    soldPlatform: localDetail.soldPlatform,
                    soldAt: localDetail.soldAt
                };
            }
        } catch { }
    }

    return null;
};
