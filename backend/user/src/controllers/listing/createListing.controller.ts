import { Request, Response, NextFunction } from 'express';
import { sendSuccessResponse } from "@esparex/core/utils/respond";
import * as AdOrchestrator from '@esparex/core/services/AdOrchestrator';
import * as adImageService from '@esparex/core/services/AdImageService';
import { normalizeListingLocation } from '@esparex/shared';
import type { AuthUser } from '../../types/auth.types';

const IMMUTABLE_SELLER_ID_MESSAGE =
    '`sellerId` is not accepted on user listing mutations. The authenticated session determines ownership.';

/**
 * POST /api/v1/listings
 */
export const createListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const body = req.body as Record<string, unknown>;

        // SSOT: Security guard to prevent seller impersonation
        if (Object.prototype.hasOwnProperty.call(body, 'sellerId')) {
            const { sendErrorResponse } = await import("@esparex/core/utils/errorResponse");
            return sendErrorResponse(req, res, 400, IMMUTABLE_SELLER_ID_MESSAGE, {
                code: 'IMMUTABLE_SELLER_ID',
                details: [{ field: 'sellerId', message: IMMUTABLE_SELLER_ID_MESSAGE }]
            });
        }

        const normalizedLocation = normalizeListingLocation(body.location);
        if (!normalizedLocation || !normalizedLocation.coordinates) {
            const { sendErrorResponse } = await import("@esparex/core/utils/errorResponse");
            return sendErrorResponse(req, res, 400, 'Valid location with coordinates is required.', {
                code: 'INVALID_LOCATION',
                details: [{ field: 'location', message: 'Valid location with coordinates is required.' }]
            });
        }
        body.location = normalizedLocation;

        const ad = await AdOrchestrator.createAd(body, {
            actor: 'USER',
            authUserId: user._id.toString(),
            sellerId: user._id.toString(),
            ip: req.ip,
            deviceFingerprint: req.headers['user-agent'],
            idempotencyKey: req.headers['idempotency-key'] as string
        });

        return sendSuccessResponse(res, ad, 'Listing created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/listings/upload-image
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        
        if (!req.file) {
            const { AppError } = await import("@esparex/core/utils/AppError");
            throw new AppError('No image file provided', 400, 'NO_IMAGE');
        }

        const result = await adImageService.uploadSingleImage(
            user._id.toString(), 
            req.file.buffer, 
            req.file.mimetype
        );

        return sendSuccessResponse(res, result, 'Image uploaded successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/listings/upload-presign
 */
export const getUploadPresignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const { fileName, fileType } = req.body as { fileName: string; fileType: string };
        const result = await adImageService.getUploadPresignedUrl(user._id.toString(), fileName, fileType);
        return sendSuccessResponse(res, result);
    } catch (error) {
        next(error);
    }
};
