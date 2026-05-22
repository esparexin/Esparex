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
import { LISTING_STATUS } from '@esparex/shared';

// ─────────────────────────────────────────────────
// VIEW TRACKING
// ─────────────────────────────────────────────────

import { ViewBufferingService } from './ViewBufferingService';

export const incrementAdView = async (
    adId: string | mongoose.Types.ObjectId,
    viewerIp?: string
): Promise<void> => {
    void viewerIp;
    if (!mongoose.Types.ObjectId.isValid(String(adId))) {
        return;
    }

    const id = new mongoose.Types.ObjectId(String(adId));

    try {
        // 🚀 STAFF+ PRODUCTION HARDENING: Buffered increments
        // Decouples view tracking from DB write latency to prevent contention.
        await ViewBufferingService.recordView(id);

        void touchLocationAnalytics(id.toString(), 'ad_view', 1).catch(() => {});
        void recordAdAnalyticsEvent(id, 'view');
    } catch (error) {
        logger.error('Failed to increment ad view', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
    }
};

/**
 * Higher-order increment by a generic filter (e.g. slug).
 */
export const incrementAdViewByFilter = async (filter: Record<string, unknown>) =>
    Ad.findOneAndUpdate(filter, { $inc: { 'views.total': 1 } });

/**
 * Enterprise view increment with unique tracking support.
 * Updates both total and unique view counters.
 */
export const incrementAdViewWithUniqueness = async (
    filter: Record<string, unknown>,
    isUnique: boolean
): Promise<void> => {
    try {
        const update: Record<string, unknown> = { 
            $inc: { 'views.total': 1 },
            $set: { 'views.lastViewedAt': new Date() }
        };
        
        if (isUnique) {
            (update.$inc as Record<string, number>)['views.unique'] = 1;
        }

        const result = await Ad.findOneAndUpdate(filter, update, { new: true }).select('_id location views').lean();
        
        if (result) {
            const adId = result._id;
            const locationId = result.location?.locationId?.toString?.();
            
            if (locationId) {
                void touchLocationAnalytics(locationId, 'ad_view', 1).catch(() => {});
            }
            
            void recordAdAnalyticsEvent(adId, 'view');
        }
    } catch (error) {
        logger.error('Failed to increment unique ad view', { filter, error });
    }
};


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

        const activeAds = ads.filter(ad => ad.status === LISTING_STATUS.LIVE).length;

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
