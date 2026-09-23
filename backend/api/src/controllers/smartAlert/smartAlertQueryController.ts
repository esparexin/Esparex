import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { respond } from "../../utils/respond";
import { ApiResponse } from "@esparex/contracts";
import { sendErrorResponse } from "../../utils/errorResponse";
import { getErrorMessage, toAlertContract } from './shared';
import { getSmartAlertsForUser, getSmartAlertMatchesForUser, getSmartAlertQuotaForUser } from '@esparex/core/services/SmartAlertQueryService';

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
            const userId = String(user.id || user._id);
            const [alerts, quota] = await Promise.all([
                getSmartAlertsForUser(userId),
                getSmartAlertQuotaForUser(userId),
            ]);
            return res.json(respond({
                success: true,
                data: alerts.map((alert) => toAlertContract(alert)),
                quota,
            }));
        }

        sendErrorResponse(req, res, 401, 'Unauthorized');
    } catch (error: unknown) {
        logger.error('Error fetching smart alerts:', error);
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const getSmartAlertQuota = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const userId = String(user.id || user._id);
        const quota = await getSmartAlertQuotaForUser(userId);

        return res.json(respond({
            success: true,
            data: quota,
        }));
    } catch (error: unknown) {
        logger.error('Error fetching smart alert quota:', error);
        return sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const getSmartAlertMatches = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const userId = String(user.id || user._id);
        const page = parseInt(String(req.query.page || '1'), 10) || 1;
        const limit = parseInt(String(req.query.limit || '10'), 10) || 10;
        const alertId = typeof req.query.alertId === 'string' ? req.query.alertId : undefined;

        const result = await getSmartAlertMatchesForUser(userId, { page, limit, alertId });

        return res.json(respond({
            success: true,
            data: result,
        }));
    } catch (error: unknown) {
        logger.error('Error fetching smart alert matches:', error);
        return sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};
