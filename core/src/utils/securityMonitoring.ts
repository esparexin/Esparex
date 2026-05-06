import { env } from '../config/env';
import { reliabilityAlertsTotal } from './metrics';
import { emitReliabilityAlert } from './reliabilityAlerts';

type WindowCounter = {
    count: number;
    resetAt: number;
};

type SecuritySnapshot = {
    apiSpikeSignals: number;
    rateLimitAbuseSignals: number;
    otpAbuseSignals: number;
    repeatedFailureSignals: number;
    lastUpdatedAt: string | null;
};

const apiUsageWindowMs = env.RELIABILITY_API_USAGE_SPIKE_WINDOW_MS ?? 60_000;
const apiUsageThreshold = env.RELIABILITY_API_USAGE_SPIKE_THRESHOLD ?? 300;
const rateLimitAbuseThreshold = env.RELIABILITY_RATE_LIMIT_ABUSE_THRESHOLD ?? 25;
const repeatedFailureThreshold = env.RELIABILITY_REPEATED_FAILURE_THRESHOLD ?? 20;
const repeatedFailureWindowMs = env.RELIABILITY_REPEATED_FAILURE_WINDOW_MS ?? 300_000;
const otpAbuseWindowMs = 10 * 60_000;
const otpAbuseThreshold = 8;

const apiUsageCounters = new Map<string, WindowCounter>();
const rateLimitCounters = new Map<string, WindowCounter>();
const otpCounters = new Map<string, WindowCounter>();
const repeatedFailureCounters = new Map<string, WindowCounter>();
const MAX_COUNTER_KEYS = 10_000;

const securitySnapshot: SecuritySnapshot = {
    apiSpikeSignals: 0,
    rateLimitAbuseSignals: 0,
    otpAbuseSignals: 0,
    repeatedFailureSignals: 0,
    lastUpdatedAt: null,
};

const incrementWindowCounter = (
    map: Map<string, WindowCounter>,
    key: string,
    windowMs: number,
): number => {
    const now = Date.now();
    if (map.size > MAX_COUNTER_KEYS) {
        for (const [entryKey, entry] of map.entries()) {
            if (now > entry.resetAt) {
                map.delete(entryKey);
            }
        }
    }
    const existing = map.get(key);
    if (!existing || now > existing.resetAt) {
        map.set(key, { count: 1, resetAt: now + windowMs });
        return 1;
    }
    existing.count += 1;
    map.set(key, existing);
    return existing.count;
};

const touchSnapshot = (): void => {
    securitySnapshot.lastUpdatedAt = new Date().toISOString();
};

const emitSecurityAlert = async (
    type: string,
    summary: string,
    metadata: Record<string, unknown>,
    severity: 'critical' | 'high' | 'warning' = 'high'
): Promise<void> => {
    reliabilityAlertsTotal.labels(type, severity).inc();
    await emitReliabilityAlert({
        type,
        title: 'Security anomaly detected',
        severity,
        summary,
        service: 'api-runtime',
        module: 'security-monitoring',
        dedupeKey: `${type}:${String(metadata.signalKey || '')}`,
        metadata,
    });
};

export const recordApiUsageSignal = (input: {
    method: string;
    route: string;
    ip: string;
    userId?: string;
}): void => {
    const signalKey = `${input.method}:${input.route}:${input.ip}`;
    const count = incrementWindowCounter(apiUsageCounters, signalKey, apiUsageWindowMs);
    touchSnapshot();
    if (count < apiUsageThreshold) return;

    securitySnapshot.apiSpikeSignals += 1;
    void emitSecurityAlert('SECURITY_API_USAGE_SPIKE', 'Unusual API usage spike detected', {
        signalKey,
        route: input.route,
        method: input.method,
        ip: input.ip,
        userId: input.userId,
        count,
        windowMs: apiUsageWindowMs,
        threshold: apiUsageThreshold,
    }, 'high');
};

export const recordRateLimitSignal = (input: {
    path: string;
    ip: string;
    bucket: string;
    code?: string;
    userId?: string;
}): void => {
    const signalKey = `${input.path}:${input.ip}:${input.bucket}`;
    const count = incrementWindowCounter(rateLimitCounters, signalKey, apiUsageWindowMs);
    touchSnapshot();
    if (count < rateLimitAbuseThreshold) return;

    securitySnapshot.rateLimitAbuseSignals += 1;
    void emitSecurityAlert('SECURITY_RATE_LIMIT_ABUSE', 'Repeated rate-limit abuse detected', {
        signalKey,
        path: input.path,
        ip: input.ip,
        bucket: input.bucket,
        code: input.code,
        userId: input.userId,
        count,
        windowMs: apiUsageWindowMs,
        threshold: rateLimitAbuseThreshold,
    }, 'warning');
};

export const recordOtpAbuseSignal = (input: {
    mobileSuffix: string;
    reason: 'invalid_otp' | 'locked' | 'rate_limited';
    userId?: string;
}): void => {
    const signalKey = `${input.mobileSuffix}:${input.reason}`;
    const count = incrementWindowCounter(otpCounters, signalKey, otpAbuseWindowMs);
    touchSnapshot();
    if (count < otpAbuseThreshold) return;

    securitySnapshot.otpAbuseSignals += 1;
    void emitSecurityAlert('SECURITY_OTP_ABUSE', 'OTP abuse pattern detected', {
        signalKey,
        mobileSuffix: input.mobileSuffix,
        reason: input.reason,
        userId: input.userId,
        count,
        windowMs: otpAbuseWindowMs,
        threshold: otpAbuseThreshold,
    }, 'high');
};

export const recordRepeatedFailureSignal = (input: {
    path: string;
    ip: string;
    statusCode: number;
    userId?: string;
}): void => {
    if (input.statusCode < 500) return;
    const signalKey = `${input.path}:${input.ip}`;
    const count = incrementWindowCounter(repeatedFailureCounters, signalKey, repeatedFailureWindowMs);
    touchSnapshot();
    if (count < repeatedFailureThreshold) return;

    securitySnapshot.repeatedFailureSignals += 1;
    void emitSecurityAlert('SECURITY_REPEATED_FAILURES', 'Repeated server failures detected for request path', {
        signalKey,
        path: input.path,
        ip: input.ip,
        statusCode: input.statusCode,
        userId: input.userId,
        count,
        windowMs: repeatedFailureWindowMs,
        threshold: repeatedFailureThreshold,
    }, 'high');
};

export const getSecurityMonitoringSnapshot = (): SecuritySnapshot => ({ ...securitySnapshot });
