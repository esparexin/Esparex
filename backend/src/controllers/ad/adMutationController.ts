/**
 * Ad Mutation Controller
 * Handles create, update, delete, restore operations
 * Extracted from adController.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as AdMutationService from '../../services/AdMutationService';
import * as adStatusService from '../../services/adStatusService';
import * as AdOrchestrator from '../../services/AdOrchestrator';

import { getBusinessByUserId } from '../../services/BusinessService';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';
import { sendErrorResponse } from '../../utils/errorResponse';
import { sendSuccessResponse } from '../../utils/respond';
import { getSingleParam } from '../../utils/requestParams';

import { IAuthUser } from '../../types/auth';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import { warnIfLegacyAdUserIdAliasUsed } from '../../utils/legacyOwnerAliasTelemetry';

const LEGACY_AD_OWNER_ALIAS_CODE = 'LEGACY_AD_USER_ID_ALIAS_REMOVED';
const hasLegacyAdUserIdAlias = (value: unknown): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'userId'));

const buildLegacyAliasDetails = (source: 'body') => ({
    alias: 'userId',
    canonical: 'sellerId',
    source,
    rolloutPhase: 'PR-D',
});

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
        warnIfLegacyAdUserIdAliasUsed(req, 'body');
        if (hasLegacyAdUserIdAlias(req.body)) {
            return sendClientError(
                req,
                res,
                400,
                '`userId` alias is no longer accepted in ad write payloads. Use `sellerId` or authenticated owner context.',
                LEGACY_AD_OWNER_ALIAS_CODE,
                buildLegacyAliasDetails('body')
            );
        }
        const authUserId = (req.user as IAuthUser)._id.toString();
        const createBody = req.body as Record<string, unknown>;
        const sellerId = (typeof createBody.sellerId === 'string' ? createBody.sellerId : null) ?? authUserId;

        // 🛡️ Strict listingType guard — requireListingType middleware coerces to LISTING_TYPE.AD
        // but double-check here as defense-in-depth against direct controller calls.
        const providedType = typeof createBody.listingType === 'string' ? createBody.listingType : undefined;
        if (providedType && providedType !== LISTING_TYPE.AD) {
            const routeMap: Record<string, string> = {
                [LISTING_TYPE.SERVICE]:    '/api/v1/services',
                [LISTING_TYPE.SPARE_PART]: '/api/v1/spare-part-listings',
            };
            return sendClientError(
                req, res, 400,
                `Use ${routeMap[providedType] ?? 'the correct route'} to create a ${providedType}.`,
                'WRONG_LISTING_TYPE'
            );
        }

        const ad = await AdOrchestrator.createAd(createBody, {
            actor: 'USER',
            authUserId,
            sellerId,
            idempotencyKey: req.idempotencyKey || req.header('Idempotency-Key') || req.header('x-idempotency-key') || undefined,
            requestId: req.requestId,
            fraudRisk: (req as Request & { fraudRisk?: string }).fraudRisk,
            fraudScore: (req as Request & { fraudScore?: number }).fraudScore,
            riskState: (req as Request & { riskState?: string }).riskState
        });

        return sendSuccessResponse(res, ad, 'Ad created successfully', 201);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Update an existing ad
 */
export const updateAd = async (req: Request, res: Response, next: NextFunction) => {
    try {
        warnIfLegacyAdUserIdAliasUsed(req, 'body');
        if (hasLegacyAdUserIdAlias(req.body)) {
            return sendClientError(
                req,
                res,
                400,
                '`userId` alias is no longer accepted in ad write payloads. Use `sellerId` or authenticated owner context.',
                LEGACY_AD_OWNER_ALIAS_CODE,
                buildLegacyAliasDetails('body')
            );
        }
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const authUserId = (req.user as IAuthUser)._id.toString();
        const updateBody = req.body as Record<string, unknown>;
        const sellerId = (typeof updateBody.sellerId === 'string' ? updateBody.sellerId : null) ?? authUserId;

        // Defense-in-depth: strip immutable identity fields — mirrors listingController.editListing
        const PROTECTED_FIELDS = ['categoryId', 'brandId', 'modelId', 'listingType', 'sellerId',
            'status', 'moderationStatus', 'approvedAt', 'approvedBy', 'isDeleted', 'deletedAt', 'expiresAt'];
        for (const field of PROTECTED_FIELDS) {
            delete updateBody[field];
        }

        if (updateBody.listingType === LISTING_TYPE.SERVICE) {
            const business = await getBusinessByUserId(authUserId);
            if (!business || !isBusinessPublishedStatus(business.status)) {
                return sendClientError(req, res, 403, 'Approved Business Account Required', 'BUSINESS_NOT_APPROVED', {
                    message: 'You need an approved business account to post a service.'
                });
            }
        }

        const ad = await AdMutationService.updateAd(id, updateBody, {
            actor: 'USER',
            authUserId,
            sellerId
        });

        return sendSuccessResponse(res, ad, 'Ad updated successfully');
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

        await AdMutationService.assertOwnership(id, (req.user)._id.toString());

        // Use canonical adStatusService (not deprecated adService.deleteAd)
        const ad = await adStatusService.deleteAd(id, (req.user)._id.toString(), 'user');
        if (!ad) {
            return sendClientError(req, res, 404, 'Ad not found', 'NOT_FOUND');
        }

        res.status(204).end();
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

        return sendSuccessResponse(res, ad, 'Ad restored successfully');
    } catch (error: unknown) {
        next(error);
    }
};
