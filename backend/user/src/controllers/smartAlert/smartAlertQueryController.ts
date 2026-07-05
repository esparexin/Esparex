/**
 * ESPAREX — SMART ALERT QUERY CONTROLLER
 *
 * Ownership transferred to backend/user gateway as part of
 * Milestone 3 Project A (Transport Separation — Batch 2).
 *
 * Previous SSOT: core/src/controllers/smartAlert/smartAlertQueryController.ts
 * Current SSOT:  backend/user/src/controllers/smartAlert/smartAlertQueryController.ts
 */
import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { respond } from '@esparex/core/utils/respond';
import { PaginatedResponse, ApiResponse } from '@esparex/shared';
import { sendErrorResponse } from '@esparex/core/utils/errorResponse';
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
