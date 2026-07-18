import { Request, Response, NextFunction } from 'express';
import { sendSuccessResponse } from "../../utils/respond";
import { getSingleParam } from '../../utils/requestParams';
import * as AdMutationService from '@esparex/core/services/AdMutationService';
import type { AuthUser } from '../../types/auth.types';

/**
 * PATCH /api/v1/listings/:id/edit
 */
export const editListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Listing ID' });
        if (!id) return;

        const user = req.user as AuthUser;
        const body = req.body as Record<string, unknown>;

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
