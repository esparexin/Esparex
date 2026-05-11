import { Request } from 'express';
import AdminLog from '../models/AdminLog';
import logger from './logger';

export type AdminLogTargetType =
    | 'User' | 'Ad' | 'Plan' | 'Business' | 'System' | 'Category' | 'Brand' | 'Model'
    | 'Service' | 'SparePart' | 'SparePartListing' | 'Location' | 'ModerationRule' | 'Config'
    | 'Notification' | 'ScheduledNotification' | 'Report' | 'Contact' | 'Transaction' | 'Invoice'
    | 'ServiceType' | 'ScreenSize' | 'Admin' | 'Keyword' | 'Geofence' | 'Conversation' | 'ApiKey'
    | 'SmartAlert' | 'ExpiryWarning' | 'SpotlightPromotion';

/**
 * Shared signature for transport-free admin logging.
 * Injected into business services by controllers.
 */
export type AdminLogFn = (
    action: string,
    targetType: AdminLogTargetType,
    targetId: string,
    metadata?: Record<string, unknown>
) => Promise<void>;

/**
 * Transport-free admin action logger.
 * Called by services that no longer depend on express.Request.
 * Controllers inject actorId, ip and userAgent as plain strings.
 */
export const logAdminActionDirect = async (
    actorId: string,
    action: string,
    targetType: AdminLogTargetType,
    targetId?: string | { toString: () => string },
    metadata?: Record<string, unknown>,
    ip = '',
    userAgent = ''
): Promise<void> => {
    try {
        if (!actorId) {
            logger.warn('[AdminLogger] Attempted to log action without adminId', { action, targetType });
            return;
        }
        await AdminLog.create({
            adminId: actorId,
            action,
            targetType,
            targetId: targetId ? targetId.toString() : undefined,
            metadata,
            ipAddress: ip,
            userAgent,
        });
    } catch (error) {
        logger.error('[AdminLogger] Failed to create log:', error);
    }
};

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
    targetType: AdminLogTargetType,
    targetId?: string | { toString: () => string },
    metadata?: Record<string, unknown>,
    actorIdOverride?: string
) => {
    try {
        const authUser = req.user;
        const adminId = actorIdOverride || authUser?._id || authUser?.id;

        if (!adminId) {
            logger.warn('[AdminLogger] Attempted to log action without adminId', { action, targetType });
            return;
        }

        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

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
    }
};
