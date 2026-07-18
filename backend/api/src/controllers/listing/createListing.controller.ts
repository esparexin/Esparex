import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccessResponse } from "../../utils/respond";
import * as AdOrchestrator from '@esparex/core/services/AdOrchestrator';
import * as adImageService from '@esparex/core/services/AdImageService';
import type { AuthUser } from '../../types/auth.types';

/**
 * POST /api/v1/listings
 */
export const createListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const ad = await AdOrchestrator.createAd(req.body as Record<string, unknown>, {
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
/**
 * Allowed MIME types for ad image uploads.
 * Must stay in sync with the S3 bucket policy.
 */
const presignBodySchema = z.object({
    fileName: z.string().min(1).max(255).regex(/^[\w.-]+$/, 'Invalid file name'),
    fileType: z.enum([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
    ]),
});

export const getUploadPresignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as AuthUser;
        const parsed = presignBodySchema.parse(req.body);
        const result = await adImageService.getUploadPresignedUrl(
            user._id.toString(),
            parsed.fileName,
            parsed.fileType
        );
        return sendSuccessResponse(res, result);
    } catch (error) {
        next(error);
    }
};
