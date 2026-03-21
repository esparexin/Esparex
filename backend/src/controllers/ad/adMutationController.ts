/**
 * Ad Mutation Controller
 * Handles create, update, delete, restore operations
 * Extracted from adController.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as adService from '../../services/AdService';
import * as adStatusService from '../../services/adStatusService';
import * as AdOrchestrator from '../../services/AdOrchestrator';
import AdModel from '../../models/Ad';
import Business from '../../models/Business';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';
import { respond } from '../../utils/respond';
import { getSingleParam } from '../../utils/requestParams';
import { Ad } from '../../../../shared/schemas/ad.schema';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import { IAuthUser } from '../../types/auth';

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
/**
 * Create a new ad listing
 */
export const createAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authUserId = (req.user as IAuthUser)._id.toString();
        const sellerId = req.body.sellerId || req.body.userId || authUserId;

        if (req.body.listingType === 'service') {
            const business = await Business.findOne({ userId: authUserId });
            if (!business || !isBusinessPublishedStatus(business.status)) {
                return sendClientError(req, res, 403, 'Approved Business Account Required', 'BUSINESS_NOT_APPROVED', {
                    message: 'You need an approved business account to post a service.'
                });
            }
            req.body.status = 'pending'; 
            req.body.sellerType = 'business';
        }

        const ad = await AdOrchestrator.createAd(req.body, {
            actor: 'USER',
            authUserId,
            sellerId,
            idempotencyKey: req.idempotencyKey || req.header('Idempotency-Key') || req.header('x-idempotency-key') || undefined,
            requestId: req.requestId,
            fraudRisk: (req as any).fraudRisk,
            fraudScore: (req as any).fraudScore,
            riskState: (req as any).riskState
        });

        const response = respond<ApiResponse<Ad>>({
            success: true,
            data: ad as unknown as Ad,
            message: 'Ad created successfully'
        });

        res.status(201).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Update an existing ad
 */
export const updateAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const authUserId = (req.user as IAuthUser)._id.toString();
        const sellerId = req.body.sellerId || req.body.userId || authUserId;

        // Defense-in-depth: strip immutable identity fields — mirrors listingController.editListing
        const PROTECTED_FIELDS = ['categoryId', 'brandId', 'modelId', 'listingType', 'sellerId',
            'status', 'moderationStatus', 'approvedAt', 'approvedBy', 'isDeleted', 'deletedAt', 'expiresAt'];
        for (const field of PROTECTED_FIELDS) {
            delete req.body[field];
        }

        if (req.body.listingType === 'service') {
            const business = await Business.findOne({ userId: authUserId });
            if (!business || !isBusinessPublishedStatus(business.status)) {
                return sendClientError(req, res, 403, 'Approved Business Account Required', 'BUSINESS_NOT_APPROVED', {
                    message: 'You need an approved business account to post a service.'
                });
            }
        }

        const ad = await adService.updateAd(id, req.body, {
            actor: 'USER',
            authUserId,
            sellerId
        });

        const response = respond<ApiResponse<Ad>>({
            success: true,
            data: ad as unknown as Ad,
            message: 'Ad updated successfully'
        });

        res.json(response);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Delete (soft delete) an ad
 */
export const deleteAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return sendClientError(req, res, 401, 'Unauthorized', 'UNAUTHORIZED');

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;

        // Optimization: checking specific fields only
        const adToCheck = await AdModel.findById(id).select('sellerId');
        if (!adToCheck) return sendClientError(req, res, 404, 'Ad not found', 'NOT_FOUND');
        if (adToCheck.sellerId.toString() !== (req.user as IAuthUser)._id.toString())
            return sendClientError(req, res, 403, 'Unauthorized', 'UNAUTHORIZED');

        // Use canonical adStatusService (not deprecated adService.deleteAd)
        const ad = await adStatusService.deleteAd(id, (req.user as IAuthUser)._id.toString(), 'user');
        if (!ad) {
            return sendClientError(req, res, 404, 'Ad not found', 'NOT_FOUND');
        }

        const response = respond<ApiResponse<null>>({
            success: true,
            data: null,
            message: 'Ad deleted successfully'
        });

        res.json(response);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Restore a deleted ad (admin only)
 */
export const restoreAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        // Use canonical adStatusService (not deprecated adService.restoreAd)
        const ad = await adStatusService.restoreAd(id, (req.user as IAuthUser)._id.toString(), 'user');
        if (!ad) {
            return sendClientError(req, res, 404, 'Ad not found', 'NOT_FOUND');
        }

        const response = respond<ApiResponse<Ad>>({
            success: true,
            data: ad as unknown as Ad,
            message: 'Ad restored successfully'
        });

        res.json(response);
    } catch (error: unknown) {
        next(error);
    }
};
