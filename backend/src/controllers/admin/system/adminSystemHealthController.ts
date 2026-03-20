/**
 * Admin System Health Controller
 * Handles system health checks, cache monitoring, and system scans
 * Extracted from adminSystemController.ts
 */

import { Request, Response } from 'express';
import { respond, sendSuccessResponse } from '../adminBaseController';
import { connectDB, getUserConnection, getAdminConnection } from '../../../config/db';
import {
    clearCachePattern,
    getCacheStats,
    getRedisHealthProbe,
    scanKeysByPattern
} from '../../../utils/redisCache';
import { getSystemConfigDoc, ensureSystemConfig } from '../../../utils/systemConfigHelper';
import { sendErrorResponse } from '../../../utils/errorResponse';

const sendHealthError = (req: Request, res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Health check failed';
    sendErrorResponse(req, res, 500, message);
};

/**
 * Get cache health metrics (Redis stats)
 */
export const getCacheHealth = async (req: Request, res: Response) => {
    try {
        const stats = await getCacheStats();
        const total = stats.metrics.hits + stats.metrics.misses;
        const hitRate = total > 0 ? (stats.metrics.hits / total) * 100 : 0;
        const missRate = total > 0 ? (stats.metrics.misses / total) * 100 : 0;
        let topPredictedCities: string[] = [];
        try {
            const topCities = await import('../../../models/CityPopularity').then(m => m.default.find().sort({ rank: 1 }).limit(5).select('city'));
            topPredictedCities = topCities.map(c => c.city);
        } catch { }
        sendSuccessResponse(res, { ...stats, hitRate: parseFloat(hitRate.toFixed(2)), missRate: parseFloat(missRate.toFixed(2)), predictiveWarmStatus: stats.memoryPressureStatus === 'critical' ? 'paused' : 'active', topPredictedCities });
    } catch (error: unknown) {
        sendHealthError(req, res, error);
    }
};

/**
 * Get system health status (database & API connectivity)
 */
export const getSystemHealth = async (req: Request, res: Response) => {
    try {
        await connectDB();
        const userDbStatus = getUserConnection().readyState === 1 ? 'connected' : 'disconnected';
        const adminDbStatus = getAdminConnection().readyState === 1 ? 'connected' : 'disconnected';
        const redisHealth = await getRedisHealthProbe();
        const dbHealthy = getUserConnection().readyState === 1 && getAdminConnection().readyState === 1;
        const redisHealthy = redisHealth.pingOk && redisHealth.roundTripOk;
        const isHealthy = dbHealthy && redisHealthy;
        res.status(isHealthy ? 200 : 503).json(respond({
            success: isHealthy,
            data: {
                status: isHealthy ? 'ok' : 'degraded',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(process.uptime()),
                databases: {
                    user: { status: userDbStatus },
                    admin: { status: adminDbStatus }
                },
                redisConnected: redisHealthy,
                redisPingLatencyMs: redisHealth.latencyMs,
                redis: redisHealth,
                apiReady: true,
                version: '1.0.0'
            }
        }));
    } catch (error: unknown) {
        sendHealthError(req, res, error);
    }
};

/**
 * Run comprehensive system diagnostic scan
 */
export const runSystemScan = async (req: Request, res: Response) => {
    try {
        const issues = [];
        const warnings = [];
        let status = 'Operationally Sound';
        let score = 100;

        // 1. DB Check
        const dbState = getUserConnection().readyState;
        if (dbState !== 1) {
            issues.push({ id: 'db_conn', type: 'system', message: 'User database connection is unstable', severity: 'high', fixable: true, action: 'reconnect_db' });
            status = 'Critical';
            score -= 40;
        }

        // 2. Redis Check
        try {
            const redisHealth = await getRedisHealthProbe();
            if (!redisHealth.pingOk || !redisHealth.roundTripOk) {
                throw new Error(redisHealth.error || 'Redis health probe failed');
            }
        } catch {
            warnings.push({ id: 'cache_conn', type: 'performance', message: 'Cache layer (Redis) is unreachable', severity: 'medium', fixable: false });
            if (status !== 'Critical') status = 'Degraded';
            score -= 20;
        }

        // 3. System Config Check
        const config = await getSystemConfigDoc();
        if (!config) {
            issues.push({ id: 'sys_config', type: 'security', message: 'System configuration document is missing', severity: 'high', fixable: true, action: 'reset_config' });
            if (status !== 'Critical') status = 'Degraded';
            score -= 30;
        } else if (!config.security?.twoFactor?.enabled) {
            warnings.push({ id: '2fa_disabled', type: 'security', message: 'Admin 2FA is currently disabled', severity: 'low', fixable: true, action: 'enable_2fa_prompt' });
            score -= 5;
        }

        // 4. Rate Limit Check
        const rlKeys = await scanKeysByPattern('rl:*', { maxKeys: 1001 });
        if (rlKeys.length > 1000) {
            warnings.push({ id: 'high_traffic', type: 'security', message: 'Unusually high number of rate-limited IPs detected', severity: 'medium', fixable: true, action: 'clear_rate_limits' });
            score -= 10;
        }

        sendSuccessResponse(res, {
            issues,
            warnings,
            status,
            score: Math.max(0, score),
            scannedAt: new Date().toISOString()
        }, 'System scan completed successfully');
    } catch (error: unknown) {
        sendHealthError(req, res, error);
    }
};

/**
 * Apply system fixes based on scan results
 */
export const applySystemFix = async (req: Request, res: Response) => {
    try {
        const { action } = req.body;
        let message = `Action ${action} executed successfully`;

        switch (action) {
            case 'reconnect_db':
                await connectDB();
                message = "Attempted to reconnect to database";
                break;
            case 'reset_config':
                await ensureSystemConfig();
                message = "Default system configuration restored";
                break;
            case 'clear_rate_limits':
                const [rlDeleted, legacyRlDeleted] = await Promise.all([
                    clearCachePattern('rl:*'),
                    clearCachePattern('rate_limit:*')
                ]);
                message = `Cleared ${rlDeleted + legacyRlDeleted} rate limit entries`;
                break;
            default:
                return sendErrorResponse(req, res, 400, `Unknown system fix action: ${String(action)}`);
        }

        sendSuccessResponse(res, { message });
    } catch (error: unknown) {
        sendHealthError(req, res, error);
    }
};
