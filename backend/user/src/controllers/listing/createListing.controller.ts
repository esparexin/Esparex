import { Request, Response, NextFunction } from 'express';
import { sendSuccessResponse } from "@core/utils/respond";
import * as AdOrchestrator from '@core/services/AdOrchestrator';
import * as adImageService from '@core/services/AdImageService';
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
            const { sendErrorResponse } = await import("@core/utils/errorResponse");
            return sendErrorResponse(req, res, 400, IMMUTABLE_SELLER_ID_MESSAGE, {
                code: 'IMMUTABLE_SELLER_ID',
                details: [{ field: 'sellerId', message: IMMUTABLE_SELLER_ID_MESSAGE }]
            });
        }

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
        const result = await adImageService.uploadAdImage(req, user._id.toString());
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
