import { Request } from 'express';
import { AuditLogService } from '../services/AuditService';

export type AdminLogTargetType =
    | 'User' | 'Ad' | 'Plan' | 'Business' | 'System' | 'Category' | 'Brand' | 'Model'
    | 'Service' | 'SparePart' | 'SparePartListing' | 'Location' | 'ModerationRule' | 'Config'
    | 'Notification' | 'ScheduledNotification' | 'Report' | 'Contact' | 'Transaction' | 'Invoice'
    | 'ServiceType' | 'ScreenSize' | 'Admin' | 'Keyword' | 'Geofence' | 'Conversation' | 'ApiKey';

export type AdminLogFn = (
    action: string,
    targetType: any,
    targetId: string | { toString: () => string } | undefined,
    metadata?: Record<string, unknown>
) => Promise<void>;

/**
 * Transport-free admin action logger.
 * Shim that forwards to the SSOT AuditLogService.
 */
export const logAdminActionDirect = async (
    actorId: string,
    action: string,
    targetType: any,
    targetId?: string | { toString: () => string },
    metadata?: Record<string, unknown>,
    ip = '',
    userAgent = ''
): Promise<void> => {
    return AuditLogService.logEvent(
        { 
            action, 
            targetType, 
            targetId: targetId ? targetId.toString() : undefined, 
            metadata 
        },
        { 
            actorId, 
            actorType: 'admin', 
            ip, 
            userAgent 
        }
    );
};

/**
 * Asynchronously logs an admin action using Request context.
 * Shim that forwards to the SSOT AuditLogService.
 */
export const logAdminAction = async (
    req: Request,
    action: string,
    targetType: any,
    targetId?: string | { toString: () => string },
    metadata?: Record<string, unknown>,
    actorIdOverride?: string
) => {
    const authUser = req.user as any;
    const adminId = actorIdOverride || authUser?._id || authUser?.id;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    return AuditLogService.logEvent(
        { 
            action, 
            targetType, 
            targetId: targetId ? targetId.toString() : undefined, 
            metadata 
        },
        { 
            actorId: adminId, 
            actorType: 'admin', 
            ip, 
            userAgent 
        }
    );
};
