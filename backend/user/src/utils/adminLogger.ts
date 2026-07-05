/**
 * ESPAREX â€” ADMIN LOGGER (backend/user transport layer)
 *
 * Contains the Express-aware logAdminAction(req, ...) function.
 * The pure logAdminActionDirect and types remain in @utils/adminLogger.
 */
import { Request } from 'express';
import { AdminLog } from '@esparex/core/models';
import logger from '@esparex/core/utils/logger';

// â”€â”€â”€ Re-export pure types and transport-free logger from core â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type {
    AdminLogTargetType,
    AdminLogFn,
} from '@esparex/core/utils/adminLogger';
export { logAdminActionDirect } from '@esparex/core/utils/adminLogger';

// â”€â”€â”€ Express-aware admin action logger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/**
 * Asynchronously logs an admin action using the Express request object.
 * Fail-safe: errors during logging are caught, ensuring the main action proceeds.
 */
export const logAdminAction = async (
    req: Request,
    action: string,
    targetType: string,
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

