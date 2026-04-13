import { Request, Response } from 'express';
import { getActiveBoostsForUser } from '../../services/BoostService';
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

        const boosts = await getActiveBoostsForUser(userId);

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: boosts
        }));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch boosts';
        sendErrorResponse(req, res, 500, message);
    }
};
