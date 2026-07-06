import { AdAggregationService_NS as AdAggregationService } from '@esparex/core/services';;
import { AdMetricsService_NS as AdMetricsService } from '@esparex/core/services';;

import { Request, Response } from 'express';
import { sendErrorResponse } from '@esparex/core/utils';;;;
import { sendSuccessResponse } from '@esparex/core/utils';;;;
import { logger } from '@esparex/core/utils';;;;
import { LISTING_TYPE } from '@esparex/shared';

/**
 * GET /api/v1/listings/mine/stats
 */
export const getMyListingStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const counts = await AdMetricsService.getSellerListingStats(userId);
        return sendSuccessResponse(res, counts);
    } catch (error) {
        logger.error('Failed to fetch listing stats', { error });
        return sendErrorResponse(req, res, 500, 'Failed to fetch listing stats');
    }
};

/**
 * GET /api/v1/listings/mine
 */
export const getMyListings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const { type, status, page = 1, limit = 20 } = req.query;
        const { getStatusMatchCriteria } = await import('@esparex/core/utils');

        const query: Record<string, unknown> = {
            sellerId: userId,
            isDeleted: { $ne: true },
        };

        if (type && Object.values(LISTING_TYPE as Record<string, string>).includes(type as string)) {
            if (type === LISTING_TYPE.AD || type === 'ad') {
                query.$or = [
                    { listingType: LISTING_TYPE.AD },
                    { listingType: { $exists: false } },
                    { listingType: null }
                ];
            } else {
                query.listingType = type;
            }
        }

        if (status) {
            query.status = getStatusMatchCriteria(status as string);
        }

        const { items, total } = await AdAggregationService.getOwnerListings(query, Number(page), Number(limit));

        return sendSuccessResponse(res, {
            items,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                hasMore: total > Number(page) * Number(limit)
            }
        });
    } catch (error) {
        logger.error('Failed to fetch owner listings', { error });
        return sendErrorResponse(req, res, 500, 'Failed to fetch your listings');
    }
};

/**
 * GET /api/v1/listings/:id/analytics
 */
export const getListingAnalytics = async (req: Request, res: Response) => {
    try {
        const listing = req.listing;
        if (!listing) return;

        return sendSuccessResponse(res, {
            id: listing._id,
            views: listing.views
        });
    } catch (error) {
        logger.error('Failed to fetch listing analytics', { error });
        return sendErrorResponse(req, res, 500, 'Failed to fetch listing analytics');
    }
};

/**
 * GET /api/v1/listings/my/status-counts
 */
export const getMyListingStatusCounts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const { listingType } = (req.query || {});
        
        const counts = await AdMetricsService.getListingStatusCountsForSeller(
            userId, 
            listingType ? String(listingType) : undefined
        );

        return sendSuccessResponse(res, counts);
    } catch (error) {
        logger.error('Failed to fetch my status counts', { error });
        return sendErrorResponse(req, res, 500, 'Failed to fetch listing status counts');
    }
};

/**
 * GET /api/v1/listings/my
 */
export const getMyTabListings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const { tab, page = 1, limit = 20 } = req.query;

        const query: Record<string, unknown> = {
            sellerId: userId,
            isDeleted: { $ne: true },
            $or: [
                { deletedAt: { $exists: false } },
                { deletedAt: null }
            ]
        };

        if (tab) {
            const tabStr = String(tab).trim().toLowerCase();
            if (tabStr === 'live' || tabStr === 'active') {
                query.status = { $in: ['active', 'live', 'deactivated'] };
            } else if (tabStr === 'pending') {
                query.status = 'pending';
            } else if (tabStr === 'expired') {
                query.status = { $in: ['expired', 'sold'] };
            } else {
                query.status = { $in: [] };
            }
        }

        const { items, total } = await AdAggregationService.getOwnerListings(
            query,
            Number(page),
            Number(limit)
        );

        return sendSuccessResponse(res, {
            items,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                hasMore: total > Number(page) * Number(limit)
            }
        });
    } catch (error) {
        logger.error('Failed to fetch tab listings', { error });
        return sendErrorResponse(req, res, 500, 'Failed to retrieve listings');
    }
};
