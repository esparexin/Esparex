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
