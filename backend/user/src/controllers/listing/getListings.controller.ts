import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { sendErrorResponse } from "@esparex/core/utils/errorResponse";
import { sendSuccessResponse } from "@esparex/core/utils/respond";
import { getSingleParam } from '@esparex/core/utils/requestParams';
import { buildPublicAdFilter, isPublicAdVisible } from '@esparex/core/utils/FeedVisibilityGuard';
import * as AdAggregationService from '@esparex/core/services/ad/AdAggregationService';
import * as AdDetailService from '@esparex/core/services/ad/AdDetailService';
import * as feedService from '@esparex/core/services/FeedService';
import * as trendingService from '@esparex/core/services/TrendingService';
import { warnIfLegacyAdUserIdAliasUsed } from '@esparex/core/utils/legacyOwnerAliasTelemetry';
import { getAdsQuerySchema, homeFeedQuerySchema, trendingAdsQuerySchema } from '@esparex/core/validators/ad.validator';
import { LISTING_STATUS } from "@shared/enums/listingStatus";
import { respond } from "@esparex/core/utils/respond";
import type { PaginatedResponse, HomeFeedResponse, ApiResponse } from "@shared/types/Api";
import type { Ad } from "@shared/schemas/ad.schema";
import type { AuthUser } from '../../types/auth.types';
import type { ListingTypeValue } from "@esparex/core/constants/enums/listingType";

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
    const user = req.user;
    if (!user?._id) return undefined;
    if (user.role === 'admin' || user.role === 'super_admin') return undefined;
    return String(user._id);
};

const hasLegacyAdUserIdAlias = (value: unknown): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'userId'));

const sendLegacyAliasError = (req: Request, res: Response, source: 'query') =>
    sendErrorResponse(
        req,
        res,
        400,
        '`userId` alias is no longer accepted in ad filters. Use `sellerId` instead.',
        {
            code: 'LEGACY_AD_USER_ID_ALIAS_REMOVED',
            details: {
                alias: 'userId',
                canonical: 'sellerId',
                source,
                rolloutPhase: 'PR-D',
            },
        }
    );

/**
 * GET /api/v1/listings/:id
 */
export const getListingDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const idOrSlug = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID or Slug' });
        if (!idOrSlug) return;

        const viewer = req.user as AuthUser;
        const viewerId = viewer?._id?.toString();
        const isAdmin = viewer?.role === 'admin' || viewer?.role === 'super_admin';

        let adId: string | null = undefined;
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
 * GET /api/v1/listings
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
        } = await import('@esparex/core/utils/redisCache');
        let cacheKey: string | null = undefined;
        let cachedResult: CachedSearchResult | null = undefined;

        if (shouldUseSearchCache) {
            cacheKey = buildDeterministicSearchCacheKey(query);
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
                listingType: query.listingType as ListingTypeValue | undefined,
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
                sortBy: query.sortBy,
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
            const { CACHE_TTLS } = await import('@esparex/core/utils/redisCache');
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
 * GET /api/v1/listings/nearby
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
                listingType: query.listingType as ListingTypeValue | undefined,
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
 * GET /api/v1/listings/home
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
 * GET /api/v1/listings/trending
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
 * GET /api/v1/listings/suggestions
 */
export const getListingSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const q = String(req.query.q || '');
        const data = await AdAggregationService.getListingSuggestions(q);
        return sendSuccessResponse(res, data);
    } catch (error) {
        next(error);
    }
};
