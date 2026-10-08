import { Router } from 'express';
import { isDbReady, getSystemMetricsSummary, register } from '@esparex/core';
import { logger } from '@esparex/core';
import { getHealthCheckData, healthCheckHandler } from '../utils/health';
import { getApiReliabilitySummary } from '../middleware/metricsMiddleware';
import { requireMetricsAuth } from '../middleware/metricsAuth';

// ─── Health & root routes (P3 extract-before-split from app.ts) ─────────────
// Mounted at `/` (NO DB GUARD). Verbatim move; paths unchanged.

const router = Router();

router.get('/health', healthCheckHandler);

router.get('/health/worker', async (_req, res) => {
    try {
        const health = await getHealthCheckData(true);
        const statusCode = health.workerStatus === 'up' ? 200 : 503;
        res.status(statusCode).json({
            status: health.workerStatus,
            workerHealth: health.workerHealth,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
});

router.get('/system/status', async (_req, res) => {
    try {
        const health = await getHealthCheckData(true);
        const statusCode = health.status === 'error' ? 503 : 200;

        res.status(statusCode).json({
            success: health.success,
            status: health.status,
            timestamp: new Date().toISOString(),
            services: {
                db: {
                    status: health.databaseHealth.overall,
                    details: health.databaseHealth,
                },
                redis: {
                    status: health.redisConnected ? 'up' : 'down',
                    latencyMs: health.redisPingLatencyMs,
                    details: health.redisHealth,
                },
                queue: {
                    status: health.queueStatus,
                    details: health.queueHealth,
                },
                worker: {
                    status: health.workerStatus,
                    details: health.workerHealth,
                },
            },
            uptime: health.uptime,
            memoryUsage: health.memoryUsage,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
});

router.get('/system/metrics-summary', requireMetricsAuth, async (_req, res) => {
    try {
        const summary = await getSystemMetricsSummary();
        const apiReliability = getApiReliabilitySummary();
        const statusCode = summary.api.status === 'error' ? 503 : 200;
        res.status(statusCode).json({
            success: summary.api.success,
            status: summary.api.status,
            generatedAt: summary.timestamp,
            api: {
                ...summary.api,
                failureRateWindow: apiReliability.lastWindow,
                failureThresholds: apiReliability.thresholds,
            },
            queue: summary.queue,
            workers: summary.worker,
            dependency: summary.dependency,
            failureRates: summary.failureRates,
            security: summary.security,
            circuitBreakers: summary.circuitBreakers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
});

router.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Esparex API is running',
        version: '1.0.0',
        isDbReady: isDbReady(),
        timestamp: new Date().toISOString()
    });
});

/**
 * 📊 PROMETHEUS METRICS ENDPOINT
 *
 * Exposes internal metrics for Prometheus scraping.
 * Protected by basic auth or internal network restricted in production.
 */
router.get('/metrics', requireMetricsAuth, async (_req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        logger.error('Failed to collect Prometheus metrics', { error: err });
        res.status(500).end('Internal Server Error');
    }
});

export default router;
