import logger from '../../utils/logger';
import { Request, Response } from 'express';
import Notification from '../../models/Notification';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { getUserId } from './shared';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 20;

        if (limit > 100) limit = 100;

        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.json(respond({
            success: true,
            data: {
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                },
                unreadCount
            }
        }));
    } catch (error) {
        logger.error('Get Notifications Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch notifications');
    }
};
