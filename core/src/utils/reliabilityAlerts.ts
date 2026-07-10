import { env } from '../config/env';
import { captureException } from '../config/sentry';
import logger from './logger';
import { TraceContext } from '@esparex/shared';
import { getReliabilityContextSnapshot } from './reliabilityContext';

export type ReliabilitySeverity = 'critical' | 'high' | 'warning' | 'info';

export interface ReliabilityAlertEvent {
    type: string;
    title: string;
    severity: ReliabilitySeverity;
    summary: string;
    service?: string;
    module?: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
    dedupeKey?: string;
}

type ChannelDelivery = {
    channel: 'slack' | 'email';
    success: boolean;
    skipped?: boolean;
    error?: string;
};

const ALERT_THROTTLE_MS = env.RELIABILITY_ALERT_THROTTLE_MS ?? 5 * 60 * 1000;
const ALERT_STATE_RETENTION_MS = Math.max(ALERT_THROTTLE_MS * 12, 30 * 60 * 1000);
const ALERT_STATE_MAX_KEYS = 5_000;
type AlertState = {
    lastSentAt: number;
    suppressedCount: number;
    lastSeenAt: number;
};
const alertStateByKey = new Map<string, AlertState>();

const safeJsonStringify = (value: unknown): string => {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return JSON.stringify({ note: 'metadata serialization failed' }, null, 2);
    }
};

const pruneAlertState = (now: number): void => {
    if (alertStateByKey.size <= ALERT_STATE_MAX_KEYS) return;
    const cutoff = now - ALERT_STATE_RETENTION_MS;
    for (const [key, state] of alertStateByKey.entries()) {
        if (state.lastSeenAt < cutoff) {
            alertStateByKey.delete(key);
        }
    }
    if (alertStateByKey.size <= ALERT_STATE_MAX_KEYS) return;
    const overflow = alertStateByKey.size - ALERT_STATE_MAX_KEYS;
    if (overflow <= 0) return;
    const keys = Array.from(alertStateByKey.keys()).slice(0, overflow);
    for (const key of keys) {
        alertStateByKey.delete(key);
    }
};

const parseRecipients = (): string[] => {
    return (env.RELIABILITY_ALERT_EMAIL_TO || '')
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
};

const shouldThrottleAlert = (key: string): { throttled: boolean; suppressed: number } => {
    const now = Date.now();
    const state = alertStateByKey.get(key);
    if (state && now - state.lastSentAt < ALERT_THROTTLE_MS) {
        state.suppressedCount += 1;
        state.lastSeenAt = now;
        alertStateByKey.set(key, state);
        return { throttled: true, suppressed: state.suppressedCount };
    }
    const suppressed = state?.suppressedCount ?? 0;
    alertStateByKey.set(key, {
        lastSentAt: now,
        suppressedCount: 0,
        lastSeenAt: now,
    });
    pruneAlertState(now);
    return { throttled: false, suppressed };
};

const normalizeString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const inferQueueJobId = (type: string, metadata: Record<string, unknown>): string | undefined => {
    const candidate = normalizeString(metadata.jobId) || normalizeString(metadata.sourceJobId);
    if (candidate) return candidate;
    const queueMarker = normalizeString(metadata.queueName) || normalizeString(metadata.sourceQueue);
    if (!queueMarker && !type.toLowerCase().includes('queue') && !type.toLowerCase().includes('dlq')) {
        return undefined;
    }
    return 'aggregate';
};

const inferRequestPath = (type: string, metadata: Record<string, unknown>): string => {
    const directPath = normalizeString(metadata.requestPath) || normalizeString(metadata.path) || normalizeString(metadata.url);
    if (directPath) return directPath;

    const queueName = normalizeString(metadata.queueName) || normalizeString(metadata.sourceQueue);
    if (queueName) {
        const jobName = normalizeString(metadata.jobName) || normalizeString(metadata.sourceJobName) || 'unknown-job';
        return `queue://${queueName}/${jobName}`;
    }

    if (type.toLowerCase().includes('queue') || type.toLowerCase().includes('dlq')) {
        return 'queue://unknown/unknown-job';
    }
    return 'n/a';
};

const resolveAlertGrouping = (event: ReliabilityAlertEvent): {
    service: string;
    module: string;
    groupKey: string;
} => {
    const metadata = event.metadata || {};
    const service = normalizeString(event.service) ||
        normalizeString(metadata.service) ||
        (env.PROCESS_ROLE === 'worker' ? 'worker-runtime' : 'api-runtime');
    const moduleName = normalizeString(event.module) || normalizeString(metadata.module) || 'reliability';
    return {
        service,
        module: moduleName,
        groupKey: `${service}:${moduleName}:${event.type}`
    };
};

const enrichAlertEvent = (
    event: ReliabilityAlertEvent,
    grouping: { service: string; module: string }
): ReliabilityAlertEvent => {
    const context = getReliabilityContextSnapshot();
    const metadata = { ...(event.metadata || {}) };
    const traceId = normalizeString(metadata.traceId) ||
        normalizeString(context.traceId) ||
        normalizeString(TraceContext.getCorrelationId()) ||
        'no-context';
    const userId = normalizeString(metadata.userId) || normalizeString(context.userId);
    const requestPath = inferRequestPath(event.type, {
        ...metadata,
        requestPath: metadata.requestPath ?? context.requestPath,
        path: metadata.path ?? context.requestPath,
        queueName: metadata.queueName ?? context.queueName,
        jobName: metadata.jobName ?? context.jobName,
    });
    const jobId = inferQueueJobId(event.type, {
        ...metadata,
        jobId: metadata.jobId ?? context.jobId,
        sourceJobId: metadata.sourceJobId ?? context.jobId,
        queueName: metadata.queueName ?? context.queueName,
        sourceQueue: metadata.sourceQueue ?? context.queueName,
    });

    const enrichedMetadata: Record<string, unknown> = {
        ...metadata,
        service: grouping.service,
        module: grouping.module,
        traceId,
        requestPath,
    };
    if (userId) enrichedMetadata.userId = userId;
    if (jobId) enrichedMetadata.jobId = jobId;

    return {
        ...event,
        service: grouping.service,
        module: grouping.module,
        metadata: enrichedMetadata,
        timestamp: event.timestamp || new Date().toISOString(),
    };
};

const toSlackText = (event: ReliabilityAlertEvent): string => {
    const payload = event.metadata || {};
    return [
        `*${event.title}*`,
        `Severity: ${event.severity.toUpperCase()}`,
        `Type: ${event.type}`,
        `Service: ${event.service || 'unknown'}`,
        `Module: ${event.module || 'unknown'}`,
        `Summary: ${event.summary}`,
        `Timestamp: ${event.timestamp || new Date().toISOString()}`,
        'Metadata:',
        '```',
        safeJsonStringify(payload),
        '```',
    ].join('\n');
};

const toEmailHtml = (event: ReliabilityAlertEvent): string => {
    const metadataJson = safeJsonStringify(event.metadata || {})
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return [
        '<div style="font-family:Arial,sans-serif;max-width:900px;">',
        `<h2>${event.title}</h2>`,
        `<p><strong>Severity:</strong> ${event.severity.toUpperCase()}</p>`,
        `<p><strong>Type:</strong> ${event.type}</p>`,
        `<p><strong>Service:</strong> ${event.service || 'unknown'}</p>`,
        `<p><strong>Module:</strong> ${event.module || 'unknown'}</p>`,
        `<p><strong>Summary:</strong> ${event.summary}</p>`,
        `<p><strong>Timestamp:</strong> ${event.timestamp || new Date().toISOString()}</p>`,
        '<h3>Metadata</h3>',
        `<pre style="background:#f5f5f5;padding:12px;border-radius:6px;overflow:auto;">${metadataJson}</pre>`,
        '</div>',
    ].join('');
};

const sendSlackAlert = async (event: ReliabilityAlertEvent): Promise<ChannelDelivery> => {
    const webhookUrl = env.RELIABILITY_SLACK_WEBHOOK_URL?.trim();
    if (!webhookUrl) {
        return { channel: 'slack', success: false, skipped: true, error: 'slack webhook not configured' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                text: toSlackText(event),
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`Slack webhook rejected (${response.status})`);
        }
        return { channel: 'slack', success: true };
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { channel: 'slack', success: false, error: reason };
    } finally {
        clearTimeout(timer);
    }
};

const sendEmailAlert = async (event: ReliabilityAlertEvent): Promise<ChannelDelivery> => {
    const recipients = parseRecipients();
    if (recipients.length === 0) {
        return { channel: 'email', success: false, skipped: true, error: 'alert email recipients not configured' };
    }

    const subject = `[${event.severity.toUpperCase()}] ${event.title}`;
    const html = toEmailHtml(event);

    let delivered = 0;
    const failures: string[] = [];

    // Lazy load EmailService to resolve startup circular dependency
    const servicePath = '../services/EmailService';
    const { emailService } = require(servicePath) as typeof import('../services/EmailService');

    for (const recipient of recipients) {
        const ok = await emailService.sendEmail(recipient, subject, html);
        if (ok) {
            delivered += 1;
        } else {
            failures.push(recipient);
        }
    }

    if (delivered > 0) {
        return { channel: 'email', success: true };
    }

    return {
        channel: 'email',
        success: false,
        error: failures.length > 0 ? `email delivery failed for: ${failures.join(', ')}` : 'email delivery failed',
    };
};

export const emitReliabilityAlert = async (event: ReliabilityAlertEvent): Promise<void> => {
    if (!env.RELIABILITY_ALERTS_ENABLED) return;

    const grouping = resolveAlertGrouping(event);
    const dedupeFingerprint = normalizeString(event.dedupeKey) || `${event.type}:${event.severity}`;
    const throttleKey = `${grouping.groupKey}:${dedupeFingerprint}`;
    const throttleResult = shouldThrottleAlert(throttleKey);
    if (throttleResult.throttled) {
        logger.warn('[RELIABILITY_ALERT] throttled duplicate alert', {
            dedupeKey: throttleKey,
            type: event.type
        });
        return;
    }

    const enrichedEvent = enrichAlertEvent(event, grouping);
    if (throttleResult.suppressed > 0) {
        enrichedEvent.metadata = {
            ...(enrichedEvent.metadata || {}),
            suppressedDuringCooldown: throttleResult.suppressed,
            cooldownMs: ALERT_THROTTLE_MS,
        };
    }

    const slackDelivery = await sendSlackAlert(enrichedEvent);
    let emailDelivery: ChannelDelivery | null = null;

    if (!slackDelivery.success) {
        emailDelivery = await sendEmailAlert(enrichedEvent);
    }

    logger.warn('[RELIABILITY_ALERT] emitted', {
        type: enrichedEvent.type,
        severity: enrichedEvent.severity,
        service: enrichedEvent.service,
        module: enrichedEvent.module,
        slack: slackDelivery,
        email: emailDelivery,
        metadata: enrichedEvent.metadata,
    });

    if (!slackDelivery.success && !emailDelivery?.success) {
        captureException(new Error('Reliability alert delivery failed on all channels'), {
            eventType: enrichedEvent.type,
            severity: enrichedEvent.severity,
            slackError: slackDelivery.error,
            emailError: emailDelivery?.error,
            metadata: enrichedEvent.metadata,
        });
    }
};
