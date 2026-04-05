import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { IAuthUser } from '../types/auth';
import { sendErrorResponse } from '../utils/errorResponse';
import { respond, sendSuccessResponse } from '../utils/respond';
import { getSingleParam } from '../utils/requestParams';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { ACTOR_TYPE } from '../../../shared/enums/actor';
import { LISTING_TYPE } from '../../../shared/enums/listingType';
import { PromotionPolicyService } from '../services/PromotionPolicyService';
import { buildPublicAdFilter, isPublicAdVisible } from '../utils/FeedVisibilityGuard';
import * as adService from '../services/AdService';
import { mutateStatus } from '../services/StatusMutationService';
import { getAndVerifyOwnedListing } from '../utils/controllerUtils';
import { getSellerPhone } from '../services/ContactRevealService';
import { collectImmutableFieldErrors, hasOwnField } from '../utils/immutableFieldErrors';

const LOCKED_AD_EDIT_FIELD_MESSAGES: Record<string, string> = {
    categoryId: 'Category cannot be changed while editing a listing.',
    brandId: 'Brand cannot be changed while editing a listing.',
    modelId: 'Model cannot be changed while editing a listing.',
    screenSize: 'Screen size cannot be changed while editing a listing.',
    spareParts: 'Spare-part mapping cannot be changed while editing a listing.',
    deviceCondition: 'Device condition cannot be changed while editing a listing.',
    listingType: 'Listing type cannot be changed while editing a listing.',
    sellerId: 'Seller cannot be changed while editing a listing.',
    sellerType: 'Seller type cannot be changed while editing a listing.',
    status: 'Status cannot be changed while editing a listing.',
    moderationStatus: 'Moderation status cannot be changed while editing a listing.',
    approvedAt: 'Approval metadata cannot be changed while editing a listing.',
    approvedBy: 'Approval metadata cannot be changed while editing a listing.',
    isDeleted: 'Deletion state cannot be changed while editing a listing.',
    deletedAt: 'Deletion state cannot be changed while editing a listing.',
    expiresAt: 'Expiry cannot be changed while editing a listing.',
};

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
        if (!isAdmin && !isOwner && !isPublicAdVisible(ad as Record<string, unknown>)) {
            return sendErrorResponse(req, res, 404, 'Listing not found');
        }

        return sendSuccessResponse(res, ad);
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
        const listing = await getAndVerifyOwnedListing(req, res, {
            errorMessage: 'Listing not found or access denied',
            select: 'status listingType',
        });
        if (!listing) return;

        const body = req.body as Record<string, unknown>;
        const lockErrors = collectImmutableFieldErrors(body, LOCKED_AD_EDIT_FIELD_MESSAGES);

        if (
            (listing.status === AD_STATUS.LIVE || listing.status === AD_STATUS.PENDING)
            && (hasOwnField(body, 'location') || hasOwnField(body, 'locationId'))
        ) {
            lockErrors.push({
                field: hasOwnField(body, 'location') ? 'location' : 'locationId',
                message: 'Location cannot be changed once a listing is live or under review.',
                code: 'IMMUTABLE_FIELD',
            });
        }

        if (lockErrors.length > 0) {
            return sendErrorResponse(req, res, 400, 'Validation failed', {
                code: 'LOCKED_FIELDS',
                details: lockErrors,
            });
        }

        const updatedListing = await adService.updateAd(id, body, {
            actor: 'USER',
            authUserId: user._id.toString(),
            sellerId: user._id.toString()
        });

        return sendSuccessResponse(res, updatedListing, 'Listing updated successfully');
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
        const user = req.user as IAuthUser;
        const listing = await getAndVerifyOwnedListing(req, res);
        if (!listing) return;

        if (listing.status !== AD_STATUS.LIVE) {
            return sendErrorResponse(req, res, 400, 'Only live listings can be marked as sold');
        }

        const soldReason = req.body?.soldReason as
            | 'sold_on_platform' | 'sold_outside' | 'no_longer_available'
            | undefined;

        const updatedListing = await mutateStatus({
            domain: 'ad',
            entityId: listing._id.toString(),
            toStatus: AD_STATUS.SOLD,
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
            reason: soldReason || 'Marked as sold by owner',
            metadata: {
                action: 'listing_mark_sold',
                sourceRoute: '/api/v1/listings/:id/mark-sold',
            },
            patch: {
                soldAt: new Date(),
                soldReason,
                isChatLocked: true,
                isSpotlight: false,
                $push: {
                    timeline: {
                        status: AD_STATUS.SOLD,
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
 * POST /api/v1/listings/:id/promote
 * Promotion entry point — only ad and service types can be promoted.
 * Spare parts cannot be spotlight-promoted.
 */
export const promoteListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as IAuthUser;
        // Select listingType so we can enforce promotion policy before reaching AdService
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status listingType' });
        if (!listing) return;

        // Centralized Policy Check: Reject if promotion is not allowed for this listing type
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

        if (listing.status !== AD_STATUS.LIVE) {
            return sendErrorResponse(req, res, 400, 'Only live listings can be promoted');
        }

        return sendSuccessResponse(res, { listingId: listing._id.toString(), currentStatus: listing.status, listingType: listing.listingType }, 'Proceed to promotion checkout');
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
        const user = req.user as IAuthUser;
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'views' });
        if (!listing) return;

        return sendSuccessResponse(res, {
            id: listing._id,
            views: listing.views
        });
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
        const idOrSlug = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID or Slug' });
        if (!idOrSlug) return;

        // Support both ID and SEO Slug for public view tracking
        const filter = mongoose.Types.ObjectId.isValid(idOrSlug)
            ? { _id: idOrSlug }
            : { seoSlug: idOrSlug };

        await Ad.findOneAndUpdate(filter, {
            $inc: { 'views.total': 1 }
        });

        return sendSuccessResponse(res, { success: true });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/listings/:id/deactivate
 * Lifecycle: LIVE → DEACTIVATED
 */
export const deactivateListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as IAuthUser;
        const listing = await getAndVerifyOwnedListing(req, res, { select: 'status' });
        if (!listing) return;

        const updatedListing = await mutateStatus({
            domain: 'ad', // Generic domain for all listings in 'Ad' collection
            entityId: listing._id.toString(),
            toStatus: 'deactivated',
            actor: {
                type: ACTOR_TYPE.USER,
                id: user._id.toString(),
                ip: req.ip,
                userAgent: req.headers['user-agent'],
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
 * GET /api/v1/listings/:id/phone
 * Unified phone reveal for all listing types
 */
export const getListingPhone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const requesterId = req.user?._id?.toString();
        const metadata = {
            ip: req.ip || req.socket.remoteAddress,
            device: req.headers['user-agent'] as string | undefined
        };

        // All listings (Ad, Service, SparePart) now live in the 'Ad' collection
        // Passing LISTING_TYPE.AD (or just 'ad') to the service is correct as it identifies the collection.
        const result = await getSellerPhone(id, LISTING_TYPE.AD, requesterId, metadata);

        if (!result || result.error) {
            switch (result?.error) {
                case 'HIDDEN':
                    return sendErrorResponse(req, res, 403, 'Seller chose not to share a phone number for this listing.', {
                        code: 'PHONE_HIDDEN',
                    });
                case 'REQUEST_REQUIRED':
                    return sendErrorResponse(req, res, 403, 'Seller shares phone numbers on request only. Use chat first.', {
                        code: 'PHONE_REQUEST_REQUIRED',
                    });
                case 'Listing not found':
                    return sendErrorResponse(req, res, 404, 'Listing not found');
                default:
                    return sendErrorResponse(req, res, 404, result?.error || 'Phone number not found');
            }
        }

        return sendSuccessResponse(res, result);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/listings/mine
 * Unified fetch for user's own listings (all types)
 */
export const getMyListingStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const counts = await adService.getSellerListingStats(userId);
        return sendSuccessResponse(res, counts);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/listings/mine
 * Unified fetch for user's own listings (all types)
 */
export const getMyListings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const { type, status, page = 1, limit = 20 } = req.query;
        const { getStatusMatchCriteria } = await import('../utils/statusQueryMapper');

        const query: Record<string, any> = {
            sellerId: userId,
            isDeleted: { $ne: true },
        };

        // Filter by type if provided (ad, service, spare_part)
        // If 'ad' is requested, we also include legacy records where listingType is missing or null.
        if (type && Object.values(LISTING_TYPE).includes(type as any)) {
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

        // Filter by status if provided (live, pending, etc.)
        if (status) {
            query.status = getStatusMatchCriteria(status as string);
        }

        const items = await Ad.find(query)
            .populate({ path: 'categoryId', select: 'name slug icon' })
            .populate({ path: 'brandId', select: 'name slug' })
            .populate({ path: 'modelId', select: 'name slug' })
            .populate({ path: 'sparePartId', select: 'name slug' })
            .populate({ path: 'serviceTypeIds', select: 'name slug' })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await Ad.countDocuments(query);

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
        sendErrorResponse(req, res, 500, 'Failed to fetch your listings');
    }
};
