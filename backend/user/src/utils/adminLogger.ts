import { Request } from 'express';
import { logAdminActionDirect, AdminLogTargetType } from '@esparex/core/utils/adminLogger';

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
    const authUser = req.user as { _id?: string; id?: string } | undefined;
    const adminId = actorIdOverride || authUser?._id || authUser?.id;

    if (!adminId) {
        return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    return logAdminActionDirect(
        String(adminId),
        action,
        targetType,
        targetId,
        metadata,
        ipAddress,
        userAgent
    );
};

export { logAdminActionDirect, AdminLogTargetType, AdminLogFn } from '@esparex/core/utils/adminLogger';
