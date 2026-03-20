import { Request, Response } from 'express';
import Boost from '../../models/Boost';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';

/**
 * Get user's active boosts (Spotlights, etc.)
 */
export const getMyBoosts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const Ad = (await import('../../models/Ad')).default;

        const userListings = await Ad.find({ sellerId: userId }).select('_id');

        const entityIds = userListings.map(l => l._id);

        const boosts = await Boost.find({
            entityId: { $in: entityIds },
            isActive: true
        }).sort({ endsAt: 1 }).lean();

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: boosts
        }));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch boosts';
        sendErrorResponse(req, res, 500, message);
    }
};
