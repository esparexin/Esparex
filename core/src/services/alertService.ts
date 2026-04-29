import Alert from '../models/Alert';
import logger from '../utils/logger';
import { TraceContext } from '@shared/observability/trace';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertPayload {
    type: string;
    severity: AlertSeverity;
    service: string;
    message: string;
    metadata?: Record<string, any>;
    traceId?: string;
}

/**
 * In-memory sliding window counter for alerting thresholds
 */
class ThresholdTracker {
    private counters = new Map<string, { count: number; firstSeen: number }>();

    increment(key: string, windowMs: number): number {
        const now = Date.now();
        const entry = this.counters.get(key);

        if (!entry || (now - entry.firstSeen) > windowMs) {
            this.counters.set(key, { count: 1, firstSeen: now });
            return 1;
        }

        entry.count += 1;
        return entry.count;
    }

    reset(key: string) {
        this.counters.delete(key);
    }
}

const tracker = new ThresholdTracker();
const cooldowns = new Map<string, number>();

/**
 * Production Alerts System (SSOT)
 * Detects failures, anomalies, and performance issues.
 */
export class AlertService {
    private static COOLDOWN_MS = 60000; // 1 minute cooldown per alert type/service

    /**
     * Internal trigger for alerts.
     * Non-blocking and rate-limited.
     */
    static async trigger(payload: AlertPayload): Promise<void> {
        const { type, service, severity, message, metadata } = payload;
        const traceId = payload.traceId || TraceContext.getCorrelationId();
        const cooldownKey = `${type}:${service}`;
        const now = Date.now();

        // 1. Rate Limiting (Cooldown)
        if (cooldowns.has(cooldownKey) && (now - cooldowns.get(cooldownKey)!) < this.COOLDOWN_MS) {
            return;
        }
        cooldowns.set(cooldownKey, now);

        const alertData = {
            ...payload,
            traceId,
            timestamp: new Date().toISOString()
        };

        // 2. Alert Channels
        // Console for dev
        if (process.env.NODE_ENV === 'development') {
            console.warn(`🚨 [ALERT] [${severity}] [${type}] ${message}`, alertData);
        }

        // Logger for prod (Winston handles JSON formatting)
        logger.error(`🚨 ALERT_TRIGGERED: ${type}`, alertData);

        // 3. Persistent Storage (Async/Non-blocking)
        Alert.findOneAndUpdate(
            { type, service, resolved: false },
            { 
                $inc: { count: 1 },
                $set: { 
                    severity, 
                    message, 
                    traceId, 
                    metadata,
                    lastTriggeredAt: new Date()
                }
            },
            { upsert: true, new: true }
        ).catch(err => {
            logger.error('FAILSAFE: Failed to persist alert to DB', { error: String(err), type });
        });
    }

    /**
     * Capture System Errors with Thresholding
     */
    static captureError(service: string, error: Error | string, statusCode: number): void {
        if (statusCode >= 500) {
            const key = `5xx:${service}`;
            const count = tracker.increment(key, 60000); // 1 minute window

            if (count >= 5) {
                this.trigger({
                    type: 'SYSTEM_FAILURE',
                    severity: 'HIGH',
                    service,
                    message: `Elevated 5xx error rate: ${count} errors in 1min`,
                    metadata: { lastError: typeof error === 'string' ? error : error.message, statusCode }
                });
                tracker.reset(key);
            }
        }
    }

    /**
     * Capture Performance Degradation
     */
    static capturePerformance(service: string, method: string, url: string, duration: number): void {
        if (duration > 1000) {
            this.trigger({
                type: 'PERFORMANCE_DEGRADATION',
                severity: 'MEDIUM',
                service,
                message: `Slow API response: ${method} ${url} took ${duration}ms`,
                metadata: { method, url, duration }
            });
        }
    }

    /**
     * Capture Admin Abuse/Anomalies
     */
    static captureAdminAction(adminId: string, action: string): void {
        const key = `admin:${adminId}:actions`;
        const count = tracker.increment(key, 60000); // 1 minute window

        if (count > 10) {
            this.trigger({
                type: 'ADMIN_ABUSE_ANOMALY',
                severity: 'HIGH',
                service: 'admin-backend',
                message: `Admin ${adminId} performed ${count} actions in 1 minute`,
                metadata: { adminId, lastAction: action, actionCount: count }
            });
        }
    }

    /**
     * Capture Security Events
     */
    static captureSecurity(service: string, event: string, metadata: Record<string, any> = {}): void {
        this.trigger({
            type: 'SECURITY_ALERT',
            severity: 'CRITICAL',
            service,
            message: `Security threat detected: ${event}`,
            metadata: { event, ...metadata }
        });
    }
}

export default AlertService;
