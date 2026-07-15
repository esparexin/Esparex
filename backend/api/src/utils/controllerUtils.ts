import { Request, Response } from 'express';
import { IAuthUser } from '@esparex/core/types/auth';
import { sendErrorResponse } from './errorResponse';
import { getSingleParam } from './requestParams';
import { getListingRepository } from '@esparex/core/composition/listings';
import { ListingFilter } from '@esparex/core/domains/listings';

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

    const filter: ListingFilter = {
        ids: [id],
        sellerId: user._id.toString(),
        isDeleted: false,
    };

    if (options.listingType) {
        filter.listingType = options.listingType as any;
    }

    const listing = await getListingRepository().findOne(filter);

    if (!listing) {
        sendErrorResponse(req, res, 404, options.errorMessage || 'Listing not found or access denied');
        return null;
    }

    return listing;
};
