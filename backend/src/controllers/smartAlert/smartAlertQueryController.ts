import logger from '../../utils/logger';
import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import {
    getErrorMessage,
    SmartAlertModel,
    toAlertContract
} from './shared';

export const getSmartAlerts = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const admin = req.admin as unknown;

        if (admin) {
            const alerts = await SmartAlertModel.find({}).sort({ createdAt: -1 });
            return res.json(respond<ApiResponse<unknown>>({
                success: true,
                data: alerts.map((alert) => toAlertContract(alert))
            }));
        }

        if (user) {
            const userId = user.id || user._id;
            const alerts = await SmartAlertModel.find({ userId }).sort({ createdAt: -1 });
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
