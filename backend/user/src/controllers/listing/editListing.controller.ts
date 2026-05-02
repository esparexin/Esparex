import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { sendSuccessResponse } from "@core/utils/respond";
import { getSingleParam } from '@core/utils/requestParams';
import { LISTING_STATUS } from "@shared/enums/listingStatus";
import * as AdMutationService from '@core/services/AdMutationService';
import { getAndVerifyOwnedListing } from "@core/utils/controllerUtils";
import { collectImmutableFieldErrors, hasOwnField } from '@core/utils/immutableFieldErrors';
import type { AuthUser } from '../../types/auth.types';

const LOCKED_AD_EDIT_FIELD_MESSAGES: Record<string, string> = {
    categoryId: 'Category cannot be changed while editing a listing.',
    brandId: 'Brand cannot be changed while editing a listing.',
    modelId: 'Model cannot be changed while editing a listing.',
    screenSize: 'Screen size cannot be changed while editing a listing.',
    spareParts: 'Spare-part mapping cannot be changed while editing a listing.',
    deviceCondition: 'Device condition cannot be changed while editing a listing.',
    listingType: 'Listing type cannot be changed while editing a listing.',
    sellerId: 'Seller cannot be changed while editing a listing.',
    sellerType: 'Seller type cannot be changed while editing a listing.',
    status: 'Status cannot be changed while editing a listing.',
    moderationStatus: 'Moderation status cannot be changed while editing a listing.',
    approvedAt: 'Approval metadata cannot be changed while editing a listing.',
    approvedBy: 'Approval metadata cannot be changed while editing a listing.',
    isDeleted: 'Deletion state cannot be changed while editing a listing.',
    deletedAt: 'Deletion state cannot be changed while editing a listing.',
    expiresAt: 'Expiry cannot be changed while editing a listing.',
};

/**
 * PUT /api/v1/listings/:id/edit
 */
export const editListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const user = req.user as AuthUser;
        const listing = await getAndVerifyOwnedListing(req, res, {
            errorMessage: 'Listing not found or access denied',
            select: 'status listingType',
        });
        if (!listing) return;

        const body = req.body as Record<string, unknown>;
        const lockErrors = collectImmutableFieldErrors(body, LOCKED_AD_EDIT_FIELD_MESSAGES);

        // Lifecycle Guard: Location is immutable once live or pending
        if (
            (listing.status === LISTING_STATUS.LIVE || listing.status === LISTING_STATUS.PENDING)
            && (hasOwnField(body, 'location') || hasOwnField(body, 'locationId'))
        ) {
            lockErrors.push({
                field: hasOwnField(body, 'location') ? 'location' : 'locationId',
                message: 'Location cannot be changed once a listing is live or under review.',
                code: 'IMMUTABLE_FIELD',
            });
        }

        if (lockErrors.length > 0) {
            return sendErrorResponse(req, res, 400, 'Validation failed', {
                code: 'LOCKED_FIELDS',
                details: lockErrors,
            });
        }

        const updatedListing = await AdMutationService.updateAd(id, body, {
            actor: 'USER',
            authUserId: user._id.toString(),
            sellerId: user._id.toString()
        });

        return sendSuccessResponse(res, updatedListing, 'Listing updated successfully');
    } catch (error) {
        next(error);
    }
};
