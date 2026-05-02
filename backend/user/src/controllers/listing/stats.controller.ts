import { Request, Response } from 'express';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { sendSuccessResponse } from "@core/utils/respond";
import logger from '@core/utils/logger';
import { LISTING_TYPE } from "@core/constants/enums/listingType";
import * as AdAggregationService from '@core/services/ad/AdAggregationService';
import * as AdMetricsService from '@core/services/ad/AdMetricsService';
import { getAndVerifyOwnedListing } from "@core/utils/controllerUtils";
import type { AuthUser } from '../../types/auth.types';

/**
 * GET /api/v1/listings/mine/stats
 */
export const getMyListingStats = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)?._id?.toString();
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
        const userId = (req.user as any)?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const { type, status, page = 1, limit = 20 } = req.query;
        const { getStatusMatchCriteria } = await import('@core/utils/statusQueryMapper');

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
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'views' });
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
