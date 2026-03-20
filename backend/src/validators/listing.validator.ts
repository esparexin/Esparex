import type { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/errorResponse';

export type ListingType = 'ad' | 'service' | 'spare_part';

const resolveListingType = (req: Request): ListingType => {
    const bodyType = typeof req.body?.listingType === 'string' ? req.body.listingType.trim().toLowerCase() : '';

    if (bodyType === 'service' || req.baseUrl.includes('/services')) return 'service';
    if (bodyType === 'spare_part' || req.baseUrl.includes('/spare-part-listings')) return 'spare_part';
    return 'ad';
};

/**
 * createListingValidator
 * SSOT listing-type conditional rules for create/update entry points.
 */
export const createListingValidator = (req: Request, res: Response, next: NextFunction) => {
    const listingType = resolveListingType(req);

    if (listingType === 'ad') {
        const condition = req.body?.condition ?? req.body?.deviceCondition;
        if (typeof condition !== 'string' || condition.trim().length === 0) {
            sendErrorResponse(req, res, 400, 'condition is required for ad listings', {
                code: 'AD_CONDITION_REQUIRED',
            });
            return;
        }
    }

    if (listingType === 'spare_part') {
        const sparePartId = req.body?.sparePartId;
        if (typeof sparePartId !== 'string' || sparePartId.trim().length === 0) {
            sendErrorResponse(req, res, 400, 'sparePartId is required for spare part listings', {
                code: 'SPARE_PART_ID_REQUIRED',
            });
            return;
        }
    }

    // listingType=service keeps price optional by policy; no mandatory price assertion.
    next();
};
