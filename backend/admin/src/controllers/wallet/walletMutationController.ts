import { Request, Response } from 'express';
import { logAdminAction } from '@esparex/core/utils/adminLogger';
import { sendErrorResponse } from '@esparex/core/utils/errorResponse';
import { sendSuccessResponse } from '@esparex/core/utils/adminBaseController';
import { getErrorMessage } from './shared';
import { credit } from '@esparex/core/services/WalletService';

export const adjustWallet = async (req: Request, res: Response) => {
    try {
        const { userId, adCredits, spotlightCredits, smartAlertSlots } = req.body as {
            userId?: string; adCredits?: number; spotlightCredits?: number; smartAlertSlots?: number;
        };

        if (!userId) return sendErrorResponse(req, res, 400, 'User ID is required');

        const incrementPayload: Record<string, number> = {};
        if (typeof adCredits === 'number') incrementPayload.adCredits = adCredits;
        if (typeof spotlightCredits === 'number') incrementPayload.spotlightCredits = spotlightCredits;
        if (typeof smartAlertSlots === 'number') incrementPayload.smartAlertSlots = smartAlertSlots;

        if (Object.keys(incrementPayload).length === 0) {
            return sendErrorResponse(req, res, 400, 'No adjustments provided');
        }

        const adminId = req.user?._id || 'system';

        const wallet = await credit({
            userId,
            amount: incrementPayload,
            reason: `Admin Credit Adjustment`,
            metadata: {
                adminId,
                adjustment: incrementPayload
            }
        });

        // 🛡️ LOG ADMIN ACTION (Security Audit Trail)
        await logAdminAction(req, 'ADJUST_WALLET', 'User', userId, { adjustment: incrementPayload });

        sendSuccessResponse(res, wallet, 'Wallet adjusted successfully');
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};
