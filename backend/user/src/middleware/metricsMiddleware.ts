import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '@core/utils/logger';

import { httpRequestDuration } from '@core/utils/metrics';

export const apiLatencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - start;
        const durationSec = durationMs / 1000;
        const requestUrl = req.originalUrl || req.url;
        const route = req.route?.path || requestUrl.split('?')[0];
        
        // 1. Record Prometheus Metric
        httpRequestDuration.labels(
            req.method,
            route || 'unknown',
            res.statusCode.toString()
        ).observe(durationSec);

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
            import('@core/utils/metrics').then(({ dbQueryDuration: prometheusDbMetric }) => {
                prometheusDbMetric.labels(collectionName, operation).observe(durationSec);
            }).catch(() => {});

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
