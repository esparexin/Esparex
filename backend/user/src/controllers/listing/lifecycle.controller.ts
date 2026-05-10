import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from "@esparex/core/utils/errorResponse";
import { sendSuccessResponse } from "@esparex/core/utils/respond";
import { getSingleParam } from '@esparex/core/utils/requestParams';
import { LISTING_STATUS } from "@shared/enums/listingStatus";
import { ACTOR_TYPE } from "@shared/enums/actor";
import { mutateStatus } from '@esparex/core/services/StatusMutationService';
import { getAndVerifyOwnedListing } from "@esparex/core/utils/controllerUtils";
import * as AdMutationService from '@esparex/core/services/AdMutationService';
import { PromotionPolicyService } from '@esparex/core/services/PromotionPolicyService';
import type { AuthUser } from '../../types/auth.types';

/**
 * PATCH /api/v1/listings/:id/sold
 * Terminal state transition: LIVE -> SOLD
 */
export const markListingSold = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const listing = await getAndVerifyOwnedListing(req, res);
        if (!listing) return;

        if (listing.status !== LISTING_STATUS.LIVE) {
            return sendErrorResponse(req, res, 400, 'Only live listings can be marked as sold');
        }

        const soldReason = (req.body as { soldReason?: 'sold_on_platform' | 'sold_outside' | 'no_longer_available' })?.soldReason;

        const updatedListing = await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: LISTING_STATUS.SOLD,
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
            },
            reason: soldReason || 'Marked as sold by owner',
            metadata: {
                action: 'listing_mark_sold',
                sourceRoute: '/api/v1/listings/:id/sold',
            },
            patch: {
                soldAt: new Date(),
                soldReason,
                isChatLocked: true,
                isSpotlight: false,
                $push: {
                    timeline: {
                        status: LISTING_STATUS.SOLD,
                        timestamp: new Date(),
                        reason: soldReason || 'Marked as sold by owner',
                    },
                },
            },
        });

        return sendSuccessResponse(res, updatedListing, 'Listing marked as sold');
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/listings/:id/deactivate
 */
export const deactivateListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status' });
        if (!listing) return;

        const updatedListing = await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: 'deactivated',
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
            },
            reason: 'Deactivated by owner',
            metadata: {
                action: 'listing_deactivate',
                sourceRoute: '/api/v1/listings/:id/deactivate',
            },
        });

        return sendSuccessResponse(res, updatedListing, 'Listing deactivated');
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/listings/:id
 */
export const deleteListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const listing = await getAndVerifyOwnedListing(req, res);
        if (!listing) return;

        await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: 'deactivated',
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
            },
            reason: 'Listing soft deleted by owner',
            metadata: {
                action: 'soft_delete',
                sourceRoute: '/api/v1/listings/:id',
            },
            patch: {
                isDeleted: true,
                deletedAt: new Date(),
                isSpotlight: false,
                isChatLocked: true,
            },
        });

        res.status(204).end();
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/listings/:id/repost
 */
export const repostListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;
        const userId = (req.user as AuthUser)._id.toString();

        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status' });
        if (!listing) return;

        if (listing.status === 'expired' || listing.status === 'rejected') {
            return sendErrorResponse(req, res, 400, 'Expired or rejected listings are strictly read-only and cannot be renewed or reposted');
        }

        const reposted = await AdMutationService.repostAd(id, userId);
        if (!reposted) {
            return sendErrorResponse(req, res, 404, 'Listing not found');
        }

        return sendSuccessResponse(res, reposted, 'Listing reposted successfully');
    } catch (error) {
        const knownError = error as { statusCode?: number, message?: string, code?: string };
        if (typeof knownError.statusCode === 'number') {
            return sendErrorResponse(
                req, res, knownError.statusCode,
                knownError.message || 'Unable to repost listing',
                { code: knownError.code }
            );
        }
        next(error);
    }
};

/**
 * POST /api/v1/listings/:id/promote
 * Promotion entry point
 */
export const promoteListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status listingType' });
        if (!listing) return;

        const policyResult = PromotionPolicyService.canPromote({
            listingType: listing.listingType || 'ad',
            status: listing.status
        });

        if (!policyResult.allowed) {
            return sendErrorResponse(
                req, res, 403,
                policyResult.reason || `Listings of type ${listing.listingType} cannot be promoted.`,
                { code: policyResult.code || 'PROMOTION_POLICY_REJECTED' }
            );
        }

        if (listing.status !== LISTING_STATUS.LIVE) {
            return sendErrorResponse(req, res, 400, 'Only live listings can be promoted');
        }

        return sendSuccessResponse(res, { listingId: listing._id.toString(), currentStatus: listing.status, listingType: listing.listingType }, 'Proceed to promotion checkout');
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/listings/:id/mark-sold
 * Mark as sold only when status = "expired" and isSold = false
 */
export const markListingStatusSold = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const listing = await getAndVerifyOwnedListing(req, res);
        if (!listing) return;

        if (listing.status !== 'expired') {
            return sendErrorResponse(req, res, 400, 'Listing must be expired to be marked as sold under this endpoint');
        }

        if (listing.isSold === true) {
            return sendErrorResponse(req, res, 400, 'Listing is already marked as sold');
        }

        listing.isSold = true;
        listing.soldAt = new Date();
        
        await listing.save();

        return sendSuccessResponse(res, listing, 'Listing marked as sold successfully');
    } catch (error) {
        next(error);
    }
};
