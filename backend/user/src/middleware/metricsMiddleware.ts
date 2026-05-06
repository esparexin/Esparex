import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '@esparex/core/utils/logger';
import { env } from '@esparex/core/config/env';
import { emitReliabilityAlert } from '@esparex/core/utils/reliabilityAlerts';
import { recordApiRequestSample } from '@esparex/core/utils/sloMonitor';
import {
    recordApiUsageSignal,
    recordRepeatedFailureSignal
} from '@esparex/core/utils/securityMonitoring';

import {
    dbQueryDuration,
    httpErrorRate,
    httpErrorsTotal,
    httpRequestDuration,
    reliabilityAlertsTotal
} from '@esparex/core/utils/metrics';

const ERROR_RATE_WINDOW_MS = 60_000;
const ERROR_RATE_THRESHOLD = env.RELIABILITY_HIGH_ERROR_RATE_THRESHOLD ?? 0.15;
const ERROR_RATE_MIN_REQUESTS = env.RELIABILITY_ERROR_RATE_MIN_REQUESTS ?? 100;

let errorWindowStartedAt = Date.now();
let errorWindowTotalRequests = 0;
let errorWindowErrorRequests = 0;
let lastErrorRateSnapshot = {
    windowStartAt: new Date().toISOString(),
    windowEndAt: new Date().toISOString(),
    totalRequests: 0,
    errorRequests: 0,
    errorRate: 0,
};

const resolveUserId = (req: Request): string | undefined => {
    const raw = req.user?._id;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw.toString === 'function') return raw.toString();
    return undefined;
};

const normalizeMetricRoute = (requestUrl: string): string => {
    return requestUrl
        .split('?')[0]
        .replace(/[0-9a-f]{24}/gi, ':id')
        .replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, ':uuid')
        .replace(/\/\d+/g, '/:num');
};

const evaluateErrorRateWindow = () => {
    const now = Date.now();
    if (now - errorWindowStartedAt < ERROR_RATE_WINDOW_MS) return;

    const total = errorWindowTotalRequests;
    const errors = errorWindowErrorRequests;
    const ratio = total > 0 ? errors / total : 0;
    lastErrorRateSnapshot = {
        windowStartAt: new Date(errorWindowStartedAt).toISOString(),
        windowEndAt: new Date(now).toISOString(),
        totalRequests: total,
        errorRequests: errors,
        errorRate: ratio,
    };

    httpErrorRate.set(ratio);

    if (total >= ERROR_RATE_MIN_REQUESTS && ratio >= ERROR_RATE_THRESHOLD) {
        reliabilityAlertsTotal.labels('HIGH_ERROR_RATE', 'critical').inc();
        void emitReliabilityAlert({
            type: 'HIGH_ERROR_RATE',
            title: 'High API error rate detected',
            severity: 'critical',
            summary: 'HTTP error ratio exceeded threshold',
            dedupeKey: 'high_error_rate',
            metadata: {
                windowMs: ERROR_RATE_WINDOW_MS,
                threshold: ERROR_RATE_THRESHOLD,
                minRequests: ERROR_RATE_MIN_REQUESTS,
                totalRequests: total,
                errorRequests: errors,
                errorRate: ratio,
            },
        });
    }

    errorWindowStartedAt = now;
    errorWindowTotalRequests = 0;
    errorWindowErrorRequests = 0;
};

export const apiLatencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - start;
        const durationSec = durationMs / 1000;
        const requestUrl = req.originalUrl || req.url;
        const route = req.route?.path || normalizeMetricRoute(requestUrl);
        const userId = resolveUserId(req);
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        
        // 1. Record Prometheus Metric
        httpRequestDuration.labels(
            req.method,
            route || 'unknown',
            res.statusCode.toString()
        ).observe(durationSec);

        errorWindowTotalRequests += 1;
        if (res.statusCode >= 500) {
            errorWindowErrorRequests += 1;
        }
        if (res.statusCode >= 400) {
            httpErrorsTotal.labels(req.method, route || 'unknown', res.statusCode.toString()).inc();
        }
        evaluateErrorRateWindow();
        recordApiRequestSample(durationMs, res.statusCode);
        recordApiUsageSignal({
            method: req.method,
            route: route || 'unknown',
            ip,
            userId,
        });
        recordRepeatedFailureSignal({
            path: requestUrl,
            ip,
            statusCode: res.statusCode,
            userId,
        });

        // 2. Existing Structured Logging
        const msg = `${req.method} ${requestUrl} ${res.statusCode} - ${durationMs}ms`;
        const isAdminLocationRoute = requestUrl.startsWith('/api/v1/admin/locations');
        const warnThresholdMs = isAdminLocationRoute ? 800 : 500;
        const errorThresholdMs = isAdminLocationRoute ? 2500 : 2000;

        if (durationMs > errorThresholdMs) {
            logger.error(`[SLOW_API] ${msg}`, { duration: durationMs, method: req.method, url: requestUrl, status: res.statusCode });
        } else if (durationMs > warnThresholdMs) {
            logger.warn(`[SLOW_API] ${msg}`, { duration: durationMs, method: req.method, url: requestUrl, status: res.statusCode });
        }
    });

    next();
};

export const getApiReliabilitySummary = (): {
    thresholds: {
        errorRateThreshold: number;
        minRequests: number;
        evaluationWindowMs: number;
    };
    lastWindow: {
        windowStartAt: string;
        windowEndAt: string;
        totalRequests: number;
        errorRequests: number;
        errorRate: number;
    };
} => ({
    thresholds: {
        errorRateThreshold: ERROR_RATE_THRESHOLD,
        minRequests: ERROR_RATE_MIN_REQUESTS,
        evaluationWindowMs: ERROR_RATE_WINDOW_MS,
    },
    lastWindow: { ...lastErrorRateSnapshot },
});

export const memoryUsageMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Note: Logging memory on every request is noisy. 
    // Usually handled by a setInterval, but middleware was requested.
    // We log periodically (e.g., 1 in 100 requests) or if memory is very high.
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    if (heapUsedMB > 1500) { // 1.5 GB threshold
        logger.error(`[HIGH_MEMORY] Heap used: ${heapUsedMB} MB`);
    }

    next();
};

export const initializeDatabaseMonitoring = () => {
    const slowQueryThresholdMs = 200; // 200ms
    type QueryContext = { _startTime?: number; mongooseCollection?: { name?: string }; op?: string; _conditions?: unknown };
    type AggregateContext = { _startTime?: number; _model?: { collection?: { name?: string } }; pipeline?: () => unknown[] };
    type MonitoringSchema = mongoose.Schema & {
        pre: (method: string, fn: (this: unknown, next: () => void) => void) => void;
        post: (method: string, fn: (this: unknown, docs: unknown, next: () => void) => void) => void;
    };

    const markStartTime = function (this: unknown, next: () => void) {
        (this as QueryContext & AggregateContext)._startTime = Date.now();
        next();
    };

    const logSlowOperation = function (this: unknown, _docs: unknown, next: () => void) {
        const ctx = this as QueryContext & AggregateContext;
        if (ctx._startTime) {
            const durationMs = Date.now() - ctx._startTime;
            const durationSec = durationMs / 1000;
            const collectionName = ctx.mongooseCollection?.name ?? ctx._model?.collection?.name ?? 'unknown_collection';
            const operation = ctx.op || 'aggregate';

            // 1. Record Prometheus Metric (Always record, not just slow ones)
            dbQueryDuration.labels(collectionName, operation).observe(durationSec);

            // 2. Existing Slow Query Logging
            if (durationMs > slowQueryThresholdMs) {
                logger.warn(`[SLOW_DB_QUERY] ${collectionName}.${operation} took ${durationMs}ms`, {
                    collection: collectionName,
                    operation,
                    duration: durationMs,
                    query: typeof ctx.pipeline === 'function' ? ctx.pipeline() : ctx._conditions || 'unknown_conditions'
                });
            }
        }
        if (typeof next === 'function') next();
    };

    mongoose.plugin((schema) => {
        const monitoringSchema = schema as MonitoringSchema;

        (['find', 'findOne', 'findOneAndUpdate'] as const).forEach((operation) => {
            monitoringSchema.pre(operation, markStartTime);
            monitoringSchema.post(operation, logSlowOperation);
        });

        monitoringSchema.pre('aggregate', markStartTime);
        monitoringSchema.post('aggregate', logSlowOperation);
    });
};
