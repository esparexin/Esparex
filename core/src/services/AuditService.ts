import mongoose from 'mongoose';
import AdminLog from '@core/models/AdminLog';
import logger from '@core/utils/logger';
import { AlertService } from './alertService';
import { TraceContext } from '@shared/observability/trace';

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

/**
 * SSOT Audit Log Service
 * Enforces accountability for administrative and security actions.
 */
export class AuditLogService {
    /**
     * Log an administrative or security event.
     * Persistence: Writes to AdminLog (MongoDB) and structured logs (Winston).
     * Non-blocking: DB persistence happens in background.
     */
    static async logEvent(event: AuditEvent, context: AuditContext): Promise<void> {
        const { action, targetType, targetId, metadata } = event;
        const { actorId, actorType, ip, userAgent } = context;
        const traceId = TraceContext.getCorrelationId();

        // 1. Structured Logging (Standard JSON log)
        logger.info(`[AUDIT] ${action}`, {
            ...event,
            ...context,
            traceId,
            service: 'audit-service'
        });

        // 2. Persistent Storage (Filtered for high-value actions)
        const isCritical = actorType === 'admin' || action.startsWith('SECURITY_') || action.startsWith('CRITICAL_');
        
        if (isCritical) {
            // Abuse Detection
            if (actorType === 'admin' && actorId) {
                AlertService.captureAdminAction(actorId, action);
            }

            // FIRE AND FORGET: Do not await DB write to keep hot paths fast
            AdminLog.create({
                adminId: actorId ? new mongoose.Types.ObjectId(actorId) : undefined,
                action,
                targetType,
                targetId,
                metadata: {
                    ...metadata,
                    traceId,
                    actorType
                },
                ipAddress: ip,
                userAgent
            }).catch(err => {
                logger.error('FAILSAFE: Audit persistence failure', { 
                    error: String(err), 
                    action, 
                    traceId 
                });
            });
        }
    }

    /**
     * Specialized helper for Ad Moderation actions
     */
    static async logAdAction(
        adminId: string, 
        adId: string, 
        action: 'approve' | 'reject' | 'block' | 'unblock',
        metadata: Record<string, any> = {}
    ): Promise<void> {
        return this.logEvent(
            { action: `AD_${action.toUpperCase()}`, targetType: 'Ad', targetId: adId, metadata },
            { actorId: adminId, actorType: 'admin' }
        );
    }
}

// Keep AuditService for backward compatibility if needed, but alias to new name
export const AuditService = AuditLogService;
export default AuditLogService;
