import { Request, Response } from 'express';
import { IAuthUser } from '../types/auth';
import { sendErrorResponse } from './errorResponse';
import { getSingleParam } from './requestParams';
import AdModel from '../models/Ad';

/**
 * Shared Controller Helpers
 * Used to reduce duplication in ownership and existence checks.
 */

export const getAndVerifyOwnedListing = async (
    req: Request,
    res: Response,
    options: {
        listingType?: string;
        errorMessage?: string;
        select?: string;
    } = {}
) => {
    const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
    if (!id) return null;

    const user = req.user as IAuthUser;
    if (!user) {
        sendErrorResponse(req, res, 401, 'Unauthorized');
        return null;
    }

    const query: any = {
        _id: id,
        sellerId: user._id,
        isDeleted: false,
    };

    if (options.listingType) {
        query.listingType = options.listingType;
    }

    const listing = await AdModel.findOne(query).select(options.select || '');

    if (!listing) {
        sendErrorResponse(req, res, 404, options.errorMessage || 'Listing not found or access denied');
        return null;
    }

    return listing;
};
