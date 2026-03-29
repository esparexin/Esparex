import logger from '../../utils/logger';
import * as notificationService from '../../services/NotificationService';
import { Request, Response } from 'express';
import Notification from '../../models/Notification';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { getUserId } from './shared';

export const markAllRead = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const result = await Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        res.json(respond({
            success: true,
            message: 'All notifications marked as read',
            data: {
                updated: result.modifiedCount
            }
        }));
    } catch (error) {
        logger.error('Mark All Read Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to mark all notifications as read');
    }
};

export const registerToken = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { token, platform } = req.body;

        await notificationService.registerToken(userId, token, platform || 'web');
        res.json(respond({ success: true, message: 'Token registered' }));

    } catch (error) {
        logger.error('Token Register Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to register token');
    }
};

export const markRead = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { id } = req.params;

        if (id === 'all') {
            await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true, readAt: new Date() }
            );
            return res.json(respond({ success: true, message: 'All notifications marked as read' }));
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return sendErrorResponse(req, res, 404, 'Notification not found');
        }

        res.json(respond({
            success: true,
            data: {
                notification
            }
        }));

    } catch (error) {
        logger.error('Mark Read Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to mark notification as read');
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId
        });

        if (!notification) {
            return sendErrorResponse(req, res, 404, 'Notification not found');
        }

        res.json(respond({ success: true, message: 'Notification deleted successfully' }));

    } catch (error) {
        logger.error('Delete Notification Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to delete notification');
    }
};
