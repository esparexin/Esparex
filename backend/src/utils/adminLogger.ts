import { Request } from 'express';
import AdminLog from '../models/AdminLog';
import { IAuthUser } from '../types/auth';
import logger from './logger';

/**
 * Asynchronously logs an admin action.
 * Fail-safe: Any errors during logging are caught and logged to console, ensuring the main action proceeds.
 * 
 * @param req - Express Request object (to extract admin user, IP, UA)
 * @param action - Action name (e.g., 'BAN_USER', 'APPROVE_AD')
 * @param targetType - Type of target entity (e.g., 'User', 'Ad')
 * @param targetId - ID of the target entity
 * @param metadata - Optional extra data (before/after states, reasons)
 */
export const logAdminAction = async (
    req: Request,
    action: string,
    targetType: 'User' | 'Ad' | 'Plan' | 'Business' | 'System' | 'Category' | 'Brand' | 'Model' | 'Service' | 'SparePart' | 'SparePartListing' | 'Location' | 'ModerationRule' | 'Config' | 'Notification' | 'ScheduledNotification' | 'Report' | 'Contact' | 'Transaction' | 'Invoice' | 'ServiceType' | 'ScreenSize' | 'Admin' | 'Keyword' | 'Geofence' | 'Conversation' | 'ApiKey',


    targetId?: string | { toString: () => string },
    metadata?: Record<string, unknown>,
    actorIdOverride?: string
) => {
    try {
        const authUser = req.user as IAuthUser | undefined;
        const adminId = actorIdOverride || authUser?._id || authUser?.id;

        if (!adminId) {
            logger.warn('[AdminLogger] Attempted to log action without adminId', { action, targetType });
            return;
        }

        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        // Fire and forget (don't await strictly if called without await, but we usually await generic async functions)
        // However, we strictly catch errors to avoid bubbling up.
        await AdminLog.create({
            adminId,
            action,
            targetType,
            targetId: targetId ? targetId.toString() : undefined,
            metadata,
            ipAddress,
            userAgent
        });

    } catch (error) {
        logger.error('[AdminLogger] Failed to create log:', error);
        // Do NOT throw error to preserve main flow
    }
};
