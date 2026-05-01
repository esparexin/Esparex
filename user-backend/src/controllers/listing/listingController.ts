import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import type { AuthUser } from '../../types/auth.types';
import { sendErrorResponse } from "@core/utils/errorResponse";
import logger from '@core/utils/logger';
import { sendSuccessResponse } from "@core/utils/respond";
import { getSingleParam } from '@core/utils/requestParams';
import { LISTING_STATUS } from "@shared/enums/listingStatus";
import { ACTOR_TYPE } from "@shared/enums/actor";
import { LISTING_TYPE } from "@shared/enums/listingType";
import { PromotionPolicyService } from '@core/services/PromotionPolicyService';
import { buildPublicAdFilter, isPublicAdVisible } from '@core/utils/FeedVisibilityGuard';
import * as AdAggregationService from '@core/services/ad/AdAggregationService';
import * as AdDetailService from '@core/services/ad/AdDetailService';
import * as AdMutationService from '@core/services/AdMutationService';
import * as AdMetricsService from '@core/services/ad/AdMetricsService';
import * as AdEngagementService from '@core/services/AdEngagementService';
import * as AdOrchestrator from '@core/services/AdOrchestrator';
import * as feedService from '@core/services/FeedService';
import * as trendingService from '@core/services/TrendingService';
import * as adImageService from '@core/services/AdImageService';
import { mutateStatus } from '@core/services/StatusMutationService';
import { getAndVerifyOwnedListing } from "@core/utils/controllerUtils";
import { getSellerPhone } from '@core/services/ContactRevealService';
import { collectImmutableFieldErrors, hasOwnField } from '@core/utils/immutableFieldErrors';
import { getAdsQuerySchema, homeFeedQuerySchema, trendingAdsQuerySchema } from '@core/validators/ad.validator';
import { warnIfLegacyAdUserIdAliasUsed } from '@core/utils/legacyOwnerAliasTelemetry';
import { respond } from "@core/utils/respond";
import type { AdFilters } from '@core/types/ad.types';
import type { PaginatedResponse, HomeFeedResponse, ApiResponse } from "@shared/types/Api";
import type { Ad } from "@shared/schemas/ad.schema";

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

const IMMUTABLE_SELLER_ID_MESSAGE =
    '`sellerId` is not accepted on user listing mutations. The authenticated session determines ownership.';

const LEGACY_AD_OWNER_ALIAS_CODE = 'LEGACY_AD_USER_ID_ALIAS_REMOVED';

// --- Helpers ---

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

type CachedSearchResult = {
    data: unknown;
    pagination?: {
        page?: number;
        limit?: number;
    };
};

const asCachedSearchResult = (value: unknown): CachedSearchResult | null => {
    if (!isRecord(value)) return null;
    const pagination = isRecord(value.pagination) ? value.pagination : undefined;
    return {
        data: value.data,
        pagination: pagination
            ? {
                page: typeof pagination.page === 'number' ? pagination.page : undefined,
                limit: typeof pagination.limit === 'number' ? pagination.limit : undefined,
            }
            : undefined,
    };
};

const getViewerIdForFeed = (req: Request): string | undefined => {
    const user = req.user as AuthUser | undefined;
    if (!user?._id) return undefined;
    if (user.role === 'admin' || user.role === 'super_admin') return undefined;
    return String(user._id);
};

const rejectSellerOverride = (
    req: Request,
    res: Response,
    body: Record<string, unknown>
) => {
    if (!Object.prototype.hasOwnProperty.call(body, 'sellerId')) return false;

    sendErrorResponse(req, res, 400, IMMUTABLE_SELLER_ID_MESSAGE, {
        code: 'IMMUTABLE_SELLER_ID',
        details: [{ field: 'sellerId', message: IMMUTABLE_SELLER_ID_MESSAGE }]
    });
    return true;
};

const sendLegacyAliasError = (req: Request, res: Response, source: 'query') =>
    sendErrorResponse(
        req,
        res,
        400,
        '`userId` alias is no longer accepted in ad filters. Use `sellerId` instead.',
        {
            code: LEGACY_AD_OWNER_ALIAS_CODE,
            details: {
                alias: 'userId',
                canonical: 'sellerId',
                source,
                rolloutPhase: 'PR-D',
            },
        }
    );

const hasLegacyAdUserIdAlias = (value: unknown): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'userId'));


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

        const viewer = req.user as AuthUser;
        const viewerId = viewer?._id?.toString();
        const isAdmin = viewer?.role === 'admin' || viewer?.role === 'super_admin';

        let adId: string | null = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            adId = idOrSlug;
        }

        if (!adId) {
            const visibilityFilter = isAdmin ? { isDeleted: { $ne: true } } : buildPublicAdFilter();
            adId = await AdDetailService.getAdIdBySlug(idOrSlug, visibilityFilter);
        }

        if (!adId) {
            return sendErrorResponse(req, res, 404, 'Listing not found');
        }

        const ad = await AdDetailService.getListingDetailById(adId);

        if (!ad || (ad as { isDeleted?: boolean }).isDeleted) {
            return sendErrorResponse(req, res, 404, 'Listing not found');
        }

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

        const user = req.user as AuthUser;
        const listing = await getAndVerifyOwnedListing(req, res, {
            errorMessage: 'Listing not found or access denied',
            select: 'status listingType',
        });
        if (!listing) return;

        const body = req.body as Record<string, unknown>;
        const lockErrors = collectImmutableFieldErrors(body, LOCKED_AD_EDIT_FIELD_MESSAGES);

        if (
            (listing.status === LISTING_STATUS.LIVE || listing.status === LISTING_STATUS.PENDING)
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

        const updatedListing = await AdMutationService.updateAd(id, body, {
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
                ip: req.ip || '',
                userAgent: (req.headers['user-agent'] as string) || '',
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
 * POST /api/v1/listings/:id/promote
 * Promotion entry point — only ad and service types can be promoted.
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
 * GET /api/v1/listings/:id/analytics
 * Performance metrics for owner
 */
export const getListingAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

        const filter = mongoose.Types.ObjectId.isValid(idOrSlug)
            ? { _id: idOrSlug }
            : { seoSlug: idOrSlug };

        await AdEngagementService.incrementAdViewByFilter(filter);

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
                ip: req.ip || '',
                userAgent: (req.headers['user-agent'] as string) || '',
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
 * Delete (soft delete) a listing
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
                ip: req.ip || '',
                userAgent: (req.headers['user-agent'] as string) || '',
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
 * Repost an expired/rejected listing
 */
export const repostListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;
        const userId = (req.user as AuthUser)._id.toString();

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
 * GET /api/v1/listings/:id/phone
 * Unified phone reveal for all listing types
 */
export const getListingPhone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const requesterId = (req.user)?._id?.toString();
        const metadata = {
            ip: req.ip || req.socket.remoteAddress,
            device: req.headers['user-agent']
        };

        const result = await getSellerPhone(id, LISTING_TYPE.AD, requesterId, metadata);

        if (!result || result.error) {
            switch (result?.error) {
                case 'HIDDEN':
                    return sendErrorResponse(req, res, 403, 'Seller chose not to share a phone number for this listing.', { code: 'PHONE_HIDDEN' });
                case 'REQUEST_REQUIRED':
                    return sendErrorResponse(req, res, 403, 'Seller shares phone numbers on request only. Use chat first.', { code: 'PHONE_REQUEST_REQUIRED' });
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
 * GET /api/v1/listings/mine/stats
 * Listing counts by type/status for owner dashboard
 */
export const getMyListingStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user)?._id?.toString();
        if (!userId) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const counts = await AdMetricsService.getSellerListingStats(userId);
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
        const userId = (req.user)?._id;
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
        logger.error('Failed to fetch owner listings', {
            userId: (req.user)?._id?.toString?.() ?? String((req.user)?._id ?? ''),
            query: req.query,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return sendErrorResponse(req, res, 500, 'Failed to fetch your listings');
    }
};

/**
 * Get paginated list of active listings with filters and geospatial search
 */
export const getListings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        warnIfLegacyAdUserIdAliasUsed(req, 'query');
        if (hasLegacyAdUserIdAlias(req.query)) {
            return sendLegacyAliasError(req, res, 'query');
        }
        const viewerId = getViewerIdForFeed(req);
        const query = getAdsQuerySchema.parse(req.query);
        const requestedPage = Number(query.page ?? 1);
        const shouldUseSearchCache =
            !query.lat &&
            !query.lng &&
            !query.cursor &&
            Number.isFinite(requestedPage) &&
            requestedPage <= 5;

        const {
            getCache,
            setCache,
            buildDeterministicSearchCacheKey
        } = await import('@core/utils/redisCache');
        let cacheKey: string | null = null;
        let cachedResult: CachedSearchResult | null = null;

        if (shouldUseSearchCache) {
            cacheKey = buildDeterministicSearchCacheKey(query as Record<string, unknown>);
            cachedResult = asCachedSearchResult(await getCache(cacheKey));

            if (cachedResult) {
                const pagination = {
                    ...(cachedResult.pagination ?? {}),
                    page: cachedResult.pagination?.page ?? query.page ?? 1,
                    limit: cachedResult.pagination?.limit ?? query.limit ?? 20
                };
                return res.json(respond<PaginatedResponse<Ad>>({
                    success: true,
                    data: cachedResult.data as Ad[],
                    pagination
                }));
            }
        }

        const result = await AdAggregationService.getAds(
            {
                listingType: (query as any).listingType as any,
                status: query.status || LISTING_STATUS.LIVE,
                categoryId: query.categoryId,
                brandId: query.brandId,
                modelId: query.modelId,
                locationId: query.locationId,
                level: query.level,
                sellerId: query.sellerId,
                isSpotlight: query.isSpotlight,
                search: query.q,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                sortBy: query.sortBy as AdFilters['sortBy'],
                radiusKm: query.radiusKm,
                lat: query.lat,
                lng: query.lng
            },
            {
                page: query.page,
                limit: query.limit,
                cursor: query.cursor,
            },
            { enforcePublicVisibility: true, viewerId }
        );

        if (cacheKey && shouldUseSearchCache) {
            const { CACHE_TTLS } = await import('@core/utils/redisCache');
            await setCache(cacheKey, result, CACHE_TTLS.SEARCH);
        }

        const pagination = {
            ...result.pagination,
            page: result.pagination.page ?? query.page ?? 1,
            limit: result.pagination.limit ?? query.limit ?? 20
        };

        res.json(respond<PaginatedResponse<Ad>>({
            success: true,
            data: result.data as unknown as Ad[],
            pagination
        }));
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Get nearby listings sorted by distance
 */
export const getNearbyListings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        warnIfLegacyAdUserIdAliasUsed(req, 'query');
        if (hasLegacyAdUserIdAlias(req.query)) {
            return sendLegacyAliasError(req, res, 'query');
        }
        const viewerId = getViewerIdForFeed(req);
        const query = getAdsQuerySchema.parse({
            ...req.query,
            status: typeof req.query.status === 'string' ? req.query.status : LISTING_STATUS.LIVE,
            sortBy: 'distance'
        });

        if (!Number.isFinite(Number(query.lat)) || !Number.isFinite(Number(query.lng))) {
            return sendErrorResponse(req, res, 400, 'lat and lng are required for nearby search');
        }

        const result = await AdAggregationService.getAds(
            {
                listingType: (query as any).listingType as any,
                status: query.status || LISTING_STATUS.LIVE,
                categoryId: query.categoryId,
                brandId: query.brandId,
                modelId: query.modelId,
                locationId: query.locationId,
                level: query.level,
                sellerId: query.sellerId,
                isSpotlight: query.isSpotlight,
                search: query.q,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                sortBy: 'distance',
                radiusKm: query.radiusKm || 25,
                lat: query.lat,
                lng: query.lng
            },
            {
                page: query.page,
                limit: query.limit,
                cursor: query.cursor,
            },
            {
                enforcePublicVisibility: true,
                disableLocationIntelligence: true,
                viewerId
            }
        );

        const pagination = {
            ...result.pagination,
            page: result.pagination.page ?? query.page ?? 1,
            limit: result.pagination.limit ?? query.limit ?? 20
        };

        return res.json(respond<PaginatedResponse<Ad>>({
            success: true,
            data: result.data as unknown as Ad[],
            pagination
        }));
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Get ranked homepage feed
 */
export const getHomeFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = homeFeedQuerySchema.parse(req.query);
        const limit = query.limit ?? 20;
        const cursorRaw = query.cursor;
        const cursorId = query.cursorId;
        const cursor = cursorRaw
            ? (cursorId
                ? { createdAt: cursorRaw, id: cursorId }
                : cursorRaw)
            : undefined;

        const data = await feedService.getHomeFeedAds({
            cursor,
            limit,
            locationId: query.locationId,
            level: query.level,
            lat: query.lat,
            lng: query.lng,
            radiusKm: query.radiusKm,
            categoryId: query.categoryId,
        });

        return res.json(respond<ApiResponse<HomeFeedResponse>>({
            success: true,
            data: data
        }));
    } catch (error: unknown) {
        return next(error);
    }
};

/**
 * Get top trending listings
 */
export const getTrending = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = trendingAdsQuerySchema.parse(req.query);

        const data = await trendingService.getTrendingAds({
            limit: query.limit ?? 20,
            locationId: query.locationId,
            categoryId: query.categoryId,
        });

        return res.json(respond<ApiResponse<{ ads: Ad[] }>>({
            success: true,
            data: data as { ads: Ad[] }
        }));
    } catch (error: unknown) {
        return next(error);
    }
};

/**
 * Search autocomplete suggestions
 */
export const getListingSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const q = String(req.query.q ?? '').trim();
        const suggestions = await AdDetailService.getAdSuggestions(q);
        return res.json({ success: true, data: { suggestions } });
    } catch (error: unknown) {
        return next(error);
    }
};

/**
 * Create a new listing (Unified Ad, Service, Spare Part)
 */
export const createListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        if (!user) return sendErrorResponse(req, res, 401, 'Unauthorized');
        
        const authUserId = String(user._id);
        const createBody = req.body as Record<string, unknown>;
        const listingType = (createBody.listingType as string) || LISTING_TYPE.AD;
        
        if (rejectSellerOverride(req, res, createBody)) return;
        
        // Handle Specialized Service Creation
        if (listingType === LISTING_TYPE.SERVICE) {
            const { createServiceMutation } = await import('@core/services/service/ServiceMutationService');
            const service = await createServiceMutation({
                user: user as any,
                business: (req as any).business,
                body: createBody
            });
            return sendSuccessResponse(res, service, 'Service submitted for approval', 201);
        }

        // Handle Business Context for Spare Parts
        const businessId = (req as any).business?._id;
        if (listingType === LISTING_TYPE.SPARE_PART && !businessId) {
            return sendErrorResponse(req, res, 401, 'Business account required for spare parts');
        }

        const ad = await AdOrchestrator.createAd(
            {
                ...createBody,
                sellerType: businessId ? 'business' : 'individual',
                businessId: businessId || undefined,
            },
            {
                actor: user.role === 'admin' ? 'ADMIN' : 'USER',
                authUserId,
                sellerId: authUserId,
                idempotencyKey: req.idempotencyKey || req.header('Idempotency-Key') || req.header('x-idempotency-key') || undefined,
                requestId: req.requestId,
                fraudRisk: (req as any).fraudRisk,
                fraudScore: (req as any).fraudScore,
                riskState: (req as any).riskState,
                ip: req.ip,
                deviceFingerprint: req.headers['x-device-fingerprint'] as string,
            }
        );

        return sendSuccessResponse(res, ad, 'Listing created successfully', 201);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Granular Image Upload
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image, adId } = req.body as { image?: string; adId?: string };
        if (!image) {
            return sendErrorResponse(req, res, 400, 'Image data (base64) is required');
        }

        // Convert base64 to Buffer for adImageService
        const match = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let mimeType = 'image/jpeg';

        if (match && match.length === 3) {
            mimeType = match[1] ?? mimeType;
            buffer = Buffer.from(match[2] ?? '', 'base64');
        } else {
            buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        }

        const result = await adImageService.uploadSingleImage(adId as string, buffer, mimeType);

        res.json(respond({
            success: true,
            data: result
        }));
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Pre-signed S3 Upload URL
 */
const PRESIGN_ALLOWED_FOLDERS = new Set(['ads', 'staging', 'business', 'avatars', 'service']);

const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
};

export const getUploadPresignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const { contentType, folder = 'ads', adId } = req.body as {
            contentType?: string;
            folder?: string;
            adId?: string;
        };

        if (!contentType || typeof contentType !== 'string') {
            return sendErrorResponse(req, res, 400, 'contentType is required');
        }

        const normalizedFolder = folder.trim().toLowerCase();
        if (!PRESIGN_ALLOWED_FOLDERS.has(normalizedFolder)) {
            return sendErrorResponse(req, res, 400, `Invalid folder. Allowed: ${[...PRESIGN_ALLOWED_FOLDERS].join(', ')}`);
        }

        const ext = MIME_TO_EXT[contentType.split(';')[0]?.trim().toLowerCase() ?? ''] ?? 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const userId = user._id.toString();

        const keyPrefix = adId ? `${normalizedFolder}/${adId}` : `${normalizedFolder}/${userId}`;
        const key = `${keyPrefix}/${timestamp}-${random}.${ext}`;

        const { generatePresignedUploadUrl } = await import('@core/utils/s3');
        const result = await generatePresignedUploadUrl(key, contentType);

        res.json(respond({
            success: true,
            data: {
                uploadUrl: result.uploadUrl,
                publicUrl: result.publicUrl,
                key: result.key,
                expiresIn: 300,
            }
        }));
    } catch (error: unknown) {
        next(error);
    }
};
