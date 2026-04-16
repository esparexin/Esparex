import logger from '../../utils/logger';
import * as notificationService from '../../services/NotificationService';
import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { getUserId } from './shared';

export const markAllRead = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const updated = await notificationService.markAllNotificationsRead(userId);

        res.json(respond({
            success: true,
            message: 'All notifications marked as read',
            data: { updated }
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
        const { token, platform } = req.body as { token?: string; platform?: string };

        await notificationService.registerToken(userId, token ?? '', (platform || 'web') as 'web' | 'android' | 'ios');
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
        const id = req.params.id as string;

        if (id === 'all') {
            await notificationService.markAllNotificationsRead(userId);
            return res.json(respond({ success: true, message: 'All notifications marked as read' }));
        }

        const notification = await notificationService.markNotificationReadById(id, userId);

        if (!notification) {
            return sendErrorResponse(req, res, 404, 'Notification not found');
        }

        res.json(respond({ success: true, data: { notification } }));

    } catch (error) {
        logger.error('Mark Read Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to mark notification as read');
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const id = req.params.id as string;

        const notification = await notificationService.deleteUserNotification(id, userId);

        if (!notification) {
            return sendErrorResponse(req, res, 404, 'Notification not found');
        }

        res.json(respond({ success: true, message: 'Notification deleted successfully' }));

    } catch (error) {
        logger.error('Delete Notification Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to delete notification');
    }
};
