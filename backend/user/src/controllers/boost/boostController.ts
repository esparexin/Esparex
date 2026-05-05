import { Request, Response } from 'express';
import { getActiveBoostsForUser } from '@esparex/core/services/BoostService';
import { respond } from "@esparex/core/utils/respond";
import { ApiResponse } from "@shared/types/api";
import { sendErrorResponse } from "@esparex/core/utils/errorResponse";

/**
 * Get user's active boosts (Spotlights, etc.)
 */
export const getMyBoosts = async (req: Request, res: Response) => {
    try {
        const userId = (req.user)?._id;
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
