import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { respond } from "@esparex/core/utils/respond";
import { PaginatedResponse } from "@shared/types/api";
import { sendErrorResponse } from "@esparex/core/utils/errorResponse";
import {
    getErrorMessage,
    SmartAlertModel,
    toAlertContract
} from './shared';

export const getSmartAlerts = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const admin = req.admin as unknown;

        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const page = Math.min(1000, Math.max(1, Number(req.query.page) || 1));
        const skip = (page - 1) * limit;

        if (admin) {
            const filter = {};
            const [alerts, total] = await Promise.all([
                SmartAlertModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
                SmartAlertModel.countDocuments(filter)
            ]);
            return res.json(respond<PaginatedResponse<unknown>>({
                success: true,
                data: alerts.map((alert) => toAlertContract(alert)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + alerts.length < total
                }
            }));
        }

        if (user) {
            const userId = user._id;
            const filter = { userId };
            const [alerts, total] = await Promise.all([
                SmartAlertModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
                SmartAlertModel.countDocuments(filter)
            ]);
            return res.json(respond<PaginatedResponse<unknown>>({
                success: true,
                data: alerts.map((alert) => toAlertContract(alert)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + alerts.length < total
                }
            }));
        }

        sendErrorResponse(req, res, 401, 'Unauthorized');
    } catch (error: unknown) {
        logger.error('Error fetching smart alerts:', error);
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};
