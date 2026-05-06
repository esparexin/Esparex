import { env } from '../config/env';
import { reliabilityAlertsTotal } from './metrics';
import { emitReliabilityAlert } from './reliabilityAlerts';

type TimedSample = {
    timestamp: number;
    value: number;
};

type ApiSample = {
    timestamp: number;
    durationMs: number;
    statusCode: number;
};

type SloState = {
    breached: boolean;
    lastUpdatedAt: string | null;
    lastBreachAt: string | null;
    lastRecoveryAt: string | null;
    latestValue: number | null;
};

export interface SloThresholdConfig {
    apiLatencyMs: number;
    apiErrorRateRatio: number;
    queueDelayMs: number;
    dbResponseMs: number;
    evaluationWindowMs: number;
    apiMinSamples: number;
    dbMinSamples: number;
    queueMinSamples: number;
}

const thresholds: SloThresholdConfig = {
    apiLatencyMs: env.RELIABILITY_API_LATENCY_THRESHOLD_MS ?? 750,
    apiErrorRateRatio: env.RELIABILITY_HIGH_ERROR_RATE_THRESHOLD ?? 0.15,
    queueDelayMs: env.RELIABILITY_QUEUE_DELAY_THRESHOLD_MS ?? 60_000,
    dbResponseMs: env.RELIABILITY_DB_RESPONSE_THRESHOLD_MS ?? 250,
    evaluationWindowMs: env.RELIABILITY_SLO_WINDOW_MS ?? 60_000,
    apiMinSamples: env.RELIABILITY_SLO_API_MIN_SAMPLES ?? (env.RELIABILITY_ERROR_RATE_MIN_REQUESTS ?? 100),
    dbMinSamples: env.RELIABILITY_SLO_DB_MIN_SAMPLES ?? 30,
    queueMinSamples: env.RELIABILITY_SLO_QUEUE_MIN_SAMPLES ?? 3,
};

const RECOVERY_HYSTERESIS_RATIO = env.RELIABILITY_SLO_RECOVERY_HYSTERESIS_RATIO ?? 0.9;

const apiSamples: ApiSample[] = [];
const dbSamples: TimedSample[] = [];
const queueDelaySamples = new Map<string, TimedSample[]>();
const queueLatestDelay = new Map<string, number>();

const sloState: Record<'apiLatency' | 'apiErrorRate' | 'queueDelay' | 'dbResponse', SloState> = {
    apiLatency: { breached: false, lastUpdatedAt: null, lastBreachAt: null, lastRecoveryAt: null, latestValue: null },
    apiErrorRate: { breached: false, lastUpdatedAt: null, lastBreachAt: null, lastRecoveryAt: null, latestValue: null },
    queueDelay: { breached: false, lastUpdatedAt: null, lastBreachAt: null, lastRecoveryAt: null, latestValue: null },
    dbResponse: { breached: false, lastUpdatedAt: null, lastBreachAt: null, lastRecoveryAt: null, latestValue: null },
};

const pruneWindow = <T extends { timestamp: number }>(samples: T[], now: number): void => {
    const cutoff = now - thresholds.evaluationWindowMs;
    while (samples.length > 0 && samples[0] && samples[0].timestamp < cutoff) {
        samples.shift();
    }
};

const percentile = (values: number[], p: number): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[index] || 0;
};

const updateSloState = (key: keyof typeof sloState, value: number): void => {
    const target = sloState[key];
    target.latestValue = value;
    target.lastUpdatedAt = new Date().toISOString();
};

const emitSloBreach = async (
    type: string,
    summary: string,
    metadata: Record<string, unknown>,
    severity: 'critical' | 'high' | 'warning' = 'high'
): Promise<void> => {
    reliabilityAlertsTotal.labels(type, severity).inc();
    await emitReliabilityAlert({
        type,
        title: 'SLO threshold breached',
        severity,
        summary,
        service: 'api-runtime',
        module: 'slo-monitor',
        dedupeKey: type.toLowerCase(),
        metadata,
    });
};

const emitSloRecovery = async (
    type: string,
    summary: string,
    metadata: Record<string, unknown>
): Promise<void> => {
    reliabilityAlertsTotal.labels(type, 'info').inc();
    await emitReliabilityAlert({
        type,
        title: 'SLO recovered',
        severity: 'info',
        summary,
        service: 'api-runtime',
        module: 'slo-monitor',
        dedupeKey: type.toLowerCase(),
        metadata,
    });
};

const evaluateApiLatencySlo = async (): Promise<void> => {
    const now = Date.now();
    pruneWindow(apiSamples, now);
    if (apiSamples.length < thresholds.apiMinSamples) return;

    const p95Latency = percentile(apiSamples.map((sample) => sample.durationMs), 95);
    updateSloState('apiLatency', p95Latency);

    const target = sloState.apiLatency;
    const breachThreshold = thresholds.apiLatencyMs;
    const recoveryThreshold = breachThreshold * RECOVERY_HYSTERESIS_RATIO;
    const isBreached = target.breached
        ? p95Latency > recoveryThreshold
        : p95Latency > breachThreshold;

    if (!target.breached && isBreached) {
        target.breached = true;
        target.lastBreachAt = new Date().toISOString();
        await emitSloBreach(
            'SLO_API_LATENCY_BREACH',
            'API p95 latency exceeded SLO threshold',
            {
                p95LatencyMs: p95Latency,
                thresholdMs: breachThreshold,
                recoveryThresholdMs: recoveryThreshold,
                samples: apiSamples.length,
                windowMs: thresholds.evaluationWindowMs,
            },
            'high'
        );
        return;
    }

    if (target.breached && !isBreached) {
        target.breached = false;
        target.lastRecoveryAt = new Date().toISOString();
        await emitSloRecovery('SLO_API_LATENCY_RECOVERED', 'API p95 latency recovered within SLO', {
            p95LatencyMs: p95Latency,
            thresholdMs: breachThreshold,
            samples: apiSamples.length,
            windowMs: thresholds.evaluationWindowMs,
        });
    }
};

const evaluateApiErrorRateSlo = async (): Promise<void> => {
    const now = Date.now();
    pruneWindow(apiSamples, now);
    if (apiSamples.length < thresholds.apiMinSamples) return;

    const errors = apiSamples.filter((sample) => sample.statusCode >= 500).length;
    const errorRate = errors / Math.max(1, apiSamples.length);
    updateSloState('apiErrorRate', errorRate);

    const target = sloState.apiErrorRate;
    const breachThreshold = thresholds.apiErrorRateRatio;
    const recoveryThreshold = breachThreshold * RECOVERY_HYSTERESIS_RATIO;
    const isBreached = target.breached
        ? errorRate > recoveryThreshold
        : errorRate > breachThreshold;

    if (!target.breached && isBreached) {
        target.breached = true;
        target.lastBreachAt = new Date().toISOString();
        await emitSloBreach(
            'SLO_API_ERROR_RATE_BREACH',
            'API error rate exceeded SLO threshold',
            {
                errorRate,
                thresholdRatio: breachThreshold,
                recoveryThresholdRatio: recoveryThreshold,
                requests: apiSamples.length,
                errors,
                windowMs: thresholds.evaluationWindowMs,
            },
            'critical'
        );
        return;
    }

    if (target.breached && !isBreached) {
        target.breached = false;
        target.lastRecoveryAt = new Date().toISOString();
        await emitSloRecovery('SLO_API_ERROR_RATE_RECOVERED', 'API error rate recovered within SLO', {
            errorRate,
            thresholdRatio: breachThreshold,
            requests: apiSamples.length,
            errors,
            windowMs: thresholds.evaluationWindowMs,
        });
    }
};

const evaluateDbResponseSlo = async (): Promise<void> => {
    const now = Date.now();
    pruneWindow(dbSamples, now);
    if (dbSamples.length < thresholds.dbMinSamples) return;

    const p95Latency = percentile(dbSamples.map((sample) => sample.value), 95);
    updateSloState('dbResponse', p95Latency);

    const target = sloState.dbResponse;
    const breachThreshold = thresholds.dbResponseMs;
    const recoveryThreshold = breachThreshold * RECOVERY_HYSTERESIS_RATIO;
    const isBreached = target.breached
        ? p95Latency > recoveryThreshold
        : p95Latency > breachThreshold;

    if (!target.breached && isBreached) {
        target.breached = true;
        target.lastBreachAt = new Date().toISOString();
        await emitSloBreach('SLO_DB_RESPONSE_BREACH', 'Database probe latency exceeded SLO threshold', {
            p95LatencyMs: p95Latency,
            thresholdMs: breachThreshold,
            recoveryThresholdMs: recoveryThreshold,
            samples: dbSamples.length,
            windowMs: thresholds.evaluationWindowMs,
        });
        return;
    }

    if (target.breached && !isBreached) {
        target.breached = false;
        target.lastRecoveryAt = new Date().toISOString();
        await emitSloRecovery('SLO_DB_RESPONSE_RECOVERED', 'Database probe latency recovered within SLO', {
            p95LatencyMs: p95Latency,
            thresholdMs: breachThreshold,
            samples: dbSamples.length,
            windowMs: thresholds.evaluationWindowMs,
        });
    }
};

const evaluateQueueDelaySlo = async (): Promise<void> => {
    const now = Date.now();
    let worstQueue = '';
    let worstDelayMs = 0;
    let qualifyingSamples = 0;

    for (const [queueName, samples] of queueDelaySamples.entries()) {
        pruneWindow(samples, now);
        if (samples.length < thresholds.queueMinSamples) continue;
        qualifyingSamples += 1;
        const p95Delay = percentile(samples.map((sample) => sample.value), 95);
        if (p95Delay > worstDelayMs) {
            worstDelayMs = p95Delay;
            worstQueue = queueName;
        }
    }

    if (qualifyingSamples === 0) return;
    updateSloState('queueDelay', worstDelayMs);

    const target = sloState.queueDelay;
    const breachThreshold = thresholds.queueDelayMs;
    const recoveryThreshold = breachThreshold * RECOVERY_HYSTERESIS_RATIO;
    const isBreached = target.breached
        ? worstDelayMs > recoveryThreshold
        : worstDelayMs > breachThreshold;

    if (!target.breached && isBreached) {
        target.breached = true;
        target.lastBreachAt = new Date().toISOString();
        await emitSloBreach('SLO_QUEUE_DELAY_BREACH', 'Queue delay exceeded SLO threshold', {
            queueName: worstQueue || 'unknown',
            p95DelayMs: worstDelayMs,
            thresholdMs: breachThreshold,
            recoveryThresholdMs: recoveryThreshold,
            evaluatedQueues: qualifyingSamples,
            windowMs: thresholds.evaluationWindowMs,
        });
        return;
    }

    if (target.breached && !isBreached) {
        target.breached = false;
        target.lastRecoveryAt = new Date().toISOString();
        await emitSloRecovery('SLO_QUEUE_DELAY_RECOVERED', 'Queue delay recovered within SLO', {
            queueName: worstQueue || 'unknown',
            p95DelayMs: worstDelayMs,
            thresholdMs: breachThreshold,
            evaluatedQueues: qualifyingSamples,
            windowMs: thresholds.evaluationWindowMs,
        });
    }
};

export const recordApiRequestSample = (durationMs: number, statusCode: number): void => {
    apiSamples.push({ timestamp: Date.now(), durationMs, statusCode });
    void evaluateApiLatencySlo();
    void evaluateApiErrorRateSlo();
};

export const recordDbResponseSample = (latencyMs: number): void => {
    dbSamples.push({ timestamp: Date.now(), value: latencyMs });
    void evaluateDbResponseSlo();
};

export const recordQueueDelaySample = (queueName: string, delayMs: number): void => {
    const now = Date.now();
    const series = queueDelaySamples.get(queueName) || [];
    series.push({ timestamp: now, value: delayMs });
    queueDelaySamples.set(queueName, series);
    queueLatestDelay.set(queueName, delayMs);
    void evaluateQueueDelaySlo();
};

export const getSloThresholdConfig = (): SloThresholdConfig => ({ ...thresholds });

export const getSloSnapshot = (): {
    thresholds: SloThresholdConfig;
    state: Record<'apiLatency' | 'apiErrorRate' | 'queueDelay' | 'dbResponse', SloState>;
    queueDelayByQueue: Record<string, number>;
} => {
    return {
        thresholds: getSloThresholdConfig(),
        state: {
            apiLatency: { ...sloState.apiLatency },
            apiErrorRate: { ...sloState.apiErrorRate },
            queueDelay: { ...sloState.queueDelay },
            dbResponse: { ...sloState.dbResponse },
        },
        queueDelayByQueue: Object.fromEntries(queueLatestDelay.entries()),
    };
};

