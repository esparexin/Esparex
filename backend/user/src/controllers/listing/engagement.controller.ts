import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { sendSuccessResponse } from "@core/utils/respond";
import { getSingleParam } from '@core/utils/requestParams';
import { extractUser } from '../../middleware/authMiddleware';
import * as AdEngagementService from '@core/services/AdEngagementService';
import { getSellerPhone } from '@core/services/ContactRevealService';
import { LISTING_TYPE } from "@core/constants/enums/listingType";

/**
 * GET /api/v1/listings/:id/view
 */
export const incrementListingView = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const idOrSlug = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID or Slug' });
        if (!idOrSlug) return;

        const filter = mongoose.Types.ObjectId.isValid(idOrSlug)
            ? { _id: idOrSlug }
            : { seoSlug: idOrSlug };

        // 🛡️ ARCHITECTURAL REFINEMENT
        // Delegating cookie-based uniqueness logic to EngagementService to keep controller thin (SSOT).
        const result = await AdEngagementService.processListingView(filter, req, res);

        return sendSuccessResponse(res, result);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/listings/:id/phone
 */
export const getListingPhone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const requesterId = (req.user as any)?._id?.toString();
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
