import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { respond } from "../../utils/respond";
import { ApiResponse } from "@esparex/contracts";
import { sendErrorResponse } from "../../utils/errorResponse";
import { getErrorMessage, toAlertContract } from './shared';
import { getSmartAlertsForUser } from '@esparex/core/services/SmartAlertQueryService';

export const getSmartAlerts = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const admin = req.admin as unknown;

        if (admin) {
            const alerts = await getSmartAlertsForUser();
            return res.json(respond<ApiResponse<unknown>>({
                success: true,
                data: alerts.map((alert) => toAlertContract(alert))
            }));
        }

        if (user) {
            const userId = user.id || user._id;
            const alerts = await getSmartAlertsForUser(String(userId));
            return res.json(respond<ApiResponse<unknown>>({
                success: true,
                data: alerts.map((alert) => toAlertContract(alert))
            }));
        }

        sendErrorResponse(req, res, 401, 'Unauthorized');
    } catch (error: unknown) {
        logger.error('Error fetching smart alerts:', error);
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};
