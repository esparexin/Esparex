/**
 * Ad Engagement Service
 * Handles ad views, engagement metrics, and buyer interactions
 *
 * Extracted from adService.ts for better separation of concerns
 */

import mongoose from 'mongoose';
import Ad, { type IAd } from '../models/Ad';
import logger from '../utils/logger';
import { touchLocationAnalytics } from './location/LocationAnalyticsService';
import { recordAdAnalyticsEvent } from './TrendingService';
import { AD_STATUS } from '../../../shared/enums/adStatus';

// ─────────────────────────────────────────────────
// VIEW TRACKING
// ─────────────────────────────────────────────────

export const incrementAdView = async (
    adId: string | mongoose.Types.ObjectId,
    viewerIp?: string
): Promise<number | null> => {
    void viewerIp;
    if (!mongoose.Types.ObjectId.isValid(String(adId))) {
        return null;
    }

    const id = new mongoose.Types.ObjectId(String(adId));

    try {
        const result = await Ad.findByIdAndUpdate(
            id,
            { $inc: { 'views.total': 1 } },
            { new: true }
        );

        if (!result) {
            return null;
        }

        const locationId = result.location?.locationId?.toString?.();
        if (locationId) {
            void touchLocationAnalytics(locationId, 'ad_view', 1).catch((error) => {
                logger.warn('Failed to update location analytics for ad_view', {
                    adId: String(id),
                    locationId,
                    error: error instanceof Error ? error.message : String(error)
                });
            });
        }

        void recordAdAnalyticsEvent(id, 'view');

        return result.views?.total || 0;
    } catch (error) {
        logger.error('Failed to increment ad view', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return null;
    }
};

/**
 * Higher-order increment by a generic filter (e.g. slug).
 */
export const incrementAdViewByFilter = async (filter: Record<string, unknown>) =>
    Ad.findOneAndUpdate(filter, { $inc: { 'views.total': 1 } });


// ─────────────────────────────────────────────────

// ─────────────────────────────────────────────────
// ENGAGEMENT METRICS (Aggregate statistics)
// ─────────────────────────────────────────────────

export const getAdEngagementMetrics = async (
    adId: string | mongoose.Types.ObjectId
): Promise<{
    views: number;
    inquiries?: number;
    shares?: number;
} | null> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return null;
    }

    const id = new mongoose.Types.ObjectId(adId);

    try {
        const ad = await Ad.findById(id)
            .select('views')
            .lean();

        if (!ad) {
            return null;
        }

        return {
            views: ad.views?.total || 0,
            inquiries: 0, // Placeholder for future implementation
            shares: 0 // Placeholder for future implementation
        };
    } catch (error) {
        logger.error('Failed to get engagement metrics', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return null;
    }
};

// ─────────────────────────────────────────────────
// TRAFFIC ANALYTICS (Per seller or per category)
// ─────────────────────────────────────────────────

export const getSellerAdStats = async (
    sellerId: string
): Promise<{
    totalViews: number;
    activeAds: number;
    avgViewsPerAd: number;
} | null> => {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        return null;
    }

    const id = new mongoose.Types.ObjectId(sellerId);

    try {
        type AdStatsEntry = Pick<IAd, 'views' | 'status'>;

        const ads = await Ad.find({ sellerId: id, isDeleted: { $ne: true } })
            .select('views status')
            .lean<AdStatsEntry[]>();

        const totalViews = ads.reduce((sum, ad) => sum + (ad.views?.total || 0), 0);

        const activeAds = ads.filter(ad => ad.status === AD_STATUS.LIVE).length;

        return {
            totalViews,
            activeAds,
            avgViewsPerAd: activeAds > 0 ? Math.round(totalViews / activeAds) : 0
        };
    } catch (error) {
        logger.error('Failed to get seller ad stats', {
            error: error instanceof Error ? error.message : String(error),
            sellerId
        });
        return null;
    }
};
