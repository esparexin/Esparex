import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { IAuthUser } from '../types/auth';
import { sendErrorResponse } from '../utils/errorResponse';
import { respond } from '../utils/respond';
import { getSingleParam } from '../utils/requestParams';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { ACTOR_TYPE } from '../../../shared/enums/actor';
import { buildPublicAdFilter } from '../utils/FeedVisibilityGuard';
import * as adService from '../services/AdService';
import { mutateStatus } from '../services/StatusMutationService';

/**
 * Enterprise Listing Controller (SSOT)
 * Centralized logic for all listing types (Ads, Services, Spare Parts)
 */

/**
 * GET /api/v1/listings/:id
 * Unified fetch for listing details
 */
export const getListingDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const idOrSlug = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID or Slug' });
        if (!idOrSlug) return;

        const viewer = req.user as IAuthUser;
        const viewerId = viewer?._id?.toString();
        const isAdmin = viewer?.role === 'admin' || viewer?.role === 'super_admin';

        let adId: string | null = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            adId = idOrSlug;
        }

        if (!adId) {
            // Resolve by slug if needed
            const visibilityFilter = isAdmin ? { isDeleted: { $ne: true } } : buildPublicAdFilter();
            adId = await adService.getAdIdBySlug(idOrSlug, visibilityFilter);
        }

        if (!adId) {
            return sendErrorResponse(req, res, 404, 'Listing not found');
        }

        const ad = await adService.getListingDetailById(adId);

        if (!ad || (ad as { isDeleted?: boolean }).isDeleted) {
            return sendErrorResponse(req, res, 404, 'Listing not found');
        }

        // Visibility Guard
        const sellerNode = (ad as { sellerId?: unknown }).sellerId;
        const sellerId = (
            sellerNode && typeof sellerNode === 'object'
                ? (sellerNode as { _id?: unknown; id?: unknown })._id ?? (sellerNode as { id?: unknown }).id
                : sellerNode
        );
        const isOwner = Boolean(viewerId && sellerId && String(sellerId) === viewerId);
        const adStatus = String((ad as { status?: unknown }).status ?? '');
        if (adStatus !== AD_STATUS.LIVE && !isOwner && !isAdmin) {
            return sendErrorResponse(req, res, 403, 'Listing is not publicly available');
        }

        return res.json(respond({
            success: true,
            data: ad
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/listings/:id/edit
 * Strict owner edit with lifecycle guards
 */
export const editListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const user = req.user as IAuthUser;
        const listing = await Ad.findById(id);

        if (!listing) return sendErrorResponse(req, res, 404, 'Listing not found');
        
        // Ownership Guard
        if (listing.sellerId.toString() !== user._id.toString()) {
            return sendErrorResponse(req, res, 403, 'Unauthorized: You do not own this listing');
        }

        // Lifecycle Guard: Block edit if sold
        if (listing.status === AD_STATUS.SOLD) {
            return sendErrorResponse(req, res, 400, 'Cannot edit a sold listing');
        }

        // Enterprise Rule: No category/brand/model change in edit mode
        const protectedFields = [
            'categoryId',
            'brandId',
            'modelId',
            'listingType',
            'sellerId',
            'status',
            'moderationStatus',
            'approvedAt',
            'approvedBy',
            'isDeleted',
            'deletedAt',
        ];
        protectedFields.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                delete req.body[field];
            }
        });

        // Enterprise Rule: KEEP expiresAt immutable during edit.
        const updatePayload = {
            ...req.body,
            updatedAt: new Date()
        };
        delete updatePayload.expiresAt; // CRITICAL: Never reset monetization expiry on edit

        let updatedListing = await Ad.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }).lean<Record<string, unknown> | null>();

        // Route status transitions through the mutation engine only.
        if (listing.status !== AD_STATUS.PENDING) {
            updatedListing = await mutateStatus({
                domain: 'ad',
                entityId: id,
                toStatus: AD_STATUS.PENDING,
                actor: {
                    type: ACTOR_TYPE.USER,
                    id: user._id.toString(),
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                },
                reason: 'Re-submitted for review after edit',
                metadata: {
                    action: 'listing_edit',
                    sourceRoute: '/api/v1/listings/:id/edit',
                },
                patch: {
                    moderationStatus: 'held_for_review',
                    $push: {
                        timeline: {
                            status: AD_STATUS.PENDING,
                            timestamp: new Date(),
                            reason: 'Re-submitted for review after edit',
                        },
                    },
                },
            }) as unknown as Record<string, unknown>;
        }

        return res.json(respond({
            success: true,
            message: 'Listing updated and pending review',
            data: updatedListing
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/listings/:id/mark-sold
 * Terminal state transition
 */
export const markListingSold = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const user = req.user as IAuthUser;
        const listing = await Ad.findById(id);

        if (!listing) return sendErrorResponse(req, res, 404, 'Listing not found');
        if (listing.sellerId.toString() !== user._id.toString()) {
            return sendErrorResponse(req, res, 403, 'Unauthorized');
        }

        if (listing.status !== AD_STATUS.LIVE) {
            return sendErrorResponse(req, res, 400, 'Only live listings can be marked as sold');
        }

        const updatedListing = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.SOLD,
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
            reason: 'Marked as sold by owner',
            metadata: {
                action: 'listing_mark_sold',
                sourceRoute: '/api/v1/listings/:id/mark-sold',
            },
            patch: {
                soldAt: new Date(),
                isChatLocked: true,
                isSpotlight: false,
                $push: {
                    timeline: {
                        status: AD_STATUS.SOLD,
                        timestamp: new Date(),
                        reason: 'Marked as sold by owner',
                    },
                },
            },
        });

        return res.json(respond({
            success: true,
            message: 'Listing marked as sold',
            data: updatedListing
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/listings/:id/promote
 * Promotion entry point
 */
export const promoteListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const user = req.user as IAuthUser;
        const listing = await Ad.findById(id);

        if (!listing) return sendErrorResponse(req, res, 404, 'Listing not found');
        if (listing.sellerId.toString() !== user._id.toString()) {
            return sendErrorResponse(req, res, 403, 'Unauthorized');
        }

        if (listing.status !== AD_STATUS.LIVE) {
            return sendErrorResponse(req, res, 400, 'Only live listings can be promoted');
        }

        // Redirect to promotion service / checkout (simplified for now)
        return res.json(respond({
            success: true,
            message: 'Proceed to promotion checkout',
            data: { listingId: id, currentStatus: listing.status }
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/listings/:id/analytics
 * Performance metrics for owner
 */
export const getListingAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const user = req.user as IAuthUser;
        const listing = await Ad.findById(id).select('sellerId views');

        if (!listing) return sendErrorResponse(req, res, 404, 'Listing not found');
        if (listing.sellerId.toString() !== user._id.toString()) {
            return sendErrorResponse(req, res, 403, 'Unauthorized');
        }

        return res.json(respond({
            success: true,
            data: {
                id: listing._id,
                views: listing.views
            }
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/listings/:id/view
 * Public increment view tracking
 */
export const incrementListingView = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        await Ad.findByIdAndUpdate(id, {
            $inc: { 'views.total': 1 }
        });

        return res.json(respond({ success: true }));
    } catch (error) {
        next(error);
    }
};
