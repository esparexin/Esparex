import { Request, Response, NextFunction } from 'express';

import { sendSuccessResponse } from "../../utils/respond";
import * as AdOrchestrator from '@esparex/core/services/AdOrchestrator';

import { normalizeListingLocation } from "@esparex/shared";
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
            const { sendErrorResponse } = await import("../../utils/errorResponse");
            return sendErrorResponse(req, res, 400, IMMUTABLE_SELLER_ID_MESSAGE, {
                code: 'IMMUTABLE_SELLER_ID',
                details: [{ field: 'sellerId', message: IMMUTABLE_SELLER_ID_MESSAGE }]
            });
        }

        const normalizedLocation = normalizeListingLocation(body.location);
        if (!normalizedLocation || !normalizedLocation.coordinates) {
            const { sendErrorResponse } = await import("../../utils/errorResponse");
            return sendErrorResponse(req, res, 400, 'Valid location with coordinates is required.', {
                code: 'INVALID_LOCATION',
                details: [{ field: 'location', message: 'Valid location with coordinates is required.' }]
            });
        }

        const { deriveLocationMetadata } = await import('@esparex/core/services/location/LocationHierarchyService');
        const meta = await deriveLocationMetadata(normalizedLocation.locationId, normalizedLocation.coordinates);
        if (meta.city && !normalizedLocation.city) normalizedLocation.city = meta.city;
        if (meta.state && !normalizedLocation.state) normalizedLocation.state = meta.state;

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


