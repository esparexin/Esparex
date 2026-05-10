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
        // Fetch listingType so StatusMutationService resolves the correct lifecycle domain
        // (ad vs service vs spare_part_listing) for transition validation.
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status listingType' });
        if (!listing) return;

        const updatedListing = await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: LISTING_STATUS.DEACTIVATED,
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
            },
            reason: 'Deactivated by owner',
            metadata: {
                action: 'listing_deactivate',
                sourceRoute: '/api/v1/listings/:id/deactivate',
                listingType: listing.listingType,
            },
        });

        return sendSuccessResponse(res, updatedListing, 'Listing deactivated');
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/listings/:id/activate
 * Reactivate a deactivated listing: DEACTIVATED → PENDING (back into moderation queue).
 * Using PENDING (not LIVE) so the listing goes back through moderation review,
 * preventing bypassed-moderation re-listings.
 */
export const activateListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status listingType' });
        if (!listing) return;

        if (listing.status !== LISTING_STATUS.DEACTIVATED) {
            return sendErrorResponse(req, res, 400, 'Only deactivated listings can be reactivated');
        }

        const updatedListing = await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: LISTING_STATUS.PENDING,
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
            },
            reason: 'Reactivated by owner',
            metadata: {
                action: 'listing_activate',
                sourceRoute: '/api/v1/listings/:id/activate',
                listingType: listing.listingType,
            },
            patch: {
                moderationStatus: 'held_for_review',
                $push: {
                    timeline: {
                        status: LISTING_STATUS.PENDING,
                        timestamp: new Date(),
                        reason: 'Reactivated by owner — pending re-review',
                    },
                },
            },
        });

        return sendSuccessResponse(res, updatedListing, 'Listing reactivated and pending review');
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
        // Fetch listingType so the lifecycle domain resolves correctly across all listing types
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status listingType' });
        if (!listing) return;

        // Use DELETED status so the LifecycleGuard transition map correctly validates
        // the terminal transition. isDeleted:true drives the soft-delete query filter.
        await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: LISTING_STATUS.DELETED,
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
            },
            reason: 'Listing soft deleted by owner',
            metadata: {
                action: 'soft_delete',
                sourceRoute: '/api/v1/listings/:id',
                listingType: listing.listingType,
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

        if (listing.status !== 'expired' && listing.status !== 'rejected') {
            return sendErrorResponse(req, res, 400, 'Only expired or rejected listings can be reposted');
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
 * Retrospective sold marker for expired listings.
 * Routes through StatusMutationService to guarantee audit trail + cache invalidation.
 */
export const markListingStatusSold = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status listingType isSold' });
        if (!listing) return;

        if (listing.status !== LISTING_STATUS.EXPIRED) {
            return sendErrorResponse(req, res, 400, 'Only expired listings can be retrospectively marked as sold via this endpoint');
        }

        if (listing.isSold === true) {
            return sendErrorResponse(req, res, 400, 'Listing is already marked as sold');
        }

        const soldReason = (req.body as { soldReason?: string })?.soldReason;

        // Route through StatusMutationService for a full audit trail, timeline entry,
        // StatusHistory record, and automatic cache invalidation.
        const updatedListing = await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: LISTING_STATUS.SOLD,
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
            },
            reason: soldReason || 'Retrospectively marked as sold by owner (expired)',
            metadata: {
                action: 'listing_mark_sold_expired',
                sourceRoute: '/api/v1/listings/:id/mark-sold',
                listingType: listing.listingType,
            },
            patch: {
                isSold: true,
                soldAt: new Date(),
                soldReason,
                isChatLocked: true,
                $push: {
                    timeline: {
                        status: LISTING_STATUS.SOLD,
                        timestamp: new Date(),
                        reason: soldReason || 'Retrospectively marked as sold by owner (expired)',
                    },
                },
            },
        });

        return sendSuccessResponse(res, updatedListing, 'Listing marked as sold successfully');
    } catch (error) {
        next(error);
    }
};
