import type { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/errorResponse';
import { LISTING_TYPE, type ListingTypeValue } from '../../../shared/enums/listingType';

/** @deprecated Use ListingTypeValue from shared/enums/listingType */
export type ListingType = ListingTypeValue;

const resolveListingType = (req: Request): ListingTypeValue => {
    const bodyType = typeof req.body?.listingType === 'string' ? req.body.listingType.trim().toLowerCase() : '';

    if (bodyType === LISTING_TYPE.SERVICE || req.baseUrl.includes('/services')) return LISTING_TYPE.SERVICE;
    if (bodyType === LISTING_TYPE.SPARE_PART || req.baseUrl.includes('/spare-part-listings')) return LISTING_TYPE.SPARE_PART;
    return LISTING_TYPE.AD;
};

/**
 * createListingValidator
 * SSOT listing-type conditional rules for create/update entry points.
 */
export const createListingValidator = (req: Request, res: Response, next: NextFunction) => {
    const listingType = resolveListingType(req);

    if (listingType === LISTING_TYPE.AD) {
        const condition = req.body?.condition ?? req.body?.deviceCondition;
        if (typeof condition !== 'string' || condition.trim().length === 0) {
            sendErrorResponse(req, res, 400, 'condition is required for ad listings', {
                code: 'AD_CONDITION_REQUIRED',
            });
            return;
        }
    }

    if (listingType === LISTING_TYPE.SPARE_PART) {
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
