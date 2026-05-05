import mongoose from 'mongoose';
import AdminLog from '../models/AdminLog';
import logger from '../utils/logger';

export type AuditContext = {
    actorId?: string;
    actorType: 'admin' | 'user' | 'system';
    ip?: string;
    userAgent?: string;
    requestId?: string;
};

export type AuditEvent = {
    action: string;
    targetType: string;
    targetId?: string | mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
};

export class AuditService {
    /**
     * Log an administrative or security event.
     * Persistence: Writes to AdminLog (MongoDB) and structured logs (Winston).
     */
    static async logEvent(event: AuditEvent, context: AuditContext): Promise<void> {
        const { action, targetType, targetId, metadata } = event;
        const { actorId, actorType, ip, userAgent, requestId } = context;

        // 1. Structured Logging (Internal tracing)
        logger.info(`[AUDIT] ${action} on ${targetType}`, {
            ...event,
            ...context,
            timestamp: new Date().toISOString()
        });

        // 2. Persistent Storage (Only for high-value actions or admin actions)
        if (actorType === 'admin' || action.startsWith('SECURITY_') || action.startsWith('CRITICAL_')) {
            try {
                // We use AdminLog as our persistent audit trail
                await AdminLog.create({
                    adminId: actorId ? new mongoose.Types.ObjectId(actorId) : undefined,
                    action,
                    targetType,
                    targetId,
                    metadata: {
                        ...metadata,
                        actorType,
                        requestId
                    },
                    ipAddress: ip,
                    userAgent
                });
            } catch (err) {
                logger.error('Failed to persist audit log to MongoDB', { error: String(err), event });
            }
        }
    }

    /**
     * Shorthand for admin actions
     */
    static async logAdminAction(
        adminId: string,
        action: string,
        targetType: string,
        targetId?: string,
        metadata?: Record<string, unknown>
    ) {
        return this.logEvent(
            { action, targetType, targetId, metadata },
            { actorId: adminId, actorType: 'admin' }
        );
    }
}
