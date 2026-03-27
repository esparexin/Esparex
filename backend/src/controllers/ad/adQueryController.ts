/**
 * Ad Query Controller
 * Handles read-only ad operations and filtering
 * Extracted from adController.ts
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as adService from '../../services/AdService';
import * as feedService from '../../services/FeedService';
import * as trendingService from '../../services/TrendingService';
import * as similarAdsService from '../../services/SimilarAdsService';
import { getSellerPhone } from '../../services/ContactRevealService';
import { respond } from '../../utils/respond';
import { getSingleParam } from '../../utils/requestParams';
import { Ad } from '../../../../shared/schemas/ad.schema';
import { ApiResponse, PaginatedResponse, HomeAdsResponse, HomeFeedResponse } from '../../../../shared/types/Api';
import { getAdsQuerySchema } from '../../validators/ad.validator';
import { IAuthUser } from '../../types/auth';
import { sendErrorResponse } from '../../utils/errorResponse';
import { buildPublicAdFilter } from '../../utils/FeedVisibilityGuard';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';

const asControllerError = (error: unknown): any => error as any;
const getViewerIdForFeed = (req: Request): string | undefined => {
    const user = req.user as IAuthUser | undefined;
    if (!user) return undefined;
    if (user.isAdmin || user.role === 'admin' || user.role === 'super_admin') return undefined;
    return user._id?.toString();
};

/**
 * Get paginated list of active ads with filters and geospatial search
 */
export const getAds = async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        } = await import('../../utils/redisCache');
        let cacheKey: string | null = null;
        let cachedResult: any = null;

        // STEP 3: Cache Non-Geo Search Only
        if (shouldUseSearchCache) {
            cacheKey = buildDeterministicSearchCacheKey(query as Record<string, unknown>);
            cachedResult = await getCache(cacheKey);

            if (cachedResult) {
                const pagination = {
                    ...cachedResult.pagination,
                    page: cachedResult.pagination.page ?? query.page ?? 1,
                    limit: cachedResult.pagination.limit ?? query.limit ?? 20
                };
                return res.json(respond<PaginatedResponse<Ad>>({
                    success: true,
                    data: cachedResult.data as unknown as Ad[],
                    pagination
                }));
            }
        }

        // 🔒 CRITICAL FIX: Use getAds (Geospatial) instead of getSimpleAds (Text-only)
        const result = await adService.getAds(
            {
                // 🔒 Scope: ad browse must only return ads, never services or spare_parts
                listingType: LISTING_TYPE.AD,
                // Public listing must never leak pending/rejected content.
                status: query.status || AD_STATUS.LIVE,
                category: query.category,
                categoryId: query.categoryId,
                brandId: query.brandId,
                modelId: query.modelId,
                locationId: query.locationId,
                level: query.level,
                location: query.location,
                sellerId: query.sellerId,
                isSpotlight: query.isSpotlight,
                search: query.q || query.search,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                sortBy: query.sortBy as any,
                radiusKm: query.radiusKm, // 📍 Geo Radius
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
            await setCache(cacheKey, result, 60); // 60 seconds TTL for search
        }

        const pagination = {
            ...result.pagination,
            page: result.pagination.page ?? query.page ?? 1,
            limit: result.pagination.limit ?? query.limit ?? 20
        };

        const response = respond<PaginatedResponse<Ad>>({
            success: true,
            data: result.data as unknown as Ad[],
            pagination
        });

        res.json(response);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Get nearby ads sorted by distance (public endpoint alias).
 * GET /api/v1/ads/nearby?lat=..&lng=..&radiusKm=..
 */
export const getNearbyAds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const viewerId = getViewerIdForFeed(req);
        const query = getAdsQuerySchema.parse({
            ...req.query,
            status: typeof req.query.status === 'string' ? req.query.status : AD_STATUS.LIVE,
            sortBy: 'distance'
        });

        if (!Number.isFinite(Number(query.lat)) || !Number.isFinite(Number(query.lng))) {
            return sendErrorResponse(req, res, 400, 'lat and lng are required for nearby search');
        }

        const result = await adService.getAds(
            {
                // 🔒 Scope: nearby must only return ads, never services or spare_parts
                listingType: LISTING_TYPE.AD,
                status: query.status || AD_STATUS.LIVE,
                category: query.category,
                categoryId: query.categoryId,
                brandId: query.brandId,
                modelId: query.modelId,
                locationId: query.locationId,
                level: query.level,
                location: query.location,
                sellerId: query.sellerId,
                isSpotlight: query.isSpotlight,
                search: query.q || query.search,
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
 * Get ranked homepage ads feed (Spotlight + Boost + Organic)
 */
export const getHomeFeedAds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
        const cursorRaw = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const cursorId = typeof req.query.cursorId === 'string' ? req.query.cursorId : undefined;
        const cursor = cursorRaw
            ? (cursorId
                ? { createdAt: cursorRaw, id: cursorId }
                : cursorRaw)
            : undefined;
        const location = typeof req.query.location === 'string' ? req.query.location : undefined;
        const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
        const level = (
            typeof req.query.level === 'string' &&
            ['country', 'state', 'district', 'city', 'area', 'village'].includes(req.query.level)
        )
            ? (req.query.level as 'country' | 'state' | 'district' | 'city' | 'area' | 'village')
            : undefined;
        const lat = typeof req.query.lat === 'string' ? Number(req.query.lat) : undefined;
        const lng = typeof req.query.lng === 'string' ? Number(req.query.lng) : undefined;
        const radiusKm = typeof req.query.radiusKm === 'string' ? Number(req.query.radiusKm) : undefined;

        const data = await feedService.getHomeFeedAds({
            cursor,
            limit,
            location,
            locationId,
            level,
            lat,
            lng,
            radiusKm,
            category,
            categoryId
        });

        const response = respond<ApiResponse<HomeFeedResponse>>({
            success: true,
            data: data as HomeFeedResponse
        });

        return res.json(response);
    } catch (error: unknown) {
        return next(error);
    }
};

/**
 * Get top trending ads
 */
export const getTrendingAds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
        const location = typeof req.query.location === 'string' ? req.query.location : undefined;
        const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;

        const data = await trendingService.getTrendingAds({
            limit,
            location,
            locationId,
            category,
            categoryId
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
 * Get similar ads by source ad ID
 */
export const getSimilarAds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const limit = parseInt(String(req.query.limit ?? '8'), 10) || 8;

        const data = await similarAdsService.getSimilarAds(id, { limit });

        return res.json(respond<ApiResponse<{ ads: Ad[] }>>({
            success: true,
            data: data as { ads: Ad[] }
        }));
    } catch (error: unknown) {
        return next(error);
    }
};



/**
 * Get any ad by ID regardless of status (admin only)
 */
export const getAnyAdById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Admin only access
        const isAdmin = req.admin || (req.user && ['admin', 'super_admin'].includes((req.user as IAuthUser).role));
        if (!isAdmin) {
            return sendErrorResponse(req, res, 403, 'Admin access required');
        }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const ad = await adService.getAnyAdById(id);
        if (!ad) {
            return sendErrorResponse(req, res, 404, 'Ad not found');
        }

        const response = respond<ApiResponse<Ad>>({
            success: true,
            data: ad as unknown as Ad
        });

        res.json(response);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * GET /ads/suggestions?q=
 * Returns up to 10 ad title suggestions for search autocomplete.
 * Intentionally lightweight — no pagination, no joins.
 */
export const getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const q = String(req.query.q ?? '').trim();
        const suggestions = await adService.getAdSuggestions(q);
        return res.json({ success: true, data: { suggestions } });
    } catch (error: unknown) {
        return next(error);
    }
};

/**
 * Note: getAdPhone removed. Use listingController.getListingPhone via generic /api/v1/listings routes.
 */
