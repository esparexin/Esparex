/**
 * Ad User Controller
 * Handles user-specific operations and admin utilities
 * Extracted from adController.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as adService from '../../services/AdService';
import * as adImageService from '../../services/AdImageService';

import { respond } from '../../utils/respond';
import { getSingleParam } from '../../utils/requestParams';
import { Ad } from '../../../../shared/schemas/ad.schema';
import { ApiResponse, PaginatedResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import { IAuthUser } from '../../types/auth';
import { validateTransition } from '../../services/LifecycleGuard';
import { type ListingTypeValue } from '../../../../shared/enums/listingType';

const sendClientError = (
    req: Request,
    res: Response,
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown
) => {
    return sendErrorResponse(req, res, statusCode, message, {
        code,
        details
    });
};

type ControllerError = {
    statusCode?: number;
    status?: number;
    code?: string | number;
    name?: string;
    path?: string;
    message?: string;
    keyPattern?: Record<string, unknown>;
};

const asControllerError = (error: unknown): ControllerError => error as ControllerError;

/**
 * Get current user's ads
 */
export const getMyAds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Read listingType from query param — frontend sends ?listingType=ad
        // Leaving undefined returns ALL types owned by the seller (future multi-type tab support)
        const listingType = req.query.listingType
            ? (req.query.listingType as ListingTypeValue)
            : undefined;

        const result = await adService.getAds(
            {
                sellerId: (req.user as IAuthUser)._id.toString(),
                status: req.query.status ? (req.query.status as string) : undefined,
                listingType,
            },
            { page, limit }
        );

        const pagination = {
            ...result.pagination,
            page: result.pagination.page ?? page,
            limit: result.pagination.limit ?? limit
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
 * Mark an ad as sold
 */
export const markAsSold = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;

        const adToCheck = await adService.assertOwnership(id, (req.user as IAuthUser)._id.toString());
        validateTransition('ad', adToCheck.status as any, 'sold');

        const ad = await adService.updateAdStatus(id, 'sold', {
            soldReason: req.body.soldReason as 'sold_on_platform' | 'sold_outside' | 'no_longer_available' | undefined,
            reason: 'Marked as sold by seller',
            actorType: 'user',
            actorId: (req.user as IAuthUser)._id.toString()
        });

        const response = respond<ApiResponse<Ad>>({
            success: true,
            data: ad as unknown as Ad,
            message: 'Ad marked as sold'
        });

        res.json(response);
    } catch (error: unknown) {
        const knownError = asControllerError(error);
        if (knownError.message === 'Unauthorized') {
            return sendClientError(req, res, 403, 'Unauthorized', 'UNAUTHORIZED');
        }
        if (knownError.message === 'Ad not found') {
            return sendClientError(req, res, 404, 'Ad not found', 'NOT_FOUND');
        }
        if (typeof knownError.statusCode === 'number' && knownError.statusCode >= 400 && knownError.statusCode < 500) {
            return sendClientError(
                req,
                res,
                knownError.statusCode,
                knownError.message || 'Invalid status transition',
                typeof knownError.code === 'string' ? knownError.code : undefined
            );
        }
        next(error);
    }
};

/**
 * Repost an expired/rejected ad using posting balance
 */
export const repostAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return sendClientError(req, res, 401, 'Unauthorized', 'UNAUTHORIZED');
        }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;

        const userId = (req.user as IAuthUser)._id.toString();
        const reposted = await adService.repostAd(id, userId);
        if (!reposted) {
            return sendClientError(req, res, 404, 'Ad not found', 'NOT_FOUND');
        }

        return res.json(respond<ApiResponse<Ad>>({
            success: true,
            data: reposted as unknown as Ad,
            message: 'Ad reposted successfully'
        }));
    } catch (error: unknown) {
        const knownError = asControllerError(error);
        if (typeof knownError.statusCode === 'number') {
            return sendClientError(
                req,
                res,
                knownError.statusCode,
                knownError.message || 'Unable to repost ad',
                typeof knownError.code === 'string' ? knownError.code : undefined
            );
        }
        next(error);
    }
};

/**
 * Increment view count for an ad
 * Uses cookie-based tracking to prevent duplicate counts per user
 */
export const incrementAdView = async (req: Request, res: Response) => {
    try {
        const adId = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!adId) return;
        const cookieName = `v_ad_${adId}`;
        const isUnique = !req.cookies[cookieName];

        await (adService.incrementAdView as any)(adId, isUnique);

        if (isUnique) {
            // Set cookie for 24 hours to track unique views per user session
            res.cookie(cookieName, '1', {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: 'lax'
            });
        }

        res.json(respond({ success: true }));
    } catch {
        // Silent fail for analytics by design.
        res.json(respond({ success: true }));
    }
};

/**
 * Promote an ad using credits
 * Deducts credits from user's wallet atomically
 */
export const promoteAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return sendClientError(req, res, 401, 'Unauthorized', 'UNAUTHORIZED');
        }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const isAdmin = (req.user as IAuthUser).isAdmin || (req.user as IAuthUser).role === 'admin' || (req.user as IAuthUser).role === 'super_admin';
        const userId = (req.user as IAuthUser)._id.toString();

        const { days, type } = req.body;

        if (!days || typeof days !== 'number' || days <= 0) {
            return sendClientError(req, res, 400, 'Invalid promotion duration', 'INVALID_PROMOTION_DURATION');
        }

        const ad = await adService.promoteAd(id, days, type, userId, isAdmin);
        if (!ad) {
            return sendClientError(req, res, 404, 'Ad not found or could not be promoted', 'NOT_FOUND');
        }

        const response = respond<ApiResponse<Ad>>({
            success: true,
            data: ad as unknown as Ad,
            message: 'Ad promoted successfully'
        });

        res.json(response);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Granular Image Upload (Enterprise Audit Standard)
 * Allows frontend to pre-upload or asynchronously upload images
 * and receive content-based duplicate rejection.
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image, adId } = req.body;
        if (!image) {
            return sendErrorResponse(req, res, 400, 'Image data (base64) is required');
        }

        // Convert base64 to Buffer for adImageService
        const match = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let mimeType = 'image/jpeg';

        if (match && match.length === 3) {
            mimeType = match[1];
            buffer = Buffer.from(match[2], 'base64');
        } else {
            buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        }

        const result = await adImageService.uploadSingleImage(adId, buffer, mimeType);

        res.json(respond({
            success: true,
            data: result
        }));
    } catch (error: unknown) {
        next(error);
    }
};

const PRESIGN_ALLOWED_FOLDERS = new Set(['ads', 'staging', 'business', 'avatars', 'service']);

const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
};

/**
 * POST /ads/upload-presign
 * Returns a pre-signed S3 PUT URL so the browser can upload directly.
 * The Node.js server never receives file bytes — only metadata.
 */
export const getUploadPresignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as IAuthUser;
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

        // Key pattern: {folder}/{userId}/{timestamp}-{random}.{ext}
        // or:          {folder}/{adId}/{timestamp}-{random}.{ext}  when adId is provided
        const keyPrefix = adId ? `${normalizedFolder}/${adId}` : `${normalizedFolder}/${userId}`;
        const key = `${keyPrefix}/${timestamp}-${random}.${ext}`;

        const { generatePresignedUploadUrl } = await import('../../utils/s3');
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
